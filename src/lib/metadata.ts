import type { Metadata } from "next";
import type { Content } from "@/content/types";
import { chromeDe, chromeEn } from "@/content/articles";
import { site } from "@/content/site";

/** Die Kennung der englischen Fassung. Steht hier, damit sie nur einmal steht. */
const OG_LOCALE_EN = "en_GB";

/**
 * Kürzt eine Beschreibung auf die Länge, die Suchmaschinen anzeigen.
 *
 * Alles über etwa 160 Zeichen wird in der Trefferliste abgeschnitten, und
 * abgeschnitten wird ohne Rücksicht auf den Satz. Deshalb hier am Satzende
 * kürzen: Lieber ein vollständiger Satz weniger als ein halber mehr.
 */
export function kurzbeschreibung(text: string, grenze = 158): string {
  if (text.length <= grenze) return text;

  const bisGrenze = text.slice(0, grenze);
  const satzende = Math.max(
    bisGrenze.lastIndexOf(". "),
    bisGrenze.lastIndexOf("? "),
    bisGrenze.lastIndexOf("! "),
  );
  if (satzende > grenze * 0.4) return bisGrenze.slice(0, satzende + 1).trim();

  const wortende = bisGrenze.lastIndexOf(" ");
  return bisGrenze.slice(0, wortende > 0 ? wortende : grenze).trimEnd() + " …";
}

/**
 * Metadaten für eine Sprachfassung.
 *
 * `alternates.languages` ist der Teil, den Suchmaschinen tatsächlich auswerten:
 * beide Fassungen zeigen aufeinander, `x-default` benennt die Fassung für
 * Besucher ohne passende Sprachpräferenz.
 */
export function buildMetadata(content: Content, lang: "de" | "en"): Metadata {
  const { site } = content;
  const base = site.url.replace(/\/$/, "");
  const path = lang === "de" ? "/" : "/en";
  const ogBild = lang === "de" ? "/opengraph-image" : "/en/opengraph-image";

  return {
    metadataBase: new URL(base),
    title: {
      default: site.meta.title,
      template: `%s – ${site.name}`,
    },
    description: kurzbeschreibung(site.meta.description),
    applicationName: site.name,
    authors: [{ name: site.name, url: base }],
    creator: site.name,
    keywords:
      lang === "de"
        ? [
            "Product Engineer",
            "Fullstack Entwickler",
            "React Native",
            "Next.js",
            "TypeScript",
            "AI Engineering",
            "Berlin",
          ]
        : [
            "Product Engineer",
            "Fullstack Developer",
            "React Native",
            "Next.js",
            "TypeScript",
            "AI Engineering",
            "Berlin",
          ],
    openGraph: {
      type: "website",
      // en_GB, nicht en_US.
      //
      // Die englische Fassung ist durchgehend britisch geschrieben — licence,
      // fibre, catalogue, recognise — und rechnet mit `en-GB`: Datumsangaben
      // als "3 August 2026", Tausender mit Komma. Die Metadaten meldeten
      // trotzdem amerikanisches Englisch an jedes System, das eine Vorschau
      // baut. Die Seite sucht Stellen in Berlin und remote in der EU; das ist
      // auch die richtige Angabe für das, was sie ist.
      locale: lang === "de" ? "de_DE" : OG_LOCALE_EN,
      alternateLocale: lang === "de" ? OG_LOCALE_EN : "de_DE",
      url: `${base}${path}`,
      siteName: site.name,
      title: site.meta.title,
      description: kurzbeschreibung(site.meta.description),
      // Das Bild muss hier stehen, obwohl app/opengraph-image.tsx existiert.
      //
      // Next setzt das Bild aus der Dateikonvention nur, solange man kein
      // eigenes openGraph-Objekt liefert. Sobald man eines liefert, gilt es
      // vollständig, und ein fehlendes images-Feld heißt dann: kein Bild.
      // Die Route /opengraph-image wurde trotzdem gebaut und lieferte brav
      // ein PNG, nur verwiesen hat niemand darauf. Beim Teilen auf LinkedIn,
      // WhatsApp oder Slack erschien deshalb eine Vorschau ohne Bild, und
      // LinkedIn hat den Link in der Auswahl-Sektion ganz abgelehnt.
      //
      // Und die Karte hat eine Sprache: Beide Fassungen zeigten auf dieselbe
      // deutsche, wer /en teilte bekam eine Vorschau mit "BERLIN,
      // DEUTSCHLAND". Jede Sprache hat jetzt ihre eigene Route.
      images: [
        {
          url: ogBild,
          width: 1200,
          height: 630,
          alt: `${site.name} – ${site.role}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.meta.title,
      description: kurzbeschreibung(site.meta.description),
      images: [ogBild],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    alternates: {
      canonical: `${base}${path}`,
      languages: {
        de: `${base}/`,
        en: `${base}/en`,
        "x-default": `${base}/`,
      },
      // Der Feed gehört auf jede Seite, nicht nur auf die Artikelübersicht.
      //
      // Ein Feed-Leser prüft die Seite, auf der man gerade steht — und das ist
      // der Artikel, denn der wird geteilt. Gemessen trug ihn nur /artikel und
      // /en/articles: Wer von einem Artikel aus abonnieren wollte, fand nichts.
      // Je Sprache der eigene, sonst bekommt ein englischer Leser deutsche
      // Einträge ins Lesegerät.
      types: feedFuer(lang),
    },
  };
}

/**
 * Der Artikel-Feed, wie ihn `alternates.types` erwartet.
 *
 * Als Funktion, weil vier Seiten ihr `alternates` vollständig selbst setzen
 * müssen: Next ersetzt das geerbte Objekt, statt es zu mischen. Ohne diese
 * Stelle stünde die Angabe fünfmal da, und auf /artikel fehlte der Titel
 * bereits — im Leser stand dort die nackte Adresse.
 */
const SEITE_URL = site.url;

export function feedFuer(lang: "de" | "en") {
  const basis = SEITE_URL.replace(/\/$/, "");
  return {
    "application/atom+xml": [
      {
        url:
          lang === "de"
            ? `${basis}/artikel/feed.xml`
            : `${basis}/en/articles/feed.xml`,
        title: lang === "de" ? chromeDe.title : chromeEn.title,
      },
    ],
  };
}
