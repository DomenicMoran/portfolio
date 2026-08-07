import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article/ArticlePage";
import {
  artikelEn,
  artikelNach,
  chromeEn,
  andereSprache,
} from "@/content/articles";
import { en } from "@/content/en";
import { feedFuer, kurzbeschreibung, vorschaukarten } from "@/lib/metadata";

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

  const other = andereSprache("en", slug);

  return {
    // absolute: ohne das haengt das Layout " – Domenic Moran" an, und die
    // Titel liegen dann bei 64 bis 79 Zeichen. Suchmaschinen schneiden ab 60
    // ab, und der Name steht ohnehin separat daneben.
    title: { absolute: article.title },
    description: kurzbeschreibung(article.dek),
    keywords: [...article.tags],
    // Siehe die deutsche Fassung: beide Karten aus einer Angabe.
    ...vorschaukarten({
      titel: article.title,
      beschreibung: kurzbeschreibung(article.dek),
      lang: "en",
      typ: "article",
      veroeffentlicht: article.date,
      eigenesBild: true,
    }),
    alternates: {
      canonical: `/en/articles/${slug}`,
      // `x-default` benennt die Fassung für Leser, deren Sprache auf keine
      // der beiden passt. Jede andere Seite der Site setzt ihn über
      // buildMetadata; die zehn Artikelseiten bauen ihre Metadaten selbst und
      // waren dadurch die einzigen ohne — ausgerechnet die, die am ehesten
      // über eine Suche gefunden werden. Wie überall zeigt er auf die
      // deutsche Fassung, das ist die Hauptfassung.
      languages: other
        ? {
            de: `/artikel/${other}`,
            en: `/en/articles/${slug}`,
            "x-default": `/artikel/${other}`,
          }
        : undefined,
      // Eine Seite mit eigenem `alternates` ersetzt das des Layouts
      // vollständig — ohne diese Zeile hätte ausgerechnet die Artikelseite
      // keinen Feed-Hinweis.
      types: feedFuer("en"),
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
