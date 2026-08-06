"use client";

import { useMemo, useState } from "react";
import type { Content } from "@/content/types";

/**
 * Die Tagesrechnung aus NOURI, mit echten Zahlen aus dem Katalog.
 *
 * Zwölf Gerichte, alle aus `supabase/catalog/001-recipes.sql` und
 * `002-macros.sql` des NOURI-Repos: die handkuratierten des Katalogs, der
 * insgesamt 11.892 Einträge hat. Kilokalorien, Eiweiß, Kohlenhydrate, Fett und
 * Ballaststoffe stehen dort je Portion, und genau diese Werte stehen hier.
 *
 * Was der Besucher tut, ist das, was die App tut: einen Tag zusammenstellen,
 * der ein Ziel trifft. Der erste Anlauf konnte nur addieren — anklicken und
 * die Summe ablesen. Das ist keine Vorführung, das ist ein Taschenrechner.
 *
 * Diese Fassung löst die Aufgabe, die dahintersteckt: Aus zwölf Gerichten
 * die Zusammenstellung finden, die unter einem Kalorienziel bleibt und dabei
 * das meiste Eiweiß bringt. Zwölf Gerichte sind 2^12 = 4.096 Möglichkeiten,
 * und die lassen sich vollständig durchrechnen — gemessen in unter einer
 * Millisekunde. Kein Näherungsverfahren, keine Heuristik: das Ergebnis ist
 * beweisbar das beste, und die geprüfte Anzahl steht daneben.
 *
 * Das Ziel setzt der Besucher am Regler. In der App hängt es am Profil, und
 * ein hier erfundenes wäre die einzige Zahl auf dieser Seite ohne Beleg.
 *
 * Die Titel stehen im Katalog in Ersatzschreibung („Haehnchen“), weil er über
 * ASCII-Kennungen erzeugt wird. Hier stehen sie mit Umlaut: Die Zahlen sind
 * die Aussage, die Schreibweise ist Darstellung.
 */

/** Je Portion, wie im Katalog hinterlegt. */
const GERICHTE = [
  {
    emoji: "🍗",
    de: "Shawarma-Hähnchen mit Kartoffeln",
    en: "Shawarma chicken with potatoes",
    kcal: 510,
    p: 50,
    k: 44,
    f: 11,
    b: 9,
  },
  {
    emoji: "🍫",
    de: "Schoko Overnight Oats",
    en: "Chocolate overnight oats",
    kcal: 415,
    p: 22,
    k: 62,
    f: 9,
    b: 12,
  },
  {
    emoji: "🍯",
    de: "Teriyaki-Hähnchen Reisbox",
    en: "Teriyaki chicken rice box",
    kcal: 530,
    p: 52,
    k: 55,
    f: 9,
    b: 7,
  },
  {
    emoji: "🫐",
    de: "Vanille Magerquark Bowl",
    en: "Vanilla quark bowl",
    kcal: 375,
    p: 40,
    k: 40,
    f: 3,
    b: 8,
  },
  {
    emoji: "🫘",
    de: "Linsen-Hähnchen Eintopf",
    en: "Lentil and chicken stew",
    kcal: 470,
    p: 50,
    k: 48,
    f: 7,
    b: 15,
  },
  {
    emoji: "🥚",
    de: "Reiswaffel-Eiersalat",
    en: "Egg salad on rice cakes",
    kcal: 360,
    p: 22,
    k: 32,
    f: 14,
    b: 3,
  },
  {
    emoji: "🥘",
    de: "Türkische Beef-Bulgur Pfanne",
    en: "Turkish beef and bulgur pan",
    kcal: 585,
    p: 46,
    k: 66,
    f: 15,
    b: 11,
  },
  {
    emoji: "🥜",
    de: "Tofu Satay Nudelbox",
    en: "Tofu satay noodle box",
    kcal: 560,
    p: 34,
    k: 70,
    f: 17,
    b: 10,
  },
  {
    emoji: "🌙",
    de: "Ramadan Iftar Linsensuppe",
    en: "Ramadan iftar lentil soup",
    kcal: 480,
    p: 32,
    k: 68,
    f: 8,
    b: 18,
  },
  {
    emoji: "🐟",
    de: "Lachs Kartoffel Blech",
    en: "Salmon and potato tray bake",
    kcal: 610,
    p: 44,
    k: 54,
    f: 24,
    b: 8,
  },
  {
    emoji: "🌯",
    de: "Mexican Bean Wraps",
    en: "Mexican bean wraps",
    kcal: 545,
    p: 29,
    k: 84,
    f: 12,
    b: 16,
  },
  {
    emoji: "🍌",
    de: "Pre-Workout Banana Toast",
    en: "Pre-workout banana toast",
    kcal: 330,
    p: 18,
    k: 55,
    f: 6,
    b: 7,
  },
] as const;

