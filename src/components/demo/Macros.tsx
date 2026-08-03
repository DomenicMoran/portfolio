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
 * Was der Besucher tut, ist das, was die App tut: Gerichte für einen Tag
 * zusammenstellen und sehen, was zusammenkommt. Die Rechnung ist Addition,
 * dazu die Energieverteilung über die Standardwerte 4/4/9 kcal je Gramm.
 * Kein Tagesziel: Das hängt in der App am Profil, und ein hier erfundenes
 * Ziel wäre die einzige Zahl auf dieser Seite ohne Beleg.
 *
 * Die Titel stehen im Katalog in Ersatzschreibung („Haehnchen"), weil er über
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

export function MacroDemo({ inhalt }: { inhalt: Content }) {
  const demo = inhalt.demoNouri;
  // Ein Frühstück und ein Mittagessen als Start: Eine leere Tabelle zeigt nichts.
  const [gewaehlt, setGewaehlt] = useState<number[]>([1, 0]);

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

  const umschalten = (i: number) =>
    setGewaehlt((alt) =>
      alt.includes(i) ? alt.filter((x) => x !== i) : [...alt, i],
    );

  const zahl = (n: number) =>
    n.toLocaleString(inhalt.lang === "de" ? "de-DE" : "en-GB");

  return (
    <div className="lit rounded-2xl border border-line bg-surface/50 p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          {demo.title}
        </h3>
        <p className="font-mono text-[11px] text-ink-faint">
          {gewaehlt.length} / {GERICHTE.length}
        </p>
      </div>

      <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {demo.lede}
      </p>

      <div
        role="group"
        aria-label={demo.mealsLabel}
        className="mt-5 flex flex-wrap gap-1.5"
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

      {/* Feste Höhe, damit das Umschalten die Zeile darunter nicht verschiebt. */}
      <dl className="mt-6 grid min-h-[5.5rem] grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-5">
        {(
          [
            ["kcal", summe.kcal, demo.units.kcal],
            ["p", summe.p, demo.units.protein],
            ["k", summe.k, demo.units.carbs],
            ["f", summe.f, demo.units.fat],
            ["b", summe.b, demo.units.fiber],
          ] as const
        ).map(([schluessel, wert, label]) => (
          <div key={schluessel}>
            <dt className="font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
              {label}
            </dt>
            <dd className="mt-1 font-mono text-xl text-ink tabular-nums">
              {zahl(wert)}
              {schluessel === "kcal" ? "" : " g"}
            </dd>
          </div>
        ))}
      </dl>

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

      <p className="mt-5 border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
        {demo.note}
      </p>
    </div>
  );
}
