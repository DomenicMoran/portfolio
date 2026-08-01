import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article/ArticlePage";
import { artikelDe, artikelNach, chromeDe, andereSprache } from "@/content/articles";
import { de } from "@/content/de";

/**
 * Alle Artikel sind zur Bauzeit bekannt, also werden alle vorgerendert.
 * `dynamicParams = false` sorgt dafür, dass ein unbekannter Slug eine 404
 * ergibt statt eines Server-Renders zur Laufzeit.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return artikelDe.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artikel = artikelNach("de", slug);
  if (!artikel) return {};

  const anderer = andereSprache("de", slug);

  return {
    title: artikel.title,
    description: artikel.dek,
    keywords: [...artikel.tags],
    openGraph: {
      type: "article",
      title: artikel.title,
      description: artikel.dek,
      publishedTime: artikel.date,
      locale: "de_DE",
    },
    alternates: {
      canonical: `/artikel/${slug}`,
      languages: anderer
        ? { de: `/artikel/${slug}`, en: `/en/articles/${anderer}` }
        : undefined,
    },
  };
}

export default async function ArtikelSeite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artikel = artikelNach("de", slug);
  if (!artikel) notFound();

  return (
    <ArticlePage
      content={de}
      chrome={chromeDe}
      article={artikel}
      weitere={artikelDe.filter((a) => a.slug !== slug)}
    />
  );
}
