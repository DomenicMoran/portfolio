/**
 * Die englischen Beschriftungen der Architekturdiagramme.
 *
 * Die Diagramme lagen mit ihrer Geometrie und ihren Texten in einem Bauteil,
 * und es gab sie nur einmal. Gemessen an der ausgelieferten Seite standen auf
 * `/en` deshalb deutsche Beschriftungen: „GETEILTE LOGIK“, „ON-DEVICE-KI“,
 * „DELIVERY & DATEN“, „ZUGÄNGE“, „DATEN & GELD“, „QR-Bestellung“. Also
 * ausgerechnet in dem Bild, das eine fachliche Führung als Erstes aufmacht.
 *
 * Aufgefallen ist es keinem Lauf: `check-parity` zählt Elemente, nicht Wörter,
 * und ein Suchlauf über `innerText` sieht Text in einem SVG nicht — dort steht
 * er in `<text>`-Knoten.
 *
 * Übersetzt wird über diese Zuordnung statt über eine zweite Datei mit
 * denselben Koordinaten. Die Geometrie ist in beiden Sprachen dieselbe; nur
 * die Wörter unterscheiden sich, und die stehen hier. Eigennamen fehlen
 * bewusst: „Supabase“, „Stripe Connect", „whisper.rn" oder „packages/core"
 * heißen in beiden Sprachen gleich, und ein Eintrag, der nichts ändert, wäre
 * eine Zeile, die jemand später pflegt, ohne dass sie etwas tut.
 *
 * Was hier fehlt, bleibt stehen wie es ist. `check:typography` prüft die
 * englischen Seiten seit heute auch auf deutsche Wörter in SVG-Texten und
 * meldet jede Lücke.
 */
const ARCHITEKTUR_EN: Record<string, string> = {
  /* Titel und Bildunterschriften */
  "Salati: ein Monorepo, vier Zielgeräte":
    "Salati: one monorepo, four target devices",
  "Die Geräte teilen sich Domänenlogik und Inhalte. Der KI-Pfad endet bewusst auf dem Gerät: Modell und Korpus werden ausgeliefert, nicht angefragt.":
    "The devices share domain logic and content. The AI path deliberately ends on the device: model and corpus ship with the app, they are not requested.",
  "MenuCloud: mandantenfähig bis in die Fiskalisierung":
    "MenuCloud: multi-tenant all the way into fiscal signing",
  "NOURI: geteilter Katalog über drei Oberflächen":
    "NOURI: one shared catalogue across three surfaces",
  "WohnungsJäger: Scan, Bewertung, menschliche Freigabe":
    "WohnungsJäger: scan, scoring, human approval",

  /* Spurenbeschriftungen */
  Clients: "Clients",

  "Geteilte Logik": "Shared logic",
  "On-Device-KI": "On-device AI",
  "Delivery & Daten": "Delivery & data",
  Zugänge: "Entry points",
  Anwendung: "Application",
  "Daten & Geld": "Data & money",
  Betrieb: "Operations",
  Oberflächen: "Surfaces",
  "Geteilter Katalog": "Shared catalogue",
  Persistenz: "Persistence",
  Quellen: "Sources",
  Agent: "Agent",
  Freigabe: "Approval",
  Versand: "Delivery",
  Service: "Service",
  Stores: "Stores",

  /* Knoten */
  "Natives Modul": "Native module",
  "Next.js Web-App": "Next.js web app",
  "Public Website": "Public website",
  "Restaurant-Site": "Restaurant site",
  "Vermieter-Sites": "Landlord sites",
  "Personal-App": "Staff app",
  "Self-Service-Admin": "Self-service admin",
  "QR-Bestellung": "QR ordering",
  Gast: "Guest",
  Betreiber: "Operator",
  "Kriterien-Filter": "Criteria filter",
  "Lokale Suche": "Local search",
  "LLM-Volltextprüfung": "LLM full-text check",
  "REVIEW-Queue": "Review queue",
  "Offline-Cache": "Offline cache",
  "Fiskaly Cloud-TSE": "Fiskaly cloud TSE",
  "Playwright-Runner": "Playwright runner",
  "EAS Build + Update": "EAS Build + Update",

  /* Unterzeilen */
  "Design-Tokens · Komponenten": "Design tokens · components",
  "Audio · Übersetzungen": "Audio · translations",
  "Audio · Podcast · Handouts": "Audio · podcast · handouts",
  "Eigener Korpus, eigene Rangfolge": "Own corpus, own ranking",
  "Vers-konditionierte Erkennung": "Verse-conditioned recognition",
  "OTA ohne Store-Zyklus": "OTA without a store cycle",
  "Regeln zuerst, deterministisch": "Rules first, deterministic",
  "Anthropic · Fallback: Regeln": "Anthropic · fallback: rules",
  "Persistente Profile je Portal": "Persistent profile per portal",
  "nur nach Freigabe": "only after approval",
  "pro Mandant": "per tenant",
  "Row Level Security pro Mandant": "Row Level Security per tenant",
  "Typisierte Verträge · Zod": "Typed contracts · Zod",
  "explizite Fehlerzustände": "explicit error states",
  "Dry-Run · 503 · echter 4xx": "dry run · 503 · real 4xx",
  "§ 146a AO · Hash-Kette": "§ 146a AO · hash chain",
  "Planer · Tracking": "Planner · tracking",
  "11.892 Rezepte · Trainingspläne": "11,892 recipes · training plans",
  "59 Tabellen · 12 Migrationen · RLS": "59 tables · 12 migrations · RLS",
  "63 Workflows · Watchdogs": "63 workflows · watchdogs",
  "Alerts nach Slack": "Alerts to Slack",
  "+ SES-Fallback": "+ SES fallback",
  "DNS · Edge · WAF": "DNS · edge · WAF",
  "Docker · EU": "Docker · EU",
  "lokal · 127.0.0.1": "local · 127.0.0.1",
  "iOS · Android": "iOS · Android",
  "RSC · Route Handlers · Magic-Link-Auth":
    "RSC · route handlers · magic-link auth",
  "Next.js 16 · App Router": "Next.js 16 · App Router",
  "Sentry · Umami": "Sentry · Umami",
  "Leanback-Fokus": "Leanback focus",
  "Gebetszeiten · Qibla · Hijri · Mushaf-Modell":
    "Prayer times · qibla · Hijri · mushaf model",
  "Konten · Inhalte": "Accounts · content",
  "Mensch entscheidet (Standard)": "A human decides (default)",
};

/**
 * Übersetzt eine Beschriftung, wenn es eine Übersetzung gibt.
 *
 * Ohne Eintrag bleibt der deutsche Text stehen. Das ist die richtige Wahl
 * gegenüber einem leeren Feld: Ein Eigenname braucht keine Zeile, und eine
 * vergessene Übersetzung ist als deutsches Wort erkennbar — als Lücke wäre
 * sie unsichtbar.
 */
export function architekturText(text: string, lang: "de" | "en"): string {
  if (lang === "de") return text;
  return ARCHITEKTUR_EN[text] ?? text;
}
