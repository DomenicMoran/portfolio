import type { Metadata } from "next";
import { OnePager } from "@/components/OnePager";
import { de } from "@/content/de";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: de.onepager.title,
  description: de.onepager.description,
  robots: { index: false, follow: true },
  openGraph: {
    title: de.onepager.title,
    description: de.onepager.description,
    locale: "de_DE",
  },
  alternates: {
    canonical: `${site.url}/onepager`,
    languages: {
      de: `${site.url}/onepager`,
      en: `${site.url}/en/onepager`,
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
