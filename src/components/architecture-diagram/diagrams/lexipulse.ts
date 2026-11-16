import type { Diagram } from "../types";

export const lexipulseDiagram: Diagram = {
  title: "LexiPulse: ein Kern ohne Plattform",
  caption:
    "Leser, Bereinigung und Wiedergabe kennen weder DOM noch React Native. Jede Plattform steuert nur einen Speicher bei; das Dokument verlässt das Gerät nie.",
  height: 480,
  lanes: [
    { label: "Import", y: 40 },
    { label: "Aufbereitung", y: 176 },
    { label: "Wiedergabe", y: 288 },
    { label: "Ablage", y: 396 },
  ],
  nodes: [
    {
      id: "epub",
      label: "EPUB",
      x: 20,
      y: 62,
      w: 160,
      tone: "muted",
    },
    {
      id: "pdf",
      label: "PDF",
      sub: "pdf.js je Plattform",
      x: 194,
      y: 62,
      w: 230,
      tone: "muted",
    },
    {
      id: "adresse",
      label: "Web-Adresse",
      sub: "Server holt nur wegen CORS",
      x: 438,
      y: 62,
      w: 274,
      tone: "muted",
    },
    {
      id: "text",
      label: "TXT · MD · HTML",
      x: 726,
      y: 62,
      w: 174,
      tone: "muted",
    },

    {
      id: "clean",
      label: "Bereinigung",
      sub: "Kopfzeilen, Seitenzahlen, Trennungen",
      x: 20,
      y: 198,
      w: 430,
      tone: "acid",
    },
    {
      id: "token",
      label: "Tokenizer",
      sub: "Codepunkte statt UTF-16",
      x: 464,
      y: 198,
      w: 436,
      tone: "acid",
    },

    {
      id: "orp",
      label: "Erkennungspunkt",
      sub: "translateX auf Festbreite",
      x: 20,
      y: 310,
      w: 300,
      tone: "acid",
    },
    {
      id: "pacing",
      label: "Pacing-Matrix",
      sub: "Faktoren multiplizieren sich",
      x: 334,
      y: 310,
      w: 300,
      tone: "acid",
    },
    {
      id: "uhr",
      label: "Uhr",
      sub: "absoluter Zeitstempel",
      x: 648,
      y: 310,
      w: 252,
      tone: "acid",
    },

    {
      id: "idb",
      label: "IndexedDB",
      sub: "im Browser",
      x: 20,
      y: 418,
      w: 300,
      tone: "neutral",
    },
    {
      id: "sqlite",
      label: "SQLite",
      sub: "auf dem Telefon",
      x: 334,
      y: 418,
      w: 300,
      tone: "neutral",
    },
    {
      id: "ausfuhr",
      label: "Ausfuhr als JSON",
      sub: "Art. 20 DSGVO",
      x: 648,
      y: 418,
      w: 252,
      tone: "neutral",
    },
  ],
  edges: [
    { from: "epub", to: "clean" },
    { from: "pdf", to: "clean" },
    { from: "adresse", to: "token" },
    { from: "text", to: "token" },
    { from: "clean", to: "orp" },
    { from: "token", to: "pacing" },
    { from: "orp", to: "idb" },
    { from: "pacing", to: "sqlite" },
    { from: "uhr", to: "ausfuhr", dashed: true },
  ],
};

/* Das erste Bild in dieser Datei, zu dem es noch keine öffentliche Adresse
     gibt. Gezeichnet ist deshalb nur, was im Repository steht: die drei
     Eingänge, der Kern und die verschlüsselte Ablage. Ein Kasten „Sync" oder
     „Cloud-Backup" wäre die bequeme Ergänzung und in diesem Projekt eine
     Lüge, denn es gibt keine Stelle im Code, die eine Adresse aufruft. Der
     gestrichelte Kasten rechts unten hält genau das fest, ohne eine Kante. */
