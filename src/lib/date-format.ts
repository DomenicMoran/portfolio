/**
 * Der Prüfstempel aus `verified.json`, in Worten.
 *
 * Dieselbe Zahl steht an sieben Stellen: im Hinweis unter den Kennzahlen, in
 * der Fußzeile des gedruckten One-Pagers, in der Notiz unter dem Liefertempo,
 * in humans.txt, in llms.txt und in beiden Sprachfassungen. Jede Stelle hatte
 * ihre eigene Formatierung, und gemessen an der ausgelieferten Startseite
 * kamen dabei zwei Schreibweisen desselben Tages heraus:
 *
 *     Gemessen am 06.08.2026 über die GitHub-API …
 *     Zahlen für Salati, gezählt am 6. August 2026 …
 *
 * Beide Sätze sind Fließtext, beide erklären eine Messung, beide stehen auf
 * der Startseite. Die zweite Form ist die richtige — ein Datum mitten im Satz
 * schreibt man aus. Die erste entstand aus `split("-").reverse().join(".")`,
 * einer Zeile, die dreimal wortgleich im Bestand stand.
 *
 * Der englischen Fassung ist dasselbe schon einmal passiert, dort mit dem
 * rohen ISO-Wert; der Kommentar darüber steht seit dem in `en.ts`. Solange
 * jede Stelle ihr Datum selbst zusammensetzt, kommt die nächste Schreibweise
 * mit der nächsten Stelle. Deshalb liegt die Formatierung hier.
 */

/** „2026-08-06“ als „6. August 2026“. */
export function datumLang(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** „2026-08-06“ als „6 August 2026“. */
export function dateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
