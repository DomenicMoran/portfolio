import type { Article, ArticleChrome } from "./types";
import { whisperDe } from "./de-whisper";
import { kassensichvDe } from "./de-kassensichv";
import { widgetDe } from "./de-widget";
import { otaDe } from "./de-ota";
import { shaperDe } from "./de-shaper";
import { whisperEn } from "./en-whisper";
import { kassensichvEn } from "./en-kassensichv";
import { widgetEn } from "./en-widget";
import { otaEn } from "./en-ota";
import { shaperEn } from "./en-shaper";

/** Neueste zuerst. Die Reihenfolge steht hier und nicht in der Komponente. */
const sortiert = (liste: Article[]) =>
  [...liste].sort((a, b) => b.date.localeCompare(a.date));

export const artikelDe = sortiert([whisperDe, kassensichvDe, widgetDe, otaDe, shaperDe]);
export const artikelEn = sortiert([whisperEn, kassensichvEn, widgetEn, otaEn, shaperEn]);

export const chromeDe: ArticleChrome = {
  base: "/artikel",
  eyebrow: "Geschrieben",
  title: "Fünf Fehler, die mich etwas gelehrt haben",
  lede: "Keine Tutorials und keine Meinungsstücke. Fünf Probleme aus meinen eigenen Systemen, jeweils mit der Ursache, dem Fix und dem Commit, an dem sich beides nachlesen lässt. Zwei davon hatten monatelang niemand bemerkt.",
  readingTime: (m) => `${m} Min. Lesezeit`,
  backToIndex: "Alle Artikel",
  evidenceLabel: "Belege",
  publishedLabel: "Veröffentlicht",
  allArticles: "Artikel",
  home: {
    eyebrow: "Geschrieben",
    title: "Fünf Fehler, die mich etwas gelehrt haben",
    lede: "Aus meinen eigenen Systemen, mit Ursache, Fix und Commit. Kein Tutorial-Recycling.",
    cta: "Alle fünf Artikel lesen",
  },
};

export const chromeEn: ArticleChrome = {
  base: "/en/articles",
  eyebrow: "Writing",
  title: "Five bugs that taught me something",
  lede: "No tutorials and no opinion pieces. Five problems out of my own systems, each with the cause, the fix, and the commit where you can read both. Two of them had gone unnoticed for months.",
  readingTime: (m) => `${m} min read`,
  backToIndex: "All articles",
  evidenceLabel: "Evidence",
  publishedLabel: "Published",
  allArticles: "Articles",
  home: {
    eyebrow: "Writing",
    title: "Five bugs that taught me something",
    lede: "Out of my own systems, with cause, fix and commit. No recycled tutorials.",
    cta: "Read all five articles",
  },
};

export function artikelIn(lang: "de" | "en") {
  return lang === "de" ? artikelDe : artikelEn;
}

export function chromeIn(lang: "de" | "en") {
  return lang === "de" ? chromeDe : chromeEn;
}

export function artikelNach(lang: "de" | "en", slug: string) {
  return artikelIn(lang).find((a) => a.slug === slug) ?? null;
}

/**
 * Dieselbe Sache in zwei Sprachen. Die Slugs unterscheiden sich, weil ein
 * deutscher Artikel keinen englischen Pfad tragen soll und umgekehrt.
 *
 * Explizit als Paare notiert und nicht über die Position der Listen
 * hergeleitet: Sobald ein vierter Artikel dazukommt oder sich ein Datum
 * ändert, wäre die Position falsch, ohne dass es auffiele.
 */
export const slugPaare = [
  { de: whisperDe.slug, en: whisperEn.slug },
  { de: kassensichvDe.slug, en: kassensichvEn.slug },
  { de: widgetDe.slug, en: widgetEn.slug },
  { de: otaDe.slug, en: otaEn.slug },
  { de: shaperDe.slug, en: shaperEn.slug },
] as const;

/** Liefert den Slug derselben Sache in der anderen Sprache. */
export function andereSprache(lang: "de" | "en", slug: string): string | null {
  const paar = slugPaare.find((p) => p[lang] === slug);
  if (!paar) return null;
  return lang === "de" ? paar.en : paar.de;
}

export type { Article, ArticleChrome, Block } from "./types";
