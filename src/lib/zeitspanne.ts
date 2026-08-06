/**
 * Die Zeitrechnung hinter zwei Angaben, die auf der Seite stehen.
 *
 * „Vier Monate ausgeliefert" und „vier Produktionssysteme in vier Monaten"
 * kommen aus derselben Rechnung: erster Commit gegen den Prüfstempel aus
 * `verified.json`. Das ist eine Zahl, die täglich wandert, öffentlich steht
 * und die niemand nachrechnet — genau die Sorte, bei der ein Fehler um eins
 * monatelang unbemerkt bleibt.
 *
 * Deshalb liegt sie hier als reine Funktion und nicht als Rechnung mitten in
 * der Inhaltsdatei: Mit Ein- und Ausgabe lässt sie sich prüfen, siehe
 * `zeitspanne.test.ts`. Der Fall, der wirklich weh tut, ist der Monatswechsel
 * am Stichtag; er steht dort zweimal, einen Tag davor und einen Tag danach.
 */

/**
 * Volle Monate zwischen zwei Tagen, mindestens einer.
 *
 * „Voll“ heißt: Der 26. März zählt erst am 26. April als ein Monat, nicht
 * schon am 1. April. Ohne diese Bedingung sagt die Seite am Monatsersten
 * einen Monat mehr, als vergangen ist.
 *
 * Die Untergrenze von eins ist Absicht: Am ersten Tag steht dort „einem
 * Monat" statt „null Monaten“. Eine Spanne von null Monaten wäre richtig
 * gerechnet und trotzdem falsch geschrieben.
 */
export function monateZwischen(start: Date, stand: Date): number {
  let monate =
    (stand.getFullYear() - start.getFullYear()) * 12 + (stand.getMonth() - start.getMonth());
  if (stand.getDate() < start.getDate()) monate -= 1;
  return Math.max(1, monate);
}

/** Volle Jahre zwischen zwei Tagen, nach derselben Regel, mindestens eines. */
export function jahreZwischen(start: Date, stand: Date): number {
  return Math.max(1, Math.floor(monateZwischen(start, stand) / 12));
}

const WOERTER_DATIV = [
  "einem",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
  "neun",
  "zehn",
  "elf",
  "zwölf",
] as const;

const WOERTER_NOMINATIV = [
  "ein",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
  "neun",
  "zehn",
  "elf",
  "zwölf",
] as const;

/**
 * Kleine Zahlen als Wort, wie es im Fließtext üblich ist.
 *
 * Zwei Listen, weil der Fall unterschiedlich ist: „in **einem** Monat“
 * gegenüber „**ein** Monat ausgeliefert". Ab dreizehn steht die Ziffer da —
 * ausgeschriebene Zahlwörter werden dann länger als die Aussage.
 */
export function alsWort(n: number, fall: "dativ" | "nominativ" = "dativ"): string {
  const liste = fall === "dativ" ? WOERTER_DATIV : WOERTER_NOMINATIV;
  return liste[n - 1] ?? String(n);
}

const WORDS_EN = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

/**
 * Dasselbe auf Englisch.
 *
 * Die englische Fassung hatte ihre eigene Rechnung samt eigener Wortliste —
 * dieselbe Logik ein zweites Mal, und damit die zweite Stelle, an der ein
 * Fehler um eins entstehen kann, ohne dass die erste ihn zeigt.
 */
export function asWord(n: number): string {
  return WORDS_EN[n - 1] ?? String(n);
}

/** Ersten Buchstaben groß, für Überschriften. */
export function grossErstes(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
