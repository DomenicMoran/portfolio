/**
 * Eine geschriebene Zahl lesen und in derselben Schreibweise zurückgeben.
 *
 * Der Zähler auf der Startseite bekommt seinen Wert als Zeichenkette aus der
 * Inhaltsdatei — „1.276“ auf Deutsch, „1,276“ auf Englisch — und muss daraus
 * eine Zahl gewinnen, um sie hochlaufen zu lassen, und danach wieder eine
 * Zeichenkette in derselben Schreibweise.
 *
 * Beides stand fest auf Deutsch: `.` gruppiert, `,` trennt die Nachkommastelle,
 * ausgegeben wurde mit `toLocaleString("de-DE")`. Auf der englischen Seite las
 * der Zähler „1,276“ deshalb als eins Komma zwei sieben sechs und gab es mit
 * drei Nachkommastellen wieder aus. Sichtbar stimmte es trotzdem: Eine
 * deutsche Dezimalzahl mit drei Nachkommastellen ist zeichengleich mit einer
 * englischen Tausendergruppe. Gemessen an der ausgelieferten Seite lief der
 * Zähler auf /en über 1,320 · 2,512 · 3,230 bis 4,318 — richtig, aber aus dem
 * falschen Grund.
 *
 * Der Zufall hält nur, solange jede Zahl genau eine Dreiergruppe hat. Ein
 * englisches „12,345,678“ ergäbe keine Zahl mehr, ein englisches „1.5“ die
 * Zahl 15.
 */

export type Sprache = "de" | "en";

/** Was in dieser Sprache Tausender gruppiert und was die Nachkommastelle trennt. */
const TRENNZEICHEN: Record<Sprache, { gruppe: string; komma: string }> = {
  de: { gruppe: ".", komma: "," },
  en: { gruppe: ",", komma: "." },
};

const ORTSANGABE: Record<Sprache, string> = { de: "de-DE", en: "en-GB" };

/** Nicht ausgeführt: Wer `zerlege` aufruft, reicht das Ergebnis nur weiter. */
type Zahlwert = {
  /** Der Zahlenwert, oder `null`, wenn die Zeichenkette keiner ist. */
  zahl: number | null;
  /** Was hinter der Zahl stand: „ %“, „/7“, „ h“. Bleibt wörtlich stehen. */
  zusatz: string;
  /** Wie viele Nachkommastellen die Quelle hatte. */
  stellen: number;
  /** Ob die Quelle Tausender gruppiert hat. Eine Jahreszahl tut das nicht. */
  gruppiert: boolean;
};

/**
 * Zerlegt „1.276“, „100 %“, „24/7“ oder „2022“ in Zahl und Rest.
 *
 * Nur der führende Zahlenteil wird gelesen; alles dahinter bleibt, wie es ist.
 * So bleibt die Inhaltsdatei lesbar, statt jeden Wert in Zahl und Einheit zu
 * zerlegen.
 */
export function zerlege(wert: string, sprache: Sprache): Zahlwert {
  const { gruppe, komma } = TRENNZEICHEN[sprache];
  const treffer = wert.match(/^([\d.,]+)(.*)$/);
  if (!treffer) return { zahl: null, zusatz: "", stellen: 0, gruppiert: false };

  const zahlteil = treffer[1];
  const zusatz = treffer[2];

  const nachkomma = zahlteil.split(komma);
  const stellen = nachkomma.length === 2 ? nachkomma[1].length : 0;
  // Mehr als ein Dezimaltrennzeichen ist keine Zahl, sondern eine Aufzählung.
  if (nachkomma.length > 2) {
    return { zahl: null, zusatz: "", stellen: 0, gruppiert: false };
  }

  const roh = zahlteil.split(gruppe).join("").replace(komma, ".");
  const zahl = Number(roh);

  return {
    zahl: Number.isFinite(zahl) && roh !== "" ? zahl : null,
    zusatz,
    stellen,
    gruppiert: zahlteil.includes(gruppe),
  };
}

/**
 * Schreibt eine Zahl so, wie die Quelle sie geschrieben hätte.
 *
 * `gruppiert` kommt aus der Quelle und wird nicht geraten: Sonst erschiene die
 * Jahreszahl 2022 als „2.022“.
 */
export function schreibe(zahl: number, form: Zahlwert, sprache: Sprache): string {
  return zahl.toLocaleString(ORTSANGABE[sprache], {
    minimumFractionDigits: form.stellen,
    maximumFractionDigits: form.stellen,
    useGrouping: form.gruppiert,
  });
}
