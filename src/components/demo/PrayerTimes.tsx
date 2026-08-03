"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Content } from "@/content/types";

/**
 * Die Gebetszeit-Rechnung aus Salati, im Browser des Besuchers.
 *
 * Kein Video, kein Bildschirmfoto, keine Nachbildung: Diese Kachel lädt
 * dieselbe Bibliothek, die in der ausgelieferten App rechnet (`adhan`, MIT),
 * und setzt dieselben Werte, die dort voreingestellt sind: Methode 13
 * (Diyanet), Schule 0 (schafiitisch), Ort Berlin. Nachgelesen in
 * `apps/mobile/src/features/prayer-times/calc.ts` und `DEFAULT_SETTINGS`.
 *
 * Warum das hier steht: Vier Systeme in Produktion, alle privat. Wer die Seite
 * liest, kann bis hierher nichts davon anfassen. Das ist der eine Teil, der
 * sich herauslösen und vorführen lässt, ohne etwas zu behaupten.
 *
 * Gezeigt wird, was der Hauptbildschirm der App zeigt: welches Gebet als
 * Nächstes ansteht und wie weit der Tag ist. Der Tagesbogen ist dabei keine
 * Zierde, sondern die Ansicht, an der man auf einen Blick sieht, wo man steht.
 *
 * Vier Bedingungen bestimmen den Aufbau:
 *
 * - **Nichts über die Leitung.** Die Datenschutzerklärung sagt, dass diese
 *   Seite keine Verbindung nach außen aufbaut, und `check:privacy` misst das.
 *   Die Rechnung läuft deshalb vollständig hier, wie in der App ohne Netz.
 * - **Nicht im ersten Bündel.** `adhan` wird erst geladen, wenn diese Kachel
 *   gebraucht wird, damit die Startseite davon nichts merkt.
 * - **Keine springende Zeile.** Jeder Bereich hat seine Höhe, bevor die Zahlen
 *   da sind.
 * - **Im Minutentakt, nicht im Sekundentakt.** Die Restzeit steht in Minuten;
 *   jede Sekunde neu zu rechnen kostet Strom und zeigt dasselbe.
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

/** Anteil des Tages, den dieser Zeitpunkt erreicht hat. 0 = 00:00, 1 = 24:00. */
function tagesAnteil(d: Date) {
  return (d.getHours() * 60 + d.getMinutes()) / (24 * 60);
}

