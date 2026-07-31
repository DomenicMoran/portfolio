/**
 * Single source of truth for every piece of copy and data on the site.
 *
 * Everything marked `TODO(domenic)` is a value only Domenic can supply — see
 * USER-TODO.md, block A. Components are written so that a missing (empty or
 * null) value removes the element rather than rendering a placeholder: an
 * unanswered question must never become a visible "lorem ipsum" on a page whose
 * whole point is credibility.
 */

export const site = {
  url: "https://domenicmoran.de",
  name: "Domenic Moran",
  role: "AI Product Engineer",
  location: "Berlin, Deutschland",
  locale: "de-DE",

  email: "domenicmoran@gmail.com",
  // Kein Telefon und keine Privatanschrift in dieser Datei: das Repo ist
  // öffentlich, und beides wird aus öffentlichen Repos zuverlässig
  // abgegriffen. Beides steht im Lebenslauf unter docs/ — außerhalb des Repos.

  // Typed as plain strings, not literals: components branch on whether these
  // are filled in, and `as const` would narrow "" to a type that makes the
  // populated branch unreachable.
  socials: {
    github: "https://github.com/DomenicMoran" as string,
    // TODO(domenic): vollständige Profil-URL — USER-TODO A1.
    linkedin: "" as string,
    // TODO(domenic): cal.com-Link — USER-TODO B5.
    calendar: "" as string,
  },

  availability: {
    open: true,
    label: "Offen für Festanstellung & Freelance",
    detail: "Remote (EU) oder Berlin hybrid",
  },

  meta: {
    title: "Domenic Moran — AI Product Engineer",
    description:
      "Entwickler, der neben einem Vollzeitjob vier Produktionssysteme gebaut hat: Apps in beiden Stores, eine Multi-Tenant-SaaS mit gesetzlicher Fiskalisierung, ein autonomer Agent. 3.946 Commits in vier Monaten — alles selbst, alles live.",
  },
} as const;

/* ========================================================================== */
/* About — die Story, die dieses Profil von jedem anderen unterscheidet        */
/* ========================================================================== */

export const about = {
  eyebrow: "Wer ich bin",
  title: "Seit acht Jahren im Streifendienst. Seit vier Monaten Software in Produktion.",
  paragraphs: [
    "Ich arbeite seit 2018 in einem Vollzeitjob in Berlin. Softwareentwicklung habe ich mir ab 2022 selbst beigebracht — erst über strukturierte Kurse von Meta und Udemy, dann über eigene Projekte. 2026 ist daraus Ernst geworden: vier Produktionssysteme in vier Monaten, zwei davon mit Apps in beiden Stores, eines mit gesetzlich vorgeschriebener Fiskalisierung.",
    "Der Dienst hat mich zwei Dinge gelehrt, die im Engineering mehr wert sind als jedes Framework. Erstens: Unter Zeitdruck entscheiden, ohne die Sorgfalt zu verlieren. Zweitens — und das ist das Wichtigere: Eine Behauptung ohne Beleg zählt nicht. In einem Bericht steht nicht, was vermutlich passiert ist.",
    "Genau diese Regel steht heute in der Konventionsdatei jedes meiner Repositories: „Sollte jetzt funktionieren“ ist kein Ergebnis. Jede Änderung wird am Live-System nachgewiesen, bevor sie als fertig gilt. Das ist der Grund, warum ich mit KI-Agenten schnell liefern kann, ohne dass Qualität zur Behauptung wird.",
  ],
  // Verified against `git log` on 2026-07-31 — not estimates.
  stats: [
    { value: "3.946", label: "Commits in 4 Monaten", note: "neben dem Vollzeitdienst" },
    { value: "4", label: "Systeme in Produktion", note: "alle allein gebaut" },
    { value: "8", label: "Jahre Vollzeitjob", note: "Berlin, seit 03/2018" },
    { value: "2022", label: "Autodidakt seit", note: "Meta- & Udemy-Zertifikate" },
  ],
  timeline: [
    {
      period: "seit 04/2026",
      title: "Gründer & Einzelunternehmer",
      org: "MenuCloud, Berlin",
      body: "Aufbau und Betrieb von vier Produktionssystemen als alleiniger Entwickler — Produkt, Architektur, Auslieferung, Recht.",
      current: true,
    },
    {
      period: "seit 03/2018",
      title: "Vollzeitbeschäftigter",
      org: "Arbeitgeber in Berlin",
      body: "Entscheidungen unter Zeitdruck, lückenlose Dokumentation, Verantwortung für Ergebnisse mit realen Konsequenzen.",
      current: true,
    },
    {
      period: "09/2015 — 03/2018",
      title: "Berufsausbildung",
      org: "Arbeitgeber in Berlin",
      body: "Abgeschlossene Laufbahnausbildung inklusive Rechts-, Einsatz- und Verwaltungslehre.",
      current: false,
    },
    {
      period: "seit 2022",
      title: "Softwareentwicklung, autodidaktisch",
      org: "Meta (Coursera) · Udemy · eigene Projekte",
      body: "Front-End, Back-End, Mobile Development, Programming in Python, Version Control — plus iOS/Swift und SwiftUI. Kein Studium, kein Bootcamp.",
      current: true,
    },
  ],
} as const;

