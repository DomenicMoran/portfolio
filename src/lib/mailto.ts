/**
 * Die Mailadresse als Verweis, mit vorbelegtem Betreff.
 *
 * Neun Stellen bauten `mailto:${site.email}` von Hand zusammen: Kopfleiste,
 * Fußzeile, Kontaktbereich, Recruiter-Bereich, Befehlspalette, 404-Seite,
 * One-Pager, Impressum und Datenschutzerklärung. Neunmal dieselbe
 * Zeichenkette heißt: Wer etwas daran ändert, ändert es an acht Stellen nicht
 * mit, und genau so war es: Die beiden Rechtsseiten blieben beim ersten
 * Durchgang liegen und waren danach die einzigen zwei Mailverweise der Seite
 * ohne Betreff.
 *
 * Eine Ausnahme bleibt: `security.txt` nennt die Adresse ohne Betreff. RFC
 * 9116 erwartet dort eine blanke Kontaktangabe, keine vorbelegte Nachricht.
 *
 * Der Betreff ist der Grund, warum es die Funktion jetzt gibt. Ohne ihn öffnet
 * sich ein leeres Fenster, und die Nachricht kommt ohne Zeile an, an der sich
 * erkennen ließe, woher sie stammt. Mit ihm steht sie da, bevor jemand tippt:
 * und lässt sich ändern wie jeder andere Betreff auch.
 *
 * Kodiert wird der Betreff vollständig. `encodeURIComponent` lässt genau die
 * Zeichen stehen, die in einer Abfrage stehen dürfen; Umlaute, Leerzeichen und
 * kaufmännische Und werden zu Prozentfolgen. Ohne das bricht ein „&“ im
 * Betreff die Adresse auseinander, und alles dahinter landet als eigenes Feld.
 */
export function mailAdresse(
  email: string,
  betreff?: string,
  punkte?: readonly string[],
): string {
  if (!betreff) return `mailto:${email}`;
  const felder = [`subject=${encodeURIComponent(betreff)}`];
  if (punkte?.length) felder.push(`body=${encodeURIComponent(rumpf(punkte))}`);
  return `mailto:${email}?${felder.join("&")}`;
}

/**
 * Die Punkte, um die der Kontaktbereich bittet, als vorbereitete Nachricht.
 *
 * Die Seite listet unter „Das hilft mir in der ersten Mail" vier Angaben und
 * überlässt es danach dem Absender, sie sich zu merken. Wer auf „Direkt
 * schreiben" klickt, bekommt ein leeres Fenster, und schreibt zwei Sätze
 * ohne Gehaltsrahmen, worauf eine Rückfrage folgt, die genau die Zeit kostet,
 * die der letzte Punkt sparen will.
 *
 * Die Zeilen stammen aus derselben Liste, die daneben steht: eine Quelle, und
 * in beiden Sprachen dieselbe. Sie stehen als leere Stichpunkte da, nicht als
 * Fragen, wer sie nicht braucht, löscht eine Zeile, statt einen Text zu
 * überschreiben.
 *
 * Zeilenumbrüche als CRLF: RFC 6068 verlangt sie so im `body`, und Outlook
 * setzt ein einzelnes LF sonst nicht um.
 */
function rumpf(punkte: readonly string[]): string {
  const umbruch = String.fromCharCode(13, 10);
  /* Ohne angehängten Doppelpunkt: Zwei der vier Punkte tragen selbst einen
     („Worum es geht: Rolle, Projekt oder Frage"), und angehängt las sich das
     als „…oder Frage: ". Die Zeilen stehen so da, wie sie auf der Seite
     stehen, und werden beim Schreiben überschrieben. */
  return punkte.map((p) => `- ${p}`).join(umbruch) + umbruch + umbruch;
}
