import type { Metadata } from "next";
import type { Content } from "@/content/types";

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
      locale: lang === "de" ? "de_DE" : "en_US",
      alternateLocale: lang === "de" ? "en_US" : "de_DE",
      url: `${base}${path}`,
      siteName: site.name,
      title: site.meta.title,
      description: kurzbeschreibung(site.meta.description),
    },
    twitter: {
      card: "summary_large_image",
      title: site.meta.title,
      description: kurzbeschreibung(site.meta.description),
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
    },
  };
}