/* ========================================================================== */
/* Hero                                                                       */
/* ========================================================================== */

export const hero = {
  eyebrow: "Berlin · verfügbar",
  // Rendered word by word; `accent` switches to the editorial serif.
  headline: [
    { text: "Ich" },
    { text: "liefere" },
    { text: "fertige", accent: true },
    { text: "Produkte" },
    { text: "—" },
    { text: "nicht" },
    { text: "Prototypen.", accent: true },
  ] as { text: string; accent?: boolean }[],
  lede: "Fullstack Product Engineer aus Berlin — und hauptberuflich in einem Vollzeitjob. In vier Monaten sind daneben vier Produktionssysteme entstanden: Apps in beiden Stores, eine Multi-Tenant-SaaS mit gesetzlicher Fiskalisierung, ein autonomer Agent. Alles selbst gebaut, von der Migration bis zum Impressum.",
  ctaPrimary: { label: "Projekte ansehen", href: "#work" },
  ctaSecondary: { label: "Für Recruiter", href: "#hire" },
  // Every number verified against git and the repos on 2026-07-31.
  proof: [
    { value: "4", label: "Systeme in Produktion" },
    { value: "3.946", label: "Commits in 4 Monaten" },
    { value: "1.276", label: "API-Routen (MenuCloud)" },
    { value: "298", label: "automatisierte Tests" },
  ],
} as const;

/* ========================================================================== */
/* Case studies                                                               */
/* ========================================================================== */

export type Metric = { value: string; label: string };
export type StackGroup = { group: string; items: string[] };

export type CaseStudy = {
  id: string;
  index: string;
  name: string;
  tagline: string;
  year: string;
  role: string;
  status: "live" | "beta" | "tool";
  statusLabel: string;
  accent: "acid" | "violet" | "cyan";
  problem: string;
  solution: string;
  /** The one detail that proves depth rather than breadth. */
  hardPart: { title: string; body: string };
  highlights: string[];
  stack: StackGroup[];
  metrics: Metric[];
  links: { label: string; href: string; kind: "live" | "store" | "code" }[];
  /** Keys into ARCHITECTURES in components/ArchitectureDiagram.tsx */
  architecture: string;
  /**
   * Live screenshots captured from the running products on 2026-07-31.
   * Omitted where there is nothing safe to show — WohnungsJäger's dashboard
   * carries real listings and applicant data.
   */
  shots?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    label?: string;
    variant?: "browser" | "phone";
  }[];
};

