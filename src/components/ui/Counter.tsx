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
export function Counter({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const match = value.match(/^([\d.,]+)(.*)$/);
  const numericPart = match?.[1] ?? "";
  const suffix = match?.[2] ?? "";

  // Deutsche Schreibweise: "." gruppiert Tausender, "," ist das Dezimaltrennzeichen.
  const decimals = numericPart.includes(",")
    ? numericPart.split(",")[1].length
    : 0;
  const target = Number(numericPart.replace(/\./g, "").replace(",", "."));
  const animatable = match !== null && Number.isFinite(target);

  // Tausender nur gruppieren, wenn die Quelle es tat, sonst würde eine
  // Jahreszahl wie "2018" als "2.018" erscheinen.
  const useGrouping = numericPart.includes(".");

  const endwert = animatable
    ? target.toLocaleString("de-DE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
      })
    : value;

  /**
   * Der Endwert steht von Anfang an da, die Animation kommt obendrauf.
   *
   * Vorher stand hier `useState("0")`. Damit trug das ausgelieferte HTML eine
   * Null, und alles, was kein JavaScript ausführt, las sie: Vorleseprogramme
   * mit abgeschaltetem Skript, Antwortmaschinen, jeder Besucher mit
   * Skriptblocker. Auf einer Seite, deren erster Satz "Vier Systeme in
   * Produktion" lautet, stand darunter "0 Systeme in Produktion".
   *
   * Schlimmer noch, es traf auch Besucher mit JavaScript. Gemessen am
   * 02.08.2026 an der ausgelieferten Seite, drei Umgebungen, zehn Sekunden
   * ohne jede Eingabe: Desktop 1440, Telefon 390 und Reduced Motion zeigten
   * durchgehend "0,0,0,0". Der Kasten lag dabei vollständig im Sichtbereich,
   * 386 px unter der Oberkante eines 900 px hohen Fensters. Erst ein Scrollen
   * ließ den Beobachter anspringen, dann standen 4, 4.109, 1.276 und 7.437 da.
   *
   * Deshalb wird nie vorsorglich auf null gesetzt. Springt der Beobachter nie
   * an, bleibt schlicht die richtige Zahl stehen — der Fehlerfall ist damit
   * der stille Normalfall statt einer sichtbaren Falschaussage.
   */
  const [display, setDisplay] = useState(endwert);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animatable) return;

    /**
     * Bei Reduced Motion läuft gar nichts.
     *
     * `MotionConfig reducedMotion="user"` erreicht diese Stelle nicht: Der
     * imperative Aufruf `animate()` liest die Einstellung nicht, anders als
     * die Motion-Bauteile. Der Wunsch stand also im Dokument und wurde hier
     * übergangen. Da der Endwert ohnehin von Anfang an dasteht, ist die
     * richtige Antwort schlicht: nichts tun.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let controls: ReturnType<typeof animate> | null = null;
    let done = false;
    /**
     * Was schon beim Ankommen im Bild steht, zählt nicht hoch.
     *
     * Sonst spränge die Zahl vom richtigen Wert auf null zurück, nur um
     * wieder hinaufzulaufen — ein Flackern genau an der Stelle, die Vertrauen
     * herstellen soll. Die Animation ist für das gedacht, was man beim
     * Scrollen erreicht.
     */
    const gemountet = performance.now();

    const starten = () => {
      if (done) return;
      done = true;
      if (performance.now() - gemountet < 400) {
        setDisplay(endwert);
        return;
      }
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

    /**
     * Und der Grund für den Druck-Wächter:
     *
     * Beim Drucken scrollt niemand. Der Beobachter feuert nie, die Zahl bleibt
     * auf "0", und genau das kommt aufs Papier. Gemessen am 02.08.2026 in der
     * Druckdarstellung der Startseite: Wo 11.892 Rezepte, 59 Tabellen und 12
     * Migrationen stehen sollten, standen 6.860, 34 und 7 — eingefrorene
     * Zwischenwerte einer Animation, die niemand zu Ende laufen ließ.
     *
     * Eine falsche Zahl ist auf dieser Seite schlimmer als eine fehlende:
     * Sie ist als Beleg gemeint, und ein Beleg, der sich selbst widerspricht,
     * beweist das Gegenteil dessen, was er soll.
     *
     * `matchMedia("print")` deckt beides ab: Der Browser schaltet die Abfrage
     * um, während er die Seiten aufbaut, und `matches` ist schon beim Aufbau
     * wahr, wenn die Seite in einer Druckumgebung geladen wird.
     */
    const druck = window.matchMedia("print");

    /**
     * Anders als `sofortSetzen` fragt das hier nicht, ob schon gezählt wird:
     * Eine laufende Animation ist genau der Fall, der den Zwischenwert aufs
     * Papier bringt. Sie wird angehalten und auf den Endwert gesetzt.
     */
    const aufEndwert = () => {
      done = true;
      controls?.stop();
      setDisplay(endwert);
    };
    const beiDruck = () => {
      if (druck.matches) aufEndwert();
    };

    const io = new IntersectionObserver(
      (beobachtungen) => {
        for (const e of beobachtungen) if (e.isIntersecting) starten();
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    pruefeUebersprungen();
    beiDruck();
    window.addEventListener("scroll", pruefeUebersprungen, { passive: true });
    window.addEventListener("beforeprint", aufEndwert);
    druck.addEventListener("change", beiDruck);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", pruefeUebersprungen);
      window.removeEventListener("beforeprint", aufEndwert);
      druck.removeEventListener("change", beiDruck);
      controls?.stop();
    };
  }, [animatable, target, decimals, useGrouping, endwert]);

  return (
    <span ref={ref} className={className}>
      {animatable ? `${display}${suffix}` : value}
    </span>
  );
}
