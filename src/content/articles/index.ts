import type { Article, ArticleChrome } from "./types";
import { whisperDe } from "./de-whisper";
import { kassensichvDe } from "./de-kassensichv";
import { widgetDe } from "./de-widget";
import { whisperEn } from "./en-whisper";
import { kassensichvEn } from "./en-kassensichv";
import { widgetEn } from "./en-widget";

/** Neueste zuerst. Die Reihenfolge steht hier und nicht in der Komponente. */
const sortiert = (liste: Article[]) =>
  [...liste].sort((a, b) => b.date.localeCompare(a.date));

export const artikelDe = sortiert([whisperDe, kassensichvDe, widgetDe]);
export const artikelEn = sortiert([whisperEn, kassensichvEn, widgetEn]);

export const chromeDe: ArticleChrome = {
  base: "/artikel",
  eyebrow: "Geschrieben",
  title: "Drei Fehler, die mich etwas gelehrt haben",
  lede: "Keine Tutorials und keine Meinungsstücke. Drei Probleme aus meinen eigenen Systemen, jeweils mit der Ursache, dem Fix und dem Commit, an dem sich beides nachlesen lässt.",
  readingTime: (m) => `${m} Min. Lesezeit`,
  backToIndex: "Alle Artikel",
  evidenceLabel: "Belege",
  publishedLabel: "Veröffentlicht",
  allArticles: "Artikel",
  home: {
    eyebrow: "Geschrieben",
    title: "Drei Fehler, die mich etwas gelehrt haben",
    lede: "Aus meinen eigenen Systemen, mit Ursache, Fix und Commit. Kein Tutorial-Recycling.",
    cta: "Alle Artikel lesen",
  },
};

export const chromeEn: ArticleChrome = {
  base: "/en/articles",
  eyebrow: "Writing",
  title: "Three bugs that taught me something",
  lede: "No tutorials and no opinion pieces. Three problems out of my own systems, each with the cause, the fix, and the commit where you can read both.",
  readingTime: (m) => `${m} min read`,
  backToIndex: "All articles",
  evidenceLabel: "Evidence",
  publishedLabel: "Published",
  allArticles: "Articles",
  home: {
    eyebrow: "Writing",
    title: "Three bugs that taught me something",
    lede: "Out of my own systems, with cause, fix and commit. No recycled tutorials.",
    cta: "Read all articles",
  },
};

export function artikelFuer(lang: "de" | "en") {
  return lang === "de" ? artikelDe : artikelEn;
}

export function chromeFuer(lang: "de" | "en") {
  return lang === "de" ? chromeDe : chromeEn;
}

export function artikelNach(lang: "de" | "en", slug: string) {
  return artikelFuer(lang).find((a) => a.slug === slug) ?? null;
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
] as const;

/** Liefert den Slug derselben Sache in der anderen Sprache. */
export function gegenstueck(lang: "de" | "en", slug: string): string | null {
  const paar = slugPaare.find((p) => p[lang] === slug);
  if (!paar) return null;
  return lang === "de" ? paar.en : paar.de;
}

export type { Article, ArticleChrome, Block } from "./types";
