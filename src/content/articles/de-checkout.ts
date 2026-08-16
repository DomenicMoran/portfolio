import type { Article } from "./types";

/**
 * Der Befund und die Gegenprobe stehen im Dartile-Repo, `packages/kern`.
 * Die Zahl achtzehn ist gezählt, nicht geschätzt: Der Eigenschaftstest läuft
 * über alle Reste von 2 bis 170 in allen drei Aus-Modi.
 */
export const checkoutDe: Article = {
  slug: "achtzehn-wege-ueber-das-bull",
  title: "Achtzehn Wege über das Bull, und der Test sah nur den letzten Pfeil",
  titleShort: "Der Test sah nur den letzten Pfeil",
  dek: "Eine Regel stand im Code, ausformuliert und begründet. Sie galt für den Schlusspfeil und nicht für die beiden davor. Kein Test bemerkte es, weil er dieselbe Stelle ansah wie die Regel.",
  date: "2026-08-16",
  minutes: 4,
  tags: ["Tests", "Eigenschaftstests", "TypeScript", "Dart"],
  evidence: [
    "Dartile-Repo, packages/kern/src/checkout.ts: bullImAufbau und die Sortierung in checkoutWege",
    "Test: packages/kern/src/checkout.test.ts, „nimmt das Bull nicht als Vorbereitungspfeil“",
    "Gezählt über alle Reste von 2 bis 170 in den Modi doppel, master und straight",
    {
      text: "Die Tafel liegt öffentlich als darts-checkout",
      href: "https://github.com/DomenicMoran/darts-checkout",
    },
  ],
  blocks: [
    {
      kind: "p",
      text: "Eine Zähl-App für Dart behält niemand wegen der Addition. Die behält man wegen der Zahlen daneben: Average, Doppelquote, und der Vorschlag, wie sich der Rest ausmachen lässt. Genau dieser Vorschlag ist die empfindlichste Stelle des Produkts, denn er wird an der Scheibe gegen etwas gehalten, das die meisten Spieler im Kopf haben.",
    },
    {
      kind: "p",
      text: "Rechnerisch gibt es auf 40 Punkte über achtzig Wege. Gespielt wird genau einer. Eine Suche, die den ersten Treffer zurückgibt, gibt Unsinn zurück: `S1 S1 D19` ergibt genauso 40 wie `D20`. Also bekommt jeder Weg Kosten, und die Kosten bilden ab, was am Board zählt.",
    },
    { kind: "h2", text: "Die Regel stand längst da" },
    {
      kind: "p",
      text: "Eine davon betrifft das Bull. Der Doppelring ist ein langes, schmales Band, das Bullseye ein winziger Kreis. Deshalb steht in jeder gedruckten Tafel auf 95 die `D19` und nicht `T15 BULL`. Aufs Bull geht man, wenn es sein muss, nicht wenn es rechnerisch passt.",
    },
    {
      kind: "p",
      text: "Genau so stand es im Code, in der Funktion für den Schlusspfeil, mit Begründung im Kommentar darüber. Das Bullseye kostet dort 50, das teuerste Doppel 18.",
    },
    { kind: "h2", text: "Für die beiden Pfeile davor galt sie nicht" },
    {
      kind: "p",
      text: "Die Kosten der Vorbereitungspfeile kannten diese Aussage nicht. Dort kostete ein Bull neun, ungefähr so viel wie eine `T13`, und war damit der billigste Weg zu einem Rest von 40. Das Ergebnis sieht man erst, wenn man es sich ansieht:",
    },
    {
      kind: "table",
      head: ["Rest", "Vorgeschlagen", "Gleich lang, ohne Bull"],
      rows: [
        ["141", "T17 BULL D20", "T20 T19 D12"],
        ["90", "BULL D20", "T18 D18"],
        ["33", "25 D4", "S17 D8"],
      ],
      caption:
        "Drei der achtzehn Reste, bei denen der Vorschlag über das Bull lief, obwohl es einen gleich langen Weg daran vorbei gab.",
    },
    {
      kind: "p",
      text: "Keiner dieser Wege steht in einer gedruckten Tafel. Wer `BULL D20` auf 90 liest, glaubt der App die nächste Zahl auch nicht mehr.",
    },
    { kind: "h2", text: "Warum kein Test anschlug" },
    {
      kind: "p",
      text: "Es gab einen Test für die Sache, und er war kein schlechter. Er lief über alle Reste von 2 bis 170, holte alle Wege, und prüfte: Endet der Vorschlag auf dem Bull, obwohl ein gleich langer Weg auf einem Doppel endet? Das ist eine Eigenschaft und kein Einzelfall, und trotzdem lief er durch.",
    },
    {
      kind: "note",
      title: "Der Test hatte dieselbe Lücke wie der Code",
      text: "Er sah auf `wuerfe[wuerfe.length - 1]`, also auf den Schlusspfeil, weil die Regel dort stand. Beide, Code und Test, waren aus derselben Vorstellung geschrieben: Das Bull ist eine Frage des Abschlusses. Ein Test, der aus derselben Annahme entsteht wie der Code, prüft die Annahme nicht.",
    },
    {
      kind: "p",
      text: "Aufgefallen ist es beim Durchsehen der Tafel, von Hand, Rest für Rest. Das ist die unangenehme Antwort: Gefunden hat es kein Werkzeug, sondern der Blick auf das Erzeugnis.",
    },
    { kind: "h2", text: "Der Fix ist keine größere Strafe" },
    {
      kind: "p",
      text: "Der naheliegende Weg wäre, dem Bull im Aufbau höhere Kosten zu geben. Er ist falsch. Der Wert müsste größer sein als der größte Abstand zweier Doppel-Ränge, und er müsste bei jeder Änderung an den Gewichten mitwachsen. Eine Zahl, die von drei anderen Zahlen abhängt, ist keine Regel, sondern eine Kalibrierung, die beim nächsten Mal wieder kippt.",
    },
    {
      kind: "p",
      text: "Die Aussage gehört deshalb in die Sortierung, vor die Kosten: Gibt es einen gleich langen Weg ohne Bull im Aufbau, kommt er zuerst. Gibt es keinen, bleibt der Weg über das Bull stehen, denn ein Vorschlag ist besser als keiner. Kein Gewicht kann diese Aussage mehr überstimmen.",
    },
    {
      kind: "code",
      lang: "ts",
      code: `bewertet.sort((a, b) => {
  if (a.weg.length !== b.weg.length)
    return a.weg.length - b.weg.length;
  // Vor den Kosten, damit kein Gewicht diese Aussage überstimmen kann.
  if (a.bull !== b.bull) return a.bull - b.bull;
  if (a.kosten !== b.kosten) return a.kosten - b.kosten;
  return a.text.localeCompare(b.text);
});`,
      caption: "Die Reihenfolge trägt die Regel, nicht die Kostenfunktion.",
    },
    { kind: "h2", text: "Was ich daraus mitnehme" },
    {
      kind: "p",
      text: "Prüft eine Eigenschaft eine Folge von Schritten, dann prüft man sie an jedem Schritt und nicht am letzten. Der neue Test tut genau das: Er sieht auf `wuerfe.slice(0, -1)`, läuft über alle drei Aus-Modi und meldet jeden Rest, bei dem ein Weg ohne Bull dieselbe Länge hätte. Gegengeprobt mit dem alten Stand meldet er die achtzehn.",
    },
    {
      kind: "p",
      text: "Und die zweite Lehre ist die ältere: Ein grüner Testlauf ist kein Beleg dafür, dass das Ergebnis stimmt. Er ist ein Beleg dafür, dass die Annahmen im Test zu den Annahmen im Code passen.",
    },
    {
      kind: "p",
      text: "Die Tafel liegt inzwischen als eigenes Paket öffentlich, mit beiden Eigenschaftstests: `darts-checkout`, TypeScript, ohne Abhängigkeiten.",
    },
  ],
};
