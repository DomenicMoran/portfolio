/**
 * Aus einer Überschrift eine Sprungmarke machen.
 *
 * Die Artikel haben zehn bis zwölf Zwischenüberschriften und bis heute keine
 * Adresse dafür: Wer einen Absatz weitergeben wollte, konnte nur den ganzen
 * Text schicken. Bei Texten, deren Zweck es ist, eine bestimmte Stelle zu
 * belegen, ist das die falsche kleinste Einheit.
 *
 * Umlaute werden ausgeschrieben und nicht entfernt: „Der zweite Hebel“ und
 * „Der zwiete Hebel“ wären sonst dieselbe Marke. Alles andere fällt weg, und
 * mehrere Trennstriche werden zu einem — eine Marke soll man vorlesen können.
 */
export function alsSprungmarke(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
