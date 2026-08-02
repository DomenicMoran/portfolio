import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotFoundPage } from "@/components/NotFoundPage";
import { de } from "@/content/de";
import { en } from "@/content/en";
import "./globals.css";

export const metadata: Metadata = {
  title: `${de.notFound.title} – ${de.site.name}`,
  robots: { index: false, follow: true },
};

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
 * Zweisprachig, und zwar notgedrungen: Next beantwortet damit jede Adresse,
 * die auf gar keine Route passt — auch `/en/irgendwas`. Diese Seite ist die
 * einzige, die nicht wissen kann, welche Sprache gemeint war. Gemessen bekam
 * ein englischer Besucher bisher „Diese Seite gibt es nicht." samt `lang="de"`.
 *
 * Es gab einmal je Sprache eine eigene `not-found.tsx`. Beide wurden nie
 * gerendert: Die Artikelrouten stehen auf `dynamicParams = false`, ein
 * unbekannter Slug erreicht das Bauteil also gar nicht, und Next liefert
 * stattdessen diese Seite aus. Gemessen am 02.08.2026 über vier falsche
 * Adressen, darunter `/en/articles/made-up` — jede bekam diese Seite mit
 * `lang="de"`.
 *
 * Der naheliegende Umbau macht es schlimmer: Mit `dynamicParams = true`
 * antwortet `/en/articles/made-up` zwar weiterhin mit 404, aber ohne jedes
 * HTML — kein `lang`, keine Überschrift, eine leere Seite. Die beiden Dateien
 * sind deshalb entfernt statt erreichbar gemacht.
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

export default function GlobalNotFound() {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <NotFoundPage content={de} zweitsprache={en} />
      </body>
    </html>
  );
}
