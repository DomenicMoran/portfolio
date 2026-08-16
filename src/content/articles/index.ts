import type { Article, ArticleChrome } from "./types";
import { whisperDe } from "./de-whisper";
import { kassensichvDe } from "./de-kassensichv";
import { widgetDe } from "./de-widget";
import { otaDe } from "./de-ota";
import { shaperDe } from "./de-shaper";
import { kontrastDe } from "./de-kontrast";
import { checkoutDe } from "./de-checkout";
import { whisperEn } from "./en-whisper";
import { kassensichvEn } from "./en-kassensichv";
import { widgetEn } from "./en-widget";
import { otaEn } from "./en-ota";
import { shaperEn } from "./en-shaper";
import { kontrastEn } from "./en-kontrast";
import { checkoutEn } from "./en-checkout";

/** Neueste zuerst. Die Reihenfolge steht hier und nicht in der Komponente. */
const sortiert = (liste: Article[]) =>
  [...liste].sort((a, b) => b.date.localeCompare(a.date));

export const artikelDe = sortiert([
  checkoutDe,
  kontrastDe,
  whisperDe,
  kassensichvDe,
  widgetDe,
  otaDe,
  shaperDe,
]);
export const artikelEn = sortiert([
  checkoutEn,
  kontrastEn,
  whisperEn,
  kassensichvEn,
  widgetEn,
  otaEn,
  shaperEn,
]);

export const chromeDe: ArticleChrome = {
  base: "/artikel",
  eyebrow: "Geschrieben",
  title: "Sieben Fehler, die mich etwas gelehrt haben",
  lede: "Keine Tutorials und keine Meinungsstücke. Sieben Probleme aus meinen eigenen Systemen, jeweils mit der Ursache, dem Fix und den Belegen, an denen sich beides nachlesen lässt: Datei und Zeile, der Commit, das Paket, das daraus entstanden ist. Einen davon hatte monatelang niemand bemerkt, einen zweiten über Wochen.",
  readingTime: (m) => `${m} Min. Lesezeit`,
  backToIndex: "Alle Artikel",
  evidenceLabel: "Belege",
  codeLabel: "Codebeispiel",
  tableLabel: "Tabelle",
  copyCode: {
    label: "Kopieren",
    done: "Kopiert",
    failed: "Kopieren ging nicht",
  },
  anchorLabel: "Verweis auf diesen Abschnitt",
  publishedLabel: "Veröffentlicht",
  fromSystem: "Aus dem System",
  feed: "Diese Artikel als Feed abonnieren",
  allArticles: "Artikel",
  home: {
    eyebrow: "Geschrieben",
    title: "Sieben Fehler, die mich etwas gelehrt haben",
    lede: "Aus meinen eigenen Systemen, mit Ursache, Fix und Beleg. Kein Tutorial-Recycling.",
    cta: "Alle sieben Artikel lesen",
  },
};

export const chromeEn: ArticleChrome = {
  base: "/en/articles",
  eyebrow: "Writing",
  title: "Seven bugs that taught me something",
  lede: "No tutorials and no opinion pieces. Seven problems out of my own systems, each with the cause, the fix, and the evidence for both: file and line, the commit, the package that came out of it. One of them had gone unnoticed for months, a second one for weeks.",
  readingTime: (m) => `${m} min read`,
  backToIndex: "All articles",
  evidenceLabel: "Evidence",
  codeLabel: "Code sample",
  tableLabel: "Table",
  copyCode: {
    label: "Copy",
    done: "Copied",
    failed: "Copying failed",
  },
  anchorLabel: "Link to this section",
  publishedLabel: "Published",
  fromSystem: "From the system",
  feed: "Subscribe to these articles as a feed",
  allArticles: "Articles",
  home: {
    eyebrow: "Writing",
    title: "Seven bugs that taught me something",
    lede: "Out of my own systems, with cause, fix and evidence. No recycled tutorials.",
    cta: "Read all seven articles",
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
const slugPaare = [
  { de: checkoutDe.slug, en: checkoutEn.slug },
  { de: kontrastDe.slug, en: kontrastEn.slug },
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
