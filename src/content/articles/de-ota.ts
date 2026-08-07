import type { Article } from "./types";

/**
 * Der Ablauf steht in der Commit-Nachricht von 71bd8d2b (Salati-Repo,
 * 30.07.2026), inklusive der Gegenprüfung, mit der die Sache aufflog.
 */
export const otaDe: Article = {
  slug: "published-ist-kein-beleg",
  title: "„Published“ ist kein Beleg. Meine Updates kamen nie an.",
  dek: "Monatelang habe ich geglaubt, ich könne Inhaltskorrekturen ohne Store-Zyklus ausliefern. Das Werkzeug meldete nach jedem Versuch Erfolg. Angekommen ist bei keinem einzigen Nutzer je etwas.",
  date: "2026-07-30",
  minutes: 5,
  tags: ["Expo", "EAS Update", "React Native", "Verifikation"],
  evidence: [
    "Salati-Repo, Commit 71bd8d2b vom 30. Juli 2026",
    "Gegenprüfung: Update-Liste beider EAS-Projekte, Kanal production, null Einträge",
    "apps/mobile/app.config.ts (eine Konstante für version und runtimeVersion)",
    "Regressionstest: apps/mobile/src/__tests__/versionen-gleichlauf.test.ts",
    "Nach dem Fix: erstes veröffentlichtes Update, Runtime 1.41.0, Android und iOS",
    {
      text: "verified-done: die Regel aus diesem Artikel als Werkzeug",
      href: "https://github.com/DomenicMoran/verified-done",
    },
  ],
  blocks: [
    {
      kind: "p",
      text: "Über-die-Luft-Updates sind für eine App mit viel Text das wichtigste Werkzeug überhaupt. Ein Tippfehler in einer Übersetzung, eine falsche Umschrift, eine unglückliche Formulierung: All das lässt sich damit in Minuten korrigieren, statt zwei Tage auf eine Store-Prüfung zu warten.",
    },
    {
      kind: "p",
      text: "Auf meiner eigenen Projektseite stand über Monate „OTA-Updates: Inhaltskorrekturen ohne Store-Zyklus“ als Fähigkeit. Ich habe das geglaubt. In der Codebasis stand ein Kommentar, der den Weg als etabliert beschrieb. Es gab eine Konfiguration, es gab einen Kanal, und der Befehl lief durch.",
    },
    {
      kind: "p",
      text: "Er lief nur nicht bis zum Ende, und niemand hat es gemerkt, weil das, was fehlschlug, still fehlschlug.",
    },
    { kind: "h2", text: "Wie es aufflog" },
    {
      kind: "p",
      text: "Ich wollte eine Korrektur an der Umschrift ausliefern, während bei Apple gerade eine Prüfung lief. Genau der Fall, für den es Über-die-Luft-Updates gibt: Man will die laufende Einreichung nicht abbrechen, nur um einen Buchstaben zu ändern.",
    },
    {
      kind: "p",
      text: "Der Befehl brach ab. Das war der erste ehrliche Fehler seit Monaten, und er hat eine Frage aufgeworfen, die ich vorher nie gestellt hatte: Wenn das jetzt nicht geht, wie oft ging es vorher?",
    },
    {
      kind: "note",
      title: "Die Prüfung, die alles beantwortet hat",
      text: "Statt dem Kommentar im Code zu glauben, habe ich die Update-Liste beider EAS-Projekte abgefragt. Ergebnis: null Einträge auf dem Produktionskanal. In beiden. Es war nie eines veröffentlicht worden. Die Abfrage dauert fünf Sekunden und hätte die ganze Zeit über zur Verfügung gestanden.",
    },
    {
      kind: "h2",
      text: "Fehler eins: eine Richtlinie, die es hier nicht gibt",
    },
    {
      kind: "p",
      text: "Ein Über-die-Luft-Update darf nur auf Installationen laufen, deren nativer Teil dazu passt. Sonst spricht neuer JavaScript-Code mit alten nativen Modulen, und die App stürzt ab. Diese Zuordnung stellt die `runtimeVersion` her.",
    },
    {
      kind: "p",
      text: "Sie lässt sich als Richtlinie angeben, etwa „nimm den Fingerabdruck der nativen Abhängigkeiten“. Das ist der bequeme Weg, und er funktioniert, wenn das Werkzeug das native Projekt selbst erzeugt.",
    },
    {
      kind: "p",
      text: "Dieses Projekt tut das nicht. Der Android-Teil liegt als handgepflegtes Verzeichnis im Repository, weil dort Dinge stehen, die kein Konfigurations-Plugin abbildet. Für das Werkzeug ist das der sogenannte bare workflow, und dort wird eine Richtlinie nicht aufgelöst. Sie bleibt einfach ein Wort, mit dem niemand etwas anfangen kann.",
    },
    {
      kind: "code",
      lang: "ts",
      caption:
        "Die Nummer steht jetzt als Konstante an beiden Stellen. Derselbe Wert, nur auflösbar.",
      code: `const VERSION = "1.41.0";

export default {
  version: VERSION,
  runtimeVersion: VERSION,
  // vorher: runtimeVersion: { policy: "fingerprint" }
};`,
    },
    {
      kind: "h2",
      text: "Fehler zwei: zwei Projekte, die nichts voneinander wussten",
    },
    {
      kind: "p",
      text: "Der zweite Fehler war schlimmer, weil er auch nach der Reparatur des ersten weitergewirkt hätte.",
    },
    {
      kind: "p",
      text: "Die Adresse, von der eine Installation ihre Updates holt, steht im Android-Manifest. Normalerweise erzeugt der Prebuild-Schritt diese Datei aus der Konfiguration, und beide sind zwangsläufig gleich. Hier wird Android aber lokal gebaut, ohne Prebuild. Also existieren zwei unabhängige Quellen für dieselbe Angabe.",
    },
    {
      kind: "p",
      text: "Sie waren verschieden. Das Manifest zeigte auf ein EAS-Projekt, die Konfiguration auf ein anderes. Ein veröffentlichtes Update hätte damit immer nur eine der beiden Plattformen erreicht, und welche das war, hing davon ab, unter welchem Projekt man es veröffentlichte.",
    },
    {
      kind: "note",
      title: "Warum das niemandem auffällt",
      text: "Ein Update, das eine Plattform nicht erreicht, sieht auf dieser Plattform aus wie „kein Update vorhanden“. Es gibt keinen Fehler, keine Warnung, keinen Eintrag im Protokoll. Der Normalzustand und der Fehlerzustand sind ununterscheidbar.",
    },
    { kind: "h2", text: "Was jetzt verhindert, dass es wiederkommt" },
    {
      kind: "p",
      text: "Beide Fehler waren Konfigurationsfehler, und Konfigurationsfehler kommen zurück, sobald jemand die Datei anfasst. Deshalb prüft sie jetzt ein Test.",
    },
    {
      kind: "list",
      items: [
        "In `runtimeVersion` darf keine Richtlinie stehen, nur ein Wert.",
        "Die Update-Adresse im Android-Manifest muss dieselbe Projektkennung tragen wie die Konfiguration.",
        "Versionsname in der Konfiguration und im nativen Build müssen übereinstimmen.",
      ],
    },
    {
      kind: "p",
      text: "Nach dem Fix wurde das erste Update des Projekts überhaupt veröffentlicht: Laufzeit 1.41.0, beide Plattformen. Weil die Manifest-Korrektur den nativen Teil betrifft, musste Android neu gebaut werden. Dass die Adresse jetzt stimmt, habe ich in der gebauten Datei nachgelesen, nicht im Quelltext.",
    },
    { kind: "h2", text: "Die eigentliche Lehre" },
    {
      kind: "p",
      text: "Der technische Teil ist erklärbar und in zwei Zeilen behoben. Der unangenehme Teil ist, wie lange ich etwas für eine Fähigkeit gehalten habe, das nie funktioniert hat.",
    },
    {
      kind: "p",
      text: "Die Ursache dafür ist nicht Nachlässigkeit, sondern eine Verwechslung, die sehr leicht passiert: Ein Werkzeug meldet Erfolg für seinen eigenen Teil der Arbeit. „Published“ heißt, dass ein Paket gebaut und hochgeladen wurde. Es heißt nicht, dass ein Gerät es je anfragt, und schon gar nicht, dass eines es bekommt.",
    },
    {
      kind: "p",
      text: "Zwischen diesen beiden Aussagen liegt die gesamte Auslieferungskette. Sie zu prüfen kostet eine Abfrage.",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Die Erfolgsmeldung eines Werkzeugs bezieht sich auf das Werkzeug, nicht auf das Ergebnis.",
        "Bei allem, was ausgeliefert wird, ist die richtige Frage nicht „lief der Befehl durch“, sondern „liegt jetzt etwas dort, wo es hingehört“. Diese Frage hat fast immer eine Abfrage, die sie beantwortet.",
        "Ein Kommentar im Code, der einen Weg als etabliert beschreibt, ist kein Beleg. Er ist die Erinnerung von jemandem, der es einmal versucht hat.",
        "Existiert eine Angabe an zwei Stellen, weil ein Erzeugungsschritt fehlt, laufen die beiden auseinander. Nicht vielleicht, sondern irgendwann sicher. Dafür gibt es Tests.",
      ],
    },
  ],
};
