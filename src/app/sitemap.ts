import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { artikelDe, artikelEn, andereSprache } from "@/content/articles";

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

  const urls: MetadataRoute.Sitemap = [
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
  ];

  /*
    Drei Seiten fehlen hier bewusst: /onepager, /impressum und /datenschutz.

    Alle drei tragen `robots: noindex`. Eine Sitemap ist die Bitte, eine Seite
    aufzunehmen; `noindex` ist die Anweisung, sie nicht aufzunehmen. Beides
    zusammen ist ein Widerspruch, den die Google Search Console als eigenen
    Fehler führt („Durch 'noindex'-Tag ausgeschlossen" bei eingereichten
    URLs), und der zudem schlecht aussieht: Wer eine Seite einreicht und
    gleichzeitig ablehnt, hat eine der beiden Angaben nicht gelesen.

    Erreichbar bleiben sie trotzdem. Beide Rechtsseiten stehen in der Fußzeile
    jeder Seite, was § 5 DDG verlangt („leicht erkennbar, unmittelbar
    erreichbar, ständig verfügbar"), und der One-Pager ist von der Startseite
    aus verlinkt. Gefunden werden sie über Links, nicht über die Sitemap.

    `noindex` ist bei allen dreien Absicht: Der One-Pager sagt dasselbe wie die
    Startseite in kürzerer Form und wäre für eine Suchmaschine ein Duplikat;
    die Rechtsseiten sollen die Privatanschrift nicht in Suchergebnisse tragen.
  */

  for (const a of artikelDe) {
    const en = andereSprache("de", a.slug);
    urls.push({
      url: `${basis}/artikel/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "yearly",
      priority: 0.7,
      ...(en ? { alternates: paar(`/artikel/${a.slug}`, `/en/articles/${en}`) } : {}),
    });
  }

  for (const a of artikelEn) {
    const de = andereSprache("en", a.slug);
    urls.push({
      url: `${basis}/en/articles/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "yearly",
      priority: 0.6,
      ...(de ? { alternates: paar(`/artikel/${de}`, `/en/articles/${a.slug}`) } : {}),
    });
  }

  return urls;
}
