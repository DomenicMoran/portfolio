import { datumLang } from "@/lib/date-format";
import verified from "./verified.json";
import { SALATI_VERSIONEN } from "./salati";
import type { CaseStudy } from "./types";
import {
  alsWort,
  grossErstes,
  jahreZwischen,
  monateZwischen,
} from "@/lib/duration";

/**
 * Wie lange die acht Systeme in Produktion entstehen, gerechnet, nicht getippt.
 *
 * Im Vorspann stand "in vier Monaten". Am Tag des Schreibens exakt richtig,
 * ab dem 26. des übernächsten Monats zu wenig, und niemand merkt es: Die
 * Angabe wird nicht falsch, sie wird stillschweigend bescheiden. Dieselbe
 * Sorte wandernder Angabe wie "3.971 Commits in 4 Monaten" und "107 Tage bis
 * heute", beide bereits abgeschafft.
 *
 * Gerechnet ab dem ersten MenuCloud-Commit bis zum Prüfdatum aus
 * `verified.json`. Der Stempel wandert täglich mit dem Automaten, ein
 * `new Date()` hier fröre dagegen auf den Bauzeitpunkt ein.
 */
const ERSTER_COMMIT = "2026-03-26";
/* Die Kurszertifikate sind von Juli 2022; seitdem läuft der autodidaktische
   Weg weiter. „Vier Jahre" war beim Schreiben richtig und wäre 2027 zu wenig. */
const LERNBEGINN = "2022-07-01";

const monate = monateZwischen(new Date(ERSTER_COMMIT), new Date(verified.date));

/** "vier Monaten", "fünf Monaten", …, nie ein eingefrorener Wert. */
const bauzeit = `${alsWort(monate)} Monat${monate === 1 ? "" : "en"}`;

const bauzeitNominativ = grossErstes(
  `${alsWort(monate, "nominativ")} Monat${monate === 1 ? "" : "e"}`,
);

/** Wie lange der Lernweg dauert, ebenfalls gerechnet. */
const lernzeit = grossErstes(
  `${alsWort(jahreZwischen(new Date(LERNBEGINN), new Date(verified.date)), "nominativ")} Jahre`,
);
/**
 * Die eine Quelle für jeden Text und jede Zahl dieser Seite.
 *
 * Alles mit `TODO(domenic)` ist ein Wert, den nur der Inhaber liefern kann.
 * Eine Sammelliste dafür gibt es nicht mehr, siehe AGENTS.md. Die Komponenten sind so gebaut,
 * dass ein fehlender Wert, leer oder null, das Element entfernt, statt einen
 * Platzhalter zu rendern: Eine offene Frage darf auf einer Seite, deren ganzer
 * Zweck Glaubwürdigkeit ist, nie als sichtbares „Lorem ipsum" enden.
 */

export const site = {
  url: "https://domenicmoran.de",
  name: "Domenic Moran",
  role: "AI Product Engineer",
  location: "Berlin, Deutschland",
  // Steht auf der Social-Vorschaukarte, nicht auf der Seite.
  ogTagline:
    "Acht Systeme in Produktion: Mobile, SaaS, Lernplattform, Infrastruktur, Compliance. Alle allein gebaut.",
  locale: "de-DE",

  email: "kontakt@domenicmoran.de",
  mailSubject: "Anfrage über domenicmoran.de",
  // Kein Telefon in dieser Datei, und keine Anschrift: Was hier steht, landet
  // auf der Seite, in llms.txt, in humans.txt und auf den Vorschaukarten. Die
  // Telefonnummer steht im Lebenslauf unter docs/, also außerhalb des Repos;
  // die ladungsfähige Anschrift gehört auf genau zwei Seiten und steht dort,
  // wo sie hingehört: in `app/(de)/(legal)/provider.ts`.

  // Als einfache Zeichenketten getippt, nicht als Literale: Die Komponenten
  // verzweigen danach, ob hier etwas steht, und `as const` würde "" so eng
  // machen, dass der gefüllte Zweig unerreichbar wird.
  socials: {
    github: "https://github.com/DomenicMoran" as string,
    linkedin: "https://www.linkedin.com/in/domenicmoran" as string,
  },

  availability: {
    open: true,
    label: "Offen für eine Festanstellung",
    // Die drei Angaben, nach denen ein Recruiter vor dem Anruf sucht: wo, ab
    // wann, in welcher Sprache. `detail` stand hier schon mit dem Hinweis, es
    // beantworte "wo und ab wann", es beantwortete nur das Wo, und auf dem
    // Kurzprofil fehlten Eintritt und Sprachen ganz. Beide standen bis dahin
    // ausschließlich im Faktenblatt der Startseite, das nicht mitgedruckt
    // wird und niemanden erreicht, der nur das Blatt bekommt.
    detail: "Berlin · remote in der EU · hybrid",
    /* „innerhalb von" und nicht „nach bis zu": Die englische Fassung sagt seit
       jeher „start within three months", die deutsche las sich als frühestens.
       Dieselbe Auskunft, zwei Richtungen, und die deutsche war die, die ein
       Personalbereich als Verzögerung liest. */
    entry: "Gespräche jederzeit · Eintritt innerhalb von drei Monaten",
    languages: "Deutsch (Muttersprache) · Englisch",
    /* Dieselbe Spanne wie in der Faktenkachel, hier als einzige Quelle.

       Sie stand nur auf der Seite. Das Kurzprofil ist aber das Blatt, das
       weitergereicht wird, und es nennt Rolle, Ort, Eintritt und Sprachen,
       also alles außer der Zahl, nach der als nächstes gefragt wird. Wer nur
       das Blatt bekommt, müsste danach zurückfragen; genau das soll es
       ersparen. Neu veröffentlicht wird damit nichts, die Spanne steht
       ohnehin öffentlich im Recruiter-Bereich. */
    salary: "55 – 70 k€, je nach Zuschnitt der Rolle",
  },

  meta: {
    title: "Domenic Moran – AI Product Engineer",
    description:
      "Acht Systeme in Produktion, alle allein gebaut: Apps in beiden Stores, eine Multi-Tenant-SaaS mit gesetzlicher Fiskalisierung, eine Lernplattform, ein autonomer Agent.",
  },
} as const;

/* ========================================================================== */
/* About: die Story, die dieses Profil von jedem anderen unterscheidet         */
/* ========================================================================== */

