"use client";

import { useEffect, useState } from "react";
import type { Content } from "@/content/types";

/**
 * Die Gebetszeit-Rechnung aus Salati, im Browser des Besuchers.
 *
 * Kein Video, kein Bildschirmfoto, keine Nachbildung: Diese Kachel lädt
 * dieselbe Bibliothek, die in der ausgelieferten App rechnet (`adhan`, MIT),
 * und setzt dieselben Werte, die dort voreingestellt sind — Methode 13
 * (Diyanet), Schule 0 (Schafiitisch), Ort Berlin. Nachgelesen in
 * `apps/mobile/src/features/prayer-times/calc.ts` und `DEFAULT_SETTINGS`.
 *
 * Warum das hier steht: Vier Systeme in Produktion, alle privat. Wer die Seite
 * liest, kann bis hierher nichts davon anfassen. Das ist der eine Teil, der
 * sich herauslösen und vorführen lässt, ohne etwas zu behaupten.
 *
 * Drei Bedingungen, die den Aufbau bestimmen:
 *
 * - **Nichts über die Leitung.** Die Datenschutzerklärung sagt, dass diese
 *   Seite keine Verbindung nach außen aufbaut, und `check:privacy` misst das.
 *   Die Rechnung läuft deshalb vollständig hier, wie in der App ohne Netz.
 * - **Nicht im ersten Bündel.** `adhan` wiegt rund 20 kB. Es wird erst geladen,
 *   wenn diese Kachel wirklich im Bild ist, damit die Startseite davon nichts
 *   merkt.
 * - **Keine springende Zeile.** Die Kachel hat ihre Höhe, bevor die Zahlen da
 *   sind. Eine Tabelle, die nach zwei Sekunden aufklappt, kostet CLS.
 */

/** Die vier Orte. Koordinaten wie in der Ortsliste der App. */
const ORTE = [
  { name: "Berlin", lat: 52.52, lon: 13.405 },
  { name: "Hamburg", lat: 53.5511, lon: 9.9937 },
  { name: "München", lat: 48.1351, lon: 11.582 },
  { name: "Köln", lat: 50.9375, lon: 6.9603 },
] as const;

/** Die fünf Pflichtgebete plus Sonnenaufgang, in der Reihenfolge des Tages. */
const GEBETE = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
type Gebet = (typeof GEBETE)[number];

type Zeiten = { name: Gebet; zeit: Date }[];

export function PrayerTimesDemo({ inhalt }: { inhalt: Content }) {
  const demo = inhalt.demoSalati;
  const [ort, setOrt] = useState(0);
  const [zeiten, setZeiten] = useState<Zeiten | null>(null);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    let abgebrochen = false;

    /* Erst laden, wenn die Kachel im Bild war. Ein Besucher, der nie bis
       hierher scrollt, lädt die Bibliothek nicht. */
    async function rechnen() {
      try {
        const adhan = await import("adhan");
        if (abgebrochen) return;

        const { lat, lon } = ORTE[ort];
        // Methode 13 und Schule 0 sind die Voreinstellung der App.
        const p = adhan.CalculationMethod.Turkey();
        p.madhab = adhan.Madhab.Shafi;
        const t = new adhan.PrayerTimes(
          new adhan.Coordinates(lat, lon),
          new Date(),
          p,
        );

        setZeiten(GEBETE.map((name) => ({ name, zeit: t[name] })));
      } catch {
        // Lieber eine ehrliche Zeile als eine leere Kachel.
        if (!abgebrochen) setFehler(true);
      }
    }

    rechnen();
    return () => {
      abgebrochen = true;
    };
  }, [ort]);

  const heute = new Date().toLocaleDateString(
    inhalt.lang === "de" ? "de-DE" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <div className="lit rounded-2xl border border-line bg-surface/50 p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          {demo.title}
        </h3>
        <p className="font-mono text-[11px] text-ink-faint">{heute}</p>
      </div>

      <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {demo.lede}
      </p>

      {/* Die Ortswahl ist eine Gruppe von Schaltern, keine Navigation: Sie
          führt nirgendwohin, sie rechnet neu. */}
      <div
        role="group"
        aria-label={demo.placeLabel}
        className="mt-5 flex flex-wrap gap-1.5"
      >
        {ORTE.map((o, i) => (
          <button
            key={o.name}
            type="button"
            onClick={() => setOrt(i)}
            aria-pressed={i === ort}
            className={
              i === ort
                ? "rounded-full border border-acid/50 bg-acid/10 px-3.5 py-1.5 font-mono text-[11px] text-ink"
                : "rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim"
            }
          >
            {o.name}
          </button>
        ))}
      </div>

      {/* Feste Höhe für sechs Zeilen, damit beim Nachladen nichts springt. */}
      <dl className="mt-5 grid min-h-[9.5rem] grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
        {zeiten
          ? zeiten.map(({ name, zeit }) => (
              <div
                key={name}
                className="flex items-baseline justify-between border-b border-line/60 pb-1.5"
              >
                <dt className="text-sm text-ink-dim">{demo.prayers[name]}</dt>
                <dd className="font-mono text-sm text-ink tabular-nums">
                  {zeit.toLocaleTimeString(
                    inhalt.lang === "de" ? "de-DE" : "en-GB",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </dd>
              </div>
            ))
          : GEBETE.map((name) => (
              <div
                key={name}
                className="flex items-baseline justify-between border-b border-line/60 pb-1.5"
              >
                <dt className="text-sm text-ink-faint">{demo.prayers[name]}</dt>
                <dd className="font-mono text-sm text-ink-faint">
                  {fehler ? demo.failed : "···"}
                </dd>
              </div>
            ))}
      </dl>

      <p className="mt-5 border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
        {demo.note}
      </p>
    </div>
  );
}
