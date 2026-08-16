"use client";

import { useMemo, useState } from "react";
import {
  BOGEY_NUMBERS,
  HIGHEST_CHECKOUT,
  checkoutRoutes,
  routeNotation,
  type OutMode,
} from "darts-checkout";
import type { Content } from "@/content/types";

/**
 * Die Checkout-Tafel aus Dartile, im Browser des Lesers.
 *
 * Die dritte Vorführung dieser Seite und die einzige, die nicht aus einem
 * privaten Repo abgeschrieben ist: Sie lädt `darts-checkout`, dasselbe Paket,
 * das auf npm liegt und in der App rechnet. Wer prüfen will, ob hier wirklich
 * gerechnet und nicht abgelesen wird, installiert es und bekommt dieselben
 * Zeichenketten.
 *
 * Gerechnet wird bei jedem Zug am Regler vollständig: Alle Wege auf den
 * gewählten Rest, sortiert nach Anzahl Pfeile und danach nach
 * Praxistauglichkeit. Die geprüfte Anzahl und die gemessene Zeit stehen
 * daneben, aus demselben Grund wie bei der Tagesrechnung von NOURI: Eine Zahl
 * ohne die Angabe, woraus sie kommt, ist eine Behauptung.
 *
 * Das Band darunter zeigt den ganzen Wertebereich statt nur den gewählten
 * Punkt. Erst darin sieht man, was eine Bogey-Zahl ist: sieben Lücken
 * unterhalb von 170, und keine davon ist gesetzt, sie fallen aus der Suche.
 */

/**
 * Der Wertebereich des Reglers. 1 ist mit Doppel-Aus nicht zu schaffen.
 *
 * Der Startwert ist 141 und keine runde Zahl: Er ist einer der achtzehn
 * Reste, bei denen der Vorschlag einmal über das Bull lief, und der Weg
 * daneben (T20 T19 D12) steht in jeder gedruckten Tafel. Wer die Kachel
 * öffnet, sieht damit sofort den Fall, um den es geht.
 */
const REST = { min: 2, max: HIGHEST_CHECKOUT, start: 141 } as const;

/** Wie viele Wege die Tafel nebeneinander zeigt. */
const WEGE = 4;

/** Ein Band über den ganzen Wertebereich, ein Strich je Rest. */
const BAND = { breite: 169, hoehe: 24 } as const;

/**
 * Sucht und misst in einem Zug.
 *
 * Die Messung steht bewusst nicht in einem `useMemo`: `performance.now()` ist
 * unrein, und `react-hooks/purity` verbietet es dort zu Recht. Gerechnet wird
 * deshalb dort, wo die Handlung passiert, im Ereignis, und das Ergebnis liegt
 * im Zustand. Dieselbe Aufteilung wie in der Tagesrechnung von NOURI.
 *
 * Weit gefasst statt auf vier begrenzt: Die Tafel zeigt vier Wege, gezählt
 * werden alle. Mit einer Grenze von vier stünde daneben „4 Wege geprüft", und
 * das wäre die Zahl der Ausgabe und nicht die der Suche.
 */
function rechne(rest: number, aus: OutMode) {
  const start = performance.now();
  const alle = checkoutRoutes(rest, 3, aus, 5000);
  return { rest, aus, alle, dauer: performance.now() - start as number | null };
}

/**
 * Dieselbe Suche ohne Uhr, für den ersten Aufbau.
 *
 * Der Server rendert diese Kachel mit, und `performance.now()` liefert dort
 * eine andere Zahl als im Browser. Gemessen an der ausgelieferten Seite war
 * genau das ein React-Fehler 418 auf `/` und `/en`: „server rendered text
 * didn't match", ausgelöst von einer Millisekundenangabe, die sich zwischen
 * beiden Läufen um ein Zehntel unterschied. Der Weg selbst ist auf beiden
 * Seiten derselbe, nur die Dauer nicht.
 *
 * Also trägt der erste Aufbau keine Dauer. Ein Effekt, der sie nachträgt,
 * wäre der naheliegende Weg und ist hier verboten: `setState` in einem Effekt
 * meldet `react-hooks/set-state-in-effect`, und die Regel hat recht. Statt
 * dessen zeigt die Zeile zunächst nur die Anzahl der geprüften Wege, die auf
 * beiden Seiten dieselbe ist; die Dauer kommt beim ersten Zug am Regler dazu,
 * also genau dann, wenn sie zum ersten Mal etwas über die Bedienung sagt.
 */
function rechneOhneUhr(rest: number, aus: OutMode) {
  return {
    rest,
    aus,
    alle: checkoutRoutes(rest, 3, aus, 5000),
    dauer: null as number | null,
  };
}

