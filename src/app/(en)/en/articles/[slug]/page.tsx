import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article/ArticlePage";
import { artikelEn, artikelNach, chromeEn, gegenstueck } from "@/content/articles";
import { en } from "@/content/en";

export const dynamicParams = false;

export function generateStaticParams() {
  return artikelEn.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = artikelNach("en", slug);
  if (!article) return {};

  const other = gegenstueck("en", slug);

  return {
    title: article.title,
    description: article.dek,
    keywords: [...article.tags],
    openGraph: {
      type: "article",
      title: article.title,
      description: article.dek,
      publishedTime: article.date,
      locale: "en_US",
    },
    alternates: {
      canonical: `/en/articles/${slug}`,
      languages: other
        ? { de: `/artikel/${other}`, en: `/en/articles/${slug}` }
        : undefined,
    },
  };
}

export default async function ArticleRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = artikelNach("en", slug);
  if (!article) notFound();

  return (
    <ArticlePage
      content={en}
      chrome={chromeEn}
      article={article}
      weitere={artikelEn.filter((a) => a.slug !== slug)}
    />
  );
}
