import verified from "./verified.json";
/**
 * Single source of truth for every piece of copy and data on the site.
 *
 * Everything marked `TODO(domenic)` is a value only Domenic can supply, see
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
  // abgegriffen. Beides steht im Lebenslauf unter docs/, also außerhalb des Repos.

  // Typed as plain strings, not literals: components branch on whether these
  // are filled in, and `as const` would narrow "" to a type that makes the
  // populated branch unreachable.
  socials: {
    github: "https://github.com/DomenicMoran" as string,
    linkedin: "https://www.linkedin.com/in/domenicmoran" as string,
  },

  availability: {
    open: true,
    label: "Offen für eine Festanstellung",
    detail: "Remote (EU) oder Berlin hybrid",
  },

  meta: {
    title: "Domenic Moran – AI Product Engineer",
    description:
      "Vier Systeme in Produktion, alle allein gebaut: Apps in beiden Stores, eine Multi-Tenant-SaaS mit gesetzlicher Fiskalisierung, ein autonomer Agent.",
  },
} as const;

/* ========================================================================== */
/* About: die Story, die dieses Profil von jedem anderen unterscheidet         */
/* ========================================================================== */

export const about = {
  eyebrow: "Wer ich bin",
  /**
   * TODO(domenic): echtes Porträt nach `public/portrait.jpg` legen und den Pfad
   * hier eintragen, siehe USER-TODO B1. Solange leer, entfällt das Bildelement und
   * die Textspalte nimmt die volle Breite ein; die Sektion sieht dann
   * vollständig aus statt lückenhaft.
   *
   * Bewusst KEIN generiertes Bild: Auf einer Seite, die mit Belegbarkeit
   * argumentiert, ist ein erfundenes Porträt der eine Fehler, der alles andere
   * infrage stellt.
   */
  portrait: "" as string,
  title: "Vier Jahre gelernt. Vier Monate ausgeliefert.",
  paragraphs: [
    "Softwareentwicklung habe ich mir ab 2022 selbst beigebracht: erst über strukturierte Kurse von Meta und Udemy, dann über eigene Projekte. Kein Informatikstudium, kein Bootcamp. 2026 ist daraus Ernst geworden: vier Produktionssysteme in vier Monaten, zwei davon mit Apps in beiden Stores, eines mit gesetzlich vorgeschriebener Fiskalisierung, entstanden neben einem Vollzeitjob.",
    "Was ich dabei gelernt habe und was heute meine Arbeitsweise bestimmt: Ein grüner Testlauf beweist nichts. Ich hatte ein Android-Widget, bei dem alle Tests durchliefen und das auf dem echten Gerät leer blieb. Und ich habe monatelang geglaubt, meine Update-Auslieferung funktioniere, weil das Werkzeug nach jedem Veröffentlichen „Published“ meldete. Angekommen ist bei keinem Nutzer je etwas.",
    "Seitdem gilt in jedem meiner Repositories dieselbe Regel: „Sollte jetzt funktionieren“ ist kein Ergebnis. Jede Änderung wird am Live-System nachgewiesen: durch HTTP-Response, Datenbankabfrage oder Screenshot vom echten Gerät. Das ist der Grund, warum ich mit KI-Agenten schnell liefern kann, ohne dass Qualität zur Behauptung wird.",
  ],
  // Verified against `git log` and the repositories on 2026-07-31.
  stats: [
    { value: verified.commitsHead, label: "Commits seit März 2026", note: "neben einem Vollzeitjob" },
    { value: "4", label: "Systeme in Produktion", note: "alle allein gebaut" },
    { value: "2", label: "App Stores", note: "iOS und Android, live" },
    { value: "2022", label: "Autodidakt seit", note: "Meta- & Udemy-Zertifikate" },
  ],
  /** Macht die Zahlen prüfbar statt bloß behauptet, und erklärt jede Abweichung,
   *  die durch weiteres Arbeiten entsteht. */
  /**
   * Aus dem Prüfstempel gespeist, nicht daneben gepflegt.
   *
   * Zahl, Datum und Anzahl der Repositories stehen in `verified.json`, das ein
   * Automat bei GitHub täglich schreibt. Vorher standen sie hier als Text und
   * gingen mit jedem Lauf ein Stück auseinander: die Kachel sagte 4.042, der
   * Stempel 4.046, die Konsolenmeldung wieder etwas anderes. Eine Seite, die
   * zum Nachrechnen einlädt, darf sich nicht selbst widersprechen.
   */
  statsHinweis: `Gemessen am ${verified.date.split("-").reverse().join(".")} über die GitHub-API, mit git rev-list --count über alle ${verified.repos} Repositories: die drei Monorepos hinter MenuCloud, Salati und NOURI, diese Webseite und die vier veröffentlichten Pakete. Gezählt wird der Hauptzweig, und nur, was auch bei GitHub liegt — lokale Stände zählen nicht mit. Ein Automat frischt die Zahl täglich auf; der Stand wächst weiter, abweichende Werte sind daher höher, nicht niedriger.`,
  timeline: [
    {
      period: "seit 04/2026",
      title: "Gründer & Product Engineer",
      org: "MenuCloud, Inh. Domenic Moran, Berlin",
      body: "Aufbau und Betrieb von vier Produktionssystemen als alleiniger Entwickler: Produkt, Architektur, Auslieferung, Betrieb und Recht in einer Hand.",
      current: true,
    },
    {
      period: "seit 2022",
      title: "Softwareentwicklung, autodidaktisch",
      org: "Meta (Coursera) · Udemy · eigene Projekte",
      body: "Kein Informatikstudium, kein Bootcamp. Der Nachweis sind vier Systeme in Produktion und eine prüfbare Git-Historie.",
      current: true,
    },
  ],
  /**
   * Öffentlicher Code. Bewusst kein Produktcode, die Produktivsysteme bleiben
   * privat. Was hier steht, sind eigenständige Bibliotheken aus Problemen, die
   * dabei tatsächlich aufgetreten sind.
   */
  openSource: {
    label: "Open Source",
    lede: "Meine Produktivsysteme bleiben privat, sie tragen Kundendaten und lizenzierte Inhalte. Veröffentlicht ist, was sich daraus herauslösen ließ: die Werkzeuge, die beim Bauen entstanden sind, und die Regeln, die aus den Fehlern folgten.",
    items: [
      {
        name: "verified-done",
        href: "https://github.com/DomenicMoran/verified-done",
        body: "Vier Claude-Code-Skills gegen die Behauptung ohne Beleg. Jeder stammt aus einem Fehler, der ausgeliefert wurde, und nennt ihn.",
        meta: "Claude Code · 4 Skills · Frontmatter-Prüfung in der CI",
      },
      {
        name: "cron-last-due",
        href: "https://github.com/DomenicMoran/cron-last-due",
        body: "Wann war dieser Cron zuletzt fällig? Zeitzonenbewusst, für Watchdogs. Entstanden aus einer pauschalen Regel, die jedes Wochenende Fehlalarm schlug.",
        meta: "TypeScript · 23 Tests · null Abhängigkeiten",
      },
      {
        name: "whisper-ggml-header",
        href: "https://github.com/DomenicMoran/whisper-ggml-header",
        body: "Liest den Header eines Whisper-Modells und sagt, ob whisper.cpp ihn lädt. Fängt die verbreitete Fehlkonvertierung ab, die kommentarlos abgelehnt wird.",
        meta: "TypeScript · CLI · 17 Tests",
      },
      {
        name: "arabic-normalize",
        href: "https://github.com/DomenicMoran/arabic-normalize",
        body: "Normalisierung arabischer Schrift für den Vergleich. Löst, dass ein Spracherkenner „علی“ ausgibt, wo die Vorlage „علي“ enthält. Für das Ohr identisch, für === verschieden.",
        meta: "TypeScript · 23 Tests · null Abhängigkeiten",
      },
      {
        name: "portfolio",
        href: "https://github.com/DomenicMoran/portfolio",
        body: "Diese Seite. Next.js 16 mit React Server Components, dokumentierten Architektur-Entscheidungen und der Begründung, warum die CSP aussieht, wie sie aussieht.",
        meta: "TypeScript · Lighthouse 100 Barrierefreiheit",
      },
    ],
  },
  /**
   * Titel, Aussteller und Datum stammen aus den Zertifikatsdateien selbst
   * (Repository Zertifikate), nicht aus dem Gedächtnis. Dabei kamen drei
   * Fehler heraus, die vorher hier standen: „Introduction to Swift 5“ heißt
   * tatsächlich „Introduction to Programming in Swift 5“, „Table Views“ heißt
   * „Tables, Data & Networking in iOS“, und zwei Zertifikate fehlten ganz.
   *
   * Jeder `href` wurde am 01.08.2026 abgerufen und antwortete mit 200.
   */
  certificates: {
    label: "Zertifikate",
    note: "Jeder Eintrag führt zur Bestätigungsseite des Ausstellers.",
    noteHref: { label: "Alle zehn zusätzlich als PDF", href: "https://github.com/DomenicMoran/Zertifikate" },
    groups: [
      {
        issuer: "Meta, über Coursera",
        items: [
          {
            name: "Introduction to Front-End Development",
            href: "https://coursera.org/verify/YH8W2JKAX4GM",
            date: "2022-07-25",
          },
          {
            name: "Introduction to Back-End Development",
            href: "https://coursera.org/verify/HUA7X3W4GE4V",
            date: "2022-07-17",
          },
          {
            name: "Introduction to Mobile Development",
            href: "https://coursera.org/verify/YZGD5294DA5F",
            date: "2022-07-26",
          },
          {
            name: "Programming with JavaScript",
            href: "https://coursera.org/verify/MKUUWNEUF5VK",
            date: "2022-07-30",
          },
          {
            name: "Programming in Python",
            href: "https://coursera.org/verify/VKLJNXHMD9B7",
            date: "2022-07-24",
          },
          {
            name: "Version Control",
            href: "https://coursera.org/verify/LFCXZZBK4JTB",
            date: "2022-07-25",
          },
        ],
      },
      {
        issuer: "LearnQuest, über Coursera",
        items: [
          {
            name: "Introduction to Programming in Swift 5",
            href: "https://coursera.org/verify/KH7JB895Z5D8",
            date: "2022-08-01",
          },
          {
            name: "Introduction to iOS App Development with Swift 5",
            href: "https://coursera.org/verify/TEMFV7CXDBSK",
            date: "2022-08-02",
          },
          {
            name: "Tables, Data & Networking in iOS",
            href: "https://coursera.org/verify/VHUCVNLX2PSJ",
            date: "2022-08-06",
          },
        ],
      },
      {
        issuer: "Udemy",
        items: [
          {
            name: "App-Entwicklung mit Swift 5 für iOS 15, inkl. SwiftUI 2 (39 Std.)",
            href: "https://ude.my/UC-0f3b4b66-20ef-4b2b-8bfc-a7da7a1290fc",
            date: "2022-08-17",
          },
        ],
      },
    ],
  },
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
    { text: "Produkte," },
    { text: "keine" },
    { text: "Prototypen.", accent: true },
  ] as { text: string; accent?: boolean }[],
  lede: "Fullstack Product Engineer aus Berlin. Vier Systeme in Produktion, in vier Monaten neben einem Vollzeitjob entstanden: Apps in beiden Stores, eine Multi-Tenant-SaaS mit gesetzlich vorgeschriebener Fiskalisierung, ein autonomer Agent. Alles selbst gebaut, von der Migration bis zum Impressum.",
  ctaPrimary: { label: "Projekte ansehen", href: "#work" },
  ctaSecondary: { label: "Für Recruiter", href: "#hire" },
  // Jede Zahl am 31.07.2026 gegen `git log` und die Repositories geprüft.
  // Commit-Stände wachsen weiter, deshalb steht das Prüfdatum sichtbar in der
  // Über-mich-Sektion, statt hier eine Zahl zu führen, die morgen stillschweigend
  // falsch wäre.
  proof: [
    { value: "4", label: "Systeme in Produktion" },
    { value: verified.commitsHead, label: "Commits seit März 2026" },
    { value: "1.276", label: "API-Routen (MenuCloud)" },
    { value: "7.437", label: "Testfälle (MenuCloud)" },
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
  links: { label: string; href: string; kind: "live" | "store" | "code" | "social" }[];
  /** Keys into ARCHITECTURES in components/ArchitectureDiagram.tsx */
  architecture: string;
  /** Optional: eigener Abschnitt, wenn ein Aspekt eine Aufzählung sprengt. */
  automation?: {
    title: string;
    lede: string;
    groups: { title: string; items: string[] }[];
  };
  /**
   * Live screenshots captured from the running products on 2026-07-31.
   * Omitted where there is nothing safe to show: WohnungsJäger's dashboard
   * carries real listings and applicant data.
   */
  shots?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    label?: string;
    variant?: "browser" | "phone" | "screen";
  }[];
  /**
   * Steht anstelle eines Screenshots, wo es einen guten Grund gibt, keinen zu
   * zeigen. Eine begründete Leerstelle ist besser als ein nachgestelltes Bild,
   * und besser als eine Fallstudie, die neben den anderen unfertig aussieht.
   */
  keinScreenshot?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    id: "salati",
    index: "01",
    name: "Salati",
    tagline: "Gebets- und Koran-App für den DACH-Raum mit KI, die offline läuft",
    year: "2026",
    role: "Alleiniger Entwickler · Produkt, Code, Stores, Recht",
    status: "live",
    statusLabel: "Live im App Store",
    accent: "acid",
    problem:
      "Bestehende Gebets-Apps sind werbefinanziert, tracken aggressiv und behandeln den Koran-Reader als Nebensache. Wer auf Deutsch lernen will (Tafsir, Übersetzung, Umschrift, isolierte und verbundene Buchstaben), findet nichts Zusammenhängendes. Und alles bricht, sobald das Netz weg ist.",
    solution:
      "Eine werbefreie Plattform über vier Zielgeräte hinweg: iOS, Android, Android TV und Wear OS. Gebetszeiten werden lokal berechnet, der komplette Koran-Reader mit mehreren Rezitatoren und Übersetzungen funktioniert offline, und die Fragen-Antwort-KI läuft als quantisiertes Modell auf dem Gerät. Keine Anfrage verlässt das Telefon.",
    hardPart: {
      title: "Spracherkennung für Koran-Rezitation",
      body: "Für den Auswendiglern-Modus muss die App hören, ob ein Vers korrekt rezitiert wurde. Der naheliegende Weg, ein größeres Whisper-Modell, war der falsche. Der Hebel lag in der Methode: den erwarteten Vers als Prompt ins Modell konditionieren, persische und Urdu-Buchstabenvarianten vor dem Vergleich normalisieren, und milde bewerten statt binär. Ein auf Tarteel feingetuntes Base-Modell schlägt so das dreifach größere Large-Modell, bei einem Bruchteil der Latenz auf dem Gerät.",
    },
    highlights: [
      "Vier Zielgeräte aus einem Monorepo: Phone, Tablet, Android TV, Wear OS",
      "On-Device-LLM (GGUF/llama.cpp) mit eigenem RAG über kuratiertem Korpus, ohne Cloud-Call",
      "Whisper-basierte Rezitations-Erkennung mit vers-konditioniertem Prompting",
      "Vollständiger Mushaf-Reader: vier Schriftarten, Tafsir, Übersetzung, Wort-Zeitstempel",
      "15-teiliger deutscher Koran-Arabisch-Podcast, produziert über eine ElevenLabs-Zwei-Stimmen-Pipeline",
      "OTA-Updates über EAS Update: Inhaltskorrekturen ohne Store-Zyklus",
      "iOS Live Activities und Android-Widgets für die nächste Gebetszeit",
      "App und Store-Texte in 14 Sprachen gepflegt, über vier Geräteklassen",
      "KI-Antworten mit Quellenangabe und Kennzeichnung nach EU AI Act Art. 50",
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
      { value: "4", label: "Zielgeräte-Klassen" },
      { value: "14", label: "Sprachen" },
      { value: "100 %", label: "KI läuft auf dem Gerät" },
      { value: "1.062", label: "Commits" },
    ],
    links: [
      { label: "salati.pro", href: "https://www.salati.pro", kind: "live" },
      { label: "Instagram", href: "https://instagram.com/salatibox", kind: "social" },
      // Nachgeprüft am 01.08.2026: Der App-Store-Eintrag existiert unter
      // id6791867298 in Version 1.45.0. Auf Google Play gibt es unter dem
      // Paketnamen de.salatibox.de keinen oeffentlichen Eintrag, und eine
      // Suche nach "Salatibox" liefert nichts. Deshalb steht hier nur der
      // Store, der wirklich erreichbar ist. Sobald Android oeffentlich ist,
      // kommt die Zeile dazu und das Statuswort wieder auf beide Stores.
      {
        label: "App Store",
        href: "https://apps.apple.com/de/app/salati-gebetszeiten-koran/id6791867298",
        kind: "store",
      },
    ],
    architecture: "salati",
    shots: [
      {
        src: "/shots/salati/shot-prayer.png",
        alt: "Die Gebetszeiten-Ansicht: über der Liste ein Bild der Kaaba mit der aktuellen Uhrzeit und dem Countdown bis zum nächsten Gebet, darunter die fünf Zeiten des Tages mit hervorgehobenem nächsten Gebet und dem Hijri-Datum.",
        width: 720, height: 1600, label: "Gebetszeiten · lokal berechnet", variant: "phone",
      },
      {
        src: "/shots/salati/shot-quran.png",
        alt: "Der Koran-Reader auf dem Telefon: arabischer Vers groß gesetzt, darunter Umschrift und deutsche Übersetzung.",
        width: 720, height: 1600, label: "Mushaf-Reader · offline", variant: "phone",
      },
      {
        src: "/shots/salati/shot-ki.png",
        alt: "Die Fragen-Antwort-KI beantwortet eine Frage mit Quellenangabe und einem Hinweis, dass die Antwort KI-gestützt ist.",
        width: 720, height: 1600, label: "KI auf dem Gerät · mit Quelle", variant: "phone",
      },
      {
        src: "/shots/salati/shot-qibla.png",
        alt: "Der Qibla-Kompass zeigt die Gebetsrichtung mit Gradzahl und Entfernung nach Mekka.",
        width: 720, height: 1600, label: "Qibla · Sensor und Standort", variant: "phone",
      },
      {
        src: "/shots/salati/shot-study.png",
        alt: "Der Lernbereich mit Kursen und Fortschrittsanzeige je Lektion.",
        width: 720, height: 1477, label: "Lernbereich", variant: "phone",
      },
      {
        src: "/shots/salati/shot-tracker.png",
        alt: "Die Gebetsverfolgung: je Tag und Gebet ein Häkchen, darüber die Strähne aufeinanderfolgender Tage.",
        width: 720, height: 1600, label: "Verfolgung · Strähne", variant: "phone",
      },
      {
        src: "/shots/salati/tv-quran.png",
        alt: "Der Koran-Reader auf dem Fernseher: der arabische Vers groß gesetzt, darunter Umschrift und Übersetzung, unten die Hinweise für die Fernbedienung.",
        width: 1280, height: 720, label: "Android TV · Leanback", variant: "screen",
      },
      {
        src: "/shots/salati/tv-home.png",
        alt: "Die Startseite auf dem Fernseher mit den Kacheln für Gebetszeiten, Koran und Lernbereich, eine davon im Fokusrahmen.",
        width: 1280, height: 720, label: "Android TV · Fokus-Navigation", variant: "screen",
      },
    ],
  },
  {
    id: "menucloud",
    index: "02",
    name: "MenuCloud Berlin",
    tagline: "Multi-Tenant-SaaS für Gastronomie, inklusive gesetzlicher Fiskalisierung",
    year: "2025–2026",
    role: "Gründer & alleiniger Entwickler",
    status: "live",
    statusLabel: "Live in Produktion",
    accent: "violet",
    problem:
      "Berliner Restaurants zahlen 15–30 % Provision an Lieferplattformen und haben keine Kontrolle über ihre eigene Speisekarte. Die Alternativen sind entweder Baukästen ohne Kassenanbindung oder Enterprise-Systeme mit vierstelligen Einrichtungskosten. Beide lösen das Problem nicht, das jeder deutsche Gastronom tatsächlich hat: KassenSichV-Konformität.",
    solution:
      "Eine Plattform, die den kompletten Weg abdeckt: Restaurant-Website mit selbst editierbarer Karte, QR-Bestellung mit direkter Auszahlung über Stripe Connect, Reservierungen, Reputationsmanagement. Darunter liegt eine mandantenfähige Cloud-TSE, die jede Transaktion nach § 146a AO signiert und in einer Hash-Kette verankert. Dazu native Apps für Betreiber und Personal.",
    hardPart: {
      title: "Fiskalisierung als Mandanten-Problem",
      body: "Eine TSE ist nicht einfach ein API-Aufruf. Jeder Mandant braucht seine eigene, rechtlich zurechenbare Signatureinheit, jede Transaktion muss lückenlos in einer Hash-Kette hängen, und ein Ausfall darf niemals stillschweigend zu unsignierten Umsätzen führen. Für den Gastronomen wäre das eine Katastrophe bei der nächsten Betriebsprüfung. Die Lösung ist eine per-Tenant provisionierte Fiskaly-Cloud-TSE mit persistierter Kette in `tse_transactions` und einem fail-closed-Pfad: keine Signatur, keine Buchung.",
    },
    highlights: [
      "1.276 API-Routen über 812 versionierte Postgres-Migrationen",
      "Mandantenfähige Architektur mit Row Level Security pro Restaurant",
      "Stripe Connect Destination-Charge: Restaurants werden direkt ausgezahlt, die Plattformgebühr wird abgeführt",
      "KassenSichV § 146a AO: Fiskaly Cloud-TSE pro Mandant, Hash-Kette persistiert",
      "7.437 Testfälle (7.263 Unit, 174 End-to-End), die End-to-End-Tests gegen Produktion",
      "Speisekarten-Scanner: PDF oder Foto rein, strukturierte Karte in der Datenbank raus",
      "Self-hosted Mailstack (Mailcow) mit dreistufiger Fallback-Kette",
      "DSGVO Art. 30 Verzeichnis, AVV-Versand automatisiert bei Zahlungseingang",
      "iOS- und Android-Apps für Betreiber und Servicekräfte",
    ],
    /** Eigener Block, weil 63 Workflows keine Fußnote sind. */
    automation: {
      title: "63 Workflows, die den Betrieb tragen",
      lede: "Der Teil des Systems, der ohne mich weiterläuft. Alle Workflows sind versioniert und im Repository nachvollziehbar, nicht in einer Oberfläche zusammengeklickt und dann vergessen.",
      groups: [
        {
          title: "Kundenkontakt",
          items: [
            "Instagram-DM-Bot beantwortet Anfragen und qualifiziert Leads",
            "WhatsApp-Business-Bot für Bestell- und Supportfragen",
            "KI-Support-Agent mit Eskalation an den Menschen bei Unsicherheit",
            "Reputation-Manager: Google-Rezensionen je Mandant, KI-Antwortentwurf, Auto-Post",
          ],
        },
        {
          title: "Betrieb & Selbstheilung",
          items: [
            "Supervisor alle 5 Minuten, Watchdog alle 15, Workflow-Wächter stündlich",
            "Globaler Error-Handler, der jeden Fehlschlag einsammelt statt ihn zu verlieren",
            "Wöchentliches Backup, dazu stündliche Prüfung, ob es wiederherstellbar ist",
            "Selbstheilung immer mit Cooldown, Obergrenze und Slack-Meldung je Eingriff",
          ],
        },
        {
          title: "Geld & Recht",
          items: [
            "Fiskaly-Abgleich täglich, Mail-Polling alle 30 Minuten",
            "Rechnungs- und Ausgabenverwaltung, Monatsabschluss vorbereitet",
            "Bounce-Handler für beide Mailwege getrennt",
            "Legal-Watcher: täglicher Abgleich rechtlicher Pflichtangaben",
          ],
        },
        {
          title: "Marketing",
          items: [
            "Täglicher LinkedIn-Post, wöchentlicher Blog-Artikel",
            "TikTok-Crossposting, tägliche Social-Analytics-Auswertung",
            "Lead-Scraper mit anschließender E-Mail-Ermittlung",
            "Abend-Briefing und wöchentlicher Marketing-Digest nach Slack",
          ],
        },
      ],
    },
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
      { value: "7.437", label: "Testfälle" },
      { value: "EU", label: "Hosting & Datenhaltung" },
      // TODO(domenic): Kunden / MRR / GMV / Uptime, siehe USER-TODO A3.
    ],
    links: [
      { label: "menucloud-berlin.de", href: "https://menucloud-berlin.de", kind: "live" },
      { label: "Status-Page", href: "https://menucloud-berlin.de/status", kind: "live" },
      { label: "Instagram", href: "https://instagram.com/menucloudberlin", kind: "social" },
      { label: "YouTube", href: "https://youtube.com/@menucloudberlin", kind: "social" },
      // Beide Apps am 01.08.2026 in beiden Stores nachgeprüft. Sie standen
      // bisher nirgends auf der Seite, obwohl sie der greifbarste Beleg sind:
      // Ein Recruiter kann sie in dreissig Sekunden selbst oeffnen.
      {
        label: "Restaurant-App (Play)",
        href: "https://play.google.com/store/apps/details?id=de.menucloudberlin.app",
        kind: "store",
      },
      {
        label: "Discovery (Play)",
        href: "https://play.google.com/store/apps/details?id=de.menucloudberlin.discovery",
        kind: "store",
      },
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
      {
        // Store-Aufnahme aus dem Projekt selbst, die Fallstudie nennt die
        // Apps, zeigte sie aber vorher nicht.
        src: "/shots/menucloud-app.png",
        alt: "Restaurantseite in der MenuCloud-App auf dem iPhone: Speisekarte, Reservierung, Öffnungszeiten und Beschreibung eines Berliner Restaurants.",
        width: 1242,
        height: 2688,
        variant: "phone",
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
      "Auf eine Berliner Wohnung kommen dreistellige Bewerberzahlen. Entscheidend ist nicht die beste Bewerbung, sondern die erste, und zwar innerhalb von Minuten nach Inseratsschaltung. Das ist ein Wettlauf, den ein Mensch strukturell nicht gewinnen kann, weil er schläft.",
    solution:
      "Ein lokal laufender Agent, der rund um die Uhr fünf Portale scannt, jedes neue Inserat gegen die eigenen Kriterien prüft, zweifelhafte Fälle per LLM im Volltext bewertet und ein individuelles Anschreiben erzeugt. Standardmäßig im REVIEW-Modus: die App versendet nichts ohne Freigabe, bis man sie bewusst auf Automatik stellt.",
    hardPart: {
      title: "Ein Agent, der nicht ungefragt handelt",
      body: "Der Reiz eines solchen Systems ist auch sein Risiko: ein Bot, der selbstständig Bewerbungen mit deinen echten Personendaten verschickt, kann realen Schaden anrichten. Deshalb ist der Auslieferungszustand REVIEW: Vorschlag statt Versand. Der Automatikmodus existiert, ist aber eine bewusste Entscheidung des Nutzers, nicht die Voreinstellung. Dieselbe Logik steckt in den Watchdogs meiner anderen Projekte: Selbstheilung immer mit Cooldown, Obergrenze und sichtbarem Alarm bei jedem Eingriff.",
    },
    highlights: [
      "Playwright mit persistenten Chrome-Profilen je Portal: echte Sessions statt brüchiger Scraper",
      "LLM-Volltextprüfung mit regelbasiertem Fallback, wenn kein Key hinterlegt ist",
      "Lokale SQLite-Datenhaltung, Server bindet standardmäßig nur auf 127.0.0.1",
      "REVIEW-Modus als Auslieferungszustand: kein Versand ohne menschliche Freigabe",
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
      { value: "2", label: "Bewertungsstufen vor dem Versand" },
    ],
    links: [],
    architecture: "wohnungsjaeger",
    keinScreenshot:
      "Von diesem Projekt gibt es hier bewusst kein Bild. Das Dashboard zeigt echte Inserate, echte Adressen und meine vollständigen Bewerbungsunterlagen. Einen Screenshot mit ausgedachten Daten nachzustellen wäre die naheliegende Lösung. Aber dann stünde auf einer Seite, die mit Nachprüfbarkeit argumentiert, ein erfundenes Bild. Die Architektur daneben ist echt.",
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
      "Eine Plattform aus Web-App, Expo-App und Fastify-API auf einem gemeinsamen Katalog von fast 12.000 Rezepten, mit Makro-Tracking, Wochenplanung, Einkaufslisten, Vorratsverwaltung und Trainingsplänen. Und mit einer API, die drei Zustände sauber unterscheidet, statt sie zu verschleiern.",
    hardPart: {
      title: "Fehler ehrlich melden",
      body: "Jeder schreibende Endpunkt unterscheidet explizit: Secrets fehlen (Dry-Run, kein Datenverlust vorgetäuscht), Datenbank nicht erreichbar (503), Datenbank erreichbar aber lehnt ab (echter 4xx mit Postgres-Fehlercode). Das klingt nach Kleinkram, ist aber der Unterschied zwischen einem System, dem man beim Debuggen glauben kann, und einem, das lügt. Genau dieselbe Disziplin wende ich auf KI-Output an: eine Behauptung ohne Beleg zählt nicht.",
    },
    highlights: [
      "Monorepo mit geteiltem Katalog über Web, Mobile und API hinweg",
      "59 Tabellen über 12 versionierte Migrationen, Row Level Security aktiv",
      "Supabase-Auth mit geräteübergreifender Profilsynchronisation",
      "Nutzung ohne Account bleibt vollständig lokal, kein Login-Zwang",
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
      { label: "nouri-fitness.vercel.app", href: "https://nouri-fitness.vercel.app", kind: "live" },
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
  lede: "Ich arbeite seit über einem Jahr agentengestützt. Das komprimiert Lieferzeiten von Monaten auf Tage, aber nur, weil um die Agenten herum ein System steht, das ihre Fehler abfängt. Ohne dieses System ist KI-gestützte Entwicklung eine Maschine zur Erzeugung von plausibel aussehendem Schrott.",
  principles: [
    {
      n: "01",
      title: "Kontext als versionierter Code",
      body: "Jedes Projekt trägt seine Konventionen als Datei im Repo: Import-Regeln, Test-Muster, Design-Tokens, Sicherheits-Defaults. Dazu ein persistentes Gedächtnis über Sessions hinweg: Jede gelernte Lektion wird ein Eintrag mit Begründung, nicht eine Notiz in einem Chatverlauf, der morgen weg ist. Ein Agent ist nur so gut wie der Kontext, den er zuverlässig vorfindet.",
      artifacts: ["CLAUDE.md pro Repo", "Persistentes Memory", "Append-only Projektlog"],
    },
    {
      n: "02",
      title: "Parallelisierung statt Wartezeit",
      body: "Lange Läufe wie Builds, Testsuites und Store-Uploads laufen im Hintergrund, während ich weiterarbeite. Unabhängige Recherchen gehen an spezialisierte Sub-Agenten mit eigenem Kontextfenster. Der Engpass bei agentengestützter Entwicklung ist selten das Modell, sondern die serialisierte Arbeitsweise davor.",
      artifacts: ["Sub-Agenten", "Hintergrund-Tasks", "Turborepo-Caching"],
    },
    {
      n: "03",
      title: "Verifikation statt Vertrauen",
      body: "„Sollte jetzt funktionieren“ ist kein Ergebnis. Jede Behauptung über den Systemzustand braucht einen Beleg: HTTP-Response, DB-Query, Playwright-Screenshot, empfangene E-Mail, echte Cron-Execution. Diese Regel hat in meinen eigenen Projekten mehrfach Bugs aufgedeckt, die durch grüne Test-Suites gerutscht waren, weil die Tests das Falsche geprüft haben.",
      artifacts: ["Playwright gegen Produktion", "Screenshot-Diffs", "Live-DB-Verifikation"],
    },
    {
      n: "04",
      title: "Wiederkehrende Fixes werden Automatisierung",
      body: "Wenn ich denselben Handgriff zum dritten Mal mache, wird er ein Workflow. Cron-bewusste Watchdogs überwachen Dienste, heilen bekannte Ausfälle selbst und melden nach Slack. Immer mit Schutzgeländer: Cooldown, Obergrenze, Alarm bei jedem Eingriff. Ein Watchdog, der blind repariert, richtet mehr Schaden an als er verhindert.",
      artifacts: ["n8n-Workflows mit Self-Healing", "Cooldown und Obergrenze", "Slack-Ops-Alerts"],
    },
    {
      n: "05",
      title: "Recht als Definition of Done",
      body: "Jedes kundenwirksame Feature durchläuft dasselbe Gate: DSGVO-Rechtsgrundlage vorhanden? UWG § 7 bei Outreach beachtet? EU AI Act Art. 50: Ist die KI als solche gekennzeichnet? Wird auf der Website etwas versprochen, das wir nicht liefern? Bei Consumer-Produkten in der EU ist das kein Beiwerk, sondern Teil des Produkts.",
      artifacts: ["DSGVO Art. 30", "AVV automatisiert", "AI-Act-Disclosure"],
    },
  ],
  /**
   * Das Terminal spielt diese Zeilen ab.
   *
   * Keine erfundene Sitzung: Das ist ein echter Fehler aus dem Salati-Repo,
   * nachgezeichnet. Die Ursache, die Datei und die Änderung stehen so im
   * Commit bce08f5e vom 23.07.2026. Vorher stand hier ein ausgedachter Ablauf
   * mit ausgedachten Zahlen. Auf einer Seite, deren Kernaussage „jede Angabe
   * ist belegbar“ lautet, war das die falscheste Stelle für Erfundenes.
   */
  demo: {
    label: "Ein echter Fehler, nachgezeichnet:",
    lines: [
      { kind: "prompt", text: "Widget zeigt auf dem Telefon veraltete Gebetszeiten" },
      { kind: "think", text: "Tests grün, Typecheck grün, im Emulator nicht reproduzierbar" },
      { kind: "run", text: "Headless-Task instrumentiert: WIDGET_UPDATE feuert, findet keinen Handler" },
      { kind: "warn", text: "registerWidgetTaskHandler läuft nie" },
      { kind: "think", text: "Android lädt index.js statt index.android.js" },
      { kind: "think", text: "Metro löst \"main\" nicht plattformspezifisch auf, wenn die Endung dabeisteht" },
      { kind: "run", text: "package.json: \"main\": \"index.js\" wird zu \"index\"" },
      { kind: "ok", text: "Widget aktualisiert im Hintergrund · Commit bce08f5e" },
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
  /** Kein Level mehr: eine Zahl, die niemand prüfen kann, trägt nichts.
   *  Der Beleg ist die Aussage. */
  skills: { name: string; evidence: string }[];
};

export const skillDomains: SkillDomain[] = [
  {
    id: "frontend",
    title: "Frontend & Produkt",
    summary:
      "Interfaces, die auf einem Fünf-Jahre-alten Android genauso funktionieren wie auf einem Studio-Display.",
    skills: [
      { name: "React / Next.js App Router", evidence: "Next.js 16 RSC in Produktion" },
      { name: "React Native / Expo", evidence: "Expo SDK 57, RN 0.86, vier Gerätetypen" },
      { name: "TypeScript", evidence: "Strict überall, 0 Fehler als Merge-Gate" },
      { name: "Motion & Interaction", evidence: "Reanimated 4, Framer Motion" },
      { name: "Core Web Vitals", evidence: "LCP/CLS/INP-Budgets im CI" },
      { name: "Barrierefreiheit", evidence: "TV-Fokus-Navigation, Reduced-Motion" },
    ],
  },
  {
    id: "backend",
    title: "Backend & Daten",
    summary:
      "Mandantenfähige Systeme mit echtem Geld, echten Steuern und echten Konsequenzen bei Fehlern.",
    skills: [
      { name: "Postgres / Supabase", evidence: "59-Tabellen-Schema, RLS, Migrationen" },
      { name: "API-Design", evidence: "Fastify, Route Handlers, Zod-Validierung" },
      { name: "Zahlungen", evidence: "Stripe Connect Destination-Charge" },
      { name: "Multi-Tenancy", evidence: "RLS + per-Tenant-Provisionierung" },
      { name: "E-Mail-Infrastruktur", evidence: "Self-hosted Mailcow + Fallback-Kette" },
      { name: "Compliance-Systeme", evidence: "KassenSichV-TSE, DSGVO Art. 30" },
    ],
  },
  {
    id: "cloud",
    title: "Cloud, Delivery & Betrieb",
    summary: "Ich betreibe, was ich baue, inklusive der Nachtschicht, wenn etwas ausfällt.",
    skills: [
      { name: "Vercel / Edge", evidence: "Statische Exports, Rewrites, ISR" },
      { name: "Docker / Coolify / Hetzner", evidence: "Eigener VPS-Stack in Produktion" },
      { name: "CI/CD", evidence: "GitHub Actions, Turborepo, EAS Build" },
      { name: "Store-Auslieferung", evidence: "App Store & Play, inkl. OTA-Updates" },
      { name: "Observability", evidence: "Sentry, Uptime-Kuma, Slack-Alerts" },
      { name: "Automatisierung", evidence: "n8n-Workflows mit Self-Healing" },
    ],
  },
  {
    id: "ai",
    title: "KI-Integration",
    summary:
      "Von der Agenten-Pipeline in meinem Editor bis zum quantisierten Modell auf dem Telefon des Nutzers.",
    skills: [
      { name: "Agenten-Orchestrierung", evidence: "Sub-Agenten, Tool-Pipelines, Loops" },
      { name: "On-Device-Inferenz", evidence: "llama.cpp/GGUF, whisper.rn" },
      { name: "RAG & Retrieval", evidence: "Eigener Korpus, Granularität gemessen" },
      { name: "Prompt-Engineering", evidence: "Vers-Konditionierung schlägt Modellgröße" },
      { name: "Evaluation", evidence: "Lokale Iteration gegen dieselbe GGUF" },
      { name: "KI-Recht (EU AI Act)", evidence: "Kennzeichnung nach Art. 50 als Gate" },
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
    // Der Anriss darüber verspricht "was ich suche". Ohne diese Zeile blieb
    // das Versprechen offen: Rolle und Modell sagen, was ich bin, nicht was
    // ich will.
    {
      label: "Suche",
      value: "Remote-Produktteam, in dem eine Person ein Feature bis in Produktion besitzt",
    },
    { label: "Standort", value: "Berlin · Remote EU" },
    // "Nach Absprache" beantwortet die erste Frage jedes Recruiters nicht.
    // Diese Fassung schon: reden sofort, anfangen nach der Frist.
    { label: "Verfügbar", value: "Gespräche jederzeit · Eintritt nach Kündigungsfrist" },
    { label: "Sprachen", value: "Deutsch (Muttersprache) · Englisch" },
    { label: "Modell", value: "Festanstellung, keine Freiberuflichkeit" },
    // Pre-empts the "where's the code?" question and answers it as a decision
    // rather than a gap, see USER-TODO block D.
    { label: "Quellcode", value: "Open Source auf GitHub · Produktivrepos auf Anfrage" },
  ],
  strengths: [
    {
      title: "Ich liefere fertig, nicht fast fertig",
      body: "Vier Systeme in Produktion, inklusive Store-Reviews, Zahlungsabwicklung, DSGVO-Dokumentation und Impressum. Der Teil, den die meisten Portfolios auslassen, ist genau der Teil, der am längsten dauert.",
    },
    {
      title: "Ich arbeite über den ganzen Stack",
      body: "React-Native-Widget, Postgres-Migration, Docker-Compose auf dem eigenen VPS, Fiskal-Compliance. Kein Ticket-Ping-Pong, weil etwas „nicht mein Bereich“ ist.",
    },
    {
      title: "Belegpflicht statt Bauchgefühl",
      body: "Ein grüner Testlauf beweist nichts. Das habe ich zweimal teuer gelernt. Deshalb wird jede Änderung am Live-System nachgewiesen, bevor sie als fertig gilt. Genau das macht agentengestützte Entwicklung erst belastbar.",
    },
    {
      title: "Ich kenne den Weg durch die Stores",
      body: "63 ausgelieferte Versionen über App Store und Play Store, 14 Sprachen, vier Geräteklassen vom Telefon bis zum Fernseher. Abgelehnte Reviews, Alterseinstufungen, Datenschutzformulare und Signierketten sind für mich Alltag, nicht Neuland.",
    },
    {
      title: "Regulierung behandle ich als Teil des Produkts",
      body: "Fiskalanforderungen nach § 146a AO, Auftragsverarbeitung nach DSGVO, Hinweispflichten für KI-Funktionen. Das kenne ich aus der Umsetzung mit Kunden, nicht aus einer Zusammenfassung. Wer das erst nach dem Launch anfasst, baut es zweimal.",
    },
    {
      title: "Ich arbeite mit Agenten, ohne die Kontrolle abzugeben",
      body: "Der Hebel ist nicht Tippgeschwindigkeit, sondern Kontext, festgeschriebene Konventionen und Prüfschleifen, die ein Modell nicht überreden kann. Ich lasse mir Entwürfe schreiben. Die Architektur, die Grenzen und die Freigabe bleiben bei mir.",
    },
  ],
  cta: {
    pdf: { label: "Kurzprofil als PDF", href: "/domenic-moran-kurzprofil.pdf" },
    mail: { label: "Direkt schreiben" },
  },
} as const;

/* ========================================================================== */
/* Contact                                                                    */
/* ========================================================================== */

export const contact = {
  eyebrow: "Kontakt",
  title: "Lass uns etwas bauen",
  lede: "Ob konkrete Rolle, Rückfrage zu einem der Projekte oder einfach eine technische Frage: Ich antworte innerhalb von 24 Stunden.",
  hinweis:
    "Bewusst kein Formular: Das bräuchte einen Mailversand-Dienst als Drittanbieter und einen Endpunkt, der ausfallen kann. Eine Mailadresse kann beides nicht. Und du behältst deine Nachricht im eigenen Postausgang.",
  checkliste: {
    titel: "Das hilft mir in der ersten Mail",
    punkte: [
      "Worum es geht: Rolle, Projekt oder Frage",
      "Was ihr baut und womit",
      "Wie schnell es losgehen soll",
      "Bei Rollen: Gehaltsrahmen, damit wir beide Zeit sparen",
    ],
  },
  fakten: [
    { label: "Antwortzeit", wert: "In der Regel unter 24 Stunden" },
    { label: "Sprachen", wert: "Deutsch · Englisch" },
    { label: "Standort", wert: "Berlin · Remote EU" },
  ],
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