/** Energie je Gramm. Standardwerte, nicht projektspezifisch. */
const KCAL_JE_GRAMM = { p: 4, k: 4, f: 9 } as const;

/** Die Grenzen des Reglers. Unter 1.200 kcal passt kaum noch ein Tag. */
const ZIEL = { min: 1200, max: 3400, schritt: 50, start: 2200 } as const;

/**
 * Die beste Zusammenstellung unter einem Kalorienziel.
 *
 * Vollständige Aufzählung über die Bitmuster von 0 bis 4.095: Jedes Bit ist
 * ein Gericht. Das geht, weil zwölf Gerichte nur 4.096 Teilmengen haben —
 * bei dreissig wären es eine Milliarde, und dann bräuchte es ein anderes
 * Verfahren. Genau das ist der Punkt, den die Zahl daneben belegt.
 *
 * Bewertet wird nach Eiweiß, bei Gleichstand nach Ballaststoffen. Mindestens
 * drei Mahlzeiten, weil ein Tag aus einem einzigen Gericht kein Tag ist.
 */
function besterTag(ziel: number) {
  const beginn = performance.now();
  let beste: number[] = [];
  let bestesEiweiss = -1;
  let besteBallast = -1;

  for (let muster = 0; muster < 1 << GERICHTE.length; muster++) {
    let kcal = 0;
    let eiweiss = 0;
    let ballast = 0;
    let anzahl = 0;

    for (let i = 0; i < GERICHTE.length; i++) {
      if (!(muster & (1 << i))) continue;
      kcal += GERICHTE[i].kcal;
      if (kcal > ziel) break;
      eiweiss += GERICHTE[i].p;
      ballast += GERICHTE[i].b;
      anzahl++;
    }

    if (kcal > ziel || anzahl < 3) continue;
    if (
      eiweiss > bestesEiweiss ||
      (eiweiss === bestesEiweiss && ballast > besteBallast)
    ) {
      bestesEiweiss = eiweiss;
      besteBallast = ballast;
      beste = GERICHTE.map((_, i) => i).filter((i) => muster & (1 << i));
    }
  }

  return {
    auswahl: beste,
    geprueft: 1 << GERICHTE.length,
    dauer: Math.round((performance.now() - beginn) * 100) / 100,
  };
}

/**
 * Alle Zusammenstellungen als Punkte, dazu die Grenze des Möglichen.
 *
 * Das Ergebnis allein zeigt nur eine Zahl. Erst der Suchraum zeigt, was daran
 * eine Leistung ist: 4.096 Möglichkeiten, und die gewählte liegt genau auf
 * der Kante, an der bei dieser Kalorienzahl kein Gramm Eiweiß mehr geht.
 *
 * Die Kante ist eine Pareto-Front: Für jeden Kalorienwert das erreichbare
 * Maximum an Eiweiß, monoton steigend. Wer eine kennt, sieht sofort, dass die
 * Wahl nicht geraten ist.
 *
 * Gerechnet wird einmal beim Aufbau, nicht bei jedem Zug am Regler: Der Raum
 * hängt nur an den zwölf Gerichten, nicht am Ziel.
 */