export const caseStudies: CaseStudy[] = [
  {
    id: "salati",
    index: "01",
    name: "Salati",
    tagline: "Gebets- und Koran-App für den DACH-Raum — mit KI, die offline läuft",
    year: "2026",
    role: "Alleiniger Entwickler · Produkt, Code, Stores, Recht",
    status: "live",
    statusLabel: "Live in beiden Stores",
    accent: "acid",
    problem:
      "Bestehende Gebets-Apps sind werbefinanziert, tracken aggressiv und behandeln den Koran-Reader als Nebensache. Wer auf Deutsch lernen will — Tafsir, Übersetzung, Umschrift, isolierte und verbundene Buchstaben — findet nichts Zusammenhängendes. Und alles bricht, sobald das Netz weg ist.",
    solution:
      "Eine werbefreie Plattform über fünf Zielgeräte hinweg: iOS, Android, Android TV, Wear OS und ein HDMI-Stick für Moscheen. Gebetszeiten werden lokal berechnet, der komplette Koran-Reader mit mehreren Rezitatoren und Übersetzungen funktioniert offline, und die Fragen-Antwort-KI läuft als quantisiertes Modell auf dem Gerät — keine Anfrage verlässt das Telefon.",
    hardPart: {
      title: "Spracherkennung für Koran-Rezitation",
      body: "Für den Auswendiglern-Modus muss die App hören, ob ein Vers korrekt rezitiert wurde. Der naheliegende Weg — größeres Whisper-Modell — war der falsche. Der Hebel lag in der Methode: den erwarteten Vers als Prompt ins Modell konditionieren, persische und Urdu-Buchstabenvarianten vor dem Vergleich normalisieren, und milde bewerten statt binär. Ein auf Tarteel feingetuntes Base-Modell schlägt so das dreifach größere Large-Modell — bei einem Bruchteil der Latenz auf dem Gerät.",
    },
    highlights: [
      "Fünf Zielgeräte aus einem Monorepo: Phone, Tablet, Android TV, Wear OS, HDMI-Stick",
      "On-Device-LLM (GGUF/llama.cpp) mit eigenem RAG über kuratiertem Korpus — ohne Cloud-Call",
      "Whisper-basierte Rezitations-Erkennung mit vers-konditioniertem Prompting",
      "Vollständiger Mushaf-Reader: vier Schriftarten, Tafsir, Übersetzung, Wort-Zeitstempel",
      "15-teiliger deutscher Koran-Arabisch-Podcast, produziert über eine ElevenLabs-Zwei-Stimmen-Pipeline",
      "OTA-Updates über EAS Update — Inhaltskorrekturen ohne Store-Zyklus",
      "iOS Live Activities und Android-Widgets für die nächste Gebetszeit",
    ],
    stack: [
      {
        group: "Mobile",
        items: ["React Native 0.86", "Expo SDK 57", "Expo Router", "Reanimated 4", "TypeScript"],
      },
      {
        group: "KI on-device",
        items: ["llama.cpp / GGUF", "whisper.rn", "Eigenes RAG", "Prompt-Konditionierung"],
      },
      {
        group: "Backend & Delivery",
        items: ["Supabase", "Cloudflare R2", "EAS Build & Update", "Vercel", "Turborepo"],
      },
      {
        group: "Native",
        items: ["Android TV (Leanback)", "Wear OS", "Live Activities", "App Widgets"],
      },
    ],
    metrics: [
      { value: "1.44", label: "Aktuelle Version" },
      { value: "5", label: "Zielgeräte-Klassen" },
      { value: "0", label: "Cloud-Calls für KI-Antworten" },
      // TODO(domenic): Downloads / Rating / MAU — USER-TODO A3.
    ],
    links: [
      // Confirmed live in the project's own licence audit (2026-07-30).
      { label: "salati.pro", href: "https://www.salati.pro", kind: "live" },
      // TODO(domenic): Store-Links — USER-TODO A4.
      { label: "App Store", href: "", kind: "store" },
      { label: "Google Play", href: "", kind: "store" },
    ],
    architecture: "salati",
    shots: [
      {
        src: "/shots/salati-desktop.png",
        alt: "Startseite von salati.pro mit Download-Buttons und den vier Kernversprechen: kostenlos, kein Tracking, KI läuft lokal, offline nutzbar.",
        width: 1440,
        height: 900,
        label: "salati.pro",
      },
      {
        src: "/shots/salati-quran.png",
        alt: "Koran-Reader von Salati auf dem Telefon mit Surenliste, arabischem Originaltext und deutscher Übersetzung.",
        width: 430,
        height: 932,
        variant: "phone",
      },
    ],
  },
  {
    id: "menucloud",
    index: "02",
    name: "MenuCloud Berlin",
    tagline: "Multi-Tenant-SaaS für Gastronomie — inklusive gesetzlicher Fiskalisierung",
    year: "2025 — 2026",
    role: "Gründer & alleiniger Entwickler",
    status: "live",
    statusLabel: "Live in Produktion",
    accent: "violet",
    problem:
      "Berliner Restaurants zahlen 15–30 % Provision an Lieferplattformen und haben keine Kontrolle über ihre eigene Speisekarte. Die Alternativen sind entweder Baukästen ohne Kassenanbindung oder Enterprise-Systeme mit vierstelligen Einrichtungskosten — und beide lösen das Problem nicht, das jeder deutsche Gastronom tatsächlich hat: KassenSichV-Konformität.",
    solution:
      "Eine Plattform, die den kompletten Weg abdeckt: Restaurant-Website mit selbst editierbarer Karte, QR-Bestellung mit direkter Auszahlung über Stripe Connect, Reservierungen, Reputationsmanagement — und darunter eine mandantenfähige Cloud-TSE, die jede Transaktion nach §146a AO signiert und in einer Hash-Kette verankert. Dazu native Apps für Betreiber und Personal.",
    hardPart: {
      title: "Fiskalisierung als Mandanten-Problem",
      body: "Eine TSE ist nicht einfach ein API-Aufruf. Jeder Mandant braucht seine eigene, rechtlich zurechenbare Signatureinheit, jede Transaktion muss lückenlos in einer Hash-Kette hängen, und ein Ausfall darf niemals stillschweigend zu unsignierten Umsätzen führen — das wäre für den Gastronom eine Betriebsprüfungs-Katastrophe. Die Lösung ist eine per-Tenant provisionierte Fiskaly-Cloud-TSE mit persistierter Kette in `tse_chain_rows` und einem fail-closed-Pfad: keine Signatur, keine Buchung.",
    },
    highlights: [
      "1.276 API-Routen über 812 versionierte Postgres-Migrationen",
      "Mandantenfähige Architektur mit Row Level Security pro Restaurant",
      "Stripe Connect Destination-Charge — Restaurants werden direkt ausgezahlt, Plattformgebühr abgeführt",
      "KassenSichV §146a AO: Fiskaly Cloud-TSE pro Mandant, Hash-Kette persistiert",
      "298 automatisierte Tests (254 Unit / 44 E2E) gegen Produktion",
      "Self-hosted Mailstack (Mailcow) mit dreistufiger Fallback-Kette",
      "47 versionierte n8n-Workflows für Onboarding, Abrechnung, Reporting und Watchdogs",
      "DSGVO Art. 30 Verzeichnis, AVV-Versand automatisiert bei Zahlungseingang",
      "iOS- und Android-Apps für Betreiber und Servicekräfte",
    ],
    stack: [
      {
        group: "Frontend",
        items: ["Next.js 16 App Router", "React 19 RSC", "TypeScript", "Tailwind"],
      },
      {
        group: "Backend & Daten",
        items: ["Supabase / Postgres", "Row Level Security", "Stripe Connect", "Fiskaly TSE"],
      },
      {
        group: "Infrastruktur",
        items: ["Hetzner", "Coolify", "Cloudflare", "Docker", "Mailcow", "n8n"],
      },
      {
        group: "Qualität",
        items: ["Vitest", "Playwright", "Sentry", "Umami", "Lighthouse-Budgets"],
      },
    ],
    metrics: [
      { value: "1.276", label: "API-Routen" },
      { value: "812", label: "DB-Migrationen" },
      { value: "298", label: "Automatisierte Tests" },
      { value: "EU", label: "Hosting & Datenhaltung" },
      // TODO(domenic): Kunden / MRR / GMV / Uptime — USER-TODO A3.
    ],
    links: [
      { label: "menucloud-berlin.de", href: "https://menucloud-berlin.de", kind: "live" },
      { label: "Status-Page", href: "https://menucloud-berlin.de/status", kind: "live" },
    ],
    architecture: "menucloud",
    shots: [
      {
        src: "/shots/menucloud-desktop.png",
        alt: "Startseite von menucloud-berlin.de mit dem Versprechen null Provision, DSGVO und KassenSichV sowie einer Vorschau des Self-Service-Admins.",
        width: 1440,
        height: 900,
        label: "menucloud-berlin.de",
      },
    ],
  },
  {
    id: "wohnungsjaeger",
    index: "03",
    name: "WohnungsJäger",
    tagline: "Autonomer Agent, der den Berliner Wohnungsmarkt schneller liest als ein Mensch",
    year: "2026",
    role: "Alleiniger Entwickler",
    status: "tool",
    statusLabel: "Im Eigenbetrieb",
    accent: "cyan",
    problem:
      "Auf eine Berliner Wohnung kommen dreistellige Bewerberzahlen. Entscheidend ist nicht die beste Bewerbung, sondern die erste — und zwar innerhalb von Minuten nach Inseratsschaltung. Das ist ein Wettlauf, den ein Mensch strukturell nicht gewinnen kann, weil er schläft.",
    solution:
      "Ein lokal laufender Agent, der rund um die Uhr fünf Portale scannt, jedes neue Inserat gegen die eigenen Kriterien prüft, zweifelhafte Fälle per LLM im Volltext bewertet und ein individuelles Anschreiben erzeugt. Standardmäßig im REVIEW-Modus: die App versendet nichts ohne Freigabe, bis man sie bewusst auf Automatik stellt.",
    hardPart: {
      title: "Ein Agent, der nicht ungefragt handelt",
      body: "Der Reiz eines solchen Systems ist auch sein Risiko: ein Bot, der selbstständig Bewerbungen mit deinen echten Personendaten verschickt, kann realen Schaden anrichten. Deshalb ist der Auslieferungszustand REVIEW — Vorschlag statt Versand. Der Automatikmodus existiert, ist aber eine bewusste Entscheidung des Nutzers, nicht die Voreinstellung. Dieselbe Logik steckt in den Watchdogs meiner anderen Projekte: Selbstheilung immer mit Cooldown, Obergrenze und sichtbarem Alarm bei jedem Eingriff.",
    },
    highlights: [
      "Playwright mit persistenten Chrome-Profilen je Portal — echte Sessions statt brüchiger Scraper",
      "LLM-Volltextprüfung mit regelbasiertem Fallback, wenn kein Key hinterlegt ist",
      "Lokale SQLite-Datenhaltung, Server bindet standardmäßig nur auf 127.0.0.1",
      "REVIEW-Modus als Auslieferungszustand — kein Versand ohne menschliche Freigabe",
      "Watchdog mit automatischem Neustart nach Absturz",
      "Mehrinstanz-Betrieb für parallele Accounts, Weitergabe-Paket ohne persönliche Daten",
    ],
    stack: [
      { group: "Runtime", items: ["Node.js 22", "TypeScript", "Fastify", "Server-Sent Events"] },
      { group: "Automation", items: ["Playwright", "Persistente Browser-Profile", "Cron-Scheduler"] },
      { group: "Daten & KI", items: ["node:sqlite", "Anthropic API", "Regelbasierter Fallback"] },
    ],
    metrics: [
      { value: "5", label: "Überwachte Portale" },
      { value: "24/7", label: "Scan-Betrieb" },
      { value: "REVIEW", label: "Sicherer Auslieferungszustand" },
      // TODO(domenic): gescannte Anzeigen / versendete Bewerbungen — USER-TODO A3.
    ],
    links: [],
    architecture: "wohnungsjaeger",
  },
  {
    id: "nouri",
    index: "04",
    name: "NOURI",
    tagline: "Fitness- und Ernährungsplattform mit Web-App, Mobile-App und eigener API",
    year: "2026",
    role: "Alleiniger Entwickler",
    status: "beta",
    statusLabel: "Beta",
    accent: "violet",
    problem:
      "Ernährungs-Apps sind entweder Tracker ohne Planung oder Planer ohne echte Datenbasis. Und fast alle behandeln Fehler als Kosmetik: Wenn der Server nicht erreichbar ist, zeigen sie „gespeichert“ an und verlieren die Eingabe.",
    solution:
      "Eine Plattform aus Web-App, Expo-App und Fastify-API auf einem gemeinsamen Katalog von fast 12.000 Rezepten — mit Makro-Tracking, Wochenplanung, Einkaufslisten, Vorratsverwaltung und Trainingsplänen. Und mit einer API, die drei Zustände sauber unterscheidet, statt sie zu verschleiern.",
    hardPart: {
      title: "Fehler ehrlich melden",
      body: "Jeder schreibende Endpunkt unterscheidet explizit: Secrets fehlen (Dry-Run, kein Datenverlust vorgetäuscht), Datenbank nicht erreichbar (503), Datenbank erreichbar aber lehnt ab (echter 4xx mit Postgres-Fehlercode). Das klingt nach Kleinkram, ist aber der Unterschied zwischen einem System, dem man beim Debuggen glauben kann, und einem, das lügt. Genau dieselbe Disziplin wende ich auf KI-Output an: eine Behauptung ohne Beleg zählt nicht.",
    },
    highlights: [
      "Monorepo mit geteiltem Katalog über Web, Mobile und API hinweg",
      "59 Tabellen über 12 versionierte Migrationen, Row Level Security aktiv",
      "Supabase-Auth mit geräteübergreifender Profilsynchronisation",
      "Nutzung ohne Account bleibt vollständig lokal — kein Login-Zwang",
      "Explizite Fehlerzustände statt stiller 500er",
    ],
    stack: [
      { group: "Apps", items: ["Next.js", "Expo", "TypeScript", "Turborepo"] },
      { group: "Services", items: ["Fastify", "Supabase", "Postgres", "RLS"] },
      { group: "Delivery", items: ["Vercel", "pnpm Workspaces"] },
    ],
    metrics: [
      { value: "11.892", label: "Rezepte im Katalog" },
      { value: "59", label: "Tabellen" },
      { value: "12", label: "Migrationen" },
    ],
    links: [
      // TODO(domenic): Live-URL bestätigen — USER-TODO A4.
      { label: "Live-Demo", href: "", kind: "live" },
    ],
    architecture: "nouri",
    shots: [
      {
        src: "/shots/nouri-desktop.png",
        alt: "Startseite der NOURI-Plattform mit Rezeptkatalog, Wochenplanung und Trainingsbereich.",
        width: 1440,
        height: 900,
        label: "nouri-fitness.vercel.app",
      },
    ],
  },
];

