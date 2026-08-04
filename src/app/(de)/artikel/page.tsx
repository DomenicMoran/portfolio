import type { Metadata } from "next";
import { ArticleIndex } from "@/components/article/ArticleIndex";
import { artikelDe, chromeDe } from "@/content/articles";
import { de } from "@/content/de";
import { feedFuer, kurzbeschreibung, ogBildFuer } from "@/lib/metadata";

export const metadata: Metadata = {
  title: chromeDe.title,
  description: kurzbeschreibung(chromeDe.lede),
  /*
     Eigene Vorschaukarte statt der geerbten.

     `openGraph` wird vom Wurzel-Layout geerbt, wenn eine Seite nichts setzt.
     Gemessen an der ausgelieferten Seite trugen deshalb alle Seiten außer den
     zehn Artikelseiten denselben Kartentitel: „Domenic Moran – AI Product
     Engineer". Wer die Artikelübersicht teilte, zeigte damit die Startseite.
     Titel und Text stehen längst da — sie wurden nur nicht weitergereicht.
  */
  openGraph: {
    // Ohne dieses Feld kein Bild: Next ersetzt das geerbte openGraph,
    // statt es zu mischen.
    images: ogBildFuer("de"),
    title: chromeDe.title,
    description: kurzbeschreibung(chromeDe.lede),
    locale: "de_DE",
  },
  alternates: {
    canonical: "/artikel",
    languages: { de: "/artikel", en: "/en/articles", "x-default": "/artikel" },
    // Ohne diesen Eintrag findet kein Feed-Leser den Feed von allein.
    types: feedFuer("de"),
  },
};

export default function ArtikelUebersicht() {
  return <ArticleIndex content={de} chrome={chromeDe} articles={artikelDe} />;
}
