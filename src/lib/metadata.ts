import type { Metadata } from "next";
import type { Content } from "@/content/types";

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
    description: site.meta.description,
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
      description: site.meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: site.meta.title,
      description: site.meta.description,
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
