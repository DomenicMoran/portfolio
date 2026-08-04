import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Nicht vorgeladen: Geist Mono trägt nur Labels und Eyebrows, kein Element,
 * das für den Largest Contentful Paint zählt. Gemessen konkurrierten drei
 * gleichzeitig vorgeladene Schriften (68 KiB) im kritischen Pfad, diese hier
 * lädt jetzt nach und gibt die Bandbreite an die Headline-Schriften ab.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/** Nur für Akzentwörter. Ein Schnitt, ein Stil, mehr braucht es nicht. */
/**
 * Die Auszeichnungsschrift der Überschrift, mit `optional` statt `swap`.
 *
 * Sie setzt nur die kursiven Wörter der Hauptüberschrift, und deren Höhe
 * unterscheidet sich von der Ersatzschrift. Bei `swap` erscheint die Zeile
 * erst in der Ersatzschrift und tauscht dann: Die Überschrift wird höher, und
 * alles darunter rutscht.
 *
 * Mit `swap` wurde daraus CLS 0,05 auf einem vierfach gedrosselten Telefon bei
 * 1,6 Mbit/s, die Verschiebung um 1.495 ms, als Quelle die Wortmasken der
 * Überschrift und die beiden Absätze darunter. `optional` lässt den Browser
 * kurz warten und die Schrift nur verwenden, wenn sie rechtzeitig da ist. Für
 * eine Auszeichnung, die drei Wörter betrifft, ist das der richtige Tausch.
 *
 * Nachgemessen an der ausgelieferten Seite, fünf kalte Läufe unter denselben
 * Bedingungen: CLS 0,0000 ohne eine einzige Verschiebung, LCP im Median
 * 1.892 ms bei einer Spanne von 1.884 bis 1.900. Beim zweiten Aufruf liegt die
 * Schrift ohnehin im Zwischenspeicher.
 */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "optional",
});

/**
 * Das Dokument-Gerüst, geteilt von beiden Wurzel-Layouts.
 *
 * Zwei Wurzel-Layouts statt eines: Nur so kann `<html lang>` je Sprache
 * stimmen, ohne die deutschen URLs unter ein `/de`-Präfix zu schieben. Der
 * Preis ist ein vollständiger Seitenwechsel beim Sprachwechsel. Bei zwei
 * Sprachen ist das ein Klick, den ohnehin niemand zweimal macht.
 */
export function RootDocument({
  lang,
  children,
}: {
  lang: "de" | "en";
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      // Next 16 hebt weiches Scrollen bei der Navigation nur noch auf, wenn
      // dieses Attribut gesetzt ist.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        {/*
          humans.txt und llms.txt gab es schon, erreichbar waren sie aber nur,
          wenn man die Adresse errät. Zwei Zeilen machen sie auffindbar:
          `rel="author"` ist die überlieferte Angabe für humans.txt, und für
          llms.txt gibt es keine eigene, deshalb `alternate` mit Medientyp und
          einem Titel, den ein Werkzeug lesen kann.

          Ohne eigenes `<head>`: React hebt `<link>` von selbst dorthin, und ein
          handgeschriebenes head-Element ist im App Router die Pages-Router-
          Gewohnheit, vor der auch der Linter warnt.
        */}
        <link rel="author" href="/humans.txt" type="text/plain" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="Facts for language models"
        />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
