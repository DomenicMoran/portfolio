"use client";

import { useEffect, useState } from "react";

/**
 * Meldet, in welchem Abschnitt der Leser gerade steht.
 *
 * Bewusst kein IntersectionObserver: Der meldet nur beim Kreuzen einer
 * Schwelle. Wer über die Befehlspalette, einen Anker oder die Ende-Taste
 * springt, überspringt jede Schwelle auf einmal, und die Anzeige bliebe auf
 * dem alten Abschnitt stehen. Dieselbe Falle hatte schon der Zähler in
 * `Counter.tsx`.
 *
 * Stattdessen wird bei jedem Scroll gemessen, welcher Abschnitt die
 * Lesezone schneidet, und zwar aus der aktuellen Position heraus. Das ist
 * auch nach einem Sprung richtig.
 *
 * Die Messung läuft in einem rAF-Fenster, damit sie höchstens einmal je
 * Bildwiederholung stattfindet, und der Listener ist passiv.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;

    let frame = 0;

    const messen = () => {
      frame = 0;

      // Lesezone: ein Drittel unter der Oberkante. Ein Abschnitt gilt als
      // aktiv, sobald sein Anfang diese Linie passiert hat.
      const linie = window.innerHeight * 0.33;
      let treffer: string | null = null;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= linie && bottom > linie) {
          treffer = id;
          break;
        }
      }

      // Am Fuß der Seite erreicht der letzte Abschnitt die Linie nie, wenn er
      // kürzer als das Fenster ist. Dann gewinnt er trotzdem.
      if (!treffer) {
        const amEnde =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        if (amEnde) treffer = ids[ids.length - 1];
      }

      setActive(treffer);
    };

    const planen = () => {
      if (frame === 0) frame = window.requestAnimationFrame(messen);
    };

    messen();
    window.addEventListener("scroll", planen, { passive: true });
    window.addEventListener("resize", planen, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", planen);
      window.removeEventListener("resize", planen);
    };
  }, [ids]);

  return active;
}
