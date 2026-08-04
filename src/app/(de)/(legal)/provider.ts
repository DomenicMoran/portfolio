/**
 * Die Angaben zum Anbieter, für beide Rechtsseiten.
 *
 * Die Anschrift stand zweimal fest im Quelltext: einmal unter „Angaben gemäß
 * § 5 DDG" im Impressum, einmal unter „Verantwortlicher" in der
 * Datenschutzerklärung. Zwei Stellen für dieselbe Angabe halten genau so
 * lange, bis eine davon geändert wird — und dann widersprechen sich
 * ausgerechnet die beiden Dokumente, die eine Behörde nebeneinanderlegt.
 *
 * Hier und nicht in `src/content/site.ts`: Dort steht, was auf der Seite,
 * in `llms.txt`, in `humans.txt` und auf den Vorschaukarten landet. Die
 * Anschrift gehört auf zwei Seiten und sonst nirgends.
 */

/** Der Name des Anbieters. Steht auf beiden Seiten oben. */
export const ANBIETER = "Domenic Moran";

/**
 * Die ladungsfähige Anschrift, zeilenweise.
 *
 * Als Zeilen und nicht als ein Satz: Das Impressum setzt sie untereinander,
 * die Datenschutzerklärung in eine Zeile. Beide bauen daraus, was sie
 * brauchen, statt zwei Schreibweisen zu pflegen.
 */
export const ANSCHRIFT = [
  "Heidelberger Straße 36",
  "12059 Berlin",
  "Deutschland",
] as const;

/** Dieselbe Anschrift in einer Zeile, wie die Datenschutzerklärung sie setzt. */
export const ANSCHRIFT_EINZEILIG = ANSCHRIFT.join(", ");
