"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Shot } from "@/content/types";
import { DeviceFrame } from "@/components/ui/DeviceFrame";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * Waagerecht blätterbare Bildstrecke.
 *
 * Bewusst auf dem nativen Scroller gebaut statt auf einer Bibliothek mit
 * eigener Zeigerlogik. Das ist der Unterschied, der sich hier lohnt:
 *
 * - Wischen auf dem Telefon, Zweifingergeste auf dem Trackpad und Ziehen der
 *   Bildlaufleiste funktionieren, ohne dass eine Zeile dafür geschrieben wird.
 * - Der Bereich ist fokussierbar, damit die Pfeiltasten ihn bedienen. Das
 *   erledigt der Browser, sobald ein Scroller den Fokus bekommen kann.
 * - Ohne JavaScript bleibt die Strecke vollständig benutzbar. Nur die beiden
 *   Knöpfe fehlen dann, und die sind ohnehin nur eine Abkürzung.
 *
 * `scroll-snap` rastet jedes Bild mittig ein, damit nichts halb angeschnitten
 * stehen bleibt. Die Positionsanzeige liest den Scrollstand, statt einen
 * eigenen Zustand mitzuführen: So stimmt sie auch nach einer Wischgeste, die
 * niemand ausgelöst hat außer dem Finger.
 */
export function ShotCarousel({
  shots,
  label,
  hinweis,
}: {
  shots: readonly Shot[];
  /** Beschreibt die Strecke für Vorlesesoftware. */
  label: string;
  /** Bedienhinweis unter der Strecke. */
  hinweis: { vor: string; zurueck: string; von: string };
}) {
  const spur = useRef<HTMLUListElement>(null);
  const [aktiv, setAktiv] = useState(0);
  // useMediaQuery statt useState im Effekt: Der Serverzustand ist ausdrücklich
  // definiert, es gibt kein Nachsetzen nach der Hydration, und die Regel
  // react-hooks/set-state-in-effect greift zu Recht gegen die andere Variante.
  const wenigerBewegung = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const el = spur.current;
    if (!el) return;

    let frame = 0;
    const messen = () => {
      frame = 0;
      // Gemessen wird gegen die linke Kante, weil dort eingerastet wird.
      const kante = el.getBoundingClientRect().left;
      let naechstes = 0;
      let abstand = Infinity;
      [...el.children].forEach((kind, i) => {
        const d = Math.abs(
          (kind as HTMLElement).getBoundingClientRect().left - kante,
        );
        if (d < abstand) {
          abstand = d;
          naechstes = i;
        }
      });

      /* Am rechten Anschlag zählt das letzte Bild, egal wo seine Kante liegt.
         --------------------------------------------------------------------
         Die Messung oben sucht das Bild, dessen linke Kante der Kante der Spur
         am nächsten ist — richtig, denn dort rastet der Bildlauf ein. Nur das
         letzte Bild rastet nie ein: Die Spur ist vorher zu Ende, und es bleibt
         rechts stehen.

         Gemessen bei 1440 px über acht Aufnahmen: Nach dem sechsten Klick war
         die Spur am Anschlag, das achte Bild vollständig zu sehen — und der
         Zähler blieb bei „7 von 8“. Der Weiter-Knopf blieb dabei aktiv, weil
         er auf `aktiv === shots.length - 1` prüft, und tat bei jedem weiteren
         Druck nichts. Ein Knopf, der sichtbar zu haben ist und nichts bewirkt,
         ist die unangenehmere Hälfte davon. */
      const amEnde = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setAktiv(amEnde ? el.children.length - 1 : naechstes);
    };

    const planen = () => {
      if (frame === 0) frame = requestAnimationFrame(messen);
    };

    messen();
    el.addEventListener("scroll", planen, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("scroll", planen);
    };
  }, [shots.length]);

  const springe = (richtung: -1 | 1) => {
    const el = spur.current;
    if (!el) return;
    const ziel = el.children[aktiv + richtung] as HTMLElement | undefined;
    if (!ziel) return;
    // Über die Rechtecke statt über offsetLeft: Das gilt unabhängig davon,
    // welches Element gerade der Bezugspunkt für die Position ist.
    const versatz =
      ziel.getBoundingClientRect().left - el.getBoundingClientRect().left;
    el.scrollTo({
      left: el.scrollLeft + versatz,
      behavior: wenigerBewegung ? "auto" : "smooth",
    });
  };

  return (
    <div className="mt-10">
      <ul
        ref={spur}
        tabIndex={0}
        aria-label={label}
        className={cn(
          // `shot-track` hängt nur für den Druck daran: Dort wickelt die
          // Reihe um, statt seitlich wegzulaufen. Gemessen fehlten sonst
          // 1.950 px, also alle Aufnahmen außer der ersten.
          "shot-track flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4",
          // Die Bildlaufleiste ist hier Rauschen: Die Position steht als
          // Punktreihe darunter, und gescrollt wird ohnehin mit Wischen,
          // Rad oder Tasten.
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {shots.map((shot) => (
          <li key={shot.src} className="shrink-0 snap-start">
            <DeviceFrame
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              label={shot.label}
              variant={shot.variant}
              className={
                shot.variant === "screen"
                  ? "w-[34rem] max-w-[80vw]"
                  : "w-[15rem]"
              }
            />
          </li>
        ))}
      </ul>

      <div className="no-print mt-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => springe(-1)}
            disabled={aktiv === 0}
            aria-label={hinweis.zurueck}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-dim transition-colors hover:border-ink-faint hover:text-ink disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => springe(1)}
            disabled={aktiv === shots.length - 1}
            aria-label={hinweis.vor}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-dim transition-colors hover:border-ink-faint hover:text-ink disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>

        {/* Die Punktreihe zeigt nur an, sie bedient nicht: Ein zweiter Weg zum
            selben Ziel neben den Knöpfen wäre für die Tastatur nur zusätzliche
            Stationen ohne Gewinn. */}
        <div aria-hidden className="flex gap-1.5">
          {shots.map((shot, i) => (
            <span
              key={shot.src}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === aktiv ? "w-6 bg-acid" : "w-1.5 bg-line",
              )}
            />
          ))}
        </div>

        {/* Der Zähler sagt die neue Stelle an, nicht nur die alte.

            Er stand als stummer Text daneben: Wer „Nächstes Bild“ drückt, hörte
            die Beschriftung des Knopfes und erfuhr nie, wo er gelandet ist —
            gemessen am 02.08.2026, `aria-live` war nicht gesetzt. Die Punktreihe
            darüber ist `aria-hidden`, sie kann es also nicht übernehmen.

            `polite`, nicht `assertive`: Die Stelle ist eine Auskunft, keine
            Warnung, und darf den laufenden Satz nicht unterbrechen. */}
        <span
          aria-live="polite"
          className="ml-auto font-mono text-[11px] text-ink-faint tabular-nums"
        >
          {aktiv + 1} {hinweis.von} {shots.length}
        </span>
      </div>
    </div>
  );
}
