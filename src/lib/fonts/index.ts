import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Die halbfette Schnitt der Hausschrift, für die Vorschaubilder.
 *
 * `next/og` bringt genau eine Schrift mit: `Geist-Regular.ttf`. Satori erfindet
 * keine Fettung — fehlt der Schnitt, rendert es den nächstbesten, und das ist
 * dort immer der reguläre. Gemessen an den ausgelieferten Karten: Jede
 * Überschrift verlangte `fontWeight` 600 oder 700 und kam in 400 heraus. Auf
 * einer Karte, die in einem LinkedIn-Verlauf zwischen anderen Karten steht,
 * ist das der Unterschied zwischen einer Überschrift und einer Bildunterschrift.
 *
 * Die Datei liegt im Repo statt in `public/`: Sie wird zur Bauzeit gelesen und
 * nie ausgeliefert. Der Bau bleibt damit ohne Netz, und die 73 KB kosten den
 * Leser nichts.
 *
 * Geist steht unter der SIL Open Font License 1.1, der Text liegt daneben.
 */
const halbfett = readFileSync(join(process.cwd(), "src/lib/fonts/Geist-SemiBold.ttf"));

/**
 * Für `ImageResponse`. Der reguläre Schnitt bleibt der eingebaute — er heißt
 * dort ebenfalls „Geist“, und genau darum greift die Zuordnung nach Gewicht.
 *
 * Zu den ungleichen Wortabständen auf den Karten, damit das niemand noch
 * einmal untersucht: Sie sind echt, gemessen am Pixel der ausgelieferten
 * Karte, und sie kommen aus Satoris Textsetzung. Derselbe Satz in 40 px:
 *
 *   Satori     15  18  15  22  14  14      (Grundlücke 14, nach „:“ 22)
 *   Chromium   12  13  12  15  13  13      (Grundlücke 12, nach „:“ 15)
 *
 * Die Richtung ist in beiden dieselbe — nach einem Doppelpunkt steht mehr
 * Weißraum, weil der Glyph schmaler ist als seine Vorschubbreite. Satori
 * setzt den Effekt nur rund zweieinhalbfach stärker. Er ist proportional zur
 * Schriftgröße, also keine Pixelrundung, die sich durch größeres Rendern
 * herausskalieren ließe.
 *
 * Was daran nicht liegt, jeweils gemessen und wieder verworfen: Schriftgewicht,
 * `letterSpacing`, `wordSpacing`, Wörter als Flex-Kinder mit `gap` (der als
 * String stillschweigend verworfen wird, als Zahl wirkt und die Verteilung
 * trotzdem unverändert lässt), `whiteSpace: pre`, `nowrap`, `wordBreak`.
 * Kerning ist es auch nicht — `font-kerning: none` ändert in Chromium nichts.
 *
 * Bliebe, jedes Wort selbst zu positionieren. Das kostet den Zeilenumbruch,
 * und damit Titel beliebiger Länge in zwei Sprachen. Für sieben Pixel hinter
 * einem Doppelpunkt ist das der falsche Tausch.
 */
export const ogSchriften = [
  { name: "Geist", data: halbfett, weight: 600 as const, style: "normal" as const },
];
