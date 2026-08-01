import type { Metadata } from "next";
import { ArticleIndex } from "@/components/article/ArticleIndex";
import { artikelEn, chromeEn } from "@/content/articles";
import { en } from "@/content/en";

export const metadata: Metadata = {
  title: chromeEn.title,
  description: chromeEn.lede,
  alternates: {
    canonical: "/en/articles",
    languages: { de: "/artikel", en: "/en/articles", "x-default": "/artikel" },
    types: { "application/atom+xml": "/en/articles/feed.xml" },
  },
};

export default function ArticlesIndex() {
  return <ArticleIndex content={en} chrome={chromeEn} articles={artikelEn} />;
}
