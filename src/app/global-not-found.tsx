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
 * Ein Auffang unter /en hilft nicht: Die Dokumentation ist deutlich, dass
 * global-not-found das Rendern überspringt und direkt ausgeliefert wird.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