/* ========================================================================== */
/* AI workflow                                                                */
/* ========================================================================== */

export const workflow = {
  eyebrow: "Arbeitsweise",
  title: "KI ist ein Werkzeug, keine Ausrede",
  lede: "Ich arbeite seit über einem Jahr agentengestützt. Das komprimiert Lieferzeiten von Monaten auf Tage — aber nur, weil um die Agenten herum ein System steht, das ihre Fehler abfängt. Ohne dieses System ist KI-gestützte Entwicklung eine Maschine zur Erzeugung von plausibel aussehendem Schrott.",
  principles: [
    {
      n: "01",
      title: "Kontext als versionierter Code",
      body: "Jedes Projekt trägt seine Konventionen als Datei im Repo: Import-Regeln, Test-Muster, Design-Tokens, Sicherheits-Defaults. Dazu ein persistentes Gedächtnis über Sessions hinweg — jede gelernte Lektion wird ein Eintrag mit Begründung, nicht eine Notiz in einem Chatverlauf, der morgen weg ist. Ein Agent ist nur so gut wie der Kontext, den er zuverlässig vorfindet.",
      artifacts: ["CLAUDE.md pro Repo", "Persistentes Memory", "Append-only Projektlog"],
    },
    {
      n: "02",
      title: "Parallelisierung statt Wartezeit",
      body: "Lange Läufe — Builds, Testsuites, Store-Uploads — laufen im Hintergrund, während ich weiterarbeite. Unabhängige Recherchen gehen an spezialisierte Sub-Agenten mit eigenem Kontextfenster. Der Engpass bei agentengestützter Entwicklung ist selten das Modell, sondern die serialisierte Arbeitsweise davor.",
      artifacts: ["Sub-Agenten", "Hintergrund-Tasks", "Turborepo-Caching"],
    },
    {
      n: "03",
      title: "Verifikation statt Vertrauen",
      body: "„Sollte jetzt funktionieren“ ist kein Ergebnis. Jede Behauptung über den Systemzustand braucht einen Beleg: HTTP-Response, DB-Query, Playwright-Screenshot, empfangene E-Mail, echte Cron-Execution. Diese Regel hat in meinen eigenen Projekten mehrfach Bugs aufgedeckt, die durch grüne Test-Suites gerutscht waren — weil die Tests das falsche geprüft haben.",
      artifacts: ["Playwright gegen Produktion", "Screenshot-Diffs", "Live-DB-Verifikation"],
    },
    {
      n: "04",
      title: "Wiederkehrende Fixes werden Automatisierung",
      body: "Wenn ich denselben Handgriff zum dritten Mal mache, wird er ein Workflow. Cron-bewusste Watchdogs überwachen Dienste, heilen bekannte Ausfälle selbst und melden nach Slack. Immer mit Schutzgeländer: Cooldown, Obergrenze, Alarm bei jedem Eingriff. Ein Watchdog, der blind repariert, richtet mehr Schaden an als er verhindert.",
      artifacts: ["75+ n8n-Workflows", "Self-Healing mit Cap", "Slack-Ops-Alerts"],
    },
    {
      n: "05",
      title: "Recht als Definition of Done",
      body: "Jedes kundenwirksame Feature durchläuft dasselbe Gate: DSGVO-Rechtsgrundlage vorhanden? UWG §7 bei Outreach beachtet? EU AI Act Art. 50 — ist die KI als solche gekennzeichnet? Wird auf der Website etwas versprochen, das wir nicht liefern? Bei Consumer-Produkten in der EU ist das kein Beiwerk, sondern Teil des Produkts.",
      artifacts: ["DSGVO Art. 30", "AVV automatisiert", "AI-Act-Disclosure"],
    },
  ],
  // The terminal replays this. Kept short so the whole loop reads in ~25s.
  demo: {
    label: "So sieht eine typische Iteration aus",
    lines: [
      { kind: "prompt", text: "Feature: Gebetszeiten-Widget für Android, offline-fähig" },
      { kind: "think", text: "Konventionen aus CLAUDE.md geladen · 3 ähnliche Module gefunden" },
      { kind: "run", text: "Implementierung in react-native-android-widget" },
      { kind: "run", text: "Tests: 14 neu · Typecheck: 0 Fehler · Lint: 0 Errors" },
      { kind: "warn", text: "Verifikation: Widget rendert leer auf API 34" },
      { kind: "think", text: "Ursache: Widget-Activity überlebt RN-Recreate nicht" },
      { kind: "run", text: "Fix + Regressionstest · Screenshot vom echten Gerät" },
      { kind: "ok", text: "Verifiziert auf Pixel 7 · OTA ausgeliefert · 0 Store-Zyklen" },
    ],
  },
} as const;

