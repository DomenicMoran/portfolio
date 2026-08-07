import type { Metadata } from "next";
import { ArticleIndex } from "@/components/article/ArticleIndex";
import { artikelEn, chromeEn } from "@/content/articles";
import { en } from "@/content/en";
import { feedFuer, kurzbeschreibung, vorschaukarten, kartenTitel } from "@/lib/metadata";

export const metadata: Metadata = {
  title: chromeEn.title,
  description: kurzbeschreibung(chromeEn.lede),
  // Siehe die deutsche Fassung: beide Karten aus einer Angabe.
  ...vorschaukarten({
    titel: kartenTitel(chromeEn.title),
    beschreibung: kurzbeschreibung(chromeEn.lede),
    lang: "en",
  }),
  alternates: {
    canonical: "/en/articles",
    languages: { de: "/artikel", en: "/en/articles", "x-default": "/artikel" },
    types: feedFuer("en"),
  },
};

export default function ArticlesIndex() {
  return <ArticleIndex content={en} chrome={chromeEn} articles={artikelEn} />;
}
