import type { Metadata } from "next";
import { ArticleIndex } from "@/components/article/ArticleIndex";
import { artikelEn, chromeEn } from "@/content/articles";
import { en } from "@/content/en";
import { feedFuer, kurzbeschreibung, ogBildFuer } from "@/lib/metadata";

export const metadata: Metadata = {
  title: chromeEn.title,
  description: kurzbeschreibung(chromeEn.lede),
  openGraph: {
    // Ohne dieses Feld kein Bild: Next ersetzt das geerbte openGraph,
    // statt es zu mischen.
    images: ogBildFuer("en"),
    title: chromeEn.title,
    description: kurzbeschreibung(chromeEn.lede),
    locale: "en_GB",
  },
  alternates: {
    canonical: "/en/articles",
    languages: { de: "/artikel", en: "/en/articles", "x-default": "/artikel" },
    types: feedFuer("en"),
  },
};

export default function ArticlesIndex() {
  return <ArticleIndex content={en} chrome={chromeEn} articles={artikelEn} />;
}
