import type { Metadata } from "next";
import { feedFuer } from "@/lib/metadata";
import { OnePager } from "@/components/OnePager";
import { en } from "@/content/en";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: en.onepager.title,
  description: en.onepager.description,
  robots: { index: false, follow: true },
  openGraph: {
    title: en.onepager.title,
    description: en.onepager.description,
    locale: "en_GB",
  },
  alternates: {
    // Der Feed steht auf jeder Seite, auch hier: Next ersetzt das geerbte
    // `alternates` vollständig, statt es zu mischen.
    types: feedFuer("en"),
    canonical: `${site.url}/en/onepager`,
    languages: {
      de: `${site.url}/onepager`,
      en: `${site.url}/en/onepager`,
    },
  },
};

/**
 * Dieselbe Seite auf Englisch.
 *
 * Sie ist keine Kopie: Beide Fassungen rendern dasselbe Bauteil und
 * unterscheiden sich nur in der Inhaltsdatei. Damit kann das englische Blatt
 * keine anderen Zahlen tragen als das deutsche — gemessen wurde beides gegen
 * dieselbe Quelle in `about.stats`.
 */
export default function OnePagerPage() {
  return <OnePager inhalt={en} sprache="en" />;
}
