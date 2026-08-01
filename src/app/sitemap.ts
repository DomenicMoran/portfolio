import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { artikelDe, artikelEn, gegenstueck } from "@/content/articles";

/**
 * Beide Sprachfassungen, mit gegenseitigen Verweisen.
 *
 * `alternates.languages` gehört auch in die Sitemap und nicht nur in den
 * Seitenkopf. Suchmaschinen lesen die Sitemap zuerst und entscheiden danach,
 * ob sie eine Seite überhaupt abrufen.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const basis = site.url.replace(/\/$/, "");

  const paar = (de: string, en: string) => ({
    languages: { de: `${basis}${de}`, en: `${basis}${en}` },
  });

  const eintraege: MetadataRoute.Sitemap = [
    {
      url: basis,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
      alternates: paar("/", "/en"),
    },
    {
      url: `${basis}/en`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: paar("/", "/en"),
    },
    {
      url: `${basis}/artikel`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: paar("/artikel", "/en/articles"),
    },
    {
      url: `${basis}/en/articles`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: paar("/artikel", "/en/articles"),
    },
    {
      url: `${basis}/onepager`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${basis}/impressum`, lastModified: now, priority: 0.2 },
    { url: `${basis}/datenschutz`, lastModified: now, priority: 0.2 },
  ];

  for (const a of artikelDe) {
    const en = gegenstueck("de", a.slug);
    eintraege.push({
      url: `${basis}/artikel/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "yearly",
      priority: 0.7,
      ...(en ? { alternates: paar(`/artikel/${a.slug}`, `/en/articles/${en}`) } : {}),
    });
  }

  for (const a of artikelEn) {
    const de = gegenstueck("en", a.slug);
    eintraege.push({
      url: `${basis}/en/articles/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "yearly",
      priority: 0.6,
      ...(de ? { alternates: paar(`/artikel/${de}`, `/en/articles/${a.slug}`) } : {}),
    });
  }

  return eintraege;
}