function suchraum() {
  const punkte: { kcal: number; eiweiss: number; anzahl: number }[] = [];
  for (let muster = 1; muster < 1 << GERICHTE.length; muster++) {
    let kcal = 0;
    let eiweiss = 0;
    let anzahl = 0;
    for (let i = 0; i < GERICHTE.length; i++) {
      if (!(muster & (1 << i))) continue;
      kcal += GERICHTE[i].kcal;
      eiweiss += GERICHTE[i].p;
      anzahl++;
    }
    if (anzahl >= 3) punkte.push({ kcal, eiweiss, anzahl });
  }

  /* Die Front: nach Kalorien sortiert, dann das laufende Maximum. */
  const sortiert = [...punkte].sort((a, b) => a.kcal - b.kcal);
  const front: { kcal: number; eiweiss: number }[] = [];
  let hoechstes = -1;
  for (const punkt of sortiert) {
    if (punkt.eiweiss > hoechstes) {
      hoechstes = punkt.eiweiss;
      front.push({ kcal: punkt.kcal, eiweiss: punkt.eiweiss });
    }
  }

  return { punkte, front };
}

export function MacroDemo({ inhalt }: { inhalt: Content }) {
  const demo = inhalt.demoNouri;
  /* Der Anfangszustand ist das Ergebnis des Laufs, nicht eine Handauswahl.
     Vorher standen dort zwei Gerichte, 925 kcal und 72 g Eiweiß — bei
     demselben Ziel sind 198 g möglich. Wer die Karte nur überfliegt, sah
     also einen Punkt weit unter der Grenze und darunter „1.275 kcal unter
     dem Ziel". Die Vorführung widersprach ihrer eigenen Behauptung, solange
     niemand den Knopf drückte.

     Gerechnet statt eingetragen, und ohne `useEffect`: Das Ergebnis hängt nur
     an den zwölf Gerichten und am Startziel, beides Konstanten. Server und
     Browser kommen damit auf dieselbe Auswahl, und es gibt kein Bild, das
     nach der Übernahme umspringt. */
  const [gewaehlt, setGewaehlt] = useState<number[]>(
    () => besterTag(ZIEL.start).auswahl,
  );
  const [ziel, setZiel] = useState<number>(ZIEL.start);
  const [lauf, setLauf] = useState<{ geprueft: number; dauer: number } | null>(
    null,
  );

  /* Der Suchraum hängt nur an den zwölf Gerichten: einmal rechnen, nicht bei
     jedem Zug am Regler. */
  const { punkte, front } = useMemo(() => suchraum(), []);

  /* Gezeichnet wird nur, was der Regler erreichen kann.
     Über alle Zusammenstellungen reicht der Raum bis 5.770 kcal — alle zwölf
     Gerichte an einem Tag. Der Regler endet bei 3.400, jenseits davon ist
     nichts wählbar. Auf die volle Breite gezeichnet drängte sich deshalb der
     gesamte brauchbare Teil in das linke Drittel, und die dichte Mitte war
     ein Fleck. Zugeschnitten liegen 2.897 der 4.017 Punkte im Bild, und die
     Wolke ist 1,7-mal so breit. */
  const RAUM = useMemo(() => {
    const maxKcal = ZIEL.max;
    const maxEiweiss = Math.max(
      ...punkte.filter((p) => p.kcal <= maxKcal).map((p) => p.eiweiss),
    );
    return { breite: 600, hoehe: 150, maxKcal, maxEiweiss };
  }, [punkte]);

  const xVon = (kcal: number) => (kcal / RAUM.maxKcal) * RAUM.breite;
  const yVon = (eiweiss: number) =>
    RAUM.hoehe - (eiweiss / RAUM.maxEiweiss) * RAUM.hoehe;

  /* Zwei Wolken statt einer: Was unter dem Ziel liegt, kommt infrage, der Rest
     nicht. Die Trennung hängt am Regler und macht ihn zur eigentlichen
     Vorführung — man sieht den Suchraum schrumpfen und die Grenze des
     Möglichen mitwandern. */
  const [wolkeUnter, wolkeUeber] = useMemo(() => {
    const unter: string[] = [];
    const ueber: string[] = [];
    for (const punkt of punkte) {
      if (punkt.kcal > RAUM.maxKcal) continue;
      const strich = `M ${xVon(punkt.kcal).toFixed(1)} ${yVon(punkt.eiweiss).toFixed(1)} h 1`;
      (punkt.kcal <= ziel ? unter : ueber).push(strich);
    }
    return [unter.join(" "), ueber.join(" ")];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [punkte, RAUM, ziel]);

  const frontPfad = useMemo(
    () =>
      "M " +
      front
        .filter((p) => p.kcal <= RAUM.maxKcal)
        .map((p) => `${xVon(p.kcal).toFixed(1)} ${yVon(p.eiweiss).toFixed(1)}`)
        .join(" L "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [front, RAUM],
  );

  const summe = useMemo(() => {
    const s = { kcal: 0, p: 0, k: 0, f: 0, b: 0 };
    for (const i of gewaehlt) {
      s.kcal += GERICHTE[i].kcal;
      s.p += GERICHTE[i].p;
      s.k += GERICHTE[i].k;
      s.f += GERICHTE[i].f;
      s.b += GERICHTE[i].b;
    }
    return s;
  }, [gewaehlt]);

  /* Die Energieverteilung, gerechnet aus den Gramm statt aus den Kilokalorien:
     Der Katalog rundet beides einzeln, und die Summe der drei Anteile soll
     hundert ergeben. */
  const anteile = useMemo(() => {
    const aus = {
      p: summe.p * KCAL_JE_GRAMM.p,
      k: summe.k * KCAL_JE_GRAMM.k,
      f: summe.f * KCAL_JE_GRAMM.f,
    };
    const gesamt = aus.p + aus.k + aus.f || 1;
    return {
      p: Math.round((aus.p / gesamt) * 100),
      k: Math.round((aus.k / gesamt) * 100),
      f: Math.round((aus.f / gesamt) * 100),
    };
  }, [summe]);

  const umschalten = (i: number) => {
    setGewaehlt((alt) =>
      alt.includes(i) ? alt.filter((x) => x !== i) : [...alt, i],
    );
    // Von Hand geändert heißt: Was dasteht, ist nicht mehr das Ergebnis des
    // Laufs. Die Messung dazu stehen zu lassen, wäre eine falsche Behauptung.
    setLauf(null);
  };

  const zusammenstellen = () => {
    const { auswahl, geprueft, dauer } = besterTag(ziel);
    setGewaehlt(auswahl);
    setLauf({ geprueft, dauer });
  };

  const zahl = (n: number) =>
    n.toLocaleString(inhalt.lang === "de" ? "de-DE" : "en-GB");

  return (
    /* `no-print`: Eine Vorführung, die man anfassen muss, gehört nicht auf
       Papier. Gemessen kam sie dort auch nicht an: `check:print` lädt frisch
       und druckt sofort, und in diesem Moment ist die Rechnung noch nicht
       durch — auf dem Blatt stand eine Kachel mit leeren Feldern. Was die
       Aussage trägt, steht in der Fallstudie darüber. */
    <div className="lit no-print rounded-2xl border border-line bg-surface/50 p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          {demo.title}
        </h3>
        <p className="font-mono text-[11px] text-ink-faint">
          {gewaehlt.length} / {GERICHTE.length}
        </p>
      </div>

      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {demo.lede}
      </p>

      {/* Ziel, dann Lauf: erst die Eingabe, darunter die Handlung.
          Nebeneinander gestellt lief die rechtsbündige Zahl des Reglers in den
          Knopf hinein, sobald die Kachel schmaler wurde als 900 px. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="basis-full sm:max-w-md">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-eyebrow">{demo.targetLabel}</span>
            <span className="font-mono text-sm text-ink tabular-nums">
              {zahl(ziel)} {demo.units.kcal}
            </span>
          </span>
          <input
            type="range"
            min={ZIEL.min}
            max={ZIEL.max}
            step={ZIEL.schritt}
            value={ziel}
            onChange={(e) => {
              setZiel(Number(e.target.value));
              setLauf(null);
            }}
            /* 24 px hoch statt 16, über `py-1` mit ausgleichendem `-my-1`:
            Die sichtbare Spur bleibt schlank, die Trefferfläche erreicht das
            Maß aus WCAG 2.5.8. Nötig war das nicht — der Regler steht allein,
            und damit greift die Abstandsausnahme der Norm. Am Finger ist der
            Unterschied trotzdem zu spüren, und es kostet nichts. */
            className="mt-2 -my-1 w-full py-1 accent-acid"
          />
        </label>

        <button
          type="button"
          onClick={zusammenstellen}
          className="shrink-0 rounded-full border border-acid/40 bg-acid/10 px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-acid hover:bg-acid/15"
        >
          {demo.solve}
        </button>

        {/* Feste Höhe: Der Text erscheint erst nach dem Lauf und darf die
            Gerichte darunter nicht verschieben. */}
        <p className="min-h-[1.1rem] font-mono text-[11px] text-ink-faint tabular-nums">
          {lauf
            ? demo.solveNote
                .replace("{n}", zahl(lauf.geprueft))
                // Auch die Millisekunde ist eine Zahl der jeweiligen Sprache:
                // "0.9 ms" stand auf der deutschen Fassung mit Punkt.
                .replace("{ms}", zahl(lauf.dauer))
            : " "}
        </p>
      </div>

      <div
        role="group"
        aria-label={demo.mealsLabel}
        className="mt-1 flex flex-wrap gap-1.5"
      >
        {GERICHTE.map((g, i) => {
          const an = gewaehlt.includes(i);
          return (
            <button
              key={g.de}
              type="button"
              onClick={() => umschalten(i)}
              aria-pressed={an}
              className={
                an
                  ? "inline-flex items-center gap-2 rounded-full border border-acid/50 bg-acid/10 px-3 py-1.5 text-[12px] text-ink"
                  : "inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim"
              }
            >
              <span aria-hidden>{g.emoji}</span>
              {inhalt.lang === "de" ? g.de : g.en}
              <span className="font-mono text-[10px] opacity-70">{g.kcal}</span>
            </button>
          );
        })}
      </div>

      {/* Die Summe wird angesagt, nicht nur angezeigt.

          Wer ein Gericht an- oder abwählt, sieht die fünf Zahlen darunter
          springen. Wer sich die Seite vorlesen lässt, hörte nichts: Die Knöpfe
          melden ihren eigenen Zustand über `aria-pressed`, aber das Ergebnis
          der Auswahl stand stumm daneben — und genau das Ergebnis ist die
          Aussage dieser Kachel.

          Nur die beiden Werte, um die es geht. „2.095 kcal, 198 g Eiweiß“ ist
          eine Ansage; fünf Zahlen hintereinander sind eine Liste, die niemand
          im Kopf behält. Der Bereich hängt von Anfang an im Baum. */}
      <p role="status" aria-live="polite" className="sr-only">
        {`${zahl(summe.kcal)} ${demo.units.kcal}, ${zahl(summe.p)} g ${demo.units.protein}`}
      </p>

      {/* Feste Höhe, damit das Umschalten die Zeile darunter nicht verschiebt. */}
      <dl className="mt-6 grid min-h-[5.5rem] grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-5">
        {(
          [
            ["kcal", summe.kcal, demo.units.kcal, "text-ink-faint"],
            ["p", summe.p, demo.units.protein, "text-acid"],
            ["k", summe.k, demo.units.carbs, "text-cyan"],
            ["f", summe.f, demo.units.fat, "text-violet"],
            ["b", summe.b, demo.units.fiber, "text-ink-faint"],
          ] as const
        ).map(([schluessel, wert, label, farbe]) => (
          <div key={schluessel}>
            {/* Die drei Makros tragen die Farbe ihres Balkenabschnitts. Ohne
                das braucht der Balken darunter eine Legende, und eine Legende
                für drei Werte ist eine Zeile zu viel. */}
            <dt
              /* `break-words`: „KOHLENHYDRATE“ und „BALLASTSTOFFE“ sind je ein
                 Wort und mit gesperrten Versalien breiter als die Spalte bei
                 320 px. Ohne Umbruchpunkt schneidet der Browser ab. */
              className={`font-mono text-[10px] tracking-[0.14em] break-words uppercase ${farbe}`}
            >
              {label}
            </dt>
            <dd className="mt-1 font-mono text-xl text-ink tabular-nums">
              {zahl(wert)}
              {schluessel === "kcal" ? "" : " g"}
            </dd>
          </div>
        ))}
      </dl>

      {/* Der Suchraum, in dem die Wahl liegt.

          Eine Zahl allein zeigt nicht, was daran eine Leistung ist. Hier
          steht jede der 4.096 Zusammenstellungen als Punkt: waagerecht ihre
          Kalorien, senkrecht ihr Eiweiß. Die Linie darüber ist die Grenze des
          Möglichen — für jeden Kalorienwert das erreichbare Maximum. Der
          gewählte Tag liegt darauf, unmittelbar links vom Ziel.

          Ein einziger Pfad statt 4.096 Elementen: Ein `circle` je Punkt wäre
          ein DOM, das die Seite spürbar lähmt. Die Punkte sind Striche von
          einem halben Nutzer-Einheit, das reicht bei dieser Dichte.

          Kein Canvas: Die Konvention dieser Seite verbietet es, und ein SVG
          skaliert ohnehin schärfer. */}
      <div className="mt-6 pb-5 pl-9">
        <div className="relative h-[150px] overflow-hidden rounded-xl border border-line bg-base">
          <svg
            viewBox={`0 0 ${RAUM.breite} ${RAUM.hoehe}`}
            preserveAspectRatio="none"
            aria-hidden
            className="size-full"
          >
            <path
              d={wolkeUeber}
              stroke="var(--color-ink)"
              strokeOpacity={0.12}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />
            <path
              d={wolkeUnter}
              stroke="var(--color-acid)"
              strokeOpacity={0.45}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />
            <path
              d={frontPfad}
              stroke="var(--color-ink)"
              strokeOpacity={0.7}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
              fill="none"
            />
            <line
              x1={xVon(ziel)}
              x2={xVon(ziel)}
              y1={0}
              y2={RAUM.hoehe}
              stroke="var(--color-acid)"
              strokeOpacity={0.5}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {summe.kcal > 0 ? (
              <circle
                cx={xVon(summe.kcal)}
                cy={yVon(summe.p)}
                r={4}
                fill="var(--color-acid)"
                stroke="var(--color-void)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>

          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 flex h-[150px] w-8 flex-col justify-between py-[1px] text-right font-mono text-[9px] text-ink-faint/80"
          >
            <span>{RAUM.maxEiweiss}</span>
            <span>0</span>
          </div>
          <p className="sr-only">{demo.fieldLabel}</p>
        </div>

        <div
          aria-hidden
          className="flex justify-between pt-1 pl-9 font-mono text-[9px] text-ink-faint/80"
        >
          <span>
            {demo.field.y} g · {demo.field.x} →
          </span>
          <span>
            {zahl(RAUM.maxKcal)} {demo.units.kcal}
          </span>
        </div>
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-acid" />
          {demo.field.chosen}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-5 bg-ink-faint/60" />
          {demo.field.best}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-acid/60" />
          {demo.field.target}
        </span>
      </p>

      {/* Der Balken ist die einzige Grafik: drei Anteile, kein Diagramm. */}
      <div
        className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${demo.units.protein} ${anteile.p} %, ${demo.units.carbs} ${anteile.k} %, ${demo.units.fat} ${anteile.f} %`}
      >
        <span className="bg-acid" style={{ width: `${anteile.p}%` }} />
        <span className="bg-cyan" style={{ width: `${anteile.k}%` }} />
        <span className="bg-violet" style={{ width: `${anteile.f}%` }} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-faint">
        {demo.units.protein} {anteile.p} % · {demo.units.carbs} {anteile.k} % ·{" "}
        {demo.units.fat} {anteile.f} %
      </p>

      {/* Wie weit die Zusammenstellung unter dem Ziel bleibt — der Rest, den
          das Verfahren nicht füllen konnte, ohne darüber zu gehen. Bei zwölf
          Gerichten mit festen Portionen bleibt fast immer etwas übrig, und
          das zu verschweigen wäre die unehrlichere Darstellung. */}
      <p className="mt-4 min-h-[1.1rem] font-mono text-[11px] text-ink-faint tabular-nums">
        {summe.kcal === 0
          ? demo.noFit
          : demo.below.replace("{n}", zahl(Math.max(0, ziel - summe.kcal)))}
      </p>

      <p className="mt-4 border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
        {demo.note}
      </p>
    </div>
  );
}