export const about = {
  eyebrow: "Wer ich bin",
  /**
   * Eine echte Aufnahme, kein erzeugtes Bild.
   *
   * Auf einer Seite, die mit Belegbarkeit argumentiert, wäre ein erfundenes
   * Porträt der eine Fehler, der alles andere infrage stellt. Solange keine
   * Aufnahme vorlag, blieb dieses Feld leer und das Bildelement entfiel, die
   * Sektion sah dadurch vollständig aus statt lückenhaft.
   *
   * Die Datei ist quadratisch, weil dieselbe Aufnahme auch als Profilbild auf
   * LinkedIn und GitHub steht und dort im Kreis beschnitten wird.
   */
  portrait: "/portrait-dark.jpg" as string,
  /* Fuer den One-Pager, der auf Papier geht. */
  portraitPrint: "/portrait.jpg" as string,
  title: `${lernzeit} gelernt. ${bauzeitNominativ} ausgeliefert.`,
  paragraphs: [
    `Softwareentwicklung habe ich mir ab 2022 selbst beigebracht: erst über strukturierte Kurse von Meta und Udemy, dann über eigene Projekte. Kein Informatikstudium, kein Bootcamp. 2026 ist daraus Ernst geworden: acht Produktionssysteme in ${bauzeit}, fünf Apps im Play Store und drei davon auch im App Store, drei weitere liegen dort in der Prüfung, eines der Systeme trägt gesetzlich vorgeschriebene Fiskalisierung. Alles neben einem Vollzeitjob entstanden.`,
    "Was ich dabei gelernt habe und was heute meine Arbeitsweise bestimmt: Ein grüner Testlauf beweist nichts. Ich hatte ein Android-Widget, bei dem alle Tests durchliefen und das auf dem echten Gerät leer blieb. Und ich habe monatelang geglaubt, meine Update-Auslieferung funktioniere, weil das Werkzeug nach jedem Veröffentlichen „Published“ meldete. Angekommen ist bei keinem Nutzer je etwas.",
    "Seitdem gilt in jedem meiner Repositories dieselbe Regel: „Sollte jetzt funktionieren“ ist kein Ergebnis. Jede Änderung wird am Live-System nachgewiesen: durch HTTP-Response, Datenbankabfrage oder Screenshot vom echten Gerät. Das ist der Grund, warum ich mit KI-Agenten schnell liefern kann, ohne dass Qualität zur Behauptung wird.",
  ],
  // Am 31.07.2026 gegen `git log` und die Repositories geprüft.
  stats: [
    {
      value: verified.commitsHead,
      label: "Commits seit März 2026",
      note: "neben einem Vollzeitjob",
    },
    { value: "8", label: "Systeme in Produktion", note: "alle allein gebaut" },
    { value: "8", label: "Store-Einträge live", note: "5 Play, 3 App Store" },
    {
      value: "2022",
      label: "Autodidakt seit",
      note: "Meta- & Udemy-Zertifikate",
    },
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
  statsHinweis: `Gemessen am ${datumLang(verified.date)} über die GitHub-API, mit git rev-list --count über alle ${verified.repos} Repositories: die sechs Monorepos hinter MenuCloud, Salati, NOURI, BitDojo, Dartile und LexiPulse, diese Webseite und die vier veröffentlichten Pakete. Gezählt wird der Hauptzweig, und nur, was auch bei GitHub liegt. Lokale Stände zählen nicht mit. Ein Automat frischt die Zahl täglich auf; der Stand wächst weiter, abweichende Werte sind daher höher, nicht niedriger.`,
  timeline: [
    {
      period: "seit 04/2026",
      title: "Gründer & alleiniger Entwickler",
      org: "MenuCloud, Inh. Domenic Moran, Berlin",
      body: "Aufbau und Betrieb von acht Produktionssystemen als alleiniger Entwickler: Produkt, Architektur, Auslieferung, Betrieb und Recht in einer Hand.",
      current: true,
    },
    {
      period: "seit 2022",
      title: "Softwareentwicklung, autodidaktisch",
      org: "Meta (Coursera) · Udemy · eigene Projekte",
      body: "Kein Informatikstudium, kein Bootcamp. Der Nachweis sind acht Systeme in Produktion und eine prüfbare Git-Historie.",
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
        meta: "Claude Code · 4 Skills · 16 Tests · null Abhängigkeiten",
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
        name: "darts-checkout",
        href: "https://github.com/DomenicMoran/darts-checkout",
        body: "Die Checkout-Tafel aus Dartile. Auf 40 gibt es über achtzig richtige Wege und genau einen, den jemand wirft. Entstanden ist das Paket an einem Fehler: Achtzehn Reste liefen über das Bull, obwohl ein gleich langer Weg daran vorbeiführte, und der Test sah nur auf den Schlusspfeil.",
        meta: "TypeScript · 25 Tests · null Abhängigkeiten",
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
    noteHref: {
      label: "Alle zehn zusätzlich als PDF",
      href: "https://github.com/DomenicMoran/certificates",
    },
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
  // Wort für Wort gerendert; `accent` schaltet auf die Serifenschrift um.
  headline: [
    { text: "Ich" },
    { text: "liefere" },
    { text: "fertige", accent: true },
    { text: "Produkte," },
    { text: "keine" },
    { text: "Prototypen.", accent: true },
  ] as { text: string; accent?: boolean }[],
  // Dieselbe Berufsbezeichnung wie überall sonst.
  //
  // Hier stand "Fullstack Product Engineer", während Titel, Kopfleiste,
  // Lebenslauf und das GitHub-Profil "AI Product Engineer" sagen. Auf dem
  // ersten Bildschirm standen damit zwei Berufsbezeichnungen für dieselbe
  // Person, das erste, woran ein Leser zweifelt. Die Breite belegt der Satz
  // ohnehin selbst, mit der Migration und dem Impressum in einer Aufzählung.
  lede: `AI Product Engineer aus Berlin. Acht Systeme in Produktion, in ${bauzeit} neben einem Vollzeitjob entstanden: Apps in beiden Stores, eine Multi-Tenant-SaaS mit gesetzlich vorgeschriebener Fiskalisierung, eine Lernplattform mit Prüfung und Zertifikat, ein autonomer Agent. Alles selbst gebaut, von der Migration bis zum Impressum.`,
  ctaPrimary: { label: "Projekte ansehen", href: "#work" },
  ctaSecondary: { label: "Für Recruiter", href: "#hire" },
  tryIt: {
    before:
      "Drei der acht Systeme in Produktion rechnen hier im Browser mit:",
    label: "Gebetszeiten, Tagesbilanz und Checkout-Tafel ausprobieren",
    href: "#case-salati",
    after: "ohne eine Anfrage nach außen.",
  },
  // Jede Zahl am 31.07.2026 gegen `git log` und die Repositories geprüft.
  // Commit-Stände wachsen weiter, deshalb steht das Prüfdatum sichtbar in der
  // Über-mich-Sektion, statt hier eine Zahl zu führen, die morgen stillschweigend
  // falsch wäre.
  proof: [
    { value: "8", label: "Systeme in Produktion" },
    { value: verified.commitsHead, label: "Commits seit März 2026" },
    { value: verified.apiRouten, label: "API-Routen (MenuCloud)" },
    { value: "7.800+", label: "Testfälle (MenuCloud)" },
  ],
} as const;

/* ========================================================================== */
/* Case studies                                                               */
/* ========================================================================== */

/*
   `CaseStudy` kam aus `types.ts` und stand hier ein zweites Mal.

   Zwei Erklärungen für dieselbe Sache: Die hiesige trug zusätzlich ein Feld
   `status` mit den Werten "live", "beta" und "tool", gesetzt an allen vier
   Fallstudien, gelesen an keiner Stelle. Gerendert wird `statusLabel`. Der
   Preis der Doppelung war sichtbar: Ein Feld, das in der einen Erklärung
   ergänzt wird, fehlt in der anderen, und der Typecheck meldet es erst beim
   nächsten Zugriff. Genau das ist beim Verweisfeld `articles` passiert.
*/

export const caseStudies: CaseStudy[] = [
  {
    id: "mfc",
    index: "00",
    name: "Moran Fleet Control",
    tagline:
      "Die eine Anwendung für den Builder-Alltag: LLM-Chat, Agenten, Werkzeuge, Backlog – lokal, ohne Abo",
    year: "2026",
    role: "Alleiniger Entwickler · Produkt, Code, Verkauf, Recht",
    statusLabel: "Live mit Kaufknopf",
    accent: "acid",
    problem:
      "Der Arbeitsalltag eines Builders ist auf zehn Werkzeuge verteilt: Terminal für Agenten, Tabs für Modelle, Tabellen für Backlog, Ordner für Projekte. Jeder Wechsel kostet Kontext, und jede Cloud-Schicht, die mitfährt, kostet Vertrauen und Geld.",
    solution:
      "Eine Desktop-Anwendung (Windows, macOS, Linux) plus Web-Fassung: Multi-LLM-Router mit sechs Anbietern, Agenten über die lokale Claude-CLI – Berechtigungen, MCP, Skills und Memory werden unverändert übernommen –, elf Micro-SaaS-Werkzeuge, Projektbrowser mit Git-Status, Backlog aller Projekte, Marketing-Pipeline mit harten Rate-Limits und ein Vault, der AES-256-verschlüsselt im OS-Keyring liegt. 49,99 Euro einmalig, kein Abo.",
    hardPart: {
      title: "Claude Code übernehmen, ohne es zu duplizieren",
      body: "Wer vom Terminal wechselt, will nichts neu einrichten. Statt Berechtigungen, MCP-Server und Skills nachzubauen, startet MFC die lokale Claude-CLI als Agenten-Backend – die bestehende Einrichtung gilt unverändert weiter. Der Stream aus 204 Ereignissen je Sitzung wird in der Oberfläche gerendert, mit Abbruch und Live-Protokoll. Was ohne Schlüssel nicht geht, sagt die Oberfläche ehrlich – Simulationen sind als solche markiert.",
    },
    highlights: [
      "Claude-Code-Übernahme: Berechtigungen, MCP, Skills und Memory werden gelesen und unverändert genutzt",
      "Chat mit Modellwahl je Nachricht, Streaming, Verlauf und Kostenprotokoll auf dem Gerät",
      "Elf Micro-SaaS-Module, acht laufen direkt im Browser, drei über Server oder Desktop",
      "Supervisor-Loop: Anthropic plant und prüft, DeepSeek führt aus, hart begrenzt auf drei Runden",
      "Mobil-Begleit-App (Android/iOS) mit Kopplung per Code und Geheimnis über ein eigenes Relay",
      "Clean-Room-Distribution: keine Founder-Daten im Paket, Setup-Wizard, Zero-Personal-Data-Scanner",
      "Windows-Installer und Linux-Bundles lokal gebaut, Web live unter mfc.domenicmoran.de",
    ],
    stack: [
      {
        group: "Desktop",
        items: [
          "Tauri 1 (Rust)",
          "Next.js 14",
          "WebView2 / WebKitGTK",
          "TypeScript",
        ],
      },
      {
        group: "Agenten & LLM",
        items: [
          "Claude-CLI als Agenten-Backend",
          "Anthropic / DeepSeek / OpenAI / Gemini",
          "Ollama / LM Studio lokal",
          "SSE-Streaming",
        ],
      },
    ],
    metrics: [
      { value: "6", label: "LLM-Anbieter" },
      { value: "11", label: "Micro-SaaS-Module" },
      { value: "49,99 €", label: "Lifetime, kein Abo" },
      { value: "3", label: "Desktop-Plattformen" },
    ],
    links: [
      { label: "mfc.domenicmoran.de", href: "https://mfc.domenicmoran.de", kind: "live" },
      { label: "Quellcode", href: "https://github.com/DomenicMoran/mfc", kind: "code" },
    ],
    architecture: "",
    shots: [
      {
        src: "/shots/mfc/dashboard.webp",
        alt: "Das MFC-Dashboard: dunkle Oberfläche mit Seitenleiste, Statuskarten für Core, Router-Anbieter, Module und Backlog, darunter die Systemkacheln.",
        width: 1280,
        height: 800,
        label: "Dashboard · live",
      },
    ],
  },
  {
    id: "salati",
    index: "01",
    name: "Salati",
    tagline:
      "Gebets- und Koran-App für den DACH-Raum mit KI, die offline läuft",
    year: "2026",
    role: "Alleiniger Entwickler · Produkt, Code, Stores, Recht",
    statusLabel: "Live in beiden Stores",
    accent: "acid",
    problem:
      "Bestehende Gebets-Apps sind werbefinanziert, tracken aggressiv und behandeln den Koran-Reader als Nebensache. Wer auf Deutsch lernen will (Tafsir, Übersetzung, Umschrift, isolierte und verbundene Buchstaben), findet nichts Zusammenhängendes. Und alles bricht, sobald das Netz weg ist.",
    solution:
      "Eine werbefreie Plattform über vier Geräteklassen hinweg: Telefon, Tablet, Android TV und Wear OS. Gebetszeiten werden lokal berechnet, der komplette Koran-Reader mit mehreren Rezitatoren und Übersetzungen funktioniert offline, und die Fragen-Antwort-Suche arbeitet vollständig auf dem Gerät. Keine Anfrage verlässt das Telefon.",
    hardPart: {
      title: "Spracherkennung für Koran-Rezitation",
      body: "Für den Auswendiglern-Modus muss die App hören, ob ein Vers korrekt rezitiert wurde. Der naheliegende Weg, ein größeres Whisper-Modell, war der falsche. Der Hebel lag in der Methode: den erwarteten Vers als Prompt ins Modell konditionieren, persische und Urdu-Buchstabenvarianten vor dem Vergleich normalisieren, und milde bewerten statt binär. Ein auf Tarteel feingetuntes Base-Modell schlägt so das dreifach größere Large-Modell, bei einem Bruchteil der Latenz auf dem Gerät.",
    },
    highlights: [
      "Vier Geräteklassen aus einem Monorepo: Telefon, Tablet, Android TV, Wear OS",
      "Fragen-Antwort-Suche auf dem Gerät: eigener Korpus, eigene Rangfolge, kein Cloud-Call",
      "Whisper-basierte Rezitations-Erkennung mit vers-konditioniertem Prompting",
      "Vollständiger Mushaf-Reader: vier Schriftarten, Tafsir, Übersetzung, Wort-Zeitstempel",
      "Deutscher Koran-Arabisch-Podcast, 68 Folgen und gut zehn Stunden, produziert über eine ElevenLabs-Zwei-Stimmen-Pipeline",
      "OTA-Updates über EAS Update: Inhaltskorrekturen ohne Store-Zyklus",
      "iOS Live Activities und Android-Widgets für die nächste Gebetszeit",
      "App und Store-Texte in 14 Sprachen gepflegt, über vier Geräteklassen",
      "KI-Antworten mit Quellenangabe und Kennzeichnung nach EU AI Act Art. 50",
    ],
    stack: [
      {
        group: "Mobile",
        items: [
          "React Native 0.86",
          "Expo SDK 57",
          "Expo Router",
          "Reanimated 4",
          "TypeScript",
        ],
      },
      {
        group: "KI on-device",
        items: [
          "Eigenes Retrieval",
          "whisper.rn",
          "Kuratierter Korpus",
          "Prompt-Konditionierung",
        ],
      },
      {
        group: "Backend & Delivery",
        items: [
          "Supabase",
          "Cloudflare R2",
          "EAS Build & Update",
          "Vercel",
          "Turborepo",
        ],
      },
      {
        group: "Native",
        items: [
          "Android TV (Leanback)",
          "Wear OS",
          "Live Activities",
          "App Widgets",
        ],
      },
    ],
    metrics: [
      { value: "4", label: "Geräteklassen" },
      { value: "14", label: "Sprachen" },
      { value: "100 %", label: "KI läuft auf dem Gerät" },
      { value: verified.commitsSalati, label: "Commits" },
    ],
    links: [
      { label: "salati.pro", href: "https://www.salati.pro", kind: "live" },
      {
        label: "Instagram",
        href: "https://instagram.com/salatibox",
        kind: "social",
      },
      /* Nachgeprüft am 08.08.2026: Beide Einträge sind öffentlich. Apple
         unter id6791867298, Google Play unter dem Paketnamen
         de.salatibox.de mit dem Titel „Salati. Gebetszeiten & Koran".
         Am 01.08.2026 antwortete Play auf denselben Paketnamen noch mit
         404, und die Zeile stand deshalb nicht hier; das Statuswort nannte
         nur Apple. Eine Seite, die weniger sagt als wahr ist, wird nicht
         dadurch richtig, dass sie einmal richtig war. */
      {
        label: "App Store",
        href: "https://apps.apple.com/de/app/salati-gebetszeiten-koran/id6791867298",
        kind: "store",
      },
      {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=de.salatibox.de",
        kind: "store",
      },
      /* Die Fernseher-Fassung ist ein eigener Store-Eintrag.

         Nachgeprüft am 08.08.2026: `de.salatibox.tv` antwortet mit 200 und
         trägt den Titel „Salati TV. Gebetszeiten". Die Fallstudie nennt
         Android TV seit Langem als eine der vier Geräteklassen; verlinkt war
         die App nicht, und damit stand die einzige Geräteklasse ohne Beleg
         da, die man nicht auf dem Telefon nachsehen kann. */
      {
        label: "Google Play (TV)",
        href: "https://play.google.com/store/apps/details?id=de.salatibox.tv",
        kind: "store",
      },
    ],
    architecture: "salati",
    articles: [
      "gestrichelter-kreis-kam-nicht-aus-der-schrift",
      "published-ist-kein-beleg",
      "widget-leer-trotz-gruener-tests",
      "kleineres-whisper-modell",
    ],
    shots: [
      {
        src: "/shots/salati/shot-prayer.webp",
        alt: "Die Gebetszeiten-Ansicht: über der Liste ein Bild der Kaaba mit der aktuellen Uhrzeit und dem Countdown bis zum nächsten Gebet, darunter die fünf Zeiten des Tages mit hervorgehobenem nächsten Gebet und dem Hijri-Datum.",
        width: 720,
        height: 1600,
        label: "Gebetszeiten · lokal berechnet",
        variant: "phone",
      },
      {
        src: "/shots/salati/shot-quran.webp",
        alt: "Der Koran-Reader auf dem Telefon: arabischer Vers groß gesetzt, darunter Umschrift und deutsche Übersetzung.",
        width: 720,
        height: 1600,
        label: "Mushaf-Reader · offline",
        variant: "phone",
      },
      {
        src: "/shots/salati/shot-ki.webp",
        alt: "Die Fragen-Antwort-KI beantwortet eine Frage mit Quellenangabe und einem Hinweis, dass die Antwort KI-gestützt ist.",
        width: 720,
        height: 1600,
        label: "KI auf dem Gerät · mit Quelle",
        variant: "phone",
      },
      {
        src: "/shots/salati/shot-qibla.webp",
        alt: "Der Qibla-Kompass zeigt die Gebetsrichtung mit Gradzahl und Entfernung nach Mekka.",
        width: 720,
        height: 1600,
        label: "Qibla · Sensor und Standort",
        variant: "phone",
      },
      /* Der Lernbereich fehlt hier bewusst, seit dem 16.08.2026.
         Die Aufnahme war 720 x 1477, waehrend ihre fuenf Geschwister 720 x 1600
         sind: Sie war unten abgeschnitten, mitten durch eine Karte, und zeigte
         dazu zwei leere Zustaende ("Heute: 0/2 Lektionen geschafft", "Nichts
         faellig"). Ein Bild, das den Ausschnitt bricht und nichts zeigt, ist
         schlechter als kein Bild. Sie kommt zurueck, sobald eine Aufnahme in
         720 x 1600 mit echtem Fortschritt vorliegt; `npm run check:shots`
         besteht seither auf dem Format der Gruppe. */
      {
        src: "/shots/salati/shot-tracker.webp",
        alt: "Die Gebetsverfolgung: je Tag und Gebet ein Häkchen, darüber die Strähne aufeinanderfolgender Tage.",
        width: 720,
        height: 1600,
        label: "Verfolgung · Strähne",
        variant: "phone",
      },
      {
        src: "/shots/salati/tv-quran.webp",
        alt: "Der Koran-Reader auf dem Fernseher: der arabische Vers groß gesetzt, darunter Umschrift und Übersetzung, unten die Hinweise für die Fernbedienung.",
        width: 1920,
        height: 1080,
        label: "Android TV · Leanback",
        variant: "screen",
      },
      {
        src: "/shots/salati/tv-home.webp",
        alt: "Die Startseite auf dem Fernseher mit den Kacheln für Gebetszeiten, Koran und Lernbereich, eine davon im Fokusrahmen.",
        width: 1920,
        height: 1080,
        label: "Android TV · Fokus-Navigation",
        variant: "screen",
      },
    ],
  },
  {
    id: "menucloud",
    index: "02",
    name: "MenuCloud Berlin",
    tagline:
      "Multi-Tenant-SaaS für Gastronomie, inklusive gesetzlicher Fiskalisierung",
    year: "2026",
    role: "Gründer & alleiniger Entwickler",
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
      `${verified.apiRouten} API-Routen über ${verified.migrationen} versionierte Postgres-Migrationen`,
      "Mandantenfähige Architektur mit Row Level Security pro Restaurant",
      "Stripe Connect Destination-Charge: Restaurants werden direkt ausgezahlt, die Plattformgebühr wird abgeführt",
      "KassenSichV § 146a AO: Fiskaly Cloud-TSE pro Mandant, Hash-Kette persistiert",
      "über 7.800 Testfälle (über 7.600 Unit, 206 End-to-End), die End-to-End-Tests gegen Produktion",
      "Speisekarten-Scanner: PDF oder Foto rein, strukturierte Karte in der Datenbank raus",
      /* „dreistufig" stimmte bis zum 01.05.2026: Resend, Migadu, SES.
         Migadu ist seither abgeschaltet, und `src/lib/smtp.ts` sagt es im
         Kopf: „Supports two backends, mailcow (default + only primary),
         ses (rescue fallback)". `resend.ts` heißt nur noch so, um 25
         Importeure nicht anzufassen; Migadu kommt in `src/lib` nicht mehr
         vor. Zwei Stufen, und der Prüflauf zählt sie nach. */
      "Self-hosted Mailstack (Mailcow) mit AWS SES als Rettungsweg",
      "DSGVO Art. 30 Verzeichnis, AVV-Versand automatisiert bei Zahlungseingang",
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
        items: [
          "Next.js 16 App Router",
          "React 19 RSC",
          "TypeScript",
          "Tailwind",
        ],
      },
      {
        group: "Backend & Daten",
        items: [
          "Supabase / Postgres",
          "Row Level Security",
          "Stripe Connect",
          "Fiskaly TSE",
        ],
      },
      {
        group: "Infrastruktur",
        items: ["Hetzner", "Coolify", "Cloudflare", "Docker", "Mailcow", "n8n"],
      },
      {
        group: "Qualität",
        // "Lighthouse-Budgets" hiess es hier, und "Budget" heisst blockieren.
        // Der Lauf meldet nach Ampel an Slack, ab 90 gruen, ab 70 gelb,
        // darunter rot, und haelt nichts auf. Was wirklich blockiert, ist das
        // Bundle-Budget je Route, und das steht als eigenes Werkzeug daneben.
        items: [
          "Vitest",
          "Playwright",
          "Sentry",
          "Umami",
          "Lighthouse-Cron",
          "Bundle-Budget",
        ],
      },
    ],
    metrics: [
      { value: verified.apiRouten, label: "API-Routen" },
      { value: verified.migrationen, label: "DB-Migrationen" },
      { value: "7.800+", label: "Testfälle" },
      { value: "EU", label: "Hosting & Datenhaltung" },
      // Kunden, MRR, GMV oder Uptime würden hier eine Behauptung durch einen
      // Beleg ersetzen. Sie stehen bewusst nicht da: Erfinden kommt nicht in
      // Frage, und solange die Zahl nicht nachzählbar ist, bleibt die Zeile
      // leer statt ungefähr.
    ],
    links: [
      {
        label: "menucloud-berlin.de",
        href: "https://menucloud-berlin.de",
        kind: "live",
      },
      {
        label: "Status-Page",
        href: "https://menucloud-berlin.de/status",
        kind: "live",
      },
      {
        label: "Instagram",
        href: "https://instagram.com/menucloudberlin",
        kind: "social",
      },
      {
        label: "YouTube",
        href: "https://youtube.com/@menucloudberlin",
        kind: "social",
      },
      // Vier Store-Einträge, alle am 02.08.2026 einzeln aufgerufen und mit
      // Status 200 und dem erwarteten Titel bestätigt. Die beiden
      // App-Store-Einträge fehlten hier: Der Kommentar darüber sagte "in
      // beiden Stores nachgeprüft", verlinkt war nur Play. Zwei
      // ausgelieferte iOS-Apps waren damit auf der ganzen Seite unsichtbar,
      // obwohl sie der greifbarste Beleg sind, ein Recruiter kann sie in
      // dreißig Sekunden selbst öffnen.
      {
        label: "Restaurant-App (Play)",
        href: "https://play.google.com/store/apps/details?id=de.menucloudberlin.app",
        kind: "store",
      },
      {
        label: "Restaurant-App (App Store)",
        href: "https://apps.apple.com/de/app/menucloud/id6762983057",
        kind: "store",
      },
      {
        label: "Discovery (Play)",
        href: "https://play.google.com/store/apps/details?id=de.menucloudberlin.discovery",
        kind: "store",
      },
      {
        label: "Discovery (App Store)",
        href: "https://apps.apple.com/de/app/menucloud-discovery/id6763892926",
        kind: "store",
      },
    ],
    architecture: "menucloud",
    articles: ["kassensichv-in-der-praxis"],
    shots: [
      {
        src: "/shots/menucloud-desktop.webp",
        alt: "Startseite von menucloud-berlin.de mit dem Versprechen null Provision, DSGVO und KassenSichV sowie einer Vorschau des Self-Service-Admins.",
        /* Der Ausschnitt endet an der Sektionskante, nicht an einer runden
           Zahl: Die vorherige Aufnahme war 1440 x 900 und schnitt quer durch
           die Knopfreihe. Dazu trug sie eine echte Bildlaufleiste am Rand,
           innerhalb eines gezeichneten Browserrahmens.
           Die Kante ist am 16.08.2026 nachgemessen und liegt bei 1375; hier
           standen 1466 und in der Datei 1480, also drei Zahlen fuer dieselbe
           Kante. Gemessen wird sie jetzt von `scripts/capture-shots.mjs`. */
        width: 1440,
        height: 1375,
        label: "menucloud-berlin.de",
      },
      {
        // Store-Aufnahme aus dem Projekt selbst, die Fallstudie nennt die
        // Apps, zeigte sie aber vorher nicht.
        src: "/shots/menucloud-app.webp",
        /* Der gezeigte Betrieb ist ein Demo-Eintrag aus den Seed-Daten.
           MenuCloud hat ihn am 04.05.2026 aus dem eigenen Aktivitätsstrom
           genommen, weil er dort als echter Kunde gelesen wurde. Hier steht
           es unter dem Bild, statt dass es jemand raten muss. */
        label: "Discovery-App · Demodaten",
        alt: "Restaurantseite in der MenuCloud-App auf dem iPhone: Speisekarte, Reservierung, Öffnungszeiten und Beschreibung eines Berliner Restaurants. Der gezeigte Betrieb ist ein Demo-Eintrag.",
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
    tagline:
      "Autonomer Agent, der den Berliner Wohnungsmarkt schneller liest als ein Mensch",
    year: "2026",
    role: "Alleiniger Entwickler",
    statusLabel: "Im Eigenbetrieb",
    accent: "cyan",
    problem:
      "Auf eine Berliner Wohnung kommen dreistellige Bewerberzahlen. Entscheidend ist nicht die beste Bewerbung, sondern die erste, und zwar innerhalb von Minuten nach Inseratsschaltung. Das ist ein Wettlauf, den ein Mensch strukturell nicht gewinnen kann, weil er schläft.",
    solution:
      "Ein lokal laufender Agent, der rund um die Uhr vier Portale scannt, jedes neue Inserat gegen die eigenen Kriterien prüft, zweifelhafte Fälle per LLM im Volltext bewertet und ein individuelles Anschreiben erzeugt. Standardmäßig im REVIEW-Modus: die App versendet nichts ohne Freigabe, bis man sie bewusst auf Automatik stellt.",
    hardPart: {
      title: "Ein Agent, der nicht ungefragt handelt",
      body: "Der Reiz eines solchen Systems ist auch sein Risiko: ein Bot, der selbstständig Bewerbungen mit echten Personendaten verschickt, kann realen Schaden anrichten. Deshalb ist der Auslieferungszustand REVIEW: Vorschlag statt Versand. Der Automatikmodus existiert, ist aber eine bewusste Entscheidung des Nutzers, nicht die Voreinstellung. Dieselbe Logik steckt in den Watchdogs meiner anderen Projekte: Selbstheilung immer mit Cooldown, Obergrenze und sichtbarem Alarm bei jedem Eingriff.",
    },
    highlights: [
      "Playwright mit persistenten Chrome-Profilen je Portal: echte Sessions statt brüchiger Scraper",
      "LLM-Volltextprüfung mit regelbasiertem Fallback, wenn kein Key hinterlegt ist",
      "Lokale SQLite-Datenhaltung, Server bindet standardmäßig nur auf 127.0.0.1",
      "REVIEW-Modus als Auslieferungszustand: kein Versand ohne menschliche Freigabe",
      "Zweiter Erfassungsweg über das eigene Postfach: ImmoScout24 meldet neue Treffer per Mail schneller, als eine Ergebnisseite sich abfragen lässt",
      "Dazu frei eintragbare Vermieter-Websites: kommunale Gesellschaften und Genossenschaften, die auf keinem Portal inserieren. Ihre Treffer gehen immer in die Freigabe, nie in den Automatikmodus",
      "Watchdog mit automatischem Neustart nach Absturz",
      "Mehrinstanz-Betrieb für parallele Accounts, Weitergabe-Paket ohne persönliche Daten",
    ],
    stack: [
      {
        group: "Runtime",
        items: ["Node.js 22", "TypeScript", "Fastify", "Server-Sent Events"],
      },
      {
        group: "Automation",
        items: ["Playwright", "Persistente Browser-Profile", "Cron-Scheduler"],
      },
      {
        group: "Daten & KI",
        items: ["node:sqlite", "Anthropic API", "Regelbasierter Fallback"],
      },
    ],
    metrics: [
      { value: "4", label: "Überwachte Portale" },
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
    tagline:
      "Fitness- und Ernährungsplattform mit Web-App, Mobile-App und eigener API",
    year: "2026",
    role: "Alleiniger Entwickler",
    /* Am 16.08.2026 gemessen, nicht angenommen: Die Play-Seite zu
       `app.nouri.mobile` antwortet mit 200 und trägt den Titel „NOURI – Essen &
       Training". Die Apple-Seite zu `id6800410318` antwortet mit 404, weil
       Fassung 1.0 dort in der Prüfung liegt. Hier stand „Beta", und das war
       schon vor der Freigabe zu wenig: Die Web-App ist seit Wochen öffentlich
       erreichbar. */
    statusLabel: "Live bei Google Play, iOS in Prüfung",
    accent: "violet",
    problem:
      "Ernährungs-Apps sind entweder Tracker ohne Planung oder Planer ohne echte Datenbasis. Und fast alle behandeln Fehler als Kosmetik: Wenn der Server nicht erreichbar ist, zeigen sie „gespeichert“ an und verlieren die Eingabe.",
    solution:
      "Eine Plattform aus Web-App und Expo-App auf einem gemeinsamen Katalog von fast 12.000 Rezepten, mit Makro-Tracking, Wochenplanung, Einkaufslisten, Vorratsverwaltung, Allergenfilter und Trainingsplänen. Die Nährwerte stehen nicht in einer Tabelle, sie werden aus den Zutaten gerechnet, und ein Test hält den ganzen Katalog gegen die Atwater-Gegenrechnung.",
    hardPart: {
      /* Hier stand „Eine API, die nicht lügt", und das war ausgerechnet an
         dieser Stelle die falsche Geschichte: Der Fastify-Dienst mit seinen 87
         Endpunkten ist nirgends deployt, und weder Web noch App rufen ihn auf.
         Das Diagramm daneben zeichnete ihn trotzdem in den Bestellpfad. Das
         Repo sagt es im eigenen README deutlich, die Fallstudie sagte das
         Gegenteil. Die Disziplin, um die es geht, ist dieselbe geblieben, nur
         steht sie jetzt an der Stelle, an der sie wirklich greift. */
      title: "Eine Zahl, die niemand nachrechnet, ist erfunden",
      body: "Ein Rezeptkatalog aus 11.892 Einträgen lädt dazu ein, Kalorien und Makros einfach hinzuschreiben. Genau das tut hier nichts: Die Werte entstehen aus den Zutaten über eine eigene Nährwerttabelle, und ein Test rechnet den gesamten Katalog mit der Atwater-Formel gegen. Der erste Lauf fand Ausreißer bis 30,5 Prozent Abweichung; heute liegt die größte bei 2,07. Ein zweiter Test hält fest, dass kein Rezepttitel eine Zutat nennt, die in der Zutatenliste fehlt. Dieselbe Regel gilt für die Schreibpfade: Fehlende Zugänge sind ein Trockenlauf, eine nicht erreichbare Datenbank ein 503, eine ablehnende Datenbank ein echter 4xx mit Postgres-Fehlercode. Kein „gespeichert“, das nichts gespeichert hat.",
    },
    highlights: [
      "Monorepo mit geteiltem Katalog und geteilter Rechenlogik über Web und App",
      "63 Tabellen mit Row Level Security, 30 Fremdschlüssel hängen mit ON DELETE CASCADE an den Konten",
      "Nährwerte aus den Zutaten gerechnet, der ganze Katalog gegen Atwater geprüft: größte Abweichung 2,07 Prozent",
      "Nutzung ohne Konto bleibt vollständig lokal, kein Login-Zwang",
      "Kontolöschung nach Art. 17 DSGVO über eine Edge Function, am laufenden Projekt durchgeprüft",
      "Der Link-Import kann nicht ins eigene Netz zeigen: geprüft wird die aufgelöste IP-Adresse, nicht der Name, und jede Weiterleitung erneut",
      "Abgerechnet wird nur im Browser; die App liest den Tarif aus dem Konto und schaltet frei, ohne einen Kaufweg zu bewerben (App-Store-Richtlinie 3.1.1 und 3.1.3(b))",
    ],
    stack: [
      {
        group: "Apps",
        items: [
          "Next.js 16 App Router",
          "React 19",
          "Expo SDK 54",
          "React Native 0.81",
          "TypeScript 5.9",
        ],
      },
      {
        /* Ohne „Fastify 5" und ohne „Zod 4": Beide stehen in
           `services/api`, und dieser Dienst läuft nirgends. Zod kommt in
           `apps/web` nicht ein einziges Mal vor, gezählt am 16.08.2026. Ein
           Tech-Stack, der die stärksten Namen aus einem Ordner nimmt, den
           kein Nutzer erreicht, ist genau die Sorte Angabe, gegen die diese
           Seite argumentiert. */
        group: "Daten & Konten",
        items: ["Supabase / Postgres", "Row Level Security", "Edge Functions"],
      },
      {
        group: "Geld & Auslieferung",
        items: ["Stripe", "Vercel", "Turborepo", "pnpm 10 Workspaces"],
      },
    ],
    metrics: [
      { value: "11.892", label: "Rezepte im Katalog" },
      /* Gezählte Werte, nicht getippte: `check-figures` liest die
         `create table`-Anweisungen und die Dateien unter
         `supabase/migrations` und hält sie gegen diese beiden Zahlen. Sie
         standen hier auf 59 und 12 und waren damit um drei Tabellen und drei
         Migrationen zu niedrig. */
      { value: "63", label: "Tabellen" },
      { value: "16", label: "Migrationen" },
      { value: "538", label: "Tests" },
    ],
    links: [
      {
        label: "nouri-fitness.de",
        href: "https://www.nouri-fitness.de",
        kind: "live",
      },
      /* Am 16.08.2026 aufgerufen: 200, Titel „NOURI – Essen & Training".
         Der Apple-Eintrag fehlt hier bewusst; `id6800410318` antwortet
         solange mit 404, wie Fassung 1.0 in der Prüfung liegt, und ein
         Verweis auf eine 404 ist schlimmer als keiner. */
      {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=app.nouri.mobile",
        kind: "store",
      },
    ],
    architecture: "nouri",
    shots: [
      {
        src: "/shots/nouri-desktop.webp",
        alt: "Startseite von nouri-fitness.de mit der Titelzeile und den Knöpfen zum Öffnen der App.",
        /* Endet an der Kante des Kopfbereichs. Die vorherige Aufnahme war
           1440 x 900 und schnitt mitten durch die Kennzahlenreihe.
           828 tat es am 16.08.2026 wieder: NOURIs Kopfbereich fuellt die
           Fensterhoehe, und die naechste Kante liegt immer 66 Pixel darueber.
           Bei einem 828 hohen Fenster faengt die Reihe also bei 762 an. */
        width: 1440,
        height: 762,
        label: "nouri-fitness.de",
      },
      {
        src: "/shots/nouri/heute.webp",
        alt: "Der Tagesbildschirm der App: gegessene Kalorien gegen das Tagesziel, darunter Eiweiß, Kohlenhydrate und Fett je mit Balken, darunter die Mahlzeiten des Tages.",
        width: 1080,
        height: 2400,
        label: "Tagesbilanz · gegen das eigene Ziel",
        variant: "phone",
      },
      {
        src: "/shots/nouri/wochenplan.webp",
        alt: "Der Wochenplan: geplante Kalorien und geplantes Eiweiß gegen das Ziel, mit dem Hinweis, dass das die Summe der geplanten Portionen ist und nicht das Protokoll. Darunter die Mahlzeiten, je mit Portionsregler, Tauschen und Entfernen.",
        width: 1080,
        height: 2400,
        label: "Wochenplan · geplant, nicht protokolliert",
        variant: "phone",
      },
      {
        src: "/shots/nouri/rezept.webp",
        alt: "Ein Rezept: Merkmale wie Mahlzeit, Zubereitungszeit und Schwierigkeit, darunter ein Regler für die Portionszahl und die Nährwerte je Portion, aus den Zutaten gerechnet.",
        width: 1080,
        height: 2400,
        label: "Rezept · Nährwerte aus den Zutaten",
        variant: "phone",
      },
      {
        src: "/shots/nouri/einkauf.webp",
        alt: "Die Einkaufsliste einer Woche, nach Warengruppen sortiert. Abgehakte Positionen sind durchgestrichen, oben stehen Teilen und Haken zurücksetzen.",
        width: 1080,
        height: 2400,
        label: "Einkauf · nach Warengruppen",
        variant: "phone",
      },
      {
        src: "/shots/nouri/vorrat.webp",
        alt: "Der Vorrat: Einträge mit Menge und Ablaufdatum, sortiert nach dem, was zuerst weg muss. Darunter Rezepte nach Trefferquote, je mit den fehlenden Zutaten.",
        width: 1080,
        height: 2400,
        label: "Vorrat · was zuerst weg muss",
        variant: "phone",
      },
    ],
  },

  {
    id: "bitdojo",
    index: "05",
    name: "BitDojo",
    tagline:
      "Deutschsprachige Lernplattform mit genau einer Lektionsbibliothek",
    year: "2026",
    role: "Alleiniger Entwickler · Inhalte, Code, Stores, Recht",
    /* Am 16.08.2026 gemessen: bitdojo.de antwortet mit 200, beide
       Ladenseiten mit 404. `node werkzeug/laden-stand.mjs` meldet dazu
       „Fassung 1.0: WAITING_FOR_REVIEW" bei Apple und „1.0: completed,
       Pakete 16" auf der Produktionsspur bei Google. */
    statusLabel: "Web live, Apps in Prüfung",
    accent: "acid",
    problem:
      "Wer auf Deutsch in die Softwareentwicklung will, findet übersetzte englische Kurse oder Videoreihen ohne Prüfung. Und fast jede Plattform schreibt denselben Begriff für jeden Kurs neu. Nach einem halben Jahr stehen zwei Erklärungen für dasselbe Wort nebeneinander, sie widersprechen sich, und keine ist als die falsche erkennbar.",
    solution:
      "Eine Plattform mit genau einer Lektionsbibliothek. Ein Kurs ist eine Reihenfolge darüber plus ein Wochenplan; wer eine Lektion in einem Kurs abhakt, hat sie in jedem anderen auch. Dieselben Texte tragen den Podcast, die Karteikarten und die Prüfung, und am Ende jedes Moduls steht ein Zertifikat, dessen Siegel sich nachrechnen lässt.",
    hardPart: {
      title: "Inhaltsfehler sind still",
      body: "Ein Tippfehler im Code bricht den Bau. Eine Karteikarte, deren Antwort im Lektionstext nicht mehr vorkommt, sieht im Betrieb aus wie eine Karte. Sie ist nur nicht mehr beantwortbar, und niemand merkt es. Deshalb prüft ein Lauf im prebuild die Inhalte wie Code und lässt den Bau scheitern: wenn die abgeleiteten Dateien nicht zu den Lektionen passen, wenn ein veröffentlichter Kurs auf eine Lektion zeigt, die es nicht gibt, wenn ein Wochenplan eine Lücke hat, wenn ein Prüfungsvorrat kleiner ist als das, was der Bauplan zieht, wenn ein Begriff an zwei Stellen erklärt wird, oder wenn im erzeugten HTML etwas Ausführbares steht. Die Karte selbst ist derselbe Kasten, den der Leser im Text sieht, dieselben Zeichen. Sie kann gar nicht vom Text abweichen.",
    },
    highlights: [
      "Eine Lektionsbibliothek für elf Kurse: wer eine Lektion abhakt, hat sie überall abgehakt",
      "Die Karteikarte ist der Begriffskasten im Lektionstext, nicht seine Kopie",
      "Prüfungsfragen werden bei jedem Versuch neu gezogen, geschichtet über die Module; die Lösungen verlassen den Server nie",
      "Zertifikate mit Nummer und Siegel über Nummer, Kurs, Name, Datum und Ergebnis; die Prüfseite rechnet das Siegel neu und sieht zusätzlich in der Datenbank nach, weil ein widerrufenes Zertifikat ein gültiges Siegel behält",
      "Podcast aus denselben Lektionen: 36 Folgen und 338 Minuten mit zwei Stimmen, blockweise vertont und deshalb abbruchfest",
      "Der bezahlte Zugang hängt an einem Datum, nicht an einem Ja/Nein: ein ausgefallener Webhook kann niemanden dauerhaft freischalten",
      "Probewoche genau einmal je Konto, geprüft am Vermerk in der Datenbank und an der Vorgeschichte bei Stripe",
      "Der Hinweis auf die kostenpflichtige Verlängerung steht außerhalb der Bedingungen; ohne ihn wäre die Klausel nach § 305c BGB überraschend und damit unwirksam",
      "Der Grundlagenkurs braucht kein Konto und keine Zahlungsdaten",
    ],
    stack: [
      {
        group: "Web",
        items: ["Next.js 16", "React 19", "TypeScript", "Tailwind"],
      },
      {
        group: "Mobil",
        items: ["Expo SDK 57", "React Native", "Geteilter Kern"],
      },
      {
        group: "Daten & Geld",
        items: [
          "Supabase / Postgres",
          "Row Level Security",
          "Stripe",
          "Resend",
        ],
      },
      {
        group: "Inhalte",
        items: ["Markdown als Quelle", "Abgeleitetes JSON", "ElevenLabs"],
      },
    ],
    metrics: [
      { value: "111", label: "Lektionen" },
      { value: "813", label: "Karten zum Wiederholen" },
      { value: "664", label: "Prüfungsaufgaben" },
      { value: "147", label: "Tests" },
    ],
    links: [{ label: "bitdojo.de", href: "https://bitdojo.de", kind: "live" }],
    architecture: "bitdojo",
    shots: [
      {
        src: "/shots/bitdojo-desktop.webp",
        alt: "Startseite von bitdojo.de: die Überschrift „Vom ersten Begriff bis zum eigenen Produkt“, darunter die Kennzahlen der Plattform.",
        width: 1440,
        height: 730,
        label: "bitdojo.de",
      },
      {
        src: "/shots/bitdojo/lektion.webp",
        alt: "Eine Lektion im Grundlagenkurs: Fließtext mit zwei Begriffskästen für DNS und IP-Adresse, rechts das Verzeichnis der Abschnitte.",
        width: 1440,
        height: 1220,
        label: "Der Begriffskasten ist die Karteikarte",
      },
      /* Die drei Telefonaufnahmen kamen am 17.08.2026 dazu. Vorher zeigte diese
         Fallstudie ausschließlich den Schreibtisch, obwohl die App in beiden
         Läden liegt: Wer die Seite liest, sah von der App nichts. Sie sind
         rohe Aufnahmen aus dem Gerät, nicht die Store-Bilder, denn die tragen
         Rahmen und Bildunterschrift. */
      {
        src: "/shots/bitdojo/telefon-lektion.webp",
        alt: "Dieselbe Lektion in der App: Titel, die Kennzeichnung Grundlagen und Kostenlos, zwölf Minuten Lesezeit, darunter der Fließtext mit einem hervorgehobenen Merksatz; unten eine Leiste mit Erledigt und Quiz.",
        width: 1284,
        height: 2778,
        label: "Dieselbe Lektion, in der App",
        variant: "phone",
      },
      {
        src: "/shots/bitdojo/telefon-quiz.webp",
        alt: "Die Prüfung zur Lektion: Frage 1 von 6, vier Antworten zur Auswahl, die richtige grün umrandet und mit Haken, darunter die Auflösung im Volltext.",
        width: 1284,
        height: 2778,
        label: "Die Prüfung kommt aus demselben Text",
        variant: "phone",
      },
      {
        src: "/shots/bitdojo/telefon-hoeren.webp",
        alt: "Der Hörbereich: zu jedem Modul eine Folge mit Laufzeit, die laufende oben mit der Kennzeichnung läuft, unten die Abspielleiste mit 15 Sekunden zurück, Pause und 30 Sekunden vor.",
        width: 1284,
        height: 2778,
        label: "Und als Podcast, aus denselben Texten",
        variant: "phone",
      },
    ],
  },

  {
    id: "dartile",
    index: "06",
    name: "Dartile",
    tagline: "Dart-Counter, der jeden Pfeil einzeln aufnimmt",
    year: "2026",
    role: "Alleiniger Entwickler",
    /* Am 16.08.2026 gemessen: dartile.de antwortet mit 200, beide Ladenseiten
       mit 404. `node werkzeug/apple-profil.mjs` meldet „1.0:
       WAITING_FOR_REVIEW, Freigabe AFTER_APPROVAL"; bei Google liegt 1.0 auf
       der Produktionsspur in der Prüfung. */
    statusLabel: "Web live, Apps in Prüfung",
    accent: "cyan",
    problem:
      "Zähl-Apps für Dart speichern die Summe einer Aufnahme. Aus einer Summe lässt sich kein Trefferbild zeichnen, keine Doppelquote rechnen und nicht sagen, ob jemand die 20 oben oder unten verfehlt. Genau diese Zahlen sind aber der Grund, warum jemand eine Zähl-App überhaupt behält.",
    solution:
      "Jeder Pfeil wird einzeln aufgenommen, über ein Raster aus fünf mal fünf Kacheln und drei Tastendrücke je Aufnahme. Daher der Name. Gespeichert wird die Ereignisliste und nicht der Punktestand: Zurücknehmen ist ein Abschneiden, Zusammenlegen ein Anhängen, und die Statistik lässt sich rückwirkend neu und genauer auswerten. Dazu acht Spielarten, eine Ansage aus vorproduzierten Rufen und eine Kamera, die vorschlägt statt zu behaupten.",
    hardPart: {
      title: "Die Kamera schlägt vor, sie behauptet nicht",
      body: "Erkennung mit einer Handykamera liegt im Feld bei rund 95 Prozent. Wer das als Gewissheit verkauft, schreibt in jeder zwanzigsten Aufnahme eine falsche Zahl in eine Statistik, die niemand mehr korrigiert. Dartile kalibriert von Hand über vier Punkte, wertet über Bilddifferenz statt über ein Modell aus, zeigt die Sicherheit an und fragt unterhalb der Schwelle nach. Zwei echte Fehler kamen dabei erst am laufenden Bild heraus und aus keinem Test: Von drei Pfeilen innerhalb einer Fünftelsekunde meldete die Auswertung nur den größten veränderten Bereich, und ein Pfeil, der während einer offenen Bestätigung fiel, wurde zum neuen Sollzustand und tauchte nie auf.",
    },
    highlights: [
      "Ereignisliste statt Punktestand: Zurücknehmen ist ein Abschneiden, das Zusammenlegen zweier Geräte ein Anhängen. Es gibt keinen Fall, in dem jemand entscheiden muss, welcher Stand gilt",
      "Die Spiel-Engine ist ein eigenes Paket, rein: keine Uhr, kein Speicher, kein React, null Abhängigkeiten, 222 Tests",
      "Acht Spielarten und zwei Trainingsübungen, alle kostenlos, alle ohne Netz",
      "175 vorproduzierte Rufe je Sprache statt Sprachausgabe zur Laufzeit, 350 Dateien für Deutsch und Englisch: keine Serverkosten je Wurf und kein Caller, der ohne Empfang verstummt",
      "Das Spiel gegen andere überträgt Würfe mit laufender Nummer; fehlt eine, wird nachgeladen, kommt sie zweimal, prallt sie am Schlüssel der Datenbank ab",
      "Zurufe sind sechs feste Schlüssel und kein Freitext: Freitext zwischen Fremden hebt die Altersfreigabe in beiden Läden an",
      "24 Ziele und Erfolge, vollständig auf dem Gerät gerechnet, mit Fortschritt statt Schloss",
      "Acht Sprachen, und die Bezahlschranke fragt zuerst den Server, ob es überhaupt etwas zu kaufen gibt",
    ],
    stack: [
      {
        group: "App",
        items: ["Expo SDK 57", "React Native", "TypeScript", "expo-iap"],
      },
      {
        group: "Engine",
        items: ["Reines TypeScript", "Null Abhängigkeiten", "Vitest"],
      },
      {
        group: "Web & Daten",
        items: [
          "Next.js",
          "Vercel",
          "Supabase / Postgres",
          "Row Level Security",
        ],
      },
      {
        group: "Stimme & Bild",
        items: ["ElevenLabs, vorproduziert", "Bilddifferenz statt Modell"],
      },
    ],
    metrics: [
      { value: "284", label: "Tests" },
      { value: "8", label: "Spielarten" },
      { value: "350", label: "Rufe, zwei Sprachen" },
      { value: "0", label: "Abhängigkeiten der Engine" },
    ],
    links: [{ label: "dartile.de", href: "https://dartile.de", kind: "live" }],
    architecture: "dartile",
    articles: ["achtzehn-wege-ueber-das-bull"],
    shots: [
      {
        src: "/shots/dartile-desktop.webp",
        alt: "Startseite von dartile.de: die Überschrift „Der Dart-Counter, der im Vereinskeller funktioniert“ neben einer gezeichneten Dartscheibe.",
        width: 1440,
        height: 799,
        label: "dartile.de",
      },
      {
        src: "/shots/dartile/spiel.webp",
        alt: "Der Zählbildschirm: oben die beiden Spieler mit Restpunkten und Average, darunter die große Restpunktzahl und das Raster aus Kacheln für die Eingabe.",
        width: 1290,
        height: 2796,
        label: "Aus zwei Metern lesbar",
        variant: "phone",
      },
      {
        src: "/shots/dartile/checkout.webp",
        alt: "Derselbe Bildschirm bei 141 Restpunkten: darunter steht der vorgeschlagene Weg T20, T19, D12.",
        width: 1290,
        height: 2796,
        label: "Checkout-Vorschlag · T20 T19 D12",
        variant: "phone",
      },
      {
        src: "/shots/dartile/statistik.webp",
        alt: "Die Auswertung einer Partie: 3-Dart-Average, Erste Neun, geworfene Darts, Checkout-Quote, Anzahl der 180er und bestes Leg, je Spieler.",
        width: 1290,
        height: 2796,
        label: "Aus jedem Pfeil gerechnet",
        variant: "phone",
      },
      /* Am 17.08.2026 dazu. Die Fallstudie zeigte dreimal dieselbe Partie und
         damit nichts von der Breite der App: Rückmeldung war, die Aufnahmen
         sähen anfängerhaft aus und zeigten nicht, was das Programm kann.
         Genommen ist die rohe deutsche Aufnahme, nicht das Store-Bild aus
         demselben Lauf; das trägt Rahmen und Werbezeile. */
      {
        src: "/shots/dartile/spielarten.webp",
        alt: "Das Einrichten einer Partie: sechs Spielarten von X01 über Cricket bis Killer, drei Startpunktzahlen plus freie Eingabe, darunter sechs Bot-Stufen von Anfänger mit Average 35 bis Weltklasse mit 100 und die Spielerliste.",
        width: 1290,
        height: 2796,
        label: "Sechs Spielarten, sechs Bot-Stufen",
        variant: "phone",
      },
    ],
  },

  {
    id: "lexipulse",
    index: "07",
    name: "LexiPulse",
    tagline:
      "Vollständiger Reader für EPUB, PDF und Web-Artikel: Wortstrom oder Fließtext",
    year: "2026",
    role: "Alleiniger Entwickler",
    /* Am 16.08.2026 gemessen: lexipulse.de antwortet mit 200. Der
       Apple-Eintrag `de.lexipulse.app` steht mit der Kennung 6801979644 im
       Konto, Fassung 1.0 mit Bau 2 wartet auf die Prüfung. Bei Google steht
       der Eintrag vollständig und wartet auf das Zahlungsprofil, ohne das
       eine kostenpflichtige App keinen Preis bekommt.

       Hier stand am selben Tag „quelloffen" und „MIT". Beides war beim
       Schreiben richtig und eine Stunde später nicht mehr: Das Repo liegt
       seither unter PolyForm Noncommercial 1.0.0. Der Quelltext ist
       weiterhin vollständig lesbar, aber die Lizenz erlaubt keine
       gewerbliche Nutzung, und damit ist es keine Open-Source-Lizenz im
       Sinne der OSI. Das Wort wandert mit. */
    /* Am 17.08.2026 abgelesen: Bei Google liegt versionCode 9 in der Prüfung,
       bei Apple Build 10, beide am selben Tag eingereicht. Beide Läden prüfen
       damit denselben Funktionsstand, und beide Beschreibungen nennen das
       Sichern, weil beide geprüften Pakete es enthalten. */
    statusLabel: "Web live, beide Läden in Prüfung",
    accent: "violet",
    problem:
      "RSVP-Leser zeigen Text Wort für Wort an einer festen Stelle. Zwei Dinge machen sie regelmäßig unbrauchbar. Der Fixpunkt wandert: Landet der hervorgehobene Buchstabe nicht in derselben Bildschirmspalte, muss das Auge ihn jedes Mal neu suchen, und genau die Zeit sollte das Verfahren sparen. Und PDFs kommen als Müll an: Kopfzeilen wiederholen sich auf jeder Seite, Fußzeilen tragen Seitenzahlen, Tabellen werden zu Leerzeichenrauschen, und am Zeilenende steht ein halbiertes Wort.",
    solution:
      "Ein Reader, der beides löst und dabei das Gerät nicht verlässt. Der Fixpunkt sitzt arithmetisch statt ungefähr: translateX((Zielspalte − Erkennungspunkt)ch) auf einer Festbreitenschrift. Die Bereinigung erkennt Kopf- und Fußzeilen, Seitenzahlen, Inhaltsverzeichnis-Punktlinien und Tabellenzeilen und setzt getrennte Wörter wieder zusammen, bevor ein einziges Wort den Player erreicht. Import aus EPUB, FB2, PDF, TXT, Markdown, HTML und aus einer Web-Adresse. Wer den Wortstrom nicht mag, liest denselben Text im Fließtext weiter, mit vier mitgelieferten Schriften, Blättern samt Seitenzahl, Volltextsuche, Markierungen in fünf Farben mit Notizen und Lesehilfen von Bionic über ein Leselineal bis zu sechs Farbfiltern. Die Leseposition ist in beiden Fassungen dieselbe. Seit dem 17. August 2026 behält der Import die Originaldatei, und über ihr liegt ein Werkzeugkasten: markieren, zeichnen, Textfelder, Notizen, Formulare, unterschreiben, Seiten ordnen. In der Web-Fassung ist das live; in der App kommt es mit 1.1, denn 1.0 liegt in beiden Läden in der Prüfung, und eine Beschreibung, die Funktionen des geprüften Pakets überholt, wäre gegenüber Käufern falsch.",
    hardPart: {
      title: "Gleiches Tempo für jedes Wort ist der Fehler",
      body: "Flaches RSVP gibt einem dreibuchstabigen Artikel dasselbe Zeitbudget wie einem Satzende, und genau daran bricht das Verstehen weg. Hier multiplizieren sich Faktoren: Wortkern über acht Zeichen mal 1,25, Satzende mal 1,75, Teilsatzende mal 1,75, Absatzende mal 2,0, Ziffern mal 1,4, Kern bis drei Zeichen mal 0,9. Abkürzungen und Ordnungszahlen sind von der Satzregel ausgenommen, damit „z. B.“ und „1.“ den Strom nicht anhalten. Dazu ein Anlauf: Nach jedem Fortsetzen laufen die ersten Wörter auf 40 Prozent des Zieltempos an, weil der Sprung aus dem Stand auf 900 Wörter je Minute der häufigste Grund ist, überhaupt nichts zu lesen. Und die Uhr rechnet mit einem absoluten Zeitstempel statt mit Bildabständen, damit ein ausgefallenes Bild den Strom nicht verschiebt.",
    },
    highlights: [
      "packages/core ohne DOM, ohne React Native, ohne Node-Bausteine: dieselbe Maschine und dieselben Leser auf Web und Gerät, 386 der 561 Tests liegen dort",
      "Zwei Leseweisen auf einer Leseposition: Wer den Wortstrom anhält und in den Fließtext wechselt, steht auf demselben Wort",
      "Der Fixpunkt ist Arithmetik, keine Näherung: translateX auf einer Festbreitenschrift",
      "Zeichenindizes sind Codepunkte, nie UTF-16-Abstände: ein Emoji oder ein kombinierendes Zeichen lässt sich damit nicht halbieren",
      "Der Erkennungspunkt hängt am alphanumerischen Kern eines Wortes: Ein führendes Anführungszeichen verschiebt ihn nicht",
      "Sieben Importwege, einer davon eine Web-Adresse; der Server holt die Seite nur wegen CORS und speichert die Adresse nicht",
      "Ein Wort nachschlagen geht offline: Der Reader zeigt, wo es im Dokument sonst vorkommt. Die Übergabe an eine andere App ist ein eigener Schritt, die App selbst sendet nichts",
      "Alles bleibt auf dem Gerät: IndexedDB im Browser, SQLite auf dem Telefon, Datenausfuhr als JSON nach Art. 20 DSGVO",
      "Eine Sicherung, die man zurückspielen kann: Beim Zusammenführen erkennt der Reader dasselbe Buch an seinem Inhalt und nicht an der Kennung, damit die Leseposition nicht zurückspringt",
      "Der Werkzeugkasten über der Originaldatei ist ein eigenes Paket, das Web und App gemeinsam benutzen: In der App läuft dieselbe Oberfläche in einer mitgelieferten WebView, weil pdf.js einen Browser braucht, den React Native nicht mitbringt",
      "Der Quelltext liegt vollständig öffentlich, unter PolyForm Noncommercial: lesbar und prüfbar, aber nicht zur gewerblichen Nutzung freigegeben",
    ],
    stack: [
      {
        group: "Kern",
        items: ["TypeScript", "Plattformfrei", "Vitest"],
      },
      {
        group: "Web",
        items: ["Next.js 15 App Router", "PWA", "IndexedDB", "pdf.js"],
      },
      {
        group: "Mobil",
        items: ["Expo SDK 57", "React Native", "SQLite"],
      },
    ],
    metrics: [
      /* Am 19.08.2026 nachgemessen: `pnpm run test` meldet 386 im Kern, 80 in
         der Oberfläche, 52 im PDF-Paket, 34 auf dem Gerät, 9 im Web, zusammen
         561. Hier standen 469, gemessen am 17.08., und davor 309.

         Die Zahl wächst zwischen zwei Messungen, und keine Prüfung hält sie
         nach: `check-figures` misst die Testzahlen von MenuCloud, nicht die
         der Nachbarprojekte. Sie wird deshalb nur dann angefasst, wenn sie
         gerade gemessen wurde, und das Datum steht hier. */
      { value: "561", label: "Tests" },
      { value: "7", label: "Importformate" },
      { value: "0", label: "Dokumente auf einem Server" },
      { value: "2", label: "Plattformen, ein Kern" },
    ],
    links: [
      { label: "lexipulse.de", href: "https://lexipulse.de", kind: "live" },
      {
        label: "Quellcode",
        href: "https://github.com/DomenicMoran/lexipulse",
        kind: "code",
      },
    ],
    architecture: "lexipulse",
    shots: [
      {
        src: "/shots/lexipulse-desktop.webp",
        alt: "Startseite von lexipulse.de: die Überschrift „Lesen, ohne dass die Augen springen“ neben einer laufenden Vorführung des Readers.",
        width: 1440,
        height: 728,
        label: "lexipulse.de",
      },
      {
        src: "/shots/lexipulse/reader.webp",
        alt: "Der Reader nach dem Import eines Wikipedia-Artikels: das Wort „Wikipedia“ steht groß in der Mitte, der Erkennungsbuchstabe ist farbig hervorgehoben und liegt zwischen zwei senkrechten Strichen.",
        width: 1440,
        height: 900,
        label: "Direkt aus der Adresse gelesen",
      },
      /* Die beiden Telefonansichten kamen am 17.08.2026 dazu. Vorher zeigte
         diese Fallstudie nur den Schreibtisch, obwohl die App in beiden Läden
         liegt, und die Beschreibung nannte nur den Wortstrom, obwohl es längst
         ein vollständiger Reader ist. Aufgenommen an lexipulse.de mit einem
         Artikel, der über die Adresse importiert wurde. */
      {
        src: "/shots/lexipulse/wortstrom.webp",
        alt: "Der Reader auf dem Telefon: oben das Wort „zu“ mit farbigem Erkennungsbuchstaben zwischen zwei Strichen, darunter die Abspielleiste, und ganz unten derselbe Text als Fließtext, in dem genau dieses Wort farbig markiert ist.",
        width: 860,
        height: 1864,
        label: "Wortstrom und Fließtext stehen auf demselben Wort",
        variant: "phone",
      },
      {
        src: "/shots/lexipulse/bibliothek.webp",
        alt: "Die Bibliothek: ein Web-Artikel mit 1.656 Wörtern, Restzeit und Fortschritt, dazu Schlagwörter und Löschen. Darunter der Bereich Meine Daten mit Sicherung herunterladen und Sicherung einlesen.",
        width: 860,
        height: 1864,
        label: "Die Sicherung geht auch zurück, nicht nur heraus",
        variant: "phone",
      },
    ],
  },
  {
    id: "aegis",
    index: "08",
    name: "Aegis",
    tagline:
      "Belege, Fristen und die EÜR eines Kleinunternehmers, gerechnet auf dem Gerät",
    year: "2026",
    role: "Alleiniger Entwickler",
    /* Am 19.08.2026 gemessen und nicht abgeschrieben: `vitest run` in
       `packages/kern` meldet 14 von 14 Dateien und 304 von 304 Tests, mit
       `--coverage` 92,16 Prozent der Anweisungen. Der Bau von `apps/web`
       gibt 15 Routen aus, jede mit dem Kreis für „statisch". `apps/mobil`
       meldet 6 Dateien und 107 Tests.

       Stand 21.08.2026: Das Android-AAB ist gebaut und die App in der Play
       Console eingerichtet, öffentlich im Laden liegt sie noch nicht. Ein
       Knopf „im Store ansehen" wäre deshalb weiterhin die Behauptung ohne
       Beleg, gegen die diese Seite argumentiert; die Aufnahmen unten stammen
       vom gebauten Android-Paket, nicht aus dem Entwicklungsstand. */
    statusLabel: "Android gebaut, Play Console eingerichtet",
    nochNichtAusgeliefert: true,
    accent: "violet",
    problem:
      "Ein Kleinunternehmer sammelt drei Sorten Papier, die nichts voneinander wissen: Bons für die Einnahmenüberschussrechnung, Rechnungen für die Gewährleistung, Kontoauszüge, die beides bestätigen sollen. Die Fristen daran sind hart und ungleich lang, und die eine, auf die es ankommt, ist nicht die, die jeder kennt. Die Werkzeuge, die diese Arbeit abnehmen, laden dafür jeden Beleg zu einem Anbieter hoch: Kontostände, Einkäufe, Aufenthaltsorte, alles in einer Datei.",
    solution:
      "Eine App, die den Beleg fotografiert, ihn auf dem Gerät liest und daraus drei Dinge gleichzeitig führt: die EÜR, die Fristenliste und den Abgleich mit dem Kontoauszug. Die Texterkennung läuft im Betriebssystem, die Auswertung in einem Kern ohne jede Laufzeit-Abhängigkeit, die Ablage in einer mit SQLCipher verschlüsselten Datenbank auf dem Gerät. Es gibt keinen Server, kein Konto und keine Anmeldung. Die Web-Fassung ist vollständig statisch: fünfzehn Routen und keine einzige, die etwas entgegennehmen könnte.",
    hardPart: {
      title: "Ein schlecht gelesener Bon darf keine Ausnahme werfen",
      body: "Eine Kamera bei schlechtem Licht ist der Normalfall und nicht der Fehlerfall. Ein Parser, der bei unklarem Text abbricht, verlangt vom Nutzer, den Bon noch einmal zu fotografieren, und genau dort hört jeder auf. Die Erkennung gibt deshalb immer einen Beleg zurück, dazu ein Vertrauensmaß zwischen 0 und 1 und eine Liste von Hinweisen im Klartext. Widersprüche senken das Maß, statt den Lauf zu beenden: Wenn die Summe der Posten nicht zum Gesamtbetrag passt, ist eine Zeile falsch gelesen oder eine fehlt, und beides gehört vor die Augen des Nutzers, statt still übernommen zu werden. Dieselbe Regel trägt die Fristenrechnung. Gewährleistung und Beweislastumkehr sind zwei verschiedene Termine, sie werden regelmäßig für einen gehalten, und die App führt sie deshalb getrennt und warnt vor beiden einzeln.",
    },
    highlights: [
      "Der Kern hat keine einzige Laufzeit-Abhängigkeit: 17 Quelldateien, 14 Testdateien, 304 Tests, 92 Prozent der Anweisungen abgedeckt",
      "Drei Eingangsformate für den Kontoauszug: MT940, camt.053 und CSV in neun Bank-Layouts. Der Abgleich bewertet jede Zuordnung, statt sie zu behaupten",
      "Zwei Fristen statt einer: die Gewährleistung nach § 438 BGB und die kürzere Beweislastumkehr nach § 477 BGB, getrennt gerechnet und getrennt gemeldet",
      "Bei der Bewirtung sind die Aufwendungen anteilig abziehbar, die Vorsteuer dagegen voll. Die beiden Sätze werden verwechselt, deshalb rechnet der Kern sie getrennt",
      "Die steuerlichen Zahlen stehen an genau zwei Stellen, im Code und in der Spezifikation. Ein Prüflauf hält beide gegeneinander und bricht ab, sobald sie auseinanderlaufen",
      "Die Datenbank liegt mit SQLCipher verschlüsselt auf dem Gerät, und beim Start wird nachgesehen, ob es wirklich SQLCipher ist, statt es anzunehmen",
      "Die rechtliche Landkarte liegt im Repository, jede Pflicht mit Fundstelle und Abrufdatum. Zwei verbreitete Annahmen haben sich beim Nachlesen als falsch herausgestellt und stehen dort als Korrektur",
      "Kein Netzzugriff im Kern, kein Konto in der App, keine API-Route im Web: Es gibt keine Stelle, an der ein Beleg das Gerät verlassen könnte. Netz braucht genau ein Bauteil, das Werbebanner der freien Fassung, und es bekommt keinen Beleg zu sehen",
    ],
    stack: [
      {
        group: "Kern",
        items: ["TypeScript", "Vitest", "Ohne Abhängigkeiten"],
      },
      {
        group: "Web",
        items: ["Next.js 16 App Router", "React 19", "Statisch erzeugt"],
      },
      {
        group: "Mobil",
        items: [
          "Expo SDK 57",
          "React Native",
          "op-sqlite mit SQLCipher",
          "Texterkennung des Systems",
        ],
      },
    ],
    metrics: [
      { value: "304", label: "Tests im Kern" },
      { value: "107", label: "Tests in der App" },
      { value: "15", label: "Routen, alle statisch" },
      { value: "0", label: "Server, kein Konto" },
    ],
    links: [],
    architecture: "aegis",
    shots: [
      {
        src: "/shots/aegis/aufnahme-01-uebersicht.webp",
        alt: "Die Übersicht von Aegis: oben die Bilanz des laufenden Jahres, darunter die jüngsten Belege und die offenen Fristen.",
        width: 1080,
        height: 2160,
        label: "Übersicht · Einnahmen und Fristen",
        variant: "phone",
      },
      {
        src: "/shots/aegis/aufnahme-02-belegliste.webp",
        alt: "Die Belegliste: erfasste Bons und Rechnungen mit Kategorie und Betrag.",
        width: 1080,
        height: 2160,
        label: "Belegliste · erkannt und kategorisiert",
        variant: "phone",
      },
      {
        src: "/shots/aegis/aufnahme-05-euer.webp",
        alt: "Die Einnahmenüberschussrechnung: Einnahmen und Ausgaben je Kategorie, darunter der Gewinn.",
        width: 1080,
        height: 2160,
        label: "EÜR · auf Knopfdruck",
        variant: "phone",
      },
    ],
  },
  {
    id: "vortex",
    index: "09",
    name: "Vortex",
    tagline:
      "Erkennt Dropshipping und zeigt den Originalpreis, gerechnet auf dem Gerät",
    year: "2026",
    role: "Alleiniger Entwickler",
    statusLabel: "Web live, Android eingereicht",
    nochNichtAusgeliefert: true,
    accent: "cyan",
    problem:
      "Dropshipping-Shops verkaufen billige Ware mit großem Aufschlag, und der Käufer kann den Unterschied nicht sehen: dieselbe Ware, dasselbe Foto, ein anderer Preis. Bewertungen sind gekauft, Siegel austauschbar, und niemand hat die Zeit, jede Seite gegen ihre Quellen zu prüfen.",
    solution:
      "Ein Shop-Link genügt. Vortex liest die Seite, prüft 36 Merkmale mit Beweis und gibt eine Punktzahl mit Begründung. Dazu der Preisvergleich: Was kostet dieselbe Ware bei AliExpress im Original? Die Auswertung läuft auf dem Gerät — kein geprüfter Shop-Aufruf verlässt es.",
    hardPart: {
      title: "Eine ehrliche Bewertung darf kein Urteil über ein Unternehmen sein",
      body: "Der erste Lauf gegen einen echten US-Hersteller gab 70 von 100 — allein wegen fehlendem deutschen Impressum, fehlender USt-IdNr. und fehlendem Rechnungskauf. Das ist keine Ungenauigkeit, sondern eine unhaltbare Behauptung über ein Unternehmen. Die Antwort war Zielmarkt- und Produktseiten-Erkennung und drei verengte Muster; sechs Tests halten den Fall fest. Danach: 4 von 100.",
    },
    highlights: [
      "36 Merkmale, jedes mit Beleg im Ergebnis, bewertet in Log-Odds statt als Punktesumme",
      "HTML wird ohne Parser-Abhängigkeit gelesen, Produktdaten aus JSON-LD, Open Graph und Shopify",
      "AliExpress-Vergleich mit serverseitiger Unterschrift; ein Partnerlink trägt die Kennzeichnung WERBUNG",
      "Der Kern kennt weder Netz noch Uhr noch node:: 204 Tests halten ihn rein",
      "Teilen mit Vortex: ein geteilter Shop-Link löst dieselbe Prüfung aus, ohne neue Berechtigung",
      "Die Grenzen der Bewertung stehen offen auf der Seite, nicht im Kleingedruckten",
    ],
    stack: [
      {
        group: "Kern",
        items: ["TypeScript", "Log-Odds", "Ohne Abhängigkeiten"],
      },
      {
        group: "Web",
        items: ["Next.js 16", "SSRF-Abwehr", "Signierter Vergleich"],
      },
      {
        group: "Mobil",
        items: ["Expo SDK 57", "React Native", "Lokaler Verlauf"],
      },
    ],
    metrics: [
      { value: "36", label: "Merkmale mit Beleg" },
      { value: "204", label: "Tests im Kern" },
      { value: "60", label: "Klickprüfungen" },
      { value: "0,00 €", label: "Betriebskosten" },
    ],
    links: [
      {
        label: "vortex.domenicmoran.de",
        href: "https://vortex.domenicmoran.de",
        kind: "live",
      },
    ],
    architecture: "",
    shots: [
      {
        src: "/shots/vortex/aufnahme-02-ergebnis-web.webp",
        alt: "Das Ergebnis der Prüfung: oben die Punktzahl mit Urteil, darunter die geprüften Merkmale mit Begründung und der Preisvergleich zum Original.",
        width: 1265,
        height: 2274,
        label: "Bewertung · mit Begründung",
        variant: "phone",
      },
    ],
  },
  {
    id: "synapse",
    index: "10",
    name: "Synapse",
    tagline:
      "Aus PDFs, Fotos und Notizen werden Lernkarten, wiederholt im SM-2-Rhythmus, vollständig offline",
    year: "2026",
    role: "Alleiniger Entwickler",
    statusLabel: "Android gebaut, Play Console eingerichtet",
    nochNichtAusgeliefert: true,
    accent: "violet",
    problem:
      "Wer aus einem Lehrbuch, einer Vorlesung oder einem Foto lernen will, tippt Karten ab oder bezahlt einen Dienst, der den Lernstoff in eine Cloud lädt. Der Wiederholungsrhythmus, der über Behalten und Vergessen entscheidet, sitzt dann auf einem Server, den man nicht sieht.",
    solution:
      "PDF, Foto oder Text rein, Karten raus. Vor dem Schreiben zeigt die App, was aus jeder Seite wird; die Karten liegen in einer SQLCipher-verschlüsselten Ablage auf dem Gerät, und der Wiederholungsrhythmus rechnet lokal. Eine unterbrochene Lernsitzung setzt dort fort, wo sie aufgehört hat.",
    hardPart: {
      title: "Ein Import, der nichts übernimmt, was man nicht gesehen hat",
      body: "Aus einem PDF Karten zu machen ist eine Heuristik, keine Garantie. Deshalb steht vor dem Schreiben die Vorschau: Was aus jeder Seite wird, entscheidet der Nutzer, nicht das Skript. Die Ablage ist mit SQLCipher verschlüsselt, und der Kern hält den Wiederholungsrhythmus mit 216 Tests und 92,6 Prozent Abdeckung fest.",
    },
    highlights: [
      "Import aus PDF, Foto und Text, mit Vorschau vor dem Schreiben",
      "SM-2-Wiederholungsrhythmus, auf dem Gerät gerechnet, mit Wiederaufnahme der Sitzung",
      "SQLCipher-Ablage: die Karten verlassen das Gerät nicht",
      "Statistik, Sicherung und Export; der Kern hat 216 Tests bei 92,6 % Abdeckung",
      "Pro-Schranke und tägliche Erinnerung, beide ohne dass die Daten die App verlassen",
    ],
    stack: [
      {
        group: "Kern",
        items: ["TypeScript", "SM-2-Rhythmus", "Vitest"],
      },
      {
        group: "Mobil",
        items: [
          "Expo SDK 57",
          "React Native",
          "op-sqlite mit SQLCipher",
          "ML Kit Texterkennung",
        ],
      },
    ],
    metrics: [
      { value: "216", label: "Tests im Kern" },
      { value: "92,6 %", label: "Abdeckung" },
      { value: "48", label: "Tests in der App" },
      { value: "3", label: "Importwege" },
    ],
    links: [],
    architecture: "",
    shots: [
      {
        src: "/shots/synapse/aufnahme-02-lernkarte.webp",
        alt: "Eine Lernkarte im Wiederholungsmodus: die Frage vorne, die Antwort wird aufgedeckt.",
        width: 1080,
        height: 2160,
        label: "Lernkarte · SM-2-Rhythmus",
        variant: "phone",
      },
      {
        src: "/shots/synapse/aufnahme-06-importieren.webp",
        alt: "Der Import: aus einem PDF wird eine Vorschau der Karten, bevor sie geschrieben werden.",
        width: 1080,
        height: 2160,
        label: "Import · Vorschau vor dem Schreiben",
        variant: "phone",
      },
      {
        src: "/shots/synapse/aufnahme-07-statistik.webp",
        alt: "Die Statistik: wiederholte Karten und der Verlauf der letzten Sitzungen.",
        width: 1080,
        height: 2160,
        label: "Statistik · Fortschritt",
        variant: "phone",
      },
    ],
  },
  {
    id: "vesper",
    index: "11",
    name: "Vesper",
    tagline:
      "Bewerbungen, Vorhaben und Kontakte auf einem lokalen Brett, mit einem Sprachmodell auf dem eigenen Rechner",
    year: "2026",
    role: "Alleiniger Entwickler",
    statusLabel: "Android gebaut, Play Console eingerichtet",
    nochNichtAusgeliefert: true,
    accent: "acid",
    problem:
      "Bewerbungen liegen in Ordnern, Vorhaben in Tabellen, Kontakte im Telefon — nichts davon zusammen. Und wer ein lokales Sprachmodell nutzen will, bedient es über eine Kommandozeile statt über sein Brett.",
    solution:
      "Ein Kanban-Brett, das den Rechner nicht verlässt: Bewerbungen, Vorhaben und Kontakte in einer verschlüsselten Ablage, Karten per Ziehen und Ablegen. Für das Zusammenfassen und Bewerten spricht die App mit einem Sprachmodell, das der Nutzer selbst betreibt — Ollama oder LM Studio, beide lokal.",
    hardPart: {
      title: "Ein Sprachmodell ansprechen, ohne eines mitzubringen",
      body: "Vesper lädt kein Modell nach. Es spricht über eine Brücke mit Ollama oder LM Studio, die der Nutzer selbst installiert hat — das hält die App klein und die Daten auf dem Rechner, verlangt aber, dass die App mit beiden Schnittstellen umgehen kann und ehrlich sagt, wenn keiner der beiden läuft.",
    },
    highlights: [
      "Kanban-Brett mit Ziehen und Ablegen, Zustand und Ablage verschlüsselt auf dem Gerät",
      "Modellbrücke zu Ollama und LM Studio: Bewerten und Zusammenfassen über ein lokales Modell",
      "Benachrichtigungen, Sicherung und ein Kasse-Gerüst; 94 Tests laufen grün",
    ],
    stack: [
      {
        group: "Kern",
        items: ["TypeScript", "Vitest"],
      },
      {
        group: "Mobil",
        items: ["Expo SDK 57", "React Native", "op-sqlite mit SQLCipher"],
      },
      {
        group: "Lokales Modell",
        items: ["Ollama", "LM Studio"],
      },
    ],
    metrics: [
      { value: "94", label: "Tests" },
      { value: "2", label: "lokale Modell-Wege" },
      { value: "0", label: "Daten in einer Cloud" },
    ],
    links: [],
    architecture: "",
    shots: [
      {
        src: "/shots/vesper/aufnahme-01-heute.webp",
        alt: "Der Heute-Bildschirm: was heute ansteht, aus Vorhaben und Bewerbungen.",
        width: 1080,
        height: 2160,
        label: "Heute · das Brett auf einen Blick",
        variant: "phone",
      },
      {
        src: "/shots/vesper/aufnahme-02-brett.webp",
        alt: "Das Kanban-Brett: Karten in Spalten, per Ziehen und Ablegen verschoben.",
        width: 1080,
        height: 2160,
        label: "Brett · Ziehen und Ablegen",
        variant: "phone",
      },
      {
        src: "/shots/vesper/aufnahme-03-karte.webp",
        alt: "Eine Karte im Detail: Vorhaben oder Bewerbung mit ihren Feldern.",
        width: 1080,
        height: 2160,
        label: "Karte · im Detail",
        variant: "phone",
      },
    ],
  },
  {
    id: "aether",
    index: "12",
    name: "Aether",
    tagline:
      "Der eigene Tag als durchsuchbares Gedächtnis: Kontext, Sprachnotizen und Gedanken, lokal verarbeitet",
    year: "2026",
    role: "Alleiniger Entwickler",
    statusLabel: "Android gebaut, Play Console eingerichtet",
    nochNichtAusgeliefert: true,
    accent: "violet",
    problem:
      "Wer sich fragt, was er letzten Dienstag gemacht hat, durchsucht Kalender, Fotos und Chat-Verläufe einzeln. Ein Gedächtnis, das alles zusammenführt, verlangt normalerweise, den ganzen Tag in eine Cloud hochzuladen.",
    solution:
      "Aether hält Kontext, Sprachnotizen und Gedanken zusammen und macht sie durchsuchbar — ausgewertet auf dem Gerät. Erfassungsquellen wie Standort oder Kalender sind einzeln abschaltbar und standardmäßig aus; eine Sprachnotiz über sich selbst ist möglich, ein Mitschnitt anderer nicht.",
    hardPart: {
      title: "Die Grenze, die ein Gerät nicht überschreiten darf",
      body: "Eine App, die den eigenen Tag erfasst, steht immer an der Grenze zur Aufzeichnung Dritter. Aether erfasst im Hintergrund standardmäßig nichts, jede Quelle ist einzeln abschaltbar, und ein Mitschnitt fremder Gespräche ist bewusst nicht möglich — § 201 StGB ist kein Formfehler, sondern eine Grenze, die der Ladentext nicht einmal andeuten darf.",
    },
    highlights: [
      "Durchsuchbare Notizen mit Rückblick; der Kern hat 239 Tests bei 96 % Abdeckung",
      "Vier Erfassungsquellen — Standort, Sprachnotiz, Foto-Metadaten, Kalender — einzeln abschaltbar, standardmäßig aus",
      "SQLCipher-Ablage, Volltextsuche, Datensicherung und Pro-Schranke",
    ],
    stack: [
      {
        group: "Kern",
        items: ["TypeScript", "Vitest"],
      },
      {
        group: "Mobil",
        items: [
          "Expo SDK 57",
          "React Native",
          "op-sqlite mit SQLCipher",
          "expo-audio",
        ],
      },
    ],
    metrics: [
      { value: "239", label: "Tests im Kern" },
      { value: "96 %", label: "Abdeckung" },
      { value: "65", label: "Tests in der App" },
      { value: "4", label: "Erfassungsquellen" },
    ],
    links: [],
    architecture: "",
    shots: [
      {
        src: "/shots/aether/aufnahme-01-uebersicht.webp",
        alt: "Die Übersicht: der Tag als Zeitleiste aus Notizen und Kontext.",
        width: 1080,
        height: 2160,
        label: "Übersicht · der Tag als Gedächtnis",
        variant: "phone",
      },
      {
        src: "/shots/aether/aufnahme-02-suchen.webp",
        alt: "Die Suche: Volltext über alle Notizen und erfassten Kontexte.",
        width: 1080,
        height: 2160,
        label: "Suche · über alles",
        variant: "phone",
      },
      {
        src: "/shots/aether/aufnahme-03-notiz.webp",
        alt: "Eine Notiz: Text mit Quelle und Zeitpunkt.",
        width: 1080,
        height: 2160,
        label: "Notiz · mit Kontext",
        variant: "phone",
      },
    ],
  },
];

/* ========================================================================== */
/* Werkbank: was angelegt ist und noch keine Fallstudie trägt                  */
/* ========================================================================== */

/*
   Stand 21.08.2026: Die vier Werkbank-Systeme — Vortex, Synapse, Vesper und
   Aether — sind inzwischen eigene Fallstudien: Ihre Android-AABs sind gebaut
   und liegen in der Play Console. Die Werkbank ist damit leer, und die
   Sektion blendet sich aus, solange `items` leer bleibt.
*/
export const werkbank = {
  title: "Was gerade entsteht",
  lede: "Zurzeit entsteht hier nichts Neues: Die vier Werkbank-Projekte sind inzwischen eigene Fallstudien.",
  items: [],
} as const;

/* ========================================================================== */
/* AI workflow                                                                */
/* ========================================================================== */

export const workflow = {
  eyebrow: "Arbeitsweise",
  title: "KI ist ein Werkzeug, keine Ausrede",
  /* Die einzige Zeitangabe der Seite, die nicht gerechnet wird, und sie
     bleibt es.

     Alle anderen kommen aus einer Quelle: die Bauzeit aus dem ersten Commit,
     die Lernjahre aus 2022, die Tage je Salati-Fassung aus dem
     Änderungsprotokoll. Diese hier ist getippt, und ableiten lässt sie sich
     nicht: Die früheste Konventionsdatei liegt im ersten MenuCloud-Commit vom
     26.03.2026, die älteste Agenten-Sitzung auf diesem Rechner stammt vom
     07.07.2026. Beides belegt Monate, kein Jahr, es widerlegt das Jahr aber
     auch nicht, denn beide Spuren beginnen erst mit den Repos.

     Sie steht deshalb unverändert da. Eine belegbare Ersatzformulierung wäre
     schwächer als die Wirklichkeit, und eine erfundene Zahl wäre genau das,
     wogegen der Abschnitt darunter argumentiert. Was die Angabe altern lässt,
     ist bekannt: In einem Jahr müsste dort „über zwei Jahren" stehen. Wer sie
     dann anfasst, hat diesen Absatz gelesen. */
  lede: "Ich arbeite seit über einem Jahr agentengestützt. Das komprimiert Lieferzeiten von Monaten auf Tage, aber nur, weil um die Agenten herum ein System steht, das ihre Fehler abfängt. Ohne dieses System ist KI-gestützte Entwicklung eine Maschine zur Erzeugung von plausibel aussehendem Schrott.",
  principles: [
    {
      n: "01",
      title: "Kontext als versionierter Code",
      /* „Jedes Projekt" war am 08.08.2026 zu viel und ist es seit demselben
         Tag nicht mehr.

         Nachgezählt trugen vier von sechs Repositories eine Konventionsdatei:
         MenuCloud, Salati (unter `apps/mobile`), diese Seite und die
         Lernplattform. NOURI und WohnungsJäger nicht, auch nicht unter
         anderem Namen, gesucht bis in die dritte Ebene. Zwei der vier Systeme,
         die diese Seite als Produktion nennt, standen ohne da.

         Der billige Weg wäre gewesen, hier eine Zahl hinzuschreiben. Statt
         dessen liegt die Datei jetzt in beiden: `NOURI/AGENTS.md` und
         `KIWohnung/AGENTS.md`, jede aus dem Code abgelesen. `check-figures`
         zählt nach und verlangt alle, wer ein Repo dazunimmt, bringt die
         Datei mit.

         Am 16.08.2026 kam der Satz erneut unter Druck: Mit BitDojo, Dartile
         und LexiPulse standen drei neue Repositories auf der Seite, und
         keines trug eine Konventionsdatei. Dieselbe Antwort wie beim ersten
         Mal, also `BitDojo/AGENTS.md`, `Dartile/AGENTS.md` und
         `LexiPulse/AGENTS.md`, jede aus dem Code abgelesen und nicht aus
         einer Vorlage kopiert. Neun Repositories, neun Dateien. */
      body: "Jedes Projekt trägt seine Konventionen als Datei im Repo: Import-Regeln, Test-Muster, Design-Tokens, Sicherheits-Defaults. Dazu ein persistentes Gedächtnis über Sessions hinweg: Jede gelernte Lektion wird ein Eintrag mit Begründung, nicht eine Notiz in einem Chatverlauf, der morgen weg ist. Ein Agent ist nur so gut wie der Kontext, den er zuverlässig vorfindet.",
      artifacts: [
        "CLAUDE.md pro Repo",
        "Persistentes Memory",
        "Append-only Projektlog",
      ],
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
      artifacts: [
        "Playwright gegen Produktion",
        "Screenshot-Diffs",
        "Live-DB-Verifikation",
      ],
    },
    {
      n: "04",
      title: "Wiederkehrende Fixes werden Automatisierung",
      body: "Wenn ich denselben Handgriff zum dritten Mal mache, wird er ein Workflow. Cron-bewusste Watchdogs überwachen Dienste, heilen bekannte Ausfälle selbst und melden nach Slack. Immer mit Schutzgeländer: Cooldown, Obergrenze, Alarm bei jedem Eingriff. Ein Watchdog, der blind repariert, richtet mehr Schaden an als er verhindert.",
      artifacts: [
        "n8n-Workflows mit Self-Healing",
        "Cooldown und Obergrenze",
        "Slack-Ops-Alerts",
      ],
    },
    {
      n: "05",
      title: "Recht als Definition of Done",
      body: "Jedes kundenwirksame Feature durchläuft dasselbe Gate: DSGVO-Rechtsgrundlage vorhanden? UWG § 7 bei Outreach beachtet? EU AI Act Art. 50: Ist die KI als solche gekennzeichnet? Wird auf der Website etwas versprochen, das wir nicht liefern? Bei Consumer-Produkten in der EU ist das kein Beiwerk, sondern Teil des Produkts.",
      artifacts: ["DSGVO Art. 30", "AVV automatisiert", "AI-Act-Disclosure"],
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
      {
        kind: "prompt",
        text: "Widget zeigt auf dem Telefon veraltete Gebetszeiten",
      },
      {
        kind: "think",
        text: "Tests grün, Typecheck grün, im Emulator nicht reproduzierbar",
      },
      {
        kind: "run",
        text: "Headless-Task instrumentiert: WIDGET_UPDATE feuert, findet keinen Handler",
      },
      { kind: "warn", text: "registerWidgetTaskHandler läuft nie" },
      { kind: "think", text: "Android lädt index.js statt index.android.js" },
      {
        kind: "think",
        text: 'Metro löst "main" nicht plattformspezifisch auf, wenn die Endung dabeisteht',
      },
      { kind: "run", text: 'package.json: "main": "index.js" wird zu "index"' },
      {
        kind: "ok",
        text: "Widget aktualisiert im Hintergrund · Commit bce08f5e",
      },
    ],
  },
} as const;

/* ========================================================================== */
/* Skills                                                                     */
/* ========================================================================== */

type SkillDomain = {
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
      {
        name: "React / Next.js App Router",
        evidence: "Next.js 16 RSC in Produktion",
      },
      {
        name: "React Native / Expo",
        evidence: "Expo SDK 57, RN 0.86, vier Geräteklassen",
      },
      {
        name: "TypeScript",
        evidence: "Strict überall, 0 Fehler als Merge-Gate",
      },
      { name: "Motion & Interaction", evidence: "Reanimated 4, Framer Motion" },
      // Der Beleg nennt jetzt, was es wirklich gibt. "LCP/CLS/INP-Budgets im
      // CI" stand hier und trug keine Entsprechung: Der Workflow von MenuCloud
      // ruft weder Lighthouse noch das Bundle-Budget auf. Gemessen wird
      // stattdessen taeglich per Cron gegen Produktion, ueber die
      // PageSpeed-API, und das Bundle-Budget liegt als eigenes Skript vor.
      {
        name: "Core Web Vitals",
        evidence: "Lighthouse-Cron gegen Produktion, Bundle-Budget je Route",
      },
      {
        name: "Barrierefreiheit",
        evidence: "TV-Fokus-Navigation, Reduced-Motion",
      },
    ],
  },
  {
    id: "backend",
    title: "Backend & Daten",
    summary:
      "Mandantenfähige Systeme mit echtem Geld, echten Steuern und echten Konsequenzen bei Fehlern.",
    skills: [
      {
        name: "Postgres / Supabase",
        /* Hier stand „59-Tabellen-Schema, RLS, Migrationen".

           Die 59 sind das Schema von NOURI, RLS ist das Merkmal von MenuCloud, zwei Systeme in einer Zeile, unter einer Überschrift, die von
           mandantenfähigen Systemen mit echtem Geld spricht. Der Abschnitt
           verspricht drei Zeilen darüber genau das Gegenteil: „neben jeder
           Fähigkeit das System, an dem sie entstanden ist."

           Nebenbei war die Zahl zu klein: MenuCloud legt in seinen
           Migrationen 844 verschiedene Tabellen an. Die steht hier trotzdem
           nicht, sie ist aus SQL gezählt und nicht so belegbar wie die
           Migrationszahl, die der tägliche Lauf ohnehin auffrischt. */
        evidence: `RLS pro Mandant, ${verified.migrationen} Migrationen (MenuCloud)`,
      },
      {
        name: "API-Design",
        evidence: "Fastify, Route Handlers, Zod-Validierung",
      },
      { name: "Zahlungen", evidence: "Stripe Connect Destination-Charge" },
      { name: "Multi-Tenancy", evidence: "RLS + per-Tenant-Provisionierung" },
      {
        name: "E-Mail-Infrastruktur",
        evidence: "Self-hosted Mailcow + Fallback-Kette",
      },
      {
        name: "Compliance-Systeme",
        evidence: "KassenSichV-TSE, DSGVO Art. 30",
      },
    ],
  },
  {
    id: "cloud",
    title: "Cloud, Delivery & Betrieb",
    summary:
      "Ich betreibe, was ich baue, inklusive der Nachtschicht, wenn etwas ausfällt.",
    skills: [
      { name: "Vercel / Edge", evidence: "Statische Exports, Rewrites, ISR" },
      {
        name: "Docker / Coolify / Hetzner",
        evidence: "Eigener VPS-Stack in Produktion",
      },
      { name: "CI/CD", evidence: "GitHub Actions, Turborepo, EAS Build" },
      {
        name: "Store-Auslieferung",
        evidence: "App Store & Play, inkl. OTA-Updates",
      },
      { name: "Observability", evidence: "Sentry, Uptime-Kuma, Slack-Alerts" },
      { name: "Automatisierung", evidence: "n8n-Workflows mit Self-Healing" },
    ],
  },
  {
    id: "ai",
    title: "KI-Integration",
    summary:
      "Von der Agenten-Pipeline in meinem Editor bis zur Antwort, die das Telefon des Nutzers ohne Netz findet.",
    skills: [
      {
        name: "Agenten-Orchestrierung",
        evidence: "Sub‑Agenten, Tool‑Pipelines, Loops",
      },
      {
        name: "On-Device-Inferenz",
        evidence: "whisper.rn, Spracherkennung ohne Netz",
      },
      {
        name: "RAG & Retrieval",
        evidence: "Eigener Korpus, Granularität gemessen",
      },
      {
        name: "Prompt-Engineering",
        evidence: "Vers-Konditionierung schlägt Modellgröße",
      },
      {
        name: "Evaluation",
        evidence: "Lokale Iteration gegen dasselbe Whisper-Modell",
      },
      {
        name: "KI-Recht (EU AI Act)",
        evidence: "Kennzeichnung nach Art. 50 als Gate",
      },
    ],
  },
];

/* ========================================================================== */
/* Recruiter hub                                                              */
/* ========================================================================== */

export const recruiter = {
  eyebrow: "Für Recruiter & CTOs",
  title: "Das Wichtigste in zwei Minuten",
  lede: "Kein Anschreiben nötig. Hier steht, was ich kann, was ich suche und wie du mich erreichst.",
  facts: [
    { label: "Rolle", value: "AI Product Engineer / Fullstack" },
    {
      label: "Schwerpunkt",
      value: "Produkt end-to-end, KI-gestützte Lieferung",
    },
    // Der Anriss darüber verspricht "was ich suche". Ohne diese Zeile blieb
    // das Versprechen offen: Rolle und Modell sagen, was ich bin, nicht was
    // ich will.
    {
      label: "Suche",
      // Die Zeile beschreibt, woran ich arbeiten will, und stellt keine
      // Bedingungen an die Arbeitsweise des Teams. Vorher stand hier
      // "async, wenig Meetings, schriftlich entscheiden": Das liest sich als
      // Anforderungsliste an den Arbeitgeber, und wer bewirbt sich, sortiert
      // damit Teams aus, bevor er sie kennt. Der Zuschnitt der Aufgabe ist
      // das, worauf es ankommt.
      value:
        "Produktteam, in dem ich ein Feature bis in die Produktion begleite",
    },
    { label: "Standort", value: site.availability.detail },
    // "Nach Absprache" beantwortet die erste Frage jedes Recruiters nicht.
    // Diese Fassung schon: reden sofort, anfangen nach der Frist.
    { label: "Verfügbar", value: site.availability.entry },
    { label: "Sprachen", value: site.availability.languages },
    { label: "Modell", value: "Festanstellung" },
    /* Die Zahl steht hier, weil die Seite sie nebenan selbst verlangt.

       Unter „Das hilft mir in der ersten Mail" bittet der Kontaktbereich um
       den Gehaltsrahmen, „damit wir beide Zeit sparen". Eine Seite, die das
       fordert und selbst schweigt, ist an genau der Stelle unglaubwürdig, an
       der sie Offenheit verspricht.

       55 bis 70 k€ ist die Einschätzung aus `docs/BEWERBUNG.md` für die erste
       Anstellung; darüber steht dort ein zweiter Korridor für den Fall, dass
       die Passung stimmt. Genannt wird der untere: Eine Spanne, die mit dem
       besten Fall beginnt, filtert die Anfragen weg, die sie eigentlich
       einladen soll. */
    { label: "Gehalt", value: site.availability.salary },
    // Nimmt die Frage „wo ist der Code?" vorweg und beantwortet sie als
    // Entscheidung statt als Lücke.
    {
      label: "Quellcode",
      value: "Open Source auf GitHub · Produktivrepos auf Anfrage",
    },
  ],
  strengths: [
    {
      title: "Ich liefere fertig, nicht fast fertig",
      body: "Acht Systeme in Produktion, inklusive Store-Reviews, Zahlungsabwicklung, DSGVO-Dokumentation und Impressum. Der Teil, den die meisten Portfolios auslassen, ist genau der Teil, der am längsten dauert.",
      proof: "#work",
      proofLabel: "Die acht Fallstudien",
    },
    {
      title: "Ich arbeite über den ganzen Stack",
      body: "React-Native-Widget, Postgres-Migration, Docker-Compose auf dem eigenen VPS, Fiskal-Compliance. Kein Ticket-Ping-Pong, weil etwas „nicht mein Bereich“ ist.",
      proof: "#case-menucloud",
      proofLabel: "MenuCloud im Detail",
    },
    {
      title: "Ich weise nach, statt zu behaupten",
      body: "Ein grüner Testlauf beweist nichts. Das habe ich zweimal teuer gelernt. Deshalb wird jede Änderung am Live-System nachgewiesen, bevor sie als fertig gilt. Genau das macht agentengestützte Entwicklung erst belastbar.",
      proof: "/artikel/published-ist-kein-beleg",
      proofLabel: "„Published“ ist kein Beleg",
    },
    {
      title: "Ich kenne den Weg durch die Stores",
      body: `${SALATI_VERSIONEN} ausgelieferte Versionen allein bei Salati, dazu acht öffentliche Store-Einträge über beide Läden und drei Apps, die gerade in der Prüfung liegen. 14 Sprachen, vier Geräteklassen vom Telefon bis zum Fernseher. Ablehnungen im Review, Alterseinstufungen, Datenschutzformulare und Signierketten sind für mich Alltag, nicht Neuland.`,
      proof: "#case-salati",
      proofLabel: "Salati im Detail",
    },
    {
      title: "Ich behandle Regulierung als Teil des Produkts",
      body: "Fiskalanforderungen nach § 146a AO, Auftragsverarbeitung nach DSGVO, Hinweispflichten für KI-Funktionen. Das kenne ich aus der Umsetzung mit Kunden, nicht aus einer Zusammenfassung. Wer das erst nach dem Launch anfasst, baut es zweimal.",
      proof: "/artikel/kassensichv-in-der-praxis",
      proofLabel: "KassenSichV in der Praxis",
    },
    {
      title: "Ich arbeite mit Agenten, ohne die Kontrolle abzugeben",
      body: "Der Hebel ist nicht Tippgeschwindigkeit, sondern Kontext, festgeschriebene Konventionen und Prüfschleifen, die ein Modell nicht überreden kann. Ich lasse mir Entwürfe schreiben. Die Architektur, die Grenzen und die Freigabe bleiben bei mir.",
      proof: "https://github.com/DomenicMoran/verified-done",
      proofLabel: "verified-done auf GitHub",
    },
  ],
  cta: {
    pdf: { label: "Kurzprofil als PDF", href: "/domenic-moran-kurzprofil.pdf" },
    /* Dieselbe Kurzfassung als Seite. Es gab sie längst, sie war nur von
       nirgends verlinkt: gezählt an der ausgelieferten Seite kein einziger
       Verweis auf `/onepager`, auf keiner der zwanzig Seiten. Auf einem
       Telefon ist ein PDF der schlechtere Weg, es öffnet in einem Betrachter,
       lässt sich nicht durchsuchen und bricht die Zeilen für DIN A4. */
    /* „Kurzprofil im Browser“ und nicht „oder im Browser lesen“.

       Das „oder“ bezog sich auf den Knopf darüber und stand nur solange
       richtig, wie beides nebeneinander gelesen wird. In der Verweisliste
       eines Vorleseprogramms steht der Name für sich, und dort hieß der
       Eintrag „oder im Browser lesen“, ohne Bezug und ohne Ziel. Alle
       anderen Verweise dieses Bereichs nennen ihr Ziel selbst („Salati im
       Detail“, „MenuCloud im Detail“), und die Befehlspalette führt dieselbe
       Seite längst als „Kurzprofil im Browser“. */
    web: { label: "Kurzprofil im Browser", href: "/onepager" },
    mail: { label: "Direkt schreiben" },
    copy: {
      label: "Adresse kopieren",
      done: "Adresse kopiert",
      failed: "Kopieren ging nicht, die Adresse steht daneben",
    },
  },
} as const;

/* ========================================================================== */
/* Contact                                                                    */
/* ========================================================================== */

/**
 * Wie schnell eine Antwort kommt, die Zahl steht einmal.
 *
 * Sie stand zweimal: im Vorspann als „innerhalb von 24 Stunden" und in der
 * Faktenkachel als „In der Regel unter 24 Stunden". Zwei Formulierungen für
 * dieselbe Zusage sind die nächste Stelle, an der eine veraltet, dieselbe
 * Begründung, aus der die Eintrittsangabe und die Sprachen hier bereits als
 * Konstante stehen.
 */
const ANTWORTZEIT_STUNDEN = 24;

export const contact = {
  eyebrow: "Kontakt",
  title: "Lass uns etwas bauen",
  lede: `Ob konkrete Rolle, Rückfrage zu einem der Projekte oder einfach eine technische Frage: Ich antworte in der Regel innerhalb von ${ANTWORTZEIT_STUNDEN} Stunden.`,
  hinweis:
    "Bewusst kein Formular: Das bräuchte einen Mailversand-Dienst als Drittanbieter und einen Endpunkt, der ausfallen kann. Eine Mailadresse kann beides nicht. Und du behältst deine Nachricht im eigenen Postausgang.",
  checkliste: {
    titel: "Das hilft mir in der ersten Mail",
    punkte: [
      "Worum es geht: Rolle, Projekt oder Frage",
      "Was ihr baut und womit",
      "Wie schnell es losgehen soll",
      // „Euer“ und nicht bloß „Gehaltsrahmen“: Seit die Faktenkachel darüber
      // die eigene Spanne nennt, wäre die kürzere Fassung zweideutig, sie
      // klingt, als solle der Absender die schon genannte Zahl wiederholen.
      "Bei Rollen: euer Gehaltsrahmen, damit wir beide Zeit sparen",
    ],
  },
  fakten: [
    {
      label: "Antwortzeit",
      wert: `In der Regel unter ${ANTWORTZEIT_STUNDEN} Stunden`,
    },
    { label: "Sprachen", wert: "Deutsch · Englisch" },
    /* Dieselbe Quelle wie im Recruiter-Bereich und auf dem Kurzprofil.
       Hier stand „Berlin · Remote EU" und dort „Berlin · remote in der EU ·
       hybrid", zwei Formulierungen derselben Angabe, und nur eine nannte die
       Bereitschaft zu hybrid. Wer beide liest, hält die knappere für eine
       Einschränkung. */
    { label: "Standort", wert: site.availability.detail },
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

/** Die Laufschrift im Kopfbereich. Nach Rhythmus geordnet, nicht nach Gewicht. */
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
  "Whisper",
  "Tailwind",
  "Turborepo",
  "Vitest",
];
