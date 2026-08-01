import type { Metadata } from "next";
import { ArticleIndex } from "@/components/article/ArticleIndex";
import { artikelDe, chromeDe } from "@/content/articles";
import { de } from "@/content/de";

export const metadata: Metadata = {
  title: chromeDe.title,
  description: chromeDe.lede,
  alternates: {
    canonical: "/artikel",
    languages: { de: "/artikel", en: "/en/articles", "x-default": "/artikel" },
    // Ohne diesen Eintrag findet kein Feed-Leser den Feed von allein.
    types: { "application/atom+xml": "/artikel/feed.xml" },
  },
};

export default function ArtikelUebersicht() {
  return <ArticleIndex content={de} chrome={chromeDe} articles={artikelDe} />;
}
