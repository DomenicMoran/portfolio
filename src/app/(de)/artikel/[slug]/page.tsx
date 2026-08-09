import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article/ArticlePage";
import {
  artikelDe,
  artikelNach,
  chromeDe,
  andereSprache,
} from "@/content/articles";
import { de } from "@/content/de";
import { feedFuer, kurzbeschreibung, vorschaukarten } from "@/lib/metadata";

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
    title: { absolute: artikel.titleShort ?? artikel.title },
    description: kurzbeschreibung(artikel.dek),
    keywords: [...artikel.tags],
    // Beide Karten aus einer Angabe: Ein eigenes `openGraph` ohne `twitter`
    // ließ dort den Titel der Startseite stehen, auf jeder der zehn
    // Artikelseiten, also genau dort, wo geteilt wird.
    ...vorschaukarten({
      titel: artikel.title,
      beschreibung: kurzbeschreibung(artikel.dek),
      lang: "de",
      pfad: `/artikel/${slug}`,
      typ: "article",
      veroeffentlicht: artikel.date,
      eigenesBild: true,
    }),
    alternates: {
      canonical: `/artikel/${slug}`,
      // `x-default` benennt die Fassung für Leser, deren Sprache auf keine
      // der beiden passt. Jede andere Seite der Site setzt ihn über
      // buildMetadata; die zehn Artikelseiten bauen ihre Metadaten selbst und
      // waren dadurch die einzigen ohne, ausgerechnet die, die am ehesten
      // über eine Suche gefunden werden. Wie überall zeigt er auf die
      // deutsche Fassung, das ist die Hauptfassung.
      languages: anderer
        ? {
            de: `/artikel/${slug}`,
            en: `/en/articles/${anderer}`,
            "x-default": `/artikel/${slug}`,
          }
        : undefined,
      // Eine Seite mit eigenem `alternates` ersetzt das des Layouts
      // vollständig, ohne diese Zeile hätte ausgerechnet die Artikelseite
      // keinen Feed-Hinweis.
      types: feedFuer("de"),
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
