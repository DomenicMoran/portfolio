/**
 * Eine Adresse so kürzen, wie man sie hinschreibt.
 *
 * Auf dem Kurzprofil stehen GitHub und LinkedIn direkt untereinander. Beide
 * wurden bisher mit `replace("https://", "")` gesetzt, und weil nur LinkedIn
 * ein `www.` in der Adresse führt, sahen die zwei Zeilen verschieden aus:
 *
 *     github.com/DomenicMoran
 *     www.linkedin.com/in/domenicmoran
 *
 * Der Verweis selbst behält das `www.` — LinkedIn braucht es —, nur die
 * Anzeige verliert es. Ein abschließender Schrägstrich fällt ebenfalls weg:
 * `domenicmoran.de/` liest sich wie ein abgeschnittener Pfad.
 */
export function alsAnzeige(adresse: string): string {
  return adresse
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}
