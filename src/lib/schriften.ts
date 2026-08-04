import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

/**
 * Die drei Schriften der Seite, an genau einer Stelle deklariert.
 *
 * Warum das eine eigene Datei ist und keine Selbstverständlichkeit: `next/font`
 * erzeugt je Aufruf einen eigenen Satz Dateien und eigene `@font-face`-Regeln.
 * Zwei Aufrufe mit denselben Werten liefern nicht dieselbe Schrift, sondern
 * zwei — mit unterschiedlichen Dateinamen, die der Browser beide lädt.
 *
 * Genau das lief hier. `global-error.tsx` und `global-not-found.tsx` bringen
 * ihr eigenes Dokument mit und deklarierten deshalb ihre eigenen Schriften.
 * Beide standen auf `preload: false` für Geist Mono, mit dem Kommentar „wie im
 * Hauptdokument auch" — was seit einer Messung nicht mehr stimmte. Das
 * Hauptdokument lädt sie vor.
 *
 * Weil Next die Fehlerseite in den Baum jeder Seite hängt, kam ihr Stylesheet
 * auf jede Seite mit. Der Browser fand damit zwei `@font-face` für „Geist
 * Mono", eines auf die vorgeladene Datei, eines auf eine zweite, gleich große,
 * und lud beide. Gemessen an der Startseite auf einem vierfach gedrosselten
 * Telefon bei 1,6 Mbit/s: die vorgeladene Datei bei 845 ms fertig, die zweite —
 * dieselben 23 KiB — von 910 bis 2.254 ms, und der Largest Contentful Paint
 * 142 ms danach bei 2.396 ms. Ein Wert über Budget, dessen Ursache in einer
 * Datei stand, die auf der gemessenen Seite gar nicht vorkommt.
 */

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

/** Die Klassen fürs `<html>`-Element. Dieselben auf jeder Seite, auch auf den beiden, die ihr eigenes Dokument mitbringen. */
export const schriftKlassen = `${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
