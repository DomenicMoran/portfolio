import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article/ArticlePage";
import { artikelDe, artikelNach, chromeDe, andereSprache } from "@/content/articles";
import { de } from "@/content/de";
import { kurzbeschreibung } from "@/lib/metadata";

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
    // absolute: ohne das haengt das Layout " – Domenic Moran" an, und die
    // Titel liegen dann bei 64 bis 79 Zeichen. Suchmaschinen schneiden ab 60
    // ab, und der Name steht ohnehin separat daneben.
    title: { absolute: artikel.title },
    description: kurzbeschreibung(artikel.dek),
    keywords: [...artikel.tags],
    openGraph: {
      type: "article",
      title: artikel.title,
      description: kurzbeschreibung(artikel.dek),
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