/* ========================================================================== */
/* Skills                                                                     */
/* ========================================================================== */

export type SkillDomain = {
  id: string;
  title: string;
  summary: string;
  /** Level drives the meter; evidence is what makes it credible. */
  skills: { name: string; level: number; evidence: string }[];
};

export const skillDomains: SkillDomain[] = [
  {
    id: "frontend",
    title: "Frontend & Produkt",
    summary:
      "Interfaces, die auf einem Fünf-Jahre-alten Android genauso funktionieren wie auf einem Studio-Display.",
    skills: [
      { name: "React / Next.js App Router", level: 95, evidence: "Next.js 16 RSC in Produktion" },
      { name: "React Native / Expo", level: 92, evidence: "Expo SDK 57, RN 0.86, fünf Gerätetypen" },
      { name: "TypeScript", level: 93, evidence: "Strict überall, 0 Fehler als Merge-Gate" },
      { name: "Motion & Interaction", level: 85, evidence: "Reanimated 4, Framer Motion" },
      { name: "Core Web Vitals", level: 88, evidence: "LCP/CLS/INP-Budgets im CI" },
      { name: "Barrierefreiheit", level: 78, evidence: "TV-Fokus-Navigation, Reduced-Motion" },
    ],
  },
  {
    id: "backend",
    title: "Backend & Daten",
    summary:
      "Mandantenfähige Systeme mit echtem Geld, echten Steuern und echten Konsequenzen bei Fehlern.",
    skills: [
      { name: "Postgres / Supabase", level: 90, evidence: "59-Tabellen-Schema, RLS, Migrationen" },
      { name: "API-Design", level: 88, evidence: "Fastify, Route Handlers, Zod-Validierung" },
      { name: "Zahlungen", level: 85, evidence: "Stripe Connect Destination-Charge" },
      { name: "Multi-Tenancy", level: 87, evidence: "RLS + per-Tenant-Provisionierung" },
      { name: "E-Mail-Infrastruktur", level: 80, evidence: "Self-hosted Mailcow + Fallback-Kette" },
      { name: "Compliance-Systeme", level: 82, evidence: "KassenSichV-TSE, DSGVO Art. 30" },
    ],
  },
  {
    id: "cloud",
    title: "Cloud, Delivery & Betrieb",
    summary: "Ich betreibe, was ich baue — inklusive der Nachtschicht, wenn etwas ausfällt.",
    skills: [
      { name: "Vercel / Edge", level: 88, evidence: "Statische Exports, Rewrites, ISR" },
      { name: "Docker / Coolify / Hetzner", level: 82, evidence: "Eigener VPS-Stack in Produktion" },
      { name: "CI/CD", level: 85, evidence: "GitHub Actions, Turborepo, EAS Build" },
      { name: "Store-Auslieferung", level: 90, evidence: "App Store & Play, inkl. OTA-Updates" },
      { name: "Observability", level: 80, evidence: "Sentry, Uptime-Kuma, Slack-Alerts" },
      { name: "Automatisierung", level: 88, evidence: "75+ n8n-Workflows, Self-Healing" },
    ],
  },
  {
    id: "ai",
    title: "KI-Integration",
    summary:
      "Von der Agenten-Pipeline in meinem Editor bis zum quantisierten Modell auf dem Telefon des Nutzers.",
    skills: [
      { name: "Agenten-Orchestrierung", level: 93, evidence: "Sub-Agenten, Tool-Pipelines, Loops" },
      { name: "On-Device-Inferenz", level: 85, evidence: "llama.cpp/GGUF, whisper.rn" },
      { name: "RAG & Retrieval", level: 82, evidence: "Eigener Korpus, Granularität gemessen" },
      { name: "Prompt-Engineering", level: 88, evidence: "Vers-Konditionierung schlägt Modellgröße" },
      { name: "Evaluation", level: 78, evidence: "Lokale Iteration gegen dieselbe GGUF" },
      { name: "KI-Recht (EU AI Act)", level: 80, evidence: "Art.-50-Disclosure als Gate" },
    ],
  },
];

