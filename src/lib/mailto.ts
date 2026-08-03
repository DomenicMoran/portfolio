/**
 * Die Mailadresse als Verweis, mit vorbelegtem Betreff.
 *
 * Sieben Stellen bauten `mailto:${site.email}` von Hand zusammen: Kopfleiste,
 * Fußzeile, Kontaktbereich, Recruiter-Bereich, Befehlspalette, 404-Seite und
 * der One-Pager. Siebenmal dieselbe Zeichenkette heißt: Wer etwas daran
 * ändert, ändert es an sechs Stellen nicht mit.
 *
 * Der Betreff ist der Grund, warum es die Funktion jetzt gibt. Ohne ihn öffnet
 * sich ein leeres Fenster, und die Nachricht kommt ohne Zeile an, an der sich
 * erkennen ließe, woher sie stammt. Mit ihm steht sie da, bevor jemand tippt —
 * und lässt sich ändern wie jeder andere Betreff auch.
 *
 * Kodiert wird der Betreff vollständig. `encodeURIComponent` lässt genau die
 * Zeichen stehen, die in einer Abfrage stehen dürfen; Umlaute, Leerzeichen und
 * kaufmännische Und werden zu Prozentfolgen. Ohne das bricht ein „&" im
 * Betreff die Adresse auseinander, und alles dahinter landet als eigenes Feld.
 */
export function mailAdresse(email: string, betreff?: string): string {
  if (!betreff) return `mailto:${email}`;
  return `mailto:${email}?subject=${encodeURIComponent(betreff)}`;
}
