import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { NotFoundPage } from "@/components/NotFoundPage";
import { de } from "@/content/de";
import { en } from "@/content/en";
import { SPRACH_KOPFZEILE } from "@/lib/language-header";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const englisch = (await headers()).get(SPRACH_KOPFZEILE) === "en";
  const inhalt = englisch ? en : de;
  return {
    title: `${inhalt.notFound.title} – ${inhalt.site.name}`,
    robots: { index: false, follow: true },
  };
}

/**
 * Die 404-Seite für Adressen, die zu keiner Route gehören.
 *
 * Diese Datei umgeht bewusst beide Wurzel-Layouts und bringt ihr eigenes
 * Dokument mit: Stylesheet, Schriften, Body-Klassen. Ohne das käme eine
 * ungestylte Standardseite, weil Next bei zwei Wurzel-Layouts nicht wählen
 * kann, in welchem es rendern soll.
 *
 * Nur zwei Schriften statt drei, und keine Bewegungs-Provider: Wer hier
 * landet, hat sich verlaufen und soll schnell weiterkommen. Die Kursivschrift
 * für Akzentwörter kommt auf dieser Seite nicht vor.
 *
 * Diese Seite beantwortet jede Adresse, die auf gar keine Route passt — auch
 * `/en/irgendwas`. Welche Sprache gemeint war, weiß sie als einzige Seite
 * nicht von sich aus: `src/proxy.ts` sagt es ihr über eine Kopfzeile. Ohne
 * die Angabe bleibt es beim Deutschen, und der Hinweis in der jeweils anderen
 * Sprache steht in beiden Fällen darunter.
 *
 * Der Weg über `not-found.tsx` ist verbaut. Es gab einmal je Sprache eine,
 * beide wurden nie gerendert, weil eine Adresse ohne Route auch kein Layout
 * hat. Auch der Umbau dahin führt nicht hin: Ein Fangsegment unter `/en`, das
 * `notFound()` wirft, bekommt bei zwei Wurzel-Layouts keine Grenze mehr
 * gerendert, sondern das leere Fehlerdokument — gemessen am 02.08.2026 mit
 * der Grenze auf beiden Ebenen und mit wie ohne `globalNotFound`: Status 404,
 * aber kein `lang`, keine Überschrift, nichts. Dasselbe gilt für
 * `dynamicParams = true` auf den Artikelrouten.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Nicht vorgeladen, wie im Hauptdokument auch.
 *
 * `RootDocument` setzt für dieselbe Schrift seit einer Messung `preload: false`:
 * Geist Mono trägt nur Beschriftungen, nie das Element, das für den Largest
 * Contentful Paint zählt. Diese Datei bringt ihr eigenes Dokument mit und hatte
 * die Entscheidung nie übernommen — gemessen meldete der Browser auf jeder
 * 404-Seite "preloaded using link preload but not used", also eine Schriftdatei,
 * die geladen und nicht gebraucht wird. Auf einer Seite, auf der niemand
 * bleiben soll, ist das die falsche Ladung.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export default async function GlobalNotFound() {
  const englisch = (await headers()).get(SPRACH_KOPFZEILE) === "en";
  const inhalt = englisch ? en : de;
  const zweitsprache = englisch ? de : en;

  return (
    <html
      lang={inhalt.lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <NotFoundPage
          content={inhalt}
          base={englisch ? "/en" : ""}
          zweitsprache={zweitsprache}
        />
      </body>
    </html>
  );
}
