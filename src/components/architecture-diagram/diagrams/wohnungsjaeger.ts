import type { Diagram } from "../types";

export const wohnungsjaegerDiagram: Diagram = {
  title: "WohnungsJäger: Scan, Bewertung, menschliche Freigabe",
  caption:
    "Der Agent läuft vollständig lokal. Die Freigabestufe zwischen Bewertung und Versand ist der Auslieferungszustand, nicht eine optionale Einstellung.",
  height: 400,
  lanes: [
    { label: "Quellen", y: 40 },
    { label: "Agent", y: 168 },
    { label: "Freigabe", y: 280 },
  ],
  nodes: [
    {
      id: "is24",
      label: "ImmoScout24",
      x: 20,
      y: 62,
      w: 168,
      tone: "muted",
      external: true,
    },
    {
      id: "iw",
      label: "Immowelt",
      x: 202,
      y: 62,
      w: 152,
      tone: "muted",
      external: true,
    },
    {
      id: "ka",
      label: "Kleinanzeigen",
      x: 368,
      y: 62,
      w: 176,
      tone: "muted",
      external: true,
    },
    {
      id: "wg",
      label: "WG-Gesucht",
      x: 558,
      y: 62,
      w: 162,
      tone: "muted",
      external: true,
    },
    {
      id: "direct",
      label: "Vermieter-Sites",
      x: 734,
      y: 62,
      w: 166,
      tone: "muted",
      external: true,
    },

    {
      id: "pw",
      label: "Playwright-Runner",
      sub: "Persistente Profile je Portal",
      x: 20,
      y: 190,
      w: 300,
      tone: "muted",
    },
    {
      id: "filter",
      label: "Kriterien-Filter",
      sub: "Regeln zuerst, deterministisch",
      x: 334,
      y: 190,
      w: 268,
      tone: "muted",
    },
    {
      id: "llm",
      label: "LLM-Volltextprüfung",
      sub: "Anthropic · Fallback: Regeln",
      x: 616,
      y: 190,
      w: 284,
      tone: "muted",
    },

    {
      id: "db",
      label: "SQLite",
      sub: "lokal · 127.0.0.1",
      x: 20,
      y: 302,
      w: 220,
      tone: "neutral",
    },
    {
      id: "review",
      label: "REVIEW-Queue",
      sub: "Mensch entscheidet (Standard)",
      x: 254,
      y: 302,
      w: 330,
      tone: "acid",
    },
    {
      id: "send",
      label: "Versand",
      sub: "nur nach Freigabe",
      x: 598,
      y: 302,
      w: 302,
      tone: "neutral",
    },
  ],
  edges: [
    { from: "is24", to: "pw" },
    { from: "iw", to: "pw" },
    { from: "ka", to: "filter" },
    { from: "wg", to: "llm" },
    { from: "direct", to: "llm" },
    { from: "pw", to: "db" },
    { from: "filter", to: "review" },
    { from: "llm", to: "send", dashed: true },
  ],
};

/* Dieses Bild zeichnete bis zum 16.08.2026 einen Dienst in den Betrieb, den
     es dort nicht gibt.

     „Fastify API" stand zwischen den Oberflächen und Postgres, und beide
     Oberflächen zeigten mit einer Kante darauf. Gemessen am Repo ist es
     andersherum: Web und App sprechen unmittelbar mit Supabase, die
     Kontolöschung läuft über eine Edge Function, und `services/api` ist
     nirgends deployt. Das eigene README des Projekts sagt genau das, in
     einem Absatz mit der Überschrift „`services/api` ist nicht Teil des
     laufenden Produkts", und nennt als Grund, die Alternative wäre, ihn „in
     Diagrammen so zu zeichnen, als sei er in Betrieb".

     Er steht deshalb weiter im Bild, aber ohne eine einzige Kante und mit der
     Unterzeile, die zutrifft. Ihn ganz wegzulassen wäre die zweite Art zu
     täuschen: 87 Endpunkte mit eigenen Tests sind Arbeit, die es gibt. */