export function CheckoutDemo({ inhalt }: { inhalt: Content }) {
  const demo = inhalt.demoDartile;
  const [ergebnis, setErgebnis] = useState(() =>
    rechneOhneUhr(REST.start, "double"),
  );
  const { rest, aus } = ergebnis;

  const setRest = (r: number) => setErgebnis(rechne(r, aus));
  const setAus = (a: OutMode) => setErgebnis(rechne(rest, a));

  /* Das Band einmal je Modus, nicht bei jedem Zug am Regler: 169 Suchen sind
     schnell, aber nicht so schnell, dass sie in ein Ziehen gehören. */
  const band = useMemo(() => {
    const werte: number[] = [];
    for (let r = REST.min; r <= REST.max; r += 1) {
      werte.push(checkoutRoutes(r, 3, aus, 1)[0]?.darts ?? 0);
    }
    return werte;
  }, [aus]);

  const bester = ergebnis.alle[0];
  const gezeigt = ergebnis.alle.slice(0, WEGE);
  const modi: { id: OutMode; label: string }[] = [
    { id: "double", label: demo.outs.doppel },
    { id: "master", label: demo.outs.master },
    { id: "straight", label: demo.outs.gerade },
  ];

  const farbe = (darts: number) =>
    darts === 1
      ? "var(--color-acid)"
      : darts === 2
        ? "var(--color-cyan)"
        : darts === 3
          ? "var(--color-violet)"
          : "transparent";

  return (
    /* `no-print` wie bei den beiden anderen Vorführungen: Was man anfassen
       muss, gehört nicht auf Papier, und beim Drucken ist die Rechnung noch
       nicht durch. */
    <div
      /* Zwei Haken für `check:demo`: Der Lauf muss die Kachel und den
         vorgeschlagenen Weg finden, ohne sich an eine Beschriftung zu binden,
         die es in zwei Sprachen gibt. */
      data-demo="checkout"
      className="lit no-print rounded-2xl border border-line bg-surface/50 p-6 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-base font-semibold tracking-tight text-ink">
          {demo.title}
        </h4>
        {/* Ohne Dauer bis zur ersten Bedienung, siehe `rechneOhneUhr`. */}
        <p className="font-mono text-[11px] text-ink-faint">
          {ergebnis.dauer === null
            ? demo.speedOhneZeit.replace("{n}", String(ergebnis.alle.length))
            : demo.speed
                .replace("{n}", String(ergebnis.alle.length))
                .replace("{ms}", ergebnis.dauer.toFixed(1))}
        </p>
      </div>

      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {demo.lede}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="basis-full sm:max-w-md">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-eyebrow">{demo.restLabel}</span>
            <span
              aria-hidden
              className="font-mono text-sm text-ink tabular-nums"
            >
              {rest}
            </span>
          </span>
          {/* Der Wert gehört in den Namen, nicht in `aria-valuetext`: Chrome
              wertet ihn am nativen Schieberegler nicht aus. Dieselbe Messung
              steht über dem Regler der Tagesrechnung. */}
          <input
            type="range"
            aria-label={`${demo.restLabel}, ${rest}`}
            min={REST.min}
            max={REST.max}
            step={1}
            value={rest}
            onChange={(e) => setRest(Number(e.target.value))}
            className="mt-2 w-full accent-acid"
          />
        </label>

        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">{demo.outLabel}</legend>
          {modi.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={aus === m.id}
              onClick={() => setAus(m.id)}
              className={
                aus === m.id
                  ? "rounded-full border border-acid/60 bg-acid/10 px-3 py-1.5 font-mono text-[11px] text-acid"
                  : "rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-ink-dim hover:text-ink"
              }
            >
              {m.label}
            </button>
          ))}
        </fieldset>
      </div>

      {/* Der Weg, groß. Er ist die Antwort, alles andere ist Beleg. */}
      <div className="mt-6 rounded-xl border border-line bg-base px-5 py-6">
        {bester ? (
          <>
            <p className="text-eyebrow">{demo.best}</p>
            <p
              data-checkout="weg"
              className="mt-2 font-mono text-2xl text-ink tabular-nums sm:text-3xl"
            >
              {routeNotation(bester)}
            </p>
          </>
        ) : (
          <>
            <p className="text-eyebrow">{demo.best}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              {demo.noWay}
            </p>
          </>
        )}
      </div>

      {gezeigt.length > 1 ? (
        <>
          <p className="mt-5 text-eyebrow">{demo.alternatives}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {gezeigt.slice(1).map((weg) => (
              <li
                key={routeNotation(weg)}
                className="rounded-lg border border-line px-3 py-1.5 font-mono text-[11px] text-ink-dim tabular-nums"
              >
                {routeNotation(weg)}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* Das Band: der ganze Wertebereich, ein Strich je Rest.

          Ein Pfad je Farbe statt 169 Rechtecken, dieselbe Überlegung wie bei
          der Punktwolke der Tagesrechnung: Ein DOM-Knoten je Wert wäre teurer
          als das Bild wert ist. */}
      <div className="mt-6">
        <div className="relative overflow-hidden rounded-lg border border-line bg-base">
          <svg
            viewBox={`0 0 ${BAND.breite} ${BAND.hoehe}`}
            preserveAspectRatio="none"
            aria-hidden
            className="h-6 w-full"
          >
            {band.map((darts, i) =>
              darts === 0 ? null : (
                <line
                  key={i}
                  x1={i + 0.5}
                  x2={i + 0.5}
                  y1={0}
                  y2={BAND.hoehe}
                  stroke={farbe(darts)}
                  strokeOpacity={0.55}
                  strokeWidth={1}
                />
              ),
            )}
            <line
              x1={rest - REST.min + 0.5}
              x2={rest - REST.min + 0.5}
              y1={0}
              y2={BAND.hoehe}
              stroke="var(--color-ink)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <p className="sr-only">{demo.fieldLabel}</p>
        </div>

        <div
          aria-hidden
          className="flex flex-wrap justify-between gap-x-4 pt-1.5 font-mono text-[9px] text-ink-faint"
        >
          <span>{REST.min}</span>
          <span>
            {demo.legend.eins} · {demo.legend.zwei} · {demo.legend.drei} ·{" "}
            {demo.legend.keiner}
          </span>
          <span>{HIGHEST_CHECKOUT}</span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint text-pretty">
        {demo.bogey.replace("{liste}", [...BOGEY_NUMBERS].reverse().join(", "))}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-ink-faint text-pretty">
        {demo.note}
      </p>
    </div>
  );
}
