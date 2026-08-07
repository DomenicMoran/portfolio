import type { Article } from "./types";

/**
 * Die Ursache steht wörtlich in der Commit-Nachricht von bce08f5e
 * (Salati-Repo, 23.07.2026). Der Artikel zeichnet den Weg dorthin nach.
 */
export const widgetDe: Article = {
  slug: "widget-leer-trotz-gruener-tests",
  title: "Alle Tests grün. Widget trotzdem leer auf dem echten Gerät.",
  dek: "Die Gebetszeiten im Android-Widget standen still. Typecheck grün, Tests grün, im Emulator nicht reproduzierbar. Die Ursache war ein Wort in der package.json.",
  date: "2026-07-30",
  minutes: 4,
  tags: ["React Native", "Android", "Metro", "Debugging"],
  evidence: [
    "Salati-Repo, Commit bce08f5e vom 23. Juli 2026",
    "Geänderte Datei: apps/mobile/package.json, ein Feld",
    "Vorgeschichte: Commit 07d259e2 (Absturz des Einrichtungsbildschirms, andere Ursache)",
  ],
  blocks: [
    {
      kind: "p",
      text: "Salati zeigt die nächste Gebetszeit in einem Widget auf dem Startbildschirm. Das ist die Funktion, die die meisten Nutzer am häufigsten sehen, und über Wochen war sie kaputt, ohne dass es jemandem aufgefallen wäre.",
    },
    {
      kind: "p",
      text: "Kaputt heißt hier nicht abgestürzt. Das Widget war da, es sah richtig aus, es zeigte Gebetszeiten. Sie waren nur alt. Wer die App öffnete, sah frische Zeiten. Wer nur auf den Startbildschirm schaute, sah den Stand vom letzten App-Start.",
    },
    {
      kind: "h2",
      text: "Warum kein Test das gefunden hat",
    },
    {
      kind: "p",
      text: "Die Berechnung der Gebetszeiten hat Tests, und die liefen. Die Aufbereitung der Widget-Daten hat Tests, und die liefen auch. Beide prüften Funktionen, die korrekt waren. Der Fehler lag nicht in einer Funktion, sondern darin, dass eine davon auf dem Gerät nie aufgerufen wurde.",
    },
    {
      kind: "note",
      title: "Das ist die Fehlerklasse, die Tests strukturell nicht sehen",
      text: "Ein Test ruft die Funktion selbst auf. Ob das Betriebssystem sie im Betrieb auch aufruft, ist damit nicht geprüft. Alles, was an einer Registrierung beim System hängt, an einem Hintergrunddienst oder an einem Auflösungsschritt des Bündlers, fällt in diese Lücke.",
    },
    {
      kind: "p",
      text: "Im Emulator trat es ebenfalls nicht auf, aus einem banalen Grund: Wer im Emulator entwickelt, öffnet ständig die App. Und beim Öffnen der App wurden die Widgets aktualisiert, über einen anderen Weg als den der Hintergrund-Aktualisierung. Der kaputte Pfad wurde also bei jeder Prüfung durch den funktionierenden verdeckt.",
    },
    {
      kind: "h2",
      text: "Der Weg zur Ursache",
    },
    {
      kind: "p",
      text: "Android aktualisiert ein Widget über einen Hintergrundauftrag, den das System nach einem festen Takt auslöst, bei uns alle 30 Minuten. React Native meldet dafür einen Handler an, der ohne sichtbare App läuft. Drei Fragen waren zu klären, in dieser Reihenfolge.",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Löst das System den Auftrag überhaupt aus?",
        "Wenn ja: findet er einen Handler?",
        "Wenn ja: rechnet der Handler richtig?",
      ],
    },
    {
      kind: "p",
      text: "Die erste Frage war schnell beantwortet: Der Auftrag lief, sichtbar im Systemprotokoll. Die zweite Frage war die richtige. Es gab keinen Handler. Die Anmeldung war nie ausgeführt worden.",
    },
    {
      kind: "p",
      text: "Die Anmeldung steht in `index.android.js`, einer Datei, die React Native ausschließlich auf Android lädt. iOS und Web bekommen `index.js`. Der Aufsatzpunkt für beides ist ein Feld in der `package.json`.",
    },
    {
      kind: "h2",
      text: "Ein Wort zu viel",
    },
    {
      kind: "code",
      lang: "diff",
      caption: "Commit bce08f5e. Der ganze Fix.",
      code: `{
   "name": "@salatibox/mobile",
-  "main": "index.js",
+  "main": "index",
   "version": "0.1.0",`,
    },
    {
      kind: "p",
      text: "Metro, der Bündler von React Native, löst Modulpfade plattformspezifisch auf. Aus `index` wird auf Android `index.android.js`, falls die Datei existiert, sonst `index.js`. Steht die Endung aber schon im Pfad, gibt es nichts mehr aufzulösen. `index.js` ist `index.js`, auf jeder Plattform.",
    },
    {
      kind: "p",
      text: "Damit lud Android die iOS-Variante des Aufsatzpunkts. Die Anwendung startete normal, denn die Datei registriert die App genauso. Nur die Widget-Anmeldung stand eben in der anderen Datei. Es gab keine Fehlermeldung, weil aus Sicht des Systems nichts fehlschlug: Ein Hintergrundauftrag ohne Handler tut einfach nichts.",
    },
    {
      kind: "h2",
      text: "Warum das so lange unentdeckt blieb",
    },
    {
      kind: "p",
      text: "Weil es einen zweiten, funktionierenden Weg gab. Beim Öffnen der App läuft eine Auffrischung aller Widgets, die einen eigenen Zeichner benutzt und den Handler nicht braucht. Der ergibt für sich genommen Sinn, sorgte hier aber dafür, dass jede manuelle Prüfung erfolgreich aussah. Der Fehler war nur sichtbar, wenn man die App eine halbe Stunde nicht anfasste, und genau das tut niemand, der gerade daran arbeitet.",
    },
    {
      kind: "p",
      text: "Kurz zuvor hatte ich am selben Widget einen anderen Fehler behoben, einen Absturz des Einrichtungsbildschirms. Der war laut und in Minuten gefunden. Dieser hier war leise und brauchte Wochen. Die Lautstärke eines Fehlers sagt nichts über seine Bedeutung.",
    },
    {
      kind: "h2",
      text: "Was sich danach geändert hat",
    },
    {
      kind: "list",
      items: [
        "Widget-Änderungen werden auf einem echten Gerät geprüft, mit geschlossener App und über einen vollen Aktualisierungstakt hinweg. Nicht im Emulator zwischen zwei App-Starts.",
        "Der Handler meldet beim Anmelden eine Zeile ins Protokoll. Eine Anmeldung, die nie stattfindet, ist damit sichtbar, statt nur wirkungslos zu sein.",
        "Bei jedem Fehler, der nur auf einer Plattform auftritt, steht die Auflösung des Bündlers weit oben auf der Liste. Plattform-Endungen sind eine stille Mechanik: Sie greifen, oder sie greifen nicht, und beides sieht gleich aus.",
      ],
    },
    {
      kind: "p",
      text: "Die allgemeine Lehre ist unbequemer. Eine grüne Testsuite beweist, dass die geprüften Funktionen tun, was sie sollen. Sie beweist nicht, dass sie im Betrieb aufgerufen werden. Zwischen diesen beiden Sätzen liegt die Klasse von Fehlern, die es bis zum Nutzer schafft. Deshalb gilt bei mir seitdem, dass eine Änderung erst fertig ist, wenn sie am laufenden System nachgewiesen ist, und nicht, wenn die Tests grün sind.",
    },
  ],
};