/* ========================================================================== */
/* Recruiter hub                                                              */
/* ========================================================================== */

export const recruiter = {
  eyebrow: "Für Recruiter & CTOs",
  title: "Das Wichtigste in 60 Sekunden",
  lede: "Kein Anschreiben nötig. Hier steht, was ich kann, was ich suche und wie du mich erreichst.",
  facts: [
    { label: "Rolle", value: "AI Product Engineer / Fullstack" },
    { label: "Schwerpunkt", value: "Produkt end-to-end, KI-gestützte Lieferung" },
    { label: "Standort", value: "Berlin · Remote EU" },
    { label: "Verfügbar", value: "Nach Absprache" },
    { label: "Sprachen", value: "Deutsch (Muttersprache) · Englisch" },
    { label: "Modell", value: "Festanstellung oder Freelance" },
    // Pre-empts the "where's the code?" question and answers it as a decision
    // rather than a gap — see USER-TODO block D.
    { label: "Quellcode", value: "Repos privat — Lese-Zugriff auf Anfrage" },
  ],
  strengths: [
    {
      title: "Ich liefere fertig, nicht fast fertig",
      body: "Vier Systeme in Produktion — inklusive Store-Reviews, Zahlungsabwicklung, DSGVO-Dokumentation und Impressum. Der Teil, den die meisten Portfolios auslassen, ist genau der Teil, der am längsten dauert.",
    },
    {
      title: "Ich arbeite über den ganzen Stack",
      body: "React-Native-Widget, Postgres-Migration, Docker-Compose auf dem eigenen VPS, Fiskal-Compliance. Kein Ticket-Ping-Pong, weil etwas „nicht mein Bereich“ ist.",
    },
    {
      title: "Belegpflicht statt Bauchgefühl",
      body: "Aus acht Jahren Berufstätigkeit: Eine Behauptung ohne Beleg zählt nicht. Übertragen aufs Engineering heißt das — jede Änderung wird am Live-System nachgewiesen, bevor sie als fertig gilt. Das macht agentengestützte Entwicklung erst belastbar.",
    },
  ],
  cta: {
    pdf: { label: "One-Pager als PDF", href: "/onepager" },
    // TODO(domenic): cal.com-Link — USER-TODO B5.
    call: { label: "30 Min. sprechen", href: "" },
  },
} as const;

