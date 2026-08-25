"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { architekturText } from "@/content/architecture-en";
import { useContent } from "@/content/ContentProvider";
import { ease, viewportOnce } from "@/lib/motion";
import { useHorizontalScrollWheel } from "@/lib/useHorizontalScrollWheel";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Ein winziges beschreibendes Diagrammformat.

   Vier SVGs von Hand zu zeichnen wäre einmal schneller geschrieben und danach
   eine Qual zu ändern gewesen. Knoten sitzen auf einem 1000 Einheiten breiten
   Raster, Kanten verweisen auf Knoten-Kennungen und werden rechtwinklig
   geführt. Alles blendet sich beim Scrollen ein: Kästen steigen zeilenweise
   auf, Verbindungen zeichnen sich selbst.
   ========================================================================== */

type Tone = "neutral" | "acid" | "violet" | "cyan" | "muted";

type Node = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h?: number;
  tone?: Tone;
  /** Dashed border = external service / third party. */
  external?: boolean;
};

type Edge = {
  from: string;
  to: string;
  label?: string;
  /** "v" routes down, "h" routes sideways, "vh" bends. */
  dashed?: boolean;
};

type Diagram = {
  title: string;
  caption: string;
  height: number;
  lanes: { label: string; y: number }[];
  nodes: Node[];
  edges: Edge[];
};

const TONE: Record<Tone, { fill: string; stroke: string; text: string }> = {
  neutral: { fill: "#16161d", stroke: "#2c2c38", text: "#e8e8ec" },
  acid: { fill: "#1b2007", stroke: "#5c7010", text: "#d4ff45" },
  violet: { fill: "#171130", stroke: "#3d2f7a", text: "#b9a8ff" },
  cyan: { fill: "#07222c", stroke: "#1d5c72", text: "#7fdcff" },
  muted: { fill: "#101014", stroke: "#22222a", text: "#8b8b96" },
};

const NODE_H = 62;

/* ==========================================================================
   Diagram definitions
   ========================================================================== */

