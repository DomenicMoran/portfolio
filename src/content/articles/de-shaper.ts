import type { Article } from "./types";

/**
 * Ursache, Gegenprüfung und Fix stehen in der Commit-Nachricht von 427cd6c6
 * (Salati-Repo, 31.07.2026).
 */
export const shaperDe: Article = {
  slug: "gestrichelter-kreis-kam-nicht-aus-der-schrift",
  title: "Der gestrichelte Kreis kam nicht aus der Schrift",
  dek: "In etwa jedem dritten Vers stand ein Punkt in einem gestrichelten Kreis, wo keiner hingehört. Ich habe zuerst die Schriftart verdächtigt. Sie war unschuldig.",
  date: "2026-07-31",
  minutes: 10,
  tags: ["Typografie", "HarfBuzz", "Unicode", "React Native"],
  evidence: [
    "Salati-Repo, Commit 427cd6c6 vom 31.07.2026",
    "Neu: apps/mobile/src/lib/arabicText.ts (Normalisierung, splitArabicWords, arabicClusters)",
    "Prüfskript: scripts/pruefe-koran-fonts.mjs, liest jede Schriftdatei byteweise",
    "Gegenprobe live gegen die Textquelle quran.com, Verse 2:2 und 2:5",
  ],
  blocks: [
    {
      kind: "p",
      text: "Ein Koran-Reader hat eine Aufgabe, die kein A/B-Test entscheidet: Der Text muss exakt so aussehen wie im gedruckten Buch. Ein zusätzliches Zeichen ist dort kein Schönheitsfehler, sondern ein Fehler im Text.",
    },
    {
      kind: "p",
      text: "In der App stand ein gestrichelter Kreis mit einem Punkt darin mitten in Versen. Nicht überall, aber häufig genug, dass es sofort auffiel.",
    },
    { kind: "h2", text: "Die naheliegende und falsche Erklärung" },
    {
      kind: "p",
      text: "Ein Zeichen, das dort steht, wo keines sein sollte, sieht nach einer unvollständigen Schriftart aus. Fehlt einer Schrift ein Zeichen, zeigt sie normalerweise ein Ersatzzeichen: ein leeres Rechteck.",
    },
    {
      kind: "p",
      text: "Also habe ich die Zeichentabelle der Schrift geprüft. Alle arabischen Schriftzeichen der Uthmani-Schreibweise waren enthalten, auch die Pausenzeichen. Die Erklärung stimmte nicht.",
    },
    {
      kind: "note",
      title: "Eine Zeichentabelle sagt nicht alles",
      text: "Eine Schrift kann ein Zeichen führen und trotzdem nichts Sinnvolles dafür zeichnen. Bei einer anderen Schrift in diesem Projekt waren 171 Zeichen in der Tabelle enthalten, aber alle auf denselben Platzhalter abgebildet. Wer nur die Tabelle prüft, hält das für vollständig. Sichtbar wird es erst, wenn man die Umrisse vergleicht.",
    },
    { kind: "h2", text: "Woher der Kreis wirklich kommt" },
    {
      kind: "p",
      text: "Das Zeichen ist U+25CC, der gepunktete Kreis. Es ist kein Zeichen der Schrift, sondern eine Konvention: Sie zeigt, wo ein Kombinationszeichen sitzen würde, wenn es einen Buchstaben zum Kombinieren hätte.",
    },
    {
      kind: "p",
      text: "Gesetzt wird es nicht von der Schrift und nicht von der App, sondern vom Textformer, der aus Zeichen Glyphen macht. Beginnt ein Formungslauf mit einem Kombinationszeichen, stellt er diesen Kreis als Träger davor. Aus Sicht des Formers ist das hilfreich: Er zeigt an, dass hier ein Zeichen ohne Bezugspunkt steht.",
    },
    { kind: "h2", text: "Warum der Lauf überhaupt so beginnt" },
    {
      kind: "p",
      text: "Der Text stammt aus einer öffentlichen Quelle in der Uthmani-Schreibweise. Dort stehen die Pausenzeichen als eigene, durch Leerzeichen getrennte Wörter im Text. Im Vers 2:2 etwa steht zwischen zwei Wörtern ein solches Zeichen allein.",
    },
    {
      kind: "p",
      text: "Solange der ganze Vers als ein durchgehender Text gesetzt wird, passiert nichts: Der Formungslauf beginnt mit einem Buchstaben, das Pausenzeichen steht mittendrin, alles ist gut.",
    },
    {
      kind: "p",
      text: "Die App zerlegt den Vers aber an drei Stellen in einzelne Wörter: für die Wort-Synchronisation beim Mitlesen, für die Ersatzdarstellung des Mushaf und für den Lückentest beim Auswendiglernen. Jedes Wort wird ein eigener Textknoten, also ein eigener Formungslauf. Und einer davon beginnt dann mit dem allein stehenden Pausenzeichen.",
    },
    {
      kind: "p",
      text: "Der Kreis war also kein Fehler in den Daten und keiner in der Schrift. Er war die korrekte Reaktion des Formers auf eine Zerlegung, die ihm einen Lauf ohne Träger gegeben hat.",
    },
    { kind: "h2", text: "Der zweite Schaden, den dieselbe Ursache angerichtet hat" },
    {
      kind: "p",
      text: "Beim Suchen nach dem Kreis ist ein zweiter Fehler aufgefallen, der viel länger unbemerkt gelaufen war.",
    },
    {
      kind: "p",
      text: "Die Textquelle zählt ein Wort samt folgendem Pausenzeichen als ein Wort. Die Wort-Zeitstempel der Rezitationen sind auf diese Zählung bezogen. Meine Zerlegung hat schlicht an jedem Leerzeichen getrennt und damit ein Token mehr geliefert.",
    },
    {
      kind: "p",
      text: "Die Folge: Ab dem ersten Pausenzeichen im Vers markierte die App beim Mitlesen das falsche Wort, und zwar für den Rest des Verses. Ein Fehler um eins, der genau dort anfängt, wo ein selten benutztes Zeichen steht.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "arabicText.ts: Zeichen-Token hängen sich an das vorherige Wort, statt eines zu werden.",
      code: `// Ein allein stehendes Pausenzeichen ist kein eigenes Wort.
// Es gehört an das Wort davor: dorthin, wo auch die Quelle es zählt.
export function splitArabicWords(text: string): string[] {
  const woerter: string[] = [];

  for (const token of normalisiere(text).split(/\\s+/)) {
    if (!token) continue;
    if (istNurZeichen(token) && woerter.length > 0) {
      woerter[woerter.length - 1] += " " + token;
      continue;
    }
    woerter.push(token);
  }

  return woerter;
}`,
    },
    {
      kind: "p",
      text: "Damit sind beide Wirkungen weg: Kein Lauf beginnt mehr mit einem Kombinationszeichen, und die Wortzählung stimmt wieder mit den Zeitstempeln überein.",
    },
    {
      kind: "note",
      title: "Einmal normalisieren, nicht bei jeder Darstellung",
      text: "Die Normalisierung sitzt an der Datenquelle, nicht in den Komponenten. Sonst hätte jede Ansicht ihre eigene Fassung des Textes, und die nächste neue Ansicht hätte den Fehler wieder. Genau dieser Weg hatte ihn ja an drei Stellen gleichzeitig erzeugt.",
    },
    { kind: "h2", text: "Was ich bei den Schriften daraus gemacht habe" },
    {
      kind: "p",
      text: "Weil die Schrift zuerst der Hauptverdächtige war, habe ich für die Aufnahme neuer Schriften ein hartes Kriterium gebaut: Ein Skript liest jede Schriftdatei byteweise und prüft, ob sie den vollständigen Zeichenvorrat der Uthmani-Schreibweise abdeckt.",
    },
    {
      kind: "p",
      text: "Fünf naheliegende Kandidaten sind daran gescheitert, mit 19 bis 24 fehlenden Zeichen. Das Ergebnis ist unbequem und eindeutig: Für die Uthmani-Schreibweise gibt es derzeit keine freie Nastaliq-Schrift, die vollständig ist. Für den südasiatischen Raum bleiben zwei andere Familien.",
    },
    {
      kind: "p",
      text: "Auch die Zeilenmaße sind gemessen statt geschätzt: Die Zeilenhöhe kommt aus den Werten, die Android für seinen Innenabstand heranzieht, nicht aus den naheliegenden anderen. Bei mehreren Schriften liegen übereinander gesetzte arabische Zeichen außerhalb der zweiten Box, und eine zu enge Zeile schneidet sie oben ab.",
    },
    { kind: "h2", text: "Was ich mitnehme" },
    {
      kind: "list",
      ordered: true,
      items: [
        "Wenn ein Zeichen erscheint, das niemand geschrieben hat, hat es jemand gesetzt. Meist die Schicht zwischen Text und Bild, an die man zuletzt denkt.",
        "Eine Zeichentabelle beweist Vorhandensein, nicht Brauchbarkeit. Wer sicher sein will, vergleicht Umrisse.",
        "Text an Leerzeichen zu zerlegen ist eine Annahme über die Sprache, keine neutrale Operation. In dieser Schrift war sie falsch.",
        "Normalisierung gehört an die Datenquelle. An der Darstellung angebracht, wiederholt sie sich mit jeder neuen Ansicht, und irgendeine vergisst man.",
      ],
    },
  ],
};