export function PrayerTimesDemo({ inhalt }: { inhalt: Content }) {
  const demo = inhalt.demoSalati;
  const [ort, setOrt] = useState(0);
  const [zeiten, setZeiten] = useState<Zeiten | null>(null);
  const [fehler, setFehler] = useState(false);

  /* Die Uhr als externe Quelle, nicht als Zustand in einem Effekt.

     Auf dem Server gibt es keine Ortszeit des Besuchers; ein Wert aus dem
     Bau wäre beim Aufruf falsch. `useSyncExternalStore` ist genau dafür da:
     Der Server liefert null, der Browser die angebrochene Minute. Ein
     `setState` im Effekt löst stattdessen eine zweite Renderrunde aus, und
     die Regel react-hooks/set-state-in-effect verbietet es zu Recht.

     Aufgelöst wird auf Minuten: Die Restzeit steht in Minuten, und jede
     Sekunde neu zu rechnen kostet Strom und zeigt dasselbe. */
  const minute = useSyncExternalStore(
    (melden) => {
      const takt = setInterval(melden, 60_000);
      return () => clearInterval(takt);
    },
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  const jetzt = minute === null ? null : new Date(minute * 60_000);

  useEffect(() => {
    let abgebrochen = false;

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

  const sprache = inhalt.lang === "de" ? "de-DE" : "en-GB";
  const uhrzeit = (d: Date) =>
    d.toLocaleTimeString(sprache, { hour: "2-digit", minute: "2-digit" });

  const heute = new Date().toLocaleDateString(sprache, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* Das nächste Gebet und die Minuten bis dahin. Nach Ischa ist der Tag
     durch; die App zeigt dann Fadschr des Folgetags, hier bleibt die Zeile
     leer statt eine Zahl zu zeigen, die aus einem anderen Tag stammt. */
  const naechstes =
    zeiten && jetzt ? zeiten.find((z) => z.zeit > jetzt) : undefined;
  const restMinuten = naechstes
    ? Math.max(
        0,
        Math.round((naechstes.zeit.getTime() - jetzt!.getTime()) / 60000),
      )
    : null;

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

      {/* Was als Nächstes ansteht. Die Zeile hat ihre Höhe auch dann, wenn
          noch nichts gerechnet ist. */}
      <p className="mt-6 flex min-h-[2rem] flex-wrap items-baseline gap-x-3 gap-y-1">
        {naechstes && restMinuten !== null ? (
          <>
            <span className="text-eyebrow">{demo.next}</span>
            <span className="text-lg font-semibold tracking-tight text-ink">
              {demo.prayers[naechstes.name]}
            </span>
            <span className="font-mono text-sm text-acid tabular-nums">
              {uhrzeit(naechstes.zeit)}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">
              {restMinuten >= 60
                ? `${Math.floor(restMinuten / 60)} h ${restMinuten % 60} min`
                : `${restMinuten} min`}
            </span>
          </>
        ) : (
          <span className="text-eyebrow text-ink-faint">
            {zeiten ? demo.dayDone : "···"}
          </span>
        )}
      </p>

      {/* Der Tagesbogen: 00:00 links, 24:00 rechts, sechs Marken und der
          Stand von jetzt. Kein Diagramm, eine Achse — und die einzige Stelle,
          an der man ohne Rechnen sieht, wo der Tag steht. */}
      <div
        className="relative mt-3 h-9"
        role="img"
        aria-label={
          zeiten
            ? zeiten
                .map((z) => `${demo.prayers[z.name]} ${uhrzeit(z.zeit)}`)
                .join(", ")
            : demo.placeLabel
        }
      >
        <span className="absolute top-4 right-0 left-0 h-px bg-line" />
        {zeiten?.map(({ name, zeit }) => {
          const x = tagesAnteil(zeit) * 100;
          const vorbei = jetzt ? zeit <= jetzt : false;
          return (
            <span
              key={name}
              style={{ left: `${x}%` }}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            >
              <span
                className={
                  vorbei
                    ? "size-1.5 rounded-full bg-ink-faint"
                    : "size-1.5 rounded-full bg-acid"
                }
              />
              <span className="mt-[0.55rem] font-mono text-[9px] whitespace-nowrap text-ink-faint">
                {uhrzeit(zeit)}
              </span>
            </span>
          );
        })}
        {jetzt ? (
          <span
            style={{ left: `${tagesAnteil(jetzt) * 100}%` }}
            className="absolute top-0 z-10 h-[1.15rem] w-px -translate-x-1/2 bg-ink shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
          />
        ) : null}
      </div>

      <dl className="mt-6 grid min-h-[9.5rem] grid-cols-2 gap-x-8 gap-y-2 sm:min-h-[5rem] sm:grid-cols-3">
        {(zeiten ?? GEBETE.map((name) => ({ name, zeit: null }))).map(
          ({ name, zeit }) => {
            const vorbei = zeit && jetzt ? zeit <= jetzt : false;
            return (
              <div
                key={name}
                className="flex items-baseline justify-between border-b border-line/60 pb-1.5"
              >
                <dt
                  className={
                    vorbei ? "text-sm text-ink-faint" : "text-sm text-ink-dim"
                  }
                >
                  {demo.prayers[name]}
                </dt>
                <dd
                  className={
                    zeit
                      ? vorbei
                        ? "font-mono text-sm text-ink-faint tabular-nums"
                        : "font-mono text-sm text-ink tabular-nums"
                      : "font-mono text-sm text-ink-faint"
                  }
                >
                  {zeit ? uhrzeit(zeit) : fehler ? demo.failed : "···"}
                </dd>
              </div>
            );
          },
        )}
      </dl>

      <p className="mt-5 border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
        {demo.note}
      </p>
    </div>
  );
}