const ARCHITECTURES: Record<string, Diagram> = {
  salati: {
    title: "Salati: ein Monorepo, vier Geräteklassen",
    caption:
      "Die Geräte teilen sich Domänenlogik und Inhalte. Der KI-Pfad endet bewusst auf dem Gerät: Modell und Korpus werden ausgeliefert, nicht angefragt.",
    height: 470,
    lanes: [
      { label: "Clients", y: 40 },
      { label: "Geteilte Logik", y: 176 },
      { label: "On-Device-KI", y: 288 },
      { label: "Delivery & Daten", y: 396 },
    ],
    nodes: [
      // Vier Geräteklassen, gleichmäßig über die Breite. Hier stand einmal ein
      // fünfter Knoten für einen HDMI-Stick; den gibt es in diesem Projekt
      // nicht.
      {
        id: "ios",
        label: "iOS",
        sub: "Expo · Live Activities",
        x: 20,
        y: 62,
        w: 208,
        tone: "acid",
      },
      {
        id: "android",
        label: "Android",
        sub: "Expo · Widgets",
        x: 244,
        y: 62,
        w: 208,
        tone: "acid",
      },
      {
        id: "tv",
        label: "Android TV",
        sub: "Leanback-Fokus",
        x: 468,
        y: 62,
        w: 208,
        tone: "acid",
      },
      {
        id: "wear",
        label: "Wear OS",
        sub: "Natives Modul",
        x: 692,
        y: 62,
        w: 208,
        tone: "acid",
      },

      {
        id: "core",
        label: "packages/core",
        sub: "Gebetszeiten · Qibla · Hijri · Mushaf-Modell",
        x: 20,
        y: 198,
        w: 520,
        tone: "neutral",
      },
      {
        id: "ui",
        label: "packages/ui",
        sub: "Design-Tokens · Komponenten",
        x: 554,
        y: 198,
        w: 346,
        tone: "neutral",
      },

      {
        id: "llm",
        label: "Lokale Suche",
        sub: "Eigener Korpus, eigene Rangfolge",
        x: 20,
        y: 310,
        w: 300,
        tone: "violet",
      },
      {
        id: "whisper",
        label: "whisper.rn",
        sub: "Vers-konditionierte Erkennung",
        x: 334,
        y: 310,
        w: 300,
        tone: "violet",
      },
      {
        id: "cache",
        label: "Offline-Cache",
        sub: "Audio · Übersetzungen",
        x: 648,
        y: 310,
        w: 252,
        tone: "violet",
      },

      {
        id: "eas",
        label: "EAS Build + Update",
        sub: "OTA ohne Store-Zyklus",
        x: 20,
        y: 418,
        w: 268,
        tone: "cyan",
        external: true,
      },
      {
        id: "supabase",
        label: "Supabase",
        sub: "Konten · Inhalte",
        x: 302,
        y: 418,
        w: 224,
        tone: "cyan",
        external: true,
      },
      {
        id: "r2",
        label: "Cloudflare R2",
        sub: "Audio · Podcast · Handouts",
        x: 540,
        y: 418,
        w: 268,
        tone: "cyan",
        external: true,
      },
      {
        id: "stores",
        label: "Stores",
        sub: "",
        x: 822,
        y: 418,
        w: 78,
        tone: "muted",
        external: true,
      },
    ],
    edges: [
      { from: "ios", to: "core" },
      { from: "android", to: "core" },
      { from: "tv", to: "core" },
      { from: "wear", to: "ui" },
      { from: "core", to: "llm" },
      { from: "core", to: "whisper" },
      { from: "ui", to: "cache" },
      { from: "llm", to: "eas" },
      { from: "whisper", to: "supabase" },
      { from: "cache", to: "r2" },
    ],
  },

  menucloud: {
    title: "MenuCloud: mandantenfähig bis in die Fiskalisierung",
    caption:
      "Jeder Mandant bekommt eine eigene, rechtlich zurechenbare Signatureinheit. Der Bestellpfad ist fail-closed: ohne TSE-Signatur wird nicht gebucht.",
    height: 480,
    lanes: [
      { label: "Zugänge", y: 40 },
      { label: "Anwendung", y: 176 },
      { label: "Daten & Geld", y: 288 },
      { label: "Betrieb", y: 396 },
    ],
    nodes: [
      {
        id: "guest",
        label: "Gast",
        sub: "QR-Bestellung",
        x: 20,
        y: 62,
        w: 200,
        tone: "violet",
      },
      {
        id: "owner",
        label: "Betreiber",
        sub: "Self-Service-Admin",
        x: 234,
        y: 62,
        w: 220,
        tone: "violet",
      },
      {
        id: "crew",
        label: "Personal-App",
        sub: "iOS · Android",
        x: 468,
        y: 62,
        w: 200,
        tone: "violet",
      },
      {
        id: "public",
        label: "Restaurant-Site",
        sub: "pro Mandant",
        x: 682,
        y: 62,
        w: 218,
        tone: "violet",
      },

      {
        id: "next",
        label: "Next.js 16 · App Router",
        sub: "RSC · Route Handlers · Magic-Link-Auth",
        x: 20,
        y: 198,
        w: 560,
        tone: "neutral",
      },
      {
        id: "n8n",
        label: "n8n",
        /* Die Zahl steht auch im Automatisierungsreiter derselben
           Fallstudie, und dort wird sie geprüft: `check-figures` zählt die
           von git verfolgten Workflow-Dateien im MenuCloud-Repo und hält
           sie gegen den Text. Hier stand „75+“, eine zweite, ungeprüfte
           Fassung derselben Aussage: gemessen sind es 63. */
        sub: "63 Workflows · Watchdogs",
        x: 594,
        y: 198,
        w: 306,
        tone: "neutral",
      },

      {
        id: "pg",
        label: "Postgres / Supabase",
        sub: "Row Level Security pro Mandant",
        x: 20,
        y: 310,
        w: 320,
        tone: "acid",
      },
      {
        id: "stripe",
        label: "Stripe Connect",
        sub: "Destination-Charge",
        x: 354,
        y: 310,
        w: 246,
        tone: "acid",
        external: true,
      },
      {
        id: "tse",
        label: "Fiskaly Cloud-TSE",
        sub: "§ 146a AO · Hash-Kette",
        x: 614,
        y: 310,
        w: 286,
        tone: "acid",
        external: true,
      },

      {
        id: "coolify",
        label: "Coolify / Hetzner",
        sub: "Docker · EU",
        x: 20,
        y: 418,
        w: 240,
        tone: "cyan",
      },
      {
        id: "cf",
        label: "Cloudflare",
        sub: "DNS · Edge · WAF",
        x: 274,
        y: 418,
        w: 216,
        tone: "cyan",
        external: true,
      },
      {
        id: "mail",
        label: "Mailcow",
        sub: "+ SES-Fallback",
        x: 504,
        y: 418,
        w: 196,
        tone: "cyan",
      },
      {
        id: "obs",
        label: "Sentry · Umami",
        sub: "Alerts nach Slack",
        x: 714,
        y: 418,
        w: 186,
        tone: "cyan",
        external: true,
      },
    ],
    edges: [
      { from: "guest", to: "next" },
      { from: "owner", to: "next" },
      { from: "crew", to: "next" },
      { from: "public", to: "n8n" },
      { from: "next", to: "pg" },
      { from: "next", to: "stripe" },
      { from: "n8n", to: "tse" },
      { from: "pg", to: "coolify" },
      { from: "stripe", to: "mail" },
      { from: "tse", to: "obs" },
    ],
  },

  wohnungsjaeger: {
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
        tone: "cyan",
      },
      {
        id: "filter",
        label: "Kriterien-Filter",
        sub: "Regeln zuerst, deterministisch",
        x: 334,
        y: 190,
        w: 268,
        tone: "cyan",
      },
      {
        id: "llm",
        label: "LLM-Volltextprüfung",
        sub: "Anthropic · Fallback: Regeln",
        x: 616,
        y: 190,
        w: 284,
        tone: "cyan",
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
  },

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
  nouri: {
    title: "NOURI: zwei Oberflächen auf einer Rechenlogik",
    caption:
      "Web und App teilen sich Typen, Rechenlogik und Katalog und sprechen beide unmittelbar mit Supabase. Die Nährwerte stehen nicht in der Datenbank, sie werden aus den Zutaten gerechnet und gegen die Atwater-Formel geprüft.",
    height: 400,
    lanes: [
      { label: "Oberflächen", y: 40 },
      { label: "Geteilte Logik", y: 168 },
      { label: "Persistenz", y: 280 },
    ],
    nodes: [
      {
        id: "web",
        label: "Next.js Web-App",
        sub: "Planer · Protokoll · Kasse",
        x: 20,
        y: 62,
        w: 290,
        tone: "violet",
      },
      {
        id: "mobile",
        label: "Expo App",
        sub: "iOS · Android",
        x: 324,
        y: 62,
        w: 262,
        tone: "violet",
      },
      {
        id: "site",
        label: "Öffentliche Seite",
        sub: "Marketing · sechs Rechtsseiten",
        x: 600,
        y: 62,
        w: 300,
        tone: "violet",
      },

      {
        id: "catalog",
        label: "packages/utils",
        sub: "11.892 Rezepte · Nährwerte aus Zutaten",
        x: 20,
        y: 190,
        w: 430,
        tone: "neutral",
      },
      {
        id: "types",
        label: "packages/types",
        sub: "Gemeinsame Datenform",
        x: 464,
        y: 190,
        w: 226,
        tone: "neutral",
      },
      {
        id: "api",
        label: "services/api",
        sub: "gebaut, nicht in Betrieb",
        x: 704,
        y: 190,
        w: 196,
        tone: "muted",
        external: true,
      },

      {
        id: "sb",
        label: "Supabase / Postgres",
        sub: "63 Tabellen · RLS · ON DELETE CASCADE",
        x: 20,
        y: 302,
        w: 430,
        tone: "acid",
      },
      {
        id: "edge",
        label: "Edge Function",
        sub: "Kontolöschung nach Art. 17",
        x: 464,
        y: 302,
        w: 226,
        tone: "cyan",
      },
      {
        id: "stripe",
        label: "Stripe",
        sub: "nur im Browser",
        x: 704,
        y: 302,
        w: 196,
        tone: "cyan",
        external: true,
      },
    ],
    edges: [
      { from: "web", to: "catalog" },
      { from: "mobile", to: "types" },
      { from: "site", to: "types" },
      { from: "catalog", to: "sb" },
      { from: "types", to: "edge" },
      { from: "web", to: "stripe", dashed: true },
    ],
  },

  bitdojo: {
    title: "BitDojo: eine Quelle, fünf Wege durch denselben Stoff",
    caption:
      "Lesen, Hören, Wiederholen, Machen und Prüfen greifen auf dieselben Markdown-Dateien zu. Der Prüflauf steht vor dem Bau und lässt ihn scheitern, wenn Inhalte und Ableitung auseinanderlaufen.",
    height: 480,
    lanes: [
      { label: "Quelle", y: 40 },
      { label: "Ableitung", y: 176 },
      { label: "Oberflächen", y: 288 },
      { label: "Daten & Geld", y: 396 },
    ],
    nodes: [
      {
        id: "md",
        label: "inhalte/lektionen/*.md",
        sub: "Text, Begriffskästen, Aufgaben, Übung",
        x: 20,
        y: 62,
        w: 500,
        tone: "acid",
      },
      {
        id: "pruefe",
        label: "werkzeug/pruefe.mjs",
        sub: "bricht den Bau bei Inhaltsfehlern",
        x: 554,
        y: 62,
        w: 346,
        tone: "acid",
      },

      {
        id: "ableiten",
        label: "werkzeug/ableiten.mjs",
        sub: "Markdown zu JSON",
        x: 20,
        y: 198,
        w: 300,
        tone: "neutral",
      },
      {
        id: "kern",
        label: "packages/kern",
        sub: "Wiederholung · Quiz · Prüfung · Siegel",
        x: 334,
        y: 198,
        w: 340,
        tone: "neutral",
      },
      {
        id: "inhalte",
        label: "packages/inhalte",
        sub: "Kurse · Zertifikatsverzeichnis",
        x: 688,
        y: 198,
        w: 212,
        tone: "neutral",
      },

      {
        id: "web",
        label: "Next.js 16",
        sub: "Lesen · Hören · Prüfen",
        x: 20,
        y: 310,
        w: 300,
        tone: "violet",
      },
      {
        id: "mobil",
        label: "Expo",
        sub: "derselbe Kern, verkauft nichts",
        x: 334,
        y: 310,
        w: 300,
        tone: "violet",
      },
      {
        id: "podcast",
        label: "Podcast",
        sub: "36 Folgen, zwei Stimmen",
        x: 648,
        y: 310,
        w: 252,
        tone: "violet",
      },

      {
        id: "sb",
        label: "Supabase / Postgres",
        sub: "Fortschritt · Zeilenschutz",
        x: 20,
        y: 418,
        w: 300,
        tone: "cyan",
      },
      {
        id: "stripe",
        label: "Stripe",
        sub: "zwei Pläne · eine Probewoche",
        x: 334,
        y: 418,
        w: 300,
        tone: "cyan",
        external: true,
      },
      {
        id: "speicher",
        label: "Privater Speicher",
        sub: "Tonspuren · Handbücher",
        x: 648,
        y: 418,
        w: 252,
        tone: "cyan",
        external: true,
      },
    ],
    edges: [
      { from: "md", to: "ableiten" },
      { from: "pruefe", to: "inhalte" },
      { from: "ableiten", to: "web" },
      { from: "kern", to: "mobil" },
      { from: "inhalte", to: "podcast" },
      { from: "web", to: "sb" },
      { from: "mobil", to: "stripe", dashed: true },
      { from: "podcast", to: "speicher" },
    ],
  },

  dartile: {
    title: "Dartile: eine Partie ist die Liste ihrer Würfe",
    caption:
      "Drei Eingabewege münden in dieselbe reine Engine. Gespeichert wird das Ereignis, nicht der Punktestand: Zurücknehmen ist ein Abschneiden, Synchronisieren ein Anhängen.",
    height: 480,
    lanes: [
      { label: "Eingabe", y: 40 },
      { label: "Regeln", y: 176 },
      { label: "Speicher", y: 288 },
      { label: "Gegen andere", y: 396 },
    ],
    nodes: [
      {
        id: "raster",
        label: "Raster 5 × 5",
        sub: "drei Tastendrücke je Aufnahme",
        x: 20,
        y: 62,
        w: 300,
        tone: "cyan",
      },
      {
        id: "kamera",
        label: "Kamera",
        sub: "Vorschlag mit sichtbarer Sicherheit",
        x: 334,
        y: 62,
        w: 340,
        tone: "cyan",
      },
      {
        id: "ansage",
        label: "Ansage",
        sub: "175 vorproduzierte Rufe je Sprache",
        x: 688,
        y: 62,
        w: 212,
        tone: "cyan",
      },

      {
        id: "kern",
        label: "packages/kern",
        sub: "Zustand plus Ereignis ergibt Zustand",
        x: 20,
        y: 198,
        w: 430,
        tone: "acid",
      },
      {
        id: "checkout",
        label: "Checkout-Tafel",
        sub: "kürzester Weg, Hand berücksichtigt",
        x: 464,
        y: 198,
        w: 436,
        tone: "acid",
      },

      {
        id: "events",
        label: "Ereignisliste",
        sub: "Würfe statt Punktestände",
        x: 20,
        y: 310,
        w: 300,
        tone: "neutral",
      },
      {
        id: "lokal",
        label: "SQLite auf dem Gerät",
        sub: "voller Betrieb ohne Netz",
        x: 334,
        y: 310,
        w: 300,
        tone: "neutral",
      },
      {
        id: "ziele",
        label: "24 Ziele und Erfolge",
        sub: "lokal gerechnet",
        x: 648,
        y: 310,
        w: 252,
        tone: "neutral",
      },

      {
        id: "sb",
        label: "Supabase / Postgres",
        sub: "Zeilenschutz · Auslöser",
        x: 20,
        y: 418,
        w: 300,
        tone: "violet",
      },
      {
        id: "online",
        label: "Wurf mit laufender Nummer",
        sub: "fehlt eine, wird nachgeladen",
        x: 334,
        y: 418,
        w: 300,
        tone: "violet",
      },
      {
        id: "beste",
        label: "Bestenlisten",
        sub: "hinter Plus",
        x: 648,
        y: 418,
        w: 252,
        tone: "violet",
      },
    ],
    edges: [
      { from: "raster", to: "kern" },
      { from: "kamera", to: "kern" },
      { from: "ansage", to: "checkout" },
      { from: "kern", to: "events" },
      { from: "checkout", to: "ziele" },
      { from: "events", to: "sb" },
      { from: "lokal", to: "online" },
      { from: "ziele", to: "beste", dashed: true },
    ],
  },

  lexipulse: {
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
        tone: "violet",
      },
      {
        id: "token",
        label: "Tokenizer",
        sub: "Codepunkte statt UTF-16",
        x: 464,
        y: 198,
        w: 436,
        tone: "violet",
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
  },

  /* Das erste Bild in dieser Datei, zu dem es noch keine öffentliche Adresse
     gibt. Gezeichnet ist deshalb nur, was im Repository steht: die drei
     Eingänge, der Kern und die verschlüsselte Ablage. Ein Kasten „Sync" oder
     „Cloud-Backup" wäre die bequeme Ergänzung und in diesem Projekt eine
     Lüge, denn es gibt keine Stelle im Code, die eine Adresse aufruft. Der
     gestrichelte Kasten rechts unten hält genau das fest, ohne eine Kante. */
  aegis: {
    title: "Aegis: vom Bon zur EÜR, ohne dass etwas das Gerät verlässt",
    caption:
      "Alles zwischen Kamera und Datenbank rechnet auf dem Gerät. Es gibt keinen Dienst, der etwas entgegennimmt: Die Ausfuhr ist eine Datei, die der Nutzer auslöst.",
    height: 480,
    lanes: [
      { label: "Erfassung", y: 40 },
      { label: "Kern, ohne Laufzeit-Abhängigkeit", y: 176 },
      { label: "Rechnen", y: 288 },
      { label: "Ablage auf dem Gerät", y: 396 },
    ],
    nodes: [
      {
        id: "foto",
        label: "Foto vom Bon",
        sub: "Texterkennung im Betriebssystem",
        x: 20,
        y: 62,
        w: 270,
        tone: "muted",
      },
      {
        id: "pdf",
        label: "Rechnung als PDF",
        x: 304,
        y: 62,
        w: 250,
        tone: "muted",
      },
      {
        id: "auszug",
        label: "Kontoauszug",
        sub: "MT940 · camt.053 · CSV",
        x: 568,
        y: 62,
        w: 332,
        tone: "muted",
      },

      {
        id: "bon",
        label: "Beleg-Parser",
        sub: "Vertrauensmaß 0 bis 1, Hinweise im Klartext",
        x: 20,
        y: 198,
        w: 430,
        tone: "violet",
      },
      {
        id: "einlesen",
        label: "Auszug einlesen",
        sub: "neun Bank-Layouts",
        x: 464,
        y: 198,
        w: 436,
        tone: "violet",
      },

      {
        id: "abgleich",
        label: "Abgleich",
        sub: "Umsatz gegen Beleg, bewertet",
        x: 20,
        y: 310,
        w: 280,
        tone: "acid",
      },
      {
        id: "euer",
        label: "EÜR",
        sub: "Einnahmen, Ausgaben, Steuer",
        x: 314,
        y: 310,
        w: 280,
        tone: "acid",
      },
      {
        id: "fristen",
        label: "Fristen",
        sub: "Gewährleistung, Beweislast, Garantie",
        x: 608,
        y: 310,
        w: 292,
        tone: "acid",
      },

      {
        id: "db",
        label: "SQLite mit SQLCipher",
        sub: "verschlüsselt, beim Start geprüft",
        x: 20,
        y: 418,
        w: 330,
        tone: "neutral",
      },
      {
        id: "export",
        label: "Ausfuhr als Datei",
        sub: "vom Nutzer ausgelöst",
        x: 364,
        y: 418,
        w: 270,
        tone: "neutral",
      },
      {
        id: "kein",
        label: "Kein Server",
        sub: "kein Konto, keine Anmeldung",
        x: 648,
        y: 418,
        w: 252,
        tone: "muted",
        external: true,
      },
    ],
    edges: [
      { from: "foto", to: "bon" },
      { from: "pdf", to: "bon" },
      { from: "auszug", to: "einlesen" },
      { from: "bon", to: "abgleich" },
      { from: "bon", to: "euer" },
      { from: "bon", to: "fristen" },
      { from: "einlesen", to: "abgleich" },
      { from: "abgleich", to: "db" },
      { from: "euer", to: "db" },
      { from: "fristen", to: "export" },
    ],
  },
};

