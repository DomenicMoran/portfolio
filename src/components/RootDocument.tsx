import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Vorgeladen, obwohl sie nur Labels und Eyebrows trägt.
 *
 * Zuerst stand hier `preload: false`, mit einer guten Begründung: Drei
 * gleichzeitig vorgeladene Schriften (68 KiB) konkurrieren im kritischen Pfad,
 * und diese setzt kein Element, das für den Largest Contentful Paint zählt.
 *
 * Der Preis stand in der anderen Kennzahl. Weil sie erst nach dem Stylesheet
 * entdeckt wird, kam sie auf einer schmalen Leitung spät: gemessen an der
 * ausgelieferten Artikelseite bei 0,8 Mbit/s und sechsfach gedrosseltem
 * Prozessor um 3.576 ms, und 75 ms später verschob sich alles, was sie setzt —
 * Lesezeit, Themen-Chips, der Verweis auf das System. CLS 0,0587, dreimal
 * gleich reproduziert; auf dem CI-Runner 0,0582, auf einem ruhigen Rechner
 * null. Genau die Art Wert, die nur eine Messung findet.
 *
 * 23 KiB früher im Pfad gegen eine Verschiebung, die ein Sechstel des Budgets
 * kostet: Der LCP hat die Luft dafür, und `check:vitals` misst beides bei
 * jedem Push.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
        {/*
          Der Rückfall für Browser ohne JavaScript.

          Die Einblendungen unterhalb der Falz starten mit `opacity: 0` und
          werden von Framer Motion sichtbar gemacht, sobald der Abschnitt ins
          Bild kommt. Läuft kein JavaScript, passiert das nie: Gemessen an der
          gebauten Startseite blieben nach vollständigem Durchscrollen 160 von
          181 Überschriften und Faktenzeilen unsichtbar — mit JavaScript keine
          einzige.

          Der Text steht im HTML, er wird nur nicht gezeigt. Betroffen sind
          Firmennetze, die Skripte filtern, und alles, was eine Seite liest,
          ohne sie auszuführen. Für einen Recruiter, der die Seite im
          Unternehmensnetz öffnet, ist das der Unterschied zwischen einem
          Portfolio und einer fast leeren Seite.

          `noscript` im Body ist der einzige Weg, der ohne JavaScript wirkt und
          mit JavaScript nichts kostet: Der Browser wertet den Inhalt gar nicht
          erst aus, wenn Skripte laufen.
        */}
        <noscript>
          <style>{`[data-reveal],.animate-fade-rise,.animate-word-rise{opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
