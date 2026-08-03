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
 * dort ebenfalls „Geist", und genau darum greift die Zuordnung nach Gewicht.
 */
export const ogSchriften = [
  { name: "Geist", data: halbfett, weight: 600 as const, style: "normal" as const },
];
