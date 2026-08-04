import type { Metadata } from "next";
import { feedFuer, ogBildFuer } from "@/lib/metadata";
import { OnePager } from "@/components/OnePager";
import { de } from "@/content/de";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: de.onepager.title,
  description: de.onepager.description,
  robots: { index: false, follow: true },
  openGraph: {
    // Ohne dieses Feld kein Bild: Next ersetzt das geerbte openGraph,
    // statt es zu mischen.
    images: ogBildFuer("de"),
    title: de.onepager.title,
    description: de.onepager.description,
    locale: "de_DE",
  },
  alternates: {
    // Der Feed steht auf jeder Seite, auch hier: Next ersetzt das geerbte
    // `alternates` vollständig, statt es zu mischen.
    types: feedFuer("de"),
    canonical: `${site.url}/onepager`,
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
 * Kurzprofil im A4-Zuschnitt, das über den Druckweg des Browsers zur
 * herunterladbaren PDF wird.
 *
 * Warum die PDF nicht auf dem Server entsteht: Ein Headless-Chrome für ein
 * einziges statisches Dokument ist eine Last in der Wartung, und die
 * Druckregeln liefern dasselbe Ergebnis mit markierbarem Text und
 * funktionierenden Links. Die Schaltfläche darüber ruft schlicht
 * window.print() auf.
 *
 * Das Blatt selbst steht in `@/components/OnePager` und bekommt seine Sprache
 * gereicht. Vorher gab es nur diese eine Fassung, und die englische Fußzeile
 * verlinkte trotzdem darauf: Wer „One-pager as PDF" anklickte, bekam ein
 * deutsches Dokument.
 */
export default function OnePagerSeite() {
  return <OnePager inhalt={de} sprache="de" />;
}
