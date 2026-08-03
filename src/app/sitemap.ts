import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { artikelDe, artikelEn, andereSprache } from "@/content/articles";
import geprueft from "@/content/verified.json";

/**
 * Beide Sprachfassungen, mit gegenseitigen Verweisen.
 *
 * `alternates.languages` gehört auch in die Sitemap und nicht nur in den
 * Seitenkopf. Suchmaschinen lesen die Sitemap zuerst und entscheiden danach,
 * ob sie eine Seite überhaupt abrufen.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /*
    `lastModified` muss stimmen, sonst zaehlt es nicht.

    Bis hierher stand an den vier Uebersichtsseiten die Bauzeit. Damit meldete
    jede Auslieferung, alle vier Seiten haetten sich geaendert - auch wenn nur
    ein Kommentar in einem Skript anders war. Google behandelt eine Sitemap,
    in der sich taeglich alles aendert, wie eine ohne Angabe: Das Feld
    verliert seinen Wert, und zwar fuer die Seiten gleich mit, bei denen es
    zutrifft.

    Die Artikel tragen laengst ihr Erscheinungsdatum. Fuer die beiden
    Startseiten ist der Pruefstempel die ehrliche Angabe: Er haelt fest, wann
    die Zahlen der Seite zuletzt gegen die Repos gemessen wurden, und die
    Zahlen sind das, was sich dort aendert. Die beiden Artikeluebersichten
    tragen das Datum des juengsten Artikels, denn genau daraus bestehen sie.
  */
  const stempel = new Date(geprueft.date);
  const juengsterArtikel = new Date(
    artikelDe.reduce(
      (neu, a) => (a.date > neu ? a.date : neu),
      artikelDe[0].date,
    ),
  );
  const basis = site.url.replace(/\/$/, "");

  const paar = (de: string, en: string) => ({
    languages: { de: `${basis}${de}`, en: `${basis}${en}` },
  });

  const urls: MetadataRoute.Sitemap = [
    {
      url: basis,
      lastModified: stempel,
      changeFrequency: "monthly",
      priority: 1,
      alternates: paar("/", "/en"),
    },
    {
      url: `${basis}/en`,
      lastModified: stempel,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: paar("/", "/en"),
    },
    {
      url: `${basis}/artikel`,
      lastModified: juengsterArtikel,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: paar("/artikel", "/en/articles"),
    },
    {
      url: `${basis}/en/articles`,
      lastModified: juengsterArtikel,
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
      ...(en
        ? { alternates: paar(`/artikel/${a.slug}`, `/en/articles/${en}`) }
        : {}),
    });
  }

  for (const a of artikelEn) {
    const de = andereSprache("en", a.slug);
    urls.push({
      url: `${basis}/en/articles/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "yearly",
      priority: 0.6,
      ...(de
        ? { alternates: paar(`/artikel/${de}`, `/en/articles/${a.slug}`) }
        : {}),
    });
  }

  return urls;
}
