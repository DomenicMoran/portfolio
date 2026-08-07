import type { Article } from "./types";

/**
 * Alle Zahlen und Dateinamen stammen aus dem Salati-Repo, Stand Juli 2026.
 * Die Belegzeile am Ende nennt die Quellen.
 */
export const whisperDe: Article = {
  slug: "kleineres-whisper-modell",
  title: "Warum ein kleineres Whisper-Modell mein größeres schlug",
  dek: "Ein Gigabyte Modell in einer Handy-App zu verteilen, war der offensichtliche Weg zu besserer Spracherkennung. Er war falsch. Der Hebel lag woanders, und er war kostenlos.",
  date: "2026-07-27",
  minutes: 5,
  tags: ["Whisper", "On-Device-KI", "React Native", "Arabisch"],
  evidence: [
    "apps/mobile/src/features/hifz/whisperModel.ts (Modellwahl, Konvertierung, Messwerte)",
    "apps/mobile/src/features/hifz/similarity.ts (Normalisierung, Dice-Koeffizient)",
    "apps/mobile/src/features/hifz/whisperCheck.ts, Zeile 617 (prompt-Übergabe)",
    "docs/audit-2026-07-27/WHISPER-EIGENE-KONVERTIERUNG.md",
    {
      text: "whisper-ggml-header: liest den Header und meldet n_text_ctx selbst nach",
      href: "https://github.com/DomenicMoran/whisper-ggml-header",
    },
    {
      text: "arabic-normalize: die Normalisierung aus similarity.ts als eigenes Paket",
      href: "https://github.com/DomenicMoran/arabic-normalize",
    },
  ],
  blocks: [
    {
      kind: "p",
      text: "Salati hat einen Auswendiglern-Modus. Der Nutzer rezitiert einen Vers aus dem Koran, die App hört zu und sagt, ob er richtig war. Das läuft vollständig auf dem Telefon, ohne Netz, ohne dass eine Aufnahme das Gerät verlässt. Der erste Bau davon war nicht gut genug: zu viele richtige Rezitationen wurden als falsch gewertet.",
    },
    {
      kind: "p",
      text: "Der naheliegende Schluss war, dass das Modell zu klein sei. Also habe ich ein größeres eingebaut. Whisper large-v3, quantisiert, knapp ein Gigabyte. Das Ergebnis war nicht besser. Es war langsamer, der Erst-Download wurde für Nutzer mit schlechtem Netz unzumutbar, und die Erkennungsqualität beim Arabisch des Korans blieb ungefähr gleich.",
    },
    {
      kind: "h2",
      text: "Warum ein größeres Modell hier nichts bringt",
    },
    {
      kind: "p",
      text: "Whisper ist auf allgemeine Sprache trainiert, über viele Sprachen hinweg. Das Arabisch des Korans ist etwas anderes als das Arabisch, das in Nachrichten oder Podcasts gesprochen wird: klassische Grammatik, ein eng begrenztes Vokabular und eine Rezitationsweise mit gedehnten Vokalen, deren Länge bedeutungstragend ist. Ein größeres generisches Modell ist in genau dem besser, was hier nicht gebraucht wird, nämlich Breite. Es ist nicht besser in dem, was gebraucht wird, nämlich Tiefe in einem sehr schmalen Ausschnitt.",
    },
    {
      kind: "p",
      text: "Dazu kommt ein zweites Problem, das mit der Modellgröße gar nichts zu tun hat. Ein mehrsprachiges Modell schreibt arabische Laute manchmal mit persischen oder Urdu-Buchstabenformen. Für das Ohr sind `ی` und `ي` identisch. Für einen Zeichenkettenvergleich sind sie es nicht.",
    },
    {
      kind: "h2",
      text: "Der erste Hebel: dem Modell sagen, was es hören wird",
    },
    {
      kind: "p",
      text: "Beim Auswendiglernen ist der erwartete Text bekannt. Die App weiß, welchen Vers der Nutzer gerade übt. Whisper nimmt einen `prompt` entgegen, der als Vorkontext in den Decoder geht und die Wahrscheinlichkeiten in Richtung dieser Wörter verschiebt. Das ist eine Zeile Code.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "whisperCheck.ts: Der erwartete Vers geht als Vorkontext mit.",
      code: `const handle = whisperContext.transcribe(path, {
  language: 'ar',
  ...(expectedText ? { prompt: expectedText } : {}),
});`,
    },
    {
      kind: "p",
      text: "Gemessen an acht echten Rezitationen des Rezitators Alafasy: Wortfehlerrate 9,2 Prozent ohne Prompt, 7,9 Prozent mit. Das klingt nach wenig. In der Wirkung ist es viel, weil die verbleibenden Fehler sich verschieben. Ohne Prompt erfindet das Modell Wörter, die im Vers nicht vorkommen. Mit Prompt liegen die Fehler fast nur noch bei Vokallängen, und genau die fängt der nächste Schritt ab.",
    },
    {
      kind: "h2",
      text: "Der zweite Hebel: vergleichen, was vergleichbar ist",
    },
    {
      kind: "p",
      text: "Bevor Rezitation und Vorlage verglichen werden, laufen beide durch dieselbe Normalisierung. Sie wirft alles weg, was für die Frage „war das derselbe Vers?“ keine Rolle spielt, und vereinheitlicht Buchstabenvarianten. Die Reihenfolge ist dabei nicht beliebig.",
    },
    {
      kind: "code",
      lang: "ts",
      caption:
        "similarity.ts, gekürzt. Die fremden Buchstabenformen müssen zuerst.",
      code: `export function normalizeArabic(text: string): string {
  return text
    .replace(DIACRITICS, '')
    // Persische und Urdu-Formen ZUERST auf Arabisch abbilden. Sonst
    // macht die [^ء-ي]-Bereinigung unten Leerzeichen daraus und
    // zerreißt Wörter.
    .replace(/ک/g, 'ك')
    .replace(/[یۍ]/g, 'ي')
    .replace(/ے/g, 'ي')
    .replace(/ھ/g, 'ه')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^ء-ي\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}`,
    },
    {
      kind: "note",
      title: "Die Reihenfolge war ein echter Fehler",
      text: "In der ersten Fassung stand die Bereinigung auf den arabischen Grundbereich vor der Buchstaben-Abbildung. Ein persisches ک fiel damit aus dem Bereich, wurde zum Leerzeichen, und aus einem Wort wurden zwei. Der Vergleich zählte das als zwei Fehler statt als keinen.",
    },
    {
      kind: "p",
      text: "Der Vergleich selbst ist ein Dice-Koeffizient über Wörter, keine exakte Gleichheit. Ein einzelnes falsch erkanntes Wort in einem Vers mit zwölf Wörtern senkt den Wert, verwirft die Rezitation aber nicht. Das ist eine bewusst milde Bewertung: Wer übt, soll für einen Erkennungsfehler des Modells nicht bestraft werden.",
    },
    {
      kind: "h2",
      text: "Das Ergebnis: kleiner ist besser",
    },
    {
      kind: "p",
      text: "Mit Prompt-Konditionierung und Normalisierung wurde die Modellgröße zur Nebensache. Standard ist heute ein auf Tarteel feingetuntes Base-Modell, quantisiert auf q5_0, 55 MB. Daneben steht wählbar large-v3-turbo mit 574 MB für starke Geräte. Das ein Gigabyte große large-v3 ist raus.",
    },
    {
      kind: "table",
      head: ["Modell", "Größe", "Rolle"],
      rows: [
        [
          "tarteel-ai/whisper-base-ar-quran, q5_0",
          "55 MB",
          "Standard, läuft auf jedem Gerät",
        ],
        [
          "Whisper large-v3-turbo, q5_0",
          "574 MB",
          "wählbar, generisch, nicht koran-tuned",
        ],
        ["Whisper large-v3", "~1 GB", "entfernt, kein messbarer Vorteil"],
      ],
      caption:
        "Die drei Modelle, die in der App gelandet oder wieder verschwunden sind, mit Größe und Rolle.",
    },
    {
      kind: "p",
      text: "Auch die Quantisierung ist gemessen und nicht geraten. Dieselben acht Rezitationen ergaben mit der F16-Datei und mit q5_0 exakt dieselben Transkripte. Gleiche Genauigkeit, 63 Prozent weniger Download.",
    },
    {
      kind: "h2",
      text: "Die Falle beim Konvertieren, die eine Woche gekostet hat",
    },
    {
      kind: "p",
      text: "Tarteel veröffentlicht sein Modell im Hugging-Face-Format. Für whisper.cpp muss es nach GGML konvertiert werden. Das Skript dafür liest `config.json` und schreibt einen Wert daraus als `n_text_ctx` ins GGML.",
    },
    {
      kind: "p",
      text: "Tarteels `config.json` enthält `max_length: 1024`. Das ist ein Generations-Parameter und nicht die Kontextlänge des Text-Decoders. Whisper hat dort fest 448. Wer den falschen Wert übernimmt, bekommt eine Datei, die aussieht wie ein Modell, sich aber von whisper.rn nicht laden lässt. Die Fehlermeldung sagt nur, das Modell sei nicht verfügbar.",
    },
    {
      kind: "note",
      title: "Vor dem Einsatz den Header lesen",
      text: "Viele frei verfügbare Konvertierungen der auf den Koran abgestimmten Whisper-Modelle tragen n_text_ctx = 1024 und sind damit unbrauchbar. Der Wert steht im GGML-Header und ist in Sekunden geprüft. Richtig ist max_target_positions = 448, nicht max_length.",
    },
    {
      kind: "h2",
      text: "Woher die Gewichte kommen, und warum das belegt ist",
    },
    {
      kind: "p",
      text: "Zuerst lag im Projekt eine fremde Konvertierung von Hugging Face, deren Herkunft nicht dokumentiert war. In einer App, die Millionen Menschen beim Auswendiglernen eines heiligen Textes unterstützen soll, ist das die falsche Grundlage. Also konvertiere ich Tarteels Original selbst und lege die Datei auf eigenen Speicher.",
    },
    {
      kind: "p",
      text: "Dass es dieselben Gewichte sind, ist nicht behauptet, sondern nachgewiesen: Meine F16-Konvertierung ist byte-identisch zur damaligen Fremddatei, SHA-256 `aaebca10…50ead`. Ein Hash ist hier der ganze Beweis, und er kostet nichts.",
    },
    {
      kind: "h2",
      text: "Was ich davon mitnehme",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Bevor das Modell größer wird, prüfen, ob die Aufgabe Breite oder Tiefe braucht. Diese brauchte Tiefe.",
        "Wenn die Anwendung weiß, was gleich gesagt wird, gehört diese Information ins Modell. Prompt-Konditionierung ist die billigste Genauigkeit, die zu haben ist.",
        "Die Metrik muss zur Aufgabe passen. Exakte Gleichheit war hier die falsche Frage.",
        "Bei allem, was von außen kommt, gilt: Herkunft dokumentieren, Identität hashen.",
      ],
    },
    {
      kind: "p",
      text: "Der letzte Punkt hat einen Nebeneffekt, der über dieses Projekt hinausgeht. Die Buchstaben-Normalisierung ist inzwischen eine eigene Bibliothek, weil das Problem nicht auf Koran-Apps beschränkt ist. Jeder, der arabischen Text aus einem mehrsprachigen Modell mit einer Vorlage vergleicht, hat es.",
    },
  ],
};