/* ========================================================================== */
/* Contact                                                                    */
/* ========================================================================== */

export const contact = {
  eyebrow: "Kontakt",
  title: "Lass uns etwas bauen",
  lede: "Ob konkrete Rolle, Projektanfrage oder einfach eine technische Frage — ich antworte innerhalb von 24 Stunden.",
  formLabels: {
    name: "Name",
    email: "E-Mail",
    company: "Unternehmen",
    message: "Nachricht",
    submit: "Nachricht senden",
    sending: "Wird gesendet …",
    success: "Angekommen. Ich melde mich innerhalb von 24 Stunden.",
    error: "Das hat nicht geklappt. Schreib mir bitte direkt:",
  },
} as const;

/* ========================================================================== */
/* Navigation                                                                 */
/* ========================================================================== */

export const navItems = [
  { label: "Projekte", href: "#work" },
  { label: "Über mich", href: "#about" },
  { label: "Arbeitsweise", href: "#workflow" },
  { label: "Skills", href: "#skills" },
  { label: "Für Recruiter", href: "#hire" },
  { label: "Kontakt", href: "#contact" },
] as const;

/** Tech ticker in the hero. Ordered for rhythm, not by importance. */
export const techTicker = [
  "TypeScript",
  "React",
  "Next.js",
  "React Native",
  "Expo",
  "Postgres",
  "Supabase",
  "Stripe",
  "Node.js",
  "Fastify",
  "Playwright",
  "Docker",
  "Cloudflare",
  "Hetzner",
  "n8n",
  "llama.cpp",
  "Whisper",
  "Tailwind",
  "Turborepo",
  "Vitest",
];
