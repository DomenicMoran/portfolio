import type { Article } from "./types";

/**
 * Alle Zahlen stammen aus den Läufen vom 08.08.2026 im Portfolio-Repo.
 * Ursache, Gegenprobe und Umbau stehen in den Commits d0efe33 und 60a46b9.
 */
export const kontrastDe: Article = {
  slug: "gruen-lokal-rot-in-der-ci",
  title: "Der Lauf war lokal grün und in der CI rot. Beide hatten recht.",
  titleShort: "Lokal grün, in der CI rot",
  dek: "Ein Prüflauf meldete 4,58:1 auf meinem Rechner und 4,50:1 auf dem Bauserver, für dieselbe Stelle und ohne Änderung dazwischen. Der Fehler lag nicht im Code, den er prüfte, sondern in der Art, wie er maß.",
  date: "2026-08-08",
  minutes: 4,
  tags: ["Barrierefreiheit", "WCAG", "CI", "Messung"],
  evidence: [
    "Portfolio-Repo, Commit 60a46b9 vom 8. August 2026 (roter CI-Lauf)",
    "Portfolio-Repo, Commit d0efe33 vom 8. August 2026 (Umbau des Verfahrens)",
    "scripts/check-contrast.mjs, misst 1.302 Textstellen über zwei Breiten",
    "Gegenprobe: drei Läufe hintereinander vor und nach dem Umbau",
    "Vergleichswert aus dem CI-Protokoll desselben Laufs unter Linux",
  ],
  blocks: [
    {
      kind: "p",
      text: "Ich habe einen Prüflauf, der den Farbkontrast dort misst, wo ein Standardwerkzeug schweigt. Werkzeuge wie axe verlangen eine einfarbige Hintergrundfarbe; steht der Text auf einem Verlauf, einer durchscheinenden Tönung oder einem Bild, melden sie „unbekannt“ und zählen die Stelle nicht. Auf einer dunklen Seite mit Glüh-Effekten und getönten Karten sind das keine Ausnahmen, sondern die Hälfte der Fläche.",
    },
    {
      kind: "p",
      text: "Der Lauf löst das, indem er jede Textstelle zweimal aufnimmt: einmal mit Text, einmal ohne. Aus der Differenz je Bildpunkt ergibt sich, wo ein Buchstabe liegt und welche Farbe wirklich hinter ihm steht. Das funktioniert seit Monaten. Bis die CI rot wurde.",
    },
    { kind: "h2", text: "Vier Komma fünf null gegen vier Komma fünf" },
    {
      kind: "p",
      text: "Die Meldung lautete: `4.50:1 statt 4.5:1`. Also 4,4999 irgendetwas, gerundet auf zwei Stellen, an einem Kommentar in einem Codeblock. Derselbe Lauf auf meinem Rechner, dieselbe Datei, derselbe Commit: 4,58:1. Kein Unterschied im Code, keiner im Inhalt, keiner in der Schriftgröße.",
    },
    {
      kind: "p",
      text: "Der erste Reflex ist, die Grenze anzufassen. Vier Hundertstel unter der Anforderung, das riecht nach Rundung, und ein Aufschlag von zwei Prozent hätte den Lauf sofort wieder grün gemacht. Genau das wäre der Fehler gewesen: Eine Prüfung, deren Grenze man verschiebt, sobald sie stört, prüft ab da nur noch sich selbst.",
    },
    {
      kind: "note",
      title: "Zwei Läufe, dieselbe Maschine, zwei Antworten",
      text: "Was den Verdacht bestätigte, war eine Wiederholung ohne jede Änderung: Für dieselbe zehn Pixel große Achsenbeschriftung meldete der Lauf einmal 4,13:1 und einmal gar nichts. Ein Messwert, der zwischen zwei Aufrufen um vier Zehntel springt, ist kein Messwert.",
    },
    { kind: "h2", text: "Die Kantenglättung entschied mit" },
    {
      kind: "p",
      text: "Der Lauf suchte den schlechtesten Wert über die Punkte, die ein Buchstabe voll deckt. Das klingt richtig, denn dort ist die Textfarbe am reinsten. Nur entscheidet über „voll gedeckt“ die Kantenglättung, und die fällt je Renderer anders aus. Windows und Linux setzen dieselbe Schrift in derselben Größe mit anderen Deckungswerten.",
    },
    {
      kind: "p",
      text: "Auf einfarbigem Grund ist das egal: Hinter jedem Punkt liegt dieselbe Farbe, und welchen man erwischt, ändert nichts. Auf einem Verlauf liegt hinter jedem Punkt eine andere. Der gemeldete Wert wurde damit zur Stichprobe, und welche Stichprobe es war, bestimmte ein Detail der Schriftdarstellung.",
    },
    { kind: "h2", text: "Die Deckung beantwortet nur noch die erste Frage" },
    {
      kind: "p",
      text: "In der Messung stecken zwei Fragen, und ich hatte sie über dieselbe Schleife beantwortet. Erstens: Steht hier überhaupt Text, und mit welcher Deckkraft? Zweitens: Wie dunkel ist der Grund im schlimmsten Fall? Nur die erste braucht die Kantenglättung.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "check-contrast.mjs: Der schlechteste Wert kommt aus dem Grund, nicht aus dem Buchstaben.",
      code: `// Erste Frage: Steht hier Text? Dafür zählen die gedeckten Punkte.
for (const punkt of punkteImKasten) {
  if (deckung[punkt] >= schwelle) kernpunkte++;
}

// Zweite Frage: Wie schlecht wird es? Dafür zählt jeder Punkt des
// Grundes im Zeilenkasten, unabhängig davon, ob ein Buchstabe ihn
// trifft. Das hängt an keiner Kantenglättung.
if (kernpunkte) {
  for (const punkt of punkteImKasten) {
    const hinten = grundfarbeAn(punkt);
    const erwartet = mische(textfarbe, hinten, deckkraft);
    schlechtester = Math.min(schlechtester, kontrast(erwartet, hinten));
  }
}`,
    },
    {
      kind: "p",
      text: "Der zweite Durchgang läuft über jeden Punkt in den Zeilenkästen des Textes und rechnet die Sollfarbe gegen den Grund, der dort wirklich liegt. Ob ein Buchstabe diesen Punkt trifft, spielt keine Rolle mehr. Damit misst der Lauf den schlimmsten Fall statt eines zufälligen.",
    },
    { kind: "h2", text: "Was danach sichtbar wurde" },
    {
      kind: "p",
      text: "Drei Läufe hintereinander meldeten dreimal denselben Wert, wo vorher 4,58, 4,61 und 4,59 standen. Und zwei echte Verstöße traten hervor, die im Rauschen gelegen hatten:",
    },
    {
      kind: "list",
      items: [
        "Codeblöcke, die seitwärts scrollen, tragen an den Rändern einen aufhellenden Streifen als Hinweis. Er liegt genau dort, wo Text steht. Bei 20 Prozent Weiß fiel eine Achsenbeschriftung eines Architekturbilds auf 4,10:1 und damit deutlich unter die 4,5:1 aus WCAG 1.4.3. Bei 12 Prozent bleibt der Hinweis sichtbar und der Kontrast im Rahmen.",
        "Ein Etikett saß als einziges seiner Art auf einer getönten Tafel und kam dort auf 4,54:1, vier Hundertstel über der Anforderung. Es hat jetzt eine eigene Klasse, eine Stufe heller; die fünfzehn Etiketten auf einfarbigem Grund bleiben, wie sie waren.",
      ],
    },
    {
      kind: "p",
      text: "Die schwächste Stelle der ganzen Seite liegt seitdem bei 4,80:1 unter Windows und 4,76:1 unter Linux. Der Rest des Unterschieds kommt aus dem Zeilenumbruch, nicht mehr aus der Schriftdarstellung.",
    },
    { kind: "h2", text: "Was ich daraus mitgenommen habe" },
    {
      kind: "p",
      text: "Ein Prüflauf ist selbst Code und kann selbst falsch sein. Der Verdacht fällt fast nie auf ihn: Wenn er grün ist, glaubt man ihm, und wenn er rot ist, sucht man im geprüften Code. Dass beide Antworten stimmten und trotzdem verschieden waren, ließ nur eine Erklärung zu: Die Frage war falsch gestellt.",
    },
    {
      kind: "note",
      title: "Der Unterschied war das Wertvollste am ganzen Fund",
      text: "Ein Lauf, der lokal grün und auf dem Bauserver rot ist, ist das teuerste Ergebnis von allen: Danach glaubt man dem eigenen Rechner nicht mehr und beginnt, rote Läufe zu wiederholen, bis sie durchgehen. Genau deshalb war die Abweichung von acht Hundertsteln kein Randfall, sondern der Anlass, das Verfahren anzufassen.",
    },
    {
      kind: "p",
      text: "Die praktische Regel, die ich seitdem anwende: Wenn eine Messung zwischen zwei Umgebungen wandert, ist nicht die Grenze zu eng, sondern die Größe schlecht definiert. Erst die Definition reparieren, dann über Schwellen reden.",
    },
  ],
};
