/**
 * Der Stand der Datenschutzerklärung. Datum und Prüfsumme des Textes.
 *
 * Das Datum wird von Hand gepflegt, und das ist Absicht: Hier stand einmal
 * `new Date()`. Damit trug die Erklärung das Datum des letzten Bauvorgangs,
 * und der läuft täglich, weil ein Automat die Commit-Zahlen auffrischt. Die
 * Seite datierte sich also jeden Morgen neu, ohne dass sich ein Wort geändert
 * hatte. Bei einem Rechtstext ist das keine Kleinigkeit: Das Datum ist die
 * Zusage, dass der Text an diesem Tag so galt.
 *
 * Von Hand gepflegt heißt aber auch: Es kann stehen bleiben, während der Text
 * weiterwandert. Deshalb steht die Prüfsumme daneben. `check:legal` liest den
 * ausgelieferten Text, rechnet sie neu und scheitert, wenn beide nicht mehr
 * zusammenpassen, der Abschnitt „Stand“ selbst bleibt dabei außen vor, sonst
 * änderte jedes neue Datum die Prüfsumme und der Lauf wäre eine Schleife.
 *
 * Wer den Text ändert, ändert beide Zeilen mit. Der Lauf sagt, welche
 * Prüfsumme hineingehört.
 */
export const STAND = "8. August 2026";

/** sha256 über den sichtbaren Text von `/datenschutz`, ohne den Abschnitt „Stand“. */
export const TEXT_PRUEFSUMME = "7228a48ff8e6e8d6";
