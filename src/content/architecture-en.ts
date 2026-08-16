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
 * und ein Suchlauf über `innerText` sieht Text in einem SVG nicht, dort steht
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
  "Salati: ein Monorepo, vier Geräteklassen":
    "Salati: one monorepo, four device classes",
  "Die Geräte teilen sich Domänenlogik und Inhalte. Der KI-Pfad endet bewusst auf dem Gerät: Modell und Korpus werden ausgeliefert, nicht angefragt.":
    "The devices share domain logic and content. The AI path deliberately ends on the device: model and corpus ship with the app, they are not requested.",
  "MenuCloud: mandantenfähig bis in die Fiskalisierung":
    "MenuCloud: multi-tenant all the way into fiscal signing",
  "NOURI: zwei Oberflächen auf einer Rechenlogik":
    "NOURI: two surfaces on one set of rules",
  "Web und App teilen sich Typen, Rechenlogik und Katalog und sprechen beide unmittelbar mit Supabase. Die Nährwerte stehen nicht in der Datenbank, sie werden aus den Zutaten gerechnet und gegen die Atwater-Formel geprüft.":
    "Web and app share types, rules and catalogue, and both talk to Supabase directly. The nutrition values are not stored, they are computed from the ingredients and checked against the Atwater formula.",
  "WohnungsJäger: Scan, Bewertung, menschliche Freigabe":
    "WohnungsJäger: scan, scoring, human approval",
  "BitDojo: eine Quelle, fünf Wege durch denselben Stoff":
    "BitDojo: one source, five ways through the same material",
  "Lesen, Hören, Wiederholen, Machen und Prüfen greifen auf dieselben Markdown-Dateien zu. Der Prüflauf steht vor dem Bau und lässt ihn scheitern, wenn Inhalte und Ableitung auseinanderlaufen.":
    "Reading, listening, revising, doing and examining all draw on the same Markdown files. The check runs before the build and fails it when content and derived files drift apart.",
  "Dartile: eine Partie ist die Liste ihrer Würfe":
    "Dartile: a match is the list of its throws",
  "Drei Eingabewege münden in dieselbe reine Engine. Gespeichert wird das Ereignis, nicht der Punktestand: Zurücknehmen ist ein Abschneiden, Synchronisieren ein Anhängen.":
    "Three input paths meet in the same pure engine. What is stored is the event, not the score: undo is a truncation, syncing is an append.",
  "LexiPulse: ein Kern ohne Plattform": "LexiPulse: a core with no platform",
  "Leser, Bereinigung und Wiedergabe kennen weder DOM noch React Native. Jede Plattform steuert nur einen Speicher bei; das Dokument verlässt das Gerät nie.":
    "Parsers, cleanup and playback know neither the DOM nor React Native. Each platform contributes a storage driver and nothing else; the document never leaves the device.",

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
  Stores: "Stores",
  Quelle: "Source",
  Ableitung: "Derived files",
  Eingabe: "Input",
  Regeln: "Rules",
  Speicher: "Storage",
  "Gegen andere": "Against others",
  Import: "Import",
  Aufbereitung: "Preparation",
  Wiedergabe: "Playback",
  Ablage: "Storage",

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
  "Öffentliche Seite": "Public site",
  "Gemeinsame Datenform": "Shared data shape",
  "Edge Function": "Edge function",
  "Privater Speicher": "Private storage",
  "Raster 5 × 5": "5 × 5 grid",
  Kamera: "Camera",
  Ansage: "Call-out",
  "Checkout-Tafel": "Checkout table",
  Ereignisliste: "Event list",
  "SQLite auf dem Gerät": "SQLite on the device",
  "24 Ziele und Erfolge": "24 goals and achievements",
  "Wurf mit laufender Nummer": "Throw with a sequence number",
  Bestenlisten: "Leaderboards",
  "Web-Adresse": "Web address",
  Bereinigung: "Cleanup",
  Erkennungspunkt: "Recognition point",
  Uhr: "Clock",
  "Ausfuhr als JSON": "Export as JSON",

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
  "Planer · Protokoll · Kasse": "Planner · log · checkout",
  "Marketing · sechs Rechtsseiten": "Marketing · six legal pages",
  "11.892 Rezepte · Nährwerte aus Zutaten":
    "11,892 recipes · nutrition from ingredients",
  "gebaut, nicht in Betrieb": "built, not in operation",
  "62 Tabellen · RLS · ON DELETE CASCADE":
    "62 tables · RLS · ON DELETE CASCADE",
  "Kontolöschung nach Art. 17": "Account deletion under Art. 17",
  "nur im Browser": "browser only",

  /* BitDojo */
  "Text, Begriffskästen, Aufgaben, Übung":
    "Text, term boxes, questions, exercise",
  "bricht den Bau bei Inhaltsfehlern": "fails the build on content errors",
  "Markdown zu JSON": "Markdown to JSON",
  "Wiederholung · Quiz · Prüfung · Siegel":
    "Revision · quiz · exam · seal",
  "Kurse · Zertifikatsverzeichnis": "Courses · certificate registry",
  "Lesen · Hören · Prüfen": "Read · listen · examine",
  "derselbe Kern, verkauft nichts": "same core, sells nothing",
  "36 Folgen, zwei Stimmen": "36 episodes, two voices",
  "Fortschritt · Zeilenschutz": "Progress · row level security",
  "zwei Pläne · eine Probewoche": "two plans · one trial week",
  "Tonspuren · Handbücher": "Audio · handbooks",

  /* Dartile */
  "drei Tastendrücke je Aufnahme": "three taps per visit",
  "Vorschlag mit sichtbarer Sicherheit": "a suggestion with visible confidence",
  "175 vorproduzierte Rufe je Sprache":
    "175 pre-recorded call-outs per language",
  "Zustand plus Ereignis ergibt Zustand": "state plus event gives state",
  "kürzester Weg, Hand berücksichtigt": "shortest route, throwing hand included",
  "Würfe statt Punktestände": "throws, not scores",
  "voller Betrieb ohne Netz": "fully usable offline",
  "lokal gerechnet": "computed on the device",
  "Zeilenschutz · Auslöser": "Row level security · triggers",
  "fehlt eine, wird nachgeladen": "a gap triggers a refetch",
  "hinter Plus": "behind Plus",

  /* LexiPulse */
  "pdf.js je Plattform": "pdf.js per platform",
  "Server holt nur wegen CORS": "the server fetches only because of CORS",
  "Kopfzeilen, Seitenzahlen, Trennungen":
    "Running heads, page numbers, hyphenation",
  "Codepunkte statt UTF-16": "code points, not UTF-16",
  "translateX auf Festbreite": "translateX on a monospace face",
  "Faktoren multiplizieren sich": "factors compose",
  "absoluter Zeitstempel": "absolute timestamp",
  "im Browser": "in the browser",
  "auf dem Telefon": "on the phone",
  "Art. 20 DSGVO": "Art. 20 GDPR",
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
 * vergessene Übersetzung ist als deutsches Wort erkennbar, als Lücke wäre
 * sie unsichtbar.
 */
export function architekturText(text: string, lang: "de" | "en"): string {
  if (lang === "de") return text;
  return ARCHITEKTUR_EN[text] ?? text;
}
