"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Zählt beim Sichtbarwerden hoch.
 *
 * Werte, die keine reine Zahl sind ("100 %", "1.44", "EU", "24/7"), werden nur
 * im führenden Zahlenteil animiert; der Rest bleibt wörtlich stehen. So bleibt
 * die Inhaltsdatei lesbar, statt jeden Wert in {Zahl, Suffix} zu zerlegen.
 */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  const match = value.match(/^([\d.,]+)(.*)$/);
  const numericPart = match?.[1] ?? "";
  const suffix = match?.[2] ?? "";

  // Deutsche Schreibweise: "." gruppiert Tausender, "," ist das Dezimaltrennzeichen.
  const decimals = numericPart.includes(",") ? numericPart.split(",")[1].length : 0;
  const target = Number(numericPart.replace(/\./g, "").replace(",", "."));
  const animatable = match !== null && Number.isFinite(target);

  // Tausender nur gruppieren, wenn die Quelle es tat, sonst würde eine
  // Jahreszahl wie "2018" als "2.018" erscheinen.
  const useGrouping = numericPart.includes(".");

  const [display, setDisplay] = useState(animatable ? "0" : value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animatable) return;

    let controls: ReturnType<typeof animate> | null = null;
    let done = false;

    const endwert = target.toLocaleString("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping,
    });

    const starten = () => {
      if (done) return;
      done = true;
      controls = animate(0, target, {
        duration: 1.4,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => {
          setDisplay(
            latest.toLocaleString("de-DE", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
              useGrouping,
            }),
          );
        },
      });
    };

    const sofortSetzen = () => {
      if (done) return;
      done = true;
      setDisplay(endwert);
    };

    /**
     * Der Grund für den zusätzlichen Scroll-Wächter:
     *
     * Ein IntersectionObserver meldet nur, was den Sichtbereich tatsächlich
     * kreuzt. Springt jemand direkt zu einem Abschnitt (über die
     * Befehlspalette, einen Anker oder Pos1/Ende) landet dieses Element unter
     * Umständen oberhalb des Sichtbereichs, ohne ihn je berührt zu haben. Der
     * Beobachter schweigt dann für immer, und die Kennzahl bliebe auf "0"
     * stehen. Eine Seite, die mit belegbaren Zahlen argumentiert, darf einem
     * Besucher nicht "0 API-Routen" zeigen.
     *
     * Deshalb: übersprungen heißt sofort Endwert, ohne Animation.
     */
    const pruefeUebersprungen = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0) sofortSetzen();
    };

    const io = new IntersectionObserver(
      (beobachtungen) => {
        for (const e of beobachtungen) if (e.isIntersecting) starten();
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    pruefeUebersprungen();
    window.addEventListener("scroll", pruefeUebersprungen, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", pruefeUebersprungen);
      controls?.stop();
    };
  }, [animatable, target, decimals, useGrouping]);

  return (
    <span ref={ref} className={className}>
      {animatable ? `${display}${suffix}` : value}
    </span>
  );
}
