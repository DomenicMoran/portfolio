import type { Metadata } from "next";
import { feedFuer, vorschaukarten, kartenTitel } from "@/lib/metadata";
import { OnePager } from "@/components/OnePager";
import { en } from "@/content/en";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: en.onepager.title,
  description: en.onepager.description,
  robots: { index: false, follow: true },
  ...vorschaukarten({
    titel: kartenTitel(en.onepager.title),
    beschreibung: en.onepager.description,
    lang: "en",
    pfad: "/en/onepager",
  }),
  alternates: {
    // Der Feed steht auf jeder Seite, auch hier: Next ersetzt das geerbte
    // `alternates` vollständig, statt es zu mischen.
    types: feedFuer("en"),
    canonical: `${site.url}/en/onepager`,
    languages: {
      de: `${site.url}/onepager`,
      en: `${site.url}/en/onepager`,
      // Ohne x-default hat eine Suchmaschine keine Angabe, welche Fassung sie
      // jemandem zeigen soll, dessen Sprache in keiner der beiden vorkommt.
      // Jede andere Seite der Seite nennt sie; diese beiden nicht.
      "x-default": `${site.url}/onepager`,
    },
  },
};

/**
 * Dieselbe Seite auf Englisch.
 *
 * Sie ist keine Kopie: Beide Fassungen rendern dasselbe Bauteil und
 * unterscheiden sich nur in der Inhaltsdatei. Damit kann das englische Blatt
 * keine anderen Zahlen tragen als das deutsche, gemessen wurde beides gegen
 * dieselbe Quelle in `about.stats`.
 */
export default function OnePagerPage() {
  return <OnePager inhalt={en} sprache="en" />;
}
