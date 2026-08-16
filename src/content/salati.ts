/**
 * Die Salati-Zahlen, an einer Stelle.
 *
 * Sie standen an dreien: als `SALATI_VERSIONEN` in `de.ts`, als
 * `SALATI_VERSIONS` in `en.ts` und ein drittes Mal als Ziffer im Text der
 * Recruiter-Kachel „Ich kenne den Weg durch die Stores". Als Salati auf 66
 * ausgelieferte Versionen kam, wanderten die beiden Konstanten mit und die
 * Ziffer blieb stehen: Gemessen an der ausgelieferten Startseite nannte
 * dieselbe Seite 66 und 65, und die englische Fassung 66, wo die deutsche 65
 * sagte. Kein Prüflauf sah das: Der Zahlenlauf vergleicht die Konstanten mit
 * dem Repo, und der Sprachvergleich zählt Bauteile, keine Ziffern im Fließtext.
 *
 * Nachgeführt wird hier und nirgends sonst. `check-figures.mjs` liest diese
 * Datei und vergleicht sie mit den Auslieferungen im Store.
 */

/** Im Changelog der App gezählt, siehe check-figures.mjs. */
export const SALATI_VERSIONEN = 69;

/** Die höchste ausgelieferte Version, wie sie im Store steht. */
export const SALATI_STAND = "1.50.0";

/** Der erste Commit im Salati-Monorepo. */
export const SALATI_ERSTER_COMMIT = "2026-04-16";