/* ==========================================================================
   Renderer
   ========================================================================== */

function edgePath(from: Node, to: Node) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + (from.h ?? NODE_H);
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const mid = y1 + (y2 - y1) / 2;

  // Rechtwinklig mit gerundetem Knie, damit die Linien wie Verkabelung wirken
  // und nicht wie beliebige Kurven.
  if (Math.abs(x1 - x2) < 2) return `M ${x1} ${y1} L ${x2} ${y2}`;

  const r = Math.min(10, Math.abs(x2 - x1) / 2, Math.abs(mid - y1));
  const dir = x2 > x1 ? 1 : -1;

  return [
    `M ${x1} ${y1}`,
    `L ${x1} ${mid - r}`,
    `Q ${x1} ${mid} ${x1 + r * dir} ${mid}`,
    `L ${x2 - r * dir} ${mid}`,
    `Q ${x2} ${mid} ${x2} ${mid + r}`,
    `L ${x2} ${y2}`,
  ].join(" ");
}

export function ArchitectureDiagram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { lang } = useContent();
  const diagram = ARCHITECTURES[name];
  const kasten = useRef<HTMLDivElement>(null);
  useHorizontalScrollWheel(kasten);

  if (!diagram) return null;

  /* Die Geometrie ist in beiden Sprachen dieselbe, nur die Worte nicht.
     Uebersetzt wird deshalb beim Zeichnen und nicht in einer zweiten
     Datendatei mit denselben Koordinaten. */
  const t = (text: string) => architekturText(text, lang);

  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));

  return (
    <figure className={cn("w-full", className)}>
      {/* Bei 390 px ist das Diagramm 720 px breit: 354 px stehen rechts
          außerhalb des Bildes. Scrollen geht, nur sah man es nicht, dieselbe
          Lage wie bei den Codeblöcken in den Artikeln, und deshalb dieselbe
          Lösung. `scroll-hint` legt zwei Deckel und zwei Schatten übereinander;
          die Deckel wandern mit dem Inhalt, die Schatten bleiben stehen. Ist
          nichts zu scrollen, deckt der Deckel den Schatten zu, und der Hinweis
          erscheint genau dann, wenn er stimmt. */}
      {/* Und er ist anspringbar, weil ein Bereich, der scrollt, mit der
          Tastatur erreichbar sein muss. Gemessen bei 390 px an der
          ausgelieferten Seite: Der Kasten scrollte, `tabIndex` war -1, wer
          keine Maus benutzt, kam an die rechte Hälfte des Diagramms nicht
          heran. Der Name ist der Diagrammtitel, sonst wird der Bereich nur
          als "Bereich" angesagt. */}
      <div
        ref={kasten}
        tabIndex={0}
        role="region"
        aria-label={t(diagram.title)}
        className="scroll-hint overflow-x-auto [--deckfarbe:var(--color-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
      >
        {/* Mindestbreite 1150 statt 720, und das ist eine Lesbarkeitsfrage.

            Das Bild rechnet in einem 920 Einheiten breiten Koordinatensystem;
            die kleinste Beschriftung misst darin 10 Einheiten. Bei 720 px
            Mindestbreite ergibt das einen Faktor von 0,78, gemessen an der
            ausgelieferten Seite standen damit auf einem Telefon 16 der 29
            Beschriftungen unter 9 px, die kleinste bei 7,8. Am Desktop, wo das
            Bild 1152 px breit wird, sind es 12,5 px und keine darunter.

            Der Kasten scrollt ohnehin waagerecht, sobald das Bild breiter ist
            als das Fenster, bei 720 px tat er das auf einem Telefon bereits.
            Mehr Breite kostet also Scrollweg, den es schon gab, und bringt
            dieselbe Schrift wie am Desktop. */}
        <motion.svg
          viewBox={`0 0 920 ${diagram.height}`}
          className="h-auto w-full min-w-[1150px]"
          role="img"
          aria-label={`${t(diagram.title)}. ${t(diagram.caption)}`}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {/* Spurenüberschriften und Trennlinien */}
          {diagram.lanes.map((lane) => (
            <g key={lane.label}>
              <text
                x={20}
                y={lane.y}
                className="fill-[#5b5b66] font-mono text-[11px] tracking-[0.18em] uppercase"
              >
                {t(lane.label)}
              </text>
              <line
                x1={20}
                x2={900}
                y1={lane.y + 10}
                y2={lane.y + 10}
                stroke="#1c1c24"
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Die Verbinder zeichnen sich selbst */}
          {diagram.edges.map((edge, i) => {
            const from = byId.get(edge.from);
            const to = byId.get(edge.to);
            if (!from || !to) return null;

            return (
              <motion.path
                key={`${edge.from}-${edge.to}`}
                d={edgePath(from, to)}
                fill="none"
                stroke="#33333f"
                strokeWidth={1.25}
                strokeDasharray={edge.dashed ? "4 4" : undefined}
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  visible: {
                    pathLength: 1,
                    opacity: 1,
                    transition: {
                      duration: 0.7,
                      ease: ease.expo,
                      delay: 0.35 + i * 0.04,
                    },
                  },
                }}
              />
            );
          })}

          {/* Die Knoten */}
          {diagram.nodes.map((node, i) => {
            const tone = TONE[node.tone ?? "neutral"];
            const h = node.h ?? NODE_H;

            return (
              <motion.g
                key={node.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      ease: ease.expo,
                      delay: i * 0.03,
                    },
                  },
                }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={h}
                  rx={10}
                  fill={tone.fill}
                  stroke={tone.stroke}
                  strokeWidth={1}
                  strokeDasharray={node.external ? "3 3" : undefined}
                />
                <text
                  x={node.x + 14}
                  y={node.y + (node.sub ? 26 : h / 2 + 4)}
                  fill={tone.text}
                  className="text-[13px] font-medium"
                >
                  {t(node.label)}
                </text>
                {node.sub ? (
                  <text
                    x={node.x + 14}
                    y={node.y + 44}
                    fill="#75757f"
                    className="font-mono text-[10px]"
                  >
                    {node.sub ? t(node.sub) : null}
                  </text>
                ) : null}
              </motion.g>
            );
          })}
        </motion.svg>
      </div>

      {/* Das Diagramm als Text, für die, die es nicht sehen.

          Das `aria-label` am SVG fasst die Aussage in zwei Sätzen zusammen.
          Sichtbar stehen aber zwischen 17 und 30 Bausteine darin, iOS, Expo,
          Whisper, Postgres, TSE, und die sind der eigentliche Inhalt.
          Weil das SVG `role="img"` trägt, werden sie nicht vorgelesen: Ein
          Sehender liest den Stack je Ebene, ein Vorleseprogramm hört zwei
          Sätze. Eine Zusammenfassung ist keine Entsprechung.

          Die Liste entsteht aus denselben Daten wie die Zeichnung. Ein Knoten
          gehört zu der Bahn, deren Oberkante am nächsten über ihm liegt:
          dieselbe Zuordnung, die das Auge im Bild vornimmt. */}
      <div className="sr-only">
        <p>{`${t(diagram.title)}. ${t(diagram.caption)}`}</p>
        <dl>
          {diagram.lanes.map((bahn, i) => {
            const naechste = diagram.lanes[i + 1];
            const drin = diagram.nodes.filter(
              (k) => k.y >= bahn.y && (!naechste || k.y < naechste.y),
            );
            if (drin.length === 0) return null;
            /* Auch hier durch `t()`, wie überall sonst in dieser Datei.

               Die Zeichnung übersetzte ihre Beschriftungen, die Liste
               darunter nicht: Auf der englischen Seite zeigte das Diagramm
               „Surfaces / Persistence / 11,892 recipes", und vorgelesen wurde
               „Oberflächen / Persistenz / 11.892 Rezepte". Gemessen an der
               ausgelieferten Seite fehlten so in allen vier Fallstudien
               zwischen 8 und 17 der Beschriftungen in der Fassung, die ein
               Vorleseprogramm benutzt, bei NOURI 8 von 17, bei MenuCloud
               17 von 30.

               Wer sehen kann, merkt davon nichts: Beide Fassungen sind für
               sich vollständig, und die deutsche stimmt. Sichtbar wird es
               genau für den, für den die Liste überhaupt existiert. */
            return (
              <div key={bahn.label}>
                <dt>{t(bahn.label)}</dt>
                <dd>
                  {drin
                    .map((k) =>
                      k.sub ? `${t(k.label)} (${t(k.sub)})` : t(k.label),
                    )
                    .join(", ")}
                  .
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <figcaption className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
        <span className="font-mono text-[11px] tracking-[0.16em] text-ink-faint uppercase">
          {t(diagram.title)}
        </span>
        <span className="max-w-3xl text-sm leading-relaxed text-ink-dim">
          {t(diagram.caption)}
        </span>
      </figcaption>
    </figure>
  );
}
