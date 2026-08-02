"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * Ein Lichtschein, der dem Zeiger über einem Kartenfeld folgt.
 *
 * Die Karten darin bekommen einen weichen Schein an der Zeigerposition und
 * einen hellen Bogen auf ihrer Kante. Beides entsteht aus zwei Farbverläufen
 * auf Pseudoelementen, die es ohnehin gibt: kein zusätzliches Element im Baum,
 * kein Canvas, keine Abhängigkeit.
 *
 * **Kein Zustand pro Mausbewegung.** Die Position wandert als CSS-Variable
 * direkt an die Karten, gedrosselt über genau ein `requestAnimationFrame`.
 * React sieht davon nichts und rendert nicht neu — ein `useState` im
 * Zeiger-Ereignis hätte bei sechs Karten pro Bild einen Renderdurchlauf
 * ausgelöst.
 *
 * **Erst lesen, dann schreiben.** Die Rechtecke aller Karten werden in einem
 * Zug gelesen und danach in einem Zug beschrieben. Gemischt ergäbe das je
 * Karte ein erzwungenes Neuberechnen des Layouts.
 *
 * **Nur wo es hingehört.** Ohne genaues Zeigegerät gibt es kein Überfahren,
 * und bei `prefers-reduced-motion` hängt sich der Zuhörer gar nicht erst ein —
 * dasselbe Muster wie beim eigenen Mauszeiger und beim weichen Scrollen.
 */
export function Spotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const feld = useRef<HTMLDivElement>(null);
  const genauerZeiger = useMediaQuery("(pointer: fine)");
  const wenigerBewegung = useMediaQuery("(prefers-reduced-motion: reduce)");
  const an = genauerZeiger && !wenigerBewegung;

  useEffect(() => {
    const flaeche = feld.current;
    if (!an || !flaeche) return;

    let bild = 0;
    let zeigerX = 0;
    let zeigerY = 0;

    const karten = () => flaeche.querySelectorAll<HTMLElement>("[data-schein]");

    const zeichnen = () => {
      bild = 0;
      const liste = [...karten()];
      const kaesten = liste.map((karte) => karte.getBoundingClientRect());
      liste.forEach((karte, i) => {
        karte.style.setProperty("--maus-x", `${zeigerX - kaesten[i].left}px`);
        karte.style.setProperty("--maus-y", `${zeigerY - kaesten[i].top}px`);
      });
    };

    const bewegen = (ereignis: PointerEvent) => {
      zeigerX = ereignis.clientX;
      zeigerY = ereignis.clientY;
      if (!bild) bild = requestAnimationFrame(zeichnen);
    };

    const eintreten = () => flaeche.style.setProperty("--schein", "1");

    /**
     * Beim Verlassen blendet der Schein über seine Deckkraft aus. Der
     * Kantenbogen kennt keine Deckkraft, er wandert deshalb aus dem Bild:
     * Sein Mittelpunkt liegt danach weit außerhalb der Karte.
     */
    const verlassen = () => {
      flaeche.style.setProperty("--schein", "0");
      for (const karte of karten()) {
        karte.style.setProperty("--maus-x", "-9999px");
        karte.style.setProperty("--maus-y", "-9999px");
      }
    };

    flaeche.addEventListener("pointermove", bewegen, { passive: true });
    flaeche.addEventListener("pointerenter", eintreten, { passive: true });
    flaeche.addEventListener("pointerleave", verlassen, { passive: true });

    return () => {
      flaeche.removeEventListener("pointermove", bewegen);
      flaeche.removeEventListener("pointerenter", eintreten);
      flaeche.removeEventListener("pointerleave", verlassen);
      if (bild) cancelAnimationFrame(bild);
    };
  }, [an]);

  return (
    <div ref={feld} className={cn(an && "schein-feld", className)}>
      {children}
    </div>
  );
}
