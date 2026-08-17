import { dateLong } from "@/lib/date-format";
import verified from "./verified.json";
import { SALATI_ERSTER_COMMIT, SALATI_STAND, SALATI_VERSIONEN } from "./salati";
import {
  asWord,
  grossErstes,
  jahreZwischen,
  monateZwischen,
} from "@/lib/duration";
import type { Content } from "./types";

/**
 * Angaben, die auf dem Kurzprofil und im Faktenblatt stehen.
 *
 * Als Konstante, weil sie an zwei Stellen gebraucht werden und dort zweimal
 * anders formuliert waren: "Open to talk now · start after notice period" im
 * Faktenblatt gegen die neue Zeile auf dem Blatt. Zwei Sätze für dieselbe
 * Sache sind die nächste Stelle, an der einer veraltet.
 */
/** Dieselbe Zahl wie in `site.ts`, aus demselben Grund an einer Stelle. */
const REPLY_HOURS = 24;

/** Eine Formulierung für den Standort, wie bei Eintritt und Sprachen. */
const LOCATION = "Berlin · remote in the EU · hybrid";

const ENTRY = "Open to talk now · start within three months";
const LANGUAGES = "German (native) · English";
const SALARY = "€55–70k, depending on scope";

/**
 * Die englische Fassung.
 *
 * Keine wörtliche Übersetzung: Das deutsche Original lebt von Konstruktionen,
 * die Wort für Wort nicht überstehen. Erhalten bleiben die Argumentation und
 * der Beleg hinter jeder Zahl.
 *
 * Die Rechtsseiten bleiben deutsch. Sie erfüllen deutsches Recht und richten
 * sich an deutsche Stellen; eine Übersetzung wäre eine zweite Fassung mit
 * unklarer Verbindlichkeit.
 */
/**
 * Tage seit dem ersten Salati-Commit, gerechnet statt getippt.
 *
 * Hier stand „107 days … until today“. Am Tag des Schreibens richtig, am
 * nächsten Morgen 108, dasselbe wandernde Fenster, das die Commit-Angabe
 * schon abgelegt hat („3.971 Commits in vier Monaten"). Eine Zahl, die sich
 * von allein bewegt, lässt sich von Hand nicht pflegen.
 *
 * Gezählt wird bis zum Prüfdatum in `verified.json`, nicht bis zum Aufruf: Die
 * Seiten sind vorgerendert, ein `new Date()` würde hier ohnehin beim Bauen
 * einfrieren. Der Stempel rückt täglich mit dem geplanten Lauf weiter, und die
 * Anmerkung neben der Zahl benennt ihn.
 */
const SALATI_FIRST_COMMIT = SALATI_ERSTER_COMMIT;
const salatiDays = Math.round(
  (Date.parse(verified.date) - Date.parse(SALATI_FIRST_COMMIT)) / 86_400_000,
);
/** Im Änderungsprotokoll der App gezählt, siehe check-figures.mjs. */
const SALATI_VERSIONS = SALATI_VERSIONEN;
const salatiHoursPerVersion = Math.round((salatiDays * 24) / SALATI_VERSIONS);

/**
 * Wie lange die vier Produktionssysteme entstehen, gerechnet.
 *
 * Im Vorspann stand „built in four months". Am Tag des Schreibens genau
 * richtig, ab dem 26. des übernächsten Monats zu bescheiden, und niemand merkt
 * es: Die Aussage wird nicht falsch, sie wird still zu klein. Dasselbe
 * wandernde Maß wie „3.971 Commits in vier Monaten" und „107 Tage bis heute“,
 * beide bereits abgelegt.
 */
const FIRST_COMMIT = "2026-03-26";
const LEARNING_START = "2022-07-01";

const months = monateZwischen(new Date(FIRST_COMMIT), new Date(verified.date));

/** "four months", "five months", …, never a frozen value. */
const buildTime = `${asWord(months)} month${months === 1 ? "" : "s"}`;
const buildTimeTitle = grossErstes(buildTime);
const learningYears = grossErstes(
  `${asWord(jahreZwischen(new Date(LEARNING_START), new Date(verified.date)))} years`,
);

export const en: Content = {
  lang: "en",
  site: {
    // Der Ursprung, nicht der Pfad: buildMetadata hängt „/en“ selbst an. Mit
    // der vollständigen /en-Adresse an dieser Stelle kam als kanonische URL
    // „https://domenicmoran.de/en/en" heraus.
    url: "https://domenicmoran.de",
    name: "Domenic Moran",
    role: "AI Product Engineer",
    location: "Berlin, Germany",
    ogTagline:
      "Seven systems in production: mobile, SaaS, a learning platform, infrastructure, compliance. All built solo.",
    email: "domenicmoran@gmail.com",
    mailSubject: "Enquiry via domenicmoran.de",
    availability: {
      label: "Open to a permanent role",
      detail: LOCATION,
      entry: ENTRY,
      languages: LANGUAGES,
      // Siehe `site.ts`: dieselbe Spanne, hier als einzige Quelle für
      // Faktenkachel und Kurzprofil.
      salary: SALARY,
    },
    meta: {
      title: "Domenic Moran – AI Product Engineer",
      description:
        "Seven systems in production, all built solo: apps in both stores, a multi-tenant SaaS with statutory fiscal signing, a learning platform, an autonomous agent.",
    },
  },

  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "How I work", href: "#workflow" },
    { label: "Skills", href: "#skills" },
    { label: "Writing", href: "#writing" },
    { label: "For recruiters", href: "#hire" },
  ],
  navContact: "Contact",
  skipToContent: "Skip to content",
  a11y: {
    toTop: "Back to top",
    mainNav: "Main navigation",
    footerNav: "Footer navigation",
    legalNav: "Back to the site",
    onepagerNav: "Print, download, switch language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    commandPalette: "Open command palette",
    currentSection: "Current section",
    llmsTitel: "Facts for language models",
    humansTitel: "About this site and who built it (German)",
    replay: "Play the sequence again",
    shots: {
      label: "Screenshots, scroll horizontally",
      vor: "Next image",
      zurueck: "Previous image",
      von: "of",
    },
  },
  palette: {
    title: "Command palette",
    searchLabel: "Search",
    placeholder: "Search or jump …",
    empty: "Nothing found.",
    results: "Results: {n}",
    jump: "Jump to",
    modifier: "Ctrl",
    pdf: { label: "One-pager as PDF", hint: "Print-ready summary" },
    onepagerWeb: {
      label: "One-pager in the browser",
      hint: "The same summary as a page",
    },
    mail: "Write an email",
    github: "Source code and profile",
    linkedin: "Professional background",
  },

  hero: {
    eyebrow: "Berlin · available",
    headline: [
      { text: "I" },
      { text: "ship" },
      { text: "finished", accent: true },
      { text: "products," },
      { text: "not" },
      { text: "prototypes.", accent: true },
    ],
    lede: `AI product engineer in Berlin. Seven systems in production, built in ${buildTime} alongside a full-time job: apps in both stores, a multi-tenant SaaS with statutory fiscal signing, a learning platform with exams and certificates, an autonomous agent. All of it mine, from the migrations to the legal notice.`,
    ctaPrimary: { label: "See the work", href: "#work" },
    ctaSecondary: { label: "For recruiters", href: "#hire" },
    tryIt: {
      before: "Three of the seven systems run right here in the browser:",
      label: "try the prayer times, the daily macros and the checkout table",
      href: "#case-salati",
      after: "without a single request leaving it.",
    },

    proof: [
      { value: "7", label: "systems in production" },
      {
        value: verified.commitsHead.replace(".", ","),
        label: "commits since March 2026",
      },
      {
        value: verified.apiRouten.replace(".", ","),
        label: "API routes (MenuCloud)",
      },
      { value: "7,800+", label: "test cases (MenuCloud)" },
    ],
  },

  work: {
    eyebrow: "Selected work",
    title: "Seven products. All live. All built alone.",
    lede: "No practice projects, no tutorial clones. Every system here has real users, real payments or real legal obligations, and I owned each one from the first line to the store review.",
    tabs: {
      highlights: "What is in it",
      automation: "Automation",
      architecture: "Architecture",
      stack: "Tech stack",
    },
    labels: {
      problem: "The problem",
      solution: "The solution",
      hardPart: "The hard part",
      readOn: "Written up in full",
    },
  },

  caseStudies: [
    {
      id: "salati",
      index: "01",
      name: "Salati",
      tagline:
        "Prayer and Quran platform for German speakers, with AI that runs offline",
      year: "2026",
      // „legal“ und nicht „licensing“: Das deutsche „Recht“ meint hier
      // Impressum, Datenschutz, Alterseinstufung und die Kennzeichnung nach
      // EU AI Act Art. 50, nicht Lizenzen.
      role: "Sole developer · product, code, stores, legal",
      statusLabel: "Live in both stores",
      accent: "acid",
      problem:
        "Existing prayer apps are ad-funded, track aggressively, and treat the Quran reader as an afterthought. Anyone wanting to study in German (tafsir, translation, transliteration, isolated and connected letters) finds nothing coherent. And all of it breaks the moment the network drops.",
      solution:
        "An ad-free platform across four device classes: phone, tablet, Android TV and Wear OS. Prayer times are computed locally, the full reader with multiple reciters and translations works offline, and the question-answering search runs entirely on the device. No query ever leaves the phone.",
      hardPart: {
        title: "Speech recognition for Quran recitation",
        body: "The memorisation mode has to hear whether a verse was recited correctly. The obvious route, a larger Whisper model, was the wrong one. The leverage was in the method: condition the model on the expected verse as a prompt, normalise Persian and Urdu letter variants before comparing, and score leniently rather than as pass or fail. A base model fine-tuned on Tarteel now beats one three times its size, at a fraction of the on-device latency.",
      },
      highlights: [
        "Four device classes from one monorepo: phone, tablet, Android TV, Wear OS",
        "Question answering on the device: own corpus, own ranking, no cloud call",
        "Whisper-based recitation checking with verse-conditioned prompting",
        "Complete Mushaf reader: four typefaces, tafsir, translation, word-level timestamps",
        "A German podcast on the Arabic of the Quran: 68 episodes, over ten hours, produced through a two-voice ElevenLabs pipeline",
        "Over-the-air updates via EAS: content corrections without a store cycle",
        "iOS Live Activities and Android widgets for the next prayer time",
        "App and store copy maintained in 14 languages, across four device classes",
        "AI answers cite their source and carry an EU AI Act Art. 50 disclosure",
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
          group: "On-device AI",
          items: [
            "Custom retrieval",
            "whisper.rn",
            "Curated corpus",
            "Prompt conditioning",
          ],
        },
        {
          group: "Backend & delivery",
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
        { value: "4", label: "device classes" },
        { value: "14", label: "languages" },
        { value: "100%", label: "AI runs on the device" },
        { value: verified.commitsSalati.replace(".", ","), label: "commits" },
      ],
      links: [
        { label: "salati.pro", href: "https://www.salati.pro", kind: "live" },
        {
          label: "Instagram",
          href: "https://instagram.com/salatibox",
          kind: "social",
        },
        // The German page linked the App Store listing, the English one did
        // not, the same shipped app, invisible to half the readers.
        {
          label: "App Store",
          href: "https://apps.apple.com/de/app/salati-gebetszeiten-koran/id6791867298",
          kind: "store",
        },
        // Siehe `site.ts`: Der Play-Eintrag ist seit dem 08.08.2026
        // öffentlich. Beide Fassungen führen ihn, sonst wiederholt sich
        // genau der Fall aus dem Kommentar darüber.
        {
          label: "Google Play",
          href: "https://play.google.com/store/apps/details?id=de.salatibox.de",
          kind: "store",
        },
        {
          label: "Google Play (TV)",
          href: "https://play.google.com/store/apps/details?id=de.salatibox.tv",
          kind: "store",
        },
      ],
      architecture: "salati",
      articles: [
        "the-dotted-circle-was-not-the-font",
        "published-is-not-proof",
        "green-tests-empty-widget",
        "a-smaller-whisper-model",
      ],
      shots: [
        {
          src: "/shots/salati/shot-prayer.webp",
          alt: "The prayer-times view: above the list an image of the Kaaba with the current time and a countdown to the next prayer, below it the five daily times with the next one highlighted and the Hijri date.",
          width: 720,
          height: 1600,
          label: "Prayer times · computed locally",
          variant: "phone",
        },
        {
          src: "/shots/salati/shot-quran.webp",
          alt: "The Quran reader on the phone: the Arabic verse set large, transliteration and German translation below it.",
          width: 720,
          height: 1600,
          label: "Mushaf reader · offline",
          variant: "phone",
        },
        {
          src: "/shots/salati/shot-ki.webp",
          alt: "The question-answering model replies with its source named and a note that the answer is AI-assisted.",
          width: 720,
          height: 1600,
          label: "AI on the device · with source",
          variant: "phone",
        },
        {
          src: "/shots/salati/shot-qibla.webp",
          alt: "The Qibla compass shows the prayer direction with the bearing in degrees and the distance to Mecca.",
          width: 720,
          height: 1600,
          label: "Qibla · sensor and location",
          variant: "phone",
        },
        /* Der Lernbereich fehlt hier bewusst, siehe site.ts: Die Aufnahme war
           720 x 1477 statt 720 x 1600, unten mitten durch eine Karte
           geschnitten, und zeigte zwei leere Zustaende. */
        {
          src: "/shots/salati/shot-tracker.webp",
          alt: "Prayer tracking: a tick per day and prayer, with the streak of consecutive days above.",
          width: 720,
          height: 1600,
          label: "Tracking · streak",
          variant: "phone",
        },
        {
          src: "/shots/salati/tv-quran.webp",
          alt: "The Quran reader on a television: the Arabic verse set large, transliteration and translation below, remote-control hints at the bottom.",
          width: 1920,
          height: 1080,
          label: "Android TV · Leanback",
          variant: "screen",
        },
        {
          src: "/shots/salati/tv-home.webp",
          alt: "The television home screen with tiles for prayer times, Quran and the study area, one of them showing the focus ring.",
          width: 1920,
          height: 1080,
          label: "Android TV · focus navigation",
          variant: "screen",
        },
      ],
    },
    {
      id: "menucloud",
      index: "02",
      name: "MenuCloud Berlin",
      tagline:
        "Multi-tenant SaaS for restaurants, including statutory fiscal signing",
      year: "2026",
      role: "Founder & sole developer",
      statusLabel: "Live in production",
      accent: "violet",
      problem:
        "Berlin restaurants hand 15–30% commission to delivery platforms and have no control over their own menu. The alternatives are website builders with no till integration, or enterprise systems with four-figure setup fees. Neither solves the problem every German restaurateur actually has: compliance with the cash-register law.",
      solution:
        "A platform covering the whole path: a restaurant site with a self-editable menu, QR ordering that pays out directly through Stripe Connect, reservations, reputation management. Underneath sits a multi-tenant cloud signing unit that signs every transaction under § 146a AO and anchors it in a hash chain. Plus native apps for owners and staff.",
      hardPart: {
        title: "Fiscal signing as a tenancy problem",
        body: "A signing unit is not simply an API call. Each tenant needs its own legally attributable unit, every transaction must sit in an unbroken hash chain, and an outage must never quietly produce unsigned revenue, which for the restaurateur would be an audit catastrophe. The answer is a per-tenant provisioned Fiskaly cloud unit with the chain persisted in `tse_transactions`, and a fail-closed path: no signature, no transaction.",
      },
      highlights: [
        `${verified.apiRouten.replace(".", ",")} API routes across ${verified.migrationen} versioned Postgres migrations`,
        "Multi-tenant architecture with row level security per restaurant",
        "Stripe Connect destination charges: restaurants are paid directly, the platform fee is settled automatically",
        "§ 146a AO compliance: per-tenant Fiskaly cloud signing unit, hash chain persisted",
        "over 7,800 test cases (over 7,600 unit, 206 end-to-end), the end-to-end suite running against production",
        "Menu scanner: a PDF or a photo goes in, a structured menu comes out",
        /* Siehe die Begründung in `site.ts`: seit dem 01.05.2026 zwei Stufen,
           nicht drei. */
        "Self-hosted mail stack with AWS SES as the rescue path",
        "GDPR Art. 30 record, data-processing agreement dispatched automatically on payment",
        "iOS and Android apps for owners and service staff",
      ],
      automation: {
        title: "63 workflows that keep the business running",
        lede: "The part of the system that runs without me. Every workflow is versioned and traceable in the repository, not clicked together in a dashboard and then forgotten.",
        groups: [
          {
            title: "Customer contact",
            items: [
              "Instagram DM bot answers enquiries and qualifies leads",
              "WhatsApp Business bot for ordering and support questions",
              "AI support agent that escalates to a human when unsure",
              "Reputation manager: Google reviews per tenant, AI-drafted reply, auto-post",
            ],
          },
          {
            title: "Operations & self-healing",
            items: [
              "Supervisor every 5 minutes, watchdog every 15, workflow monitor hourly",
              "Global error handler that collects every failure instead of losing it",
              "Weekly backup, plus an hourly check that it can actually be restored",
              "Self-healing always with a cooldown, a cap, and a message per intervention",
            ],
          },
          {
            title: "Money & compliance",
            items: [
              "Daily fiscal reconciliation, mail polling every 30 minutes",
              "Invoice and expense handling, month-end close prepared",
              "Separate bounce handlers for each mail path",
              "Legal watcher: daily check of mandatory disclosures",
            ],
          },
          {
            title: "Marketing",
            items: [
              "Daily LinkedIn post, weekly blog article",
              "TikTok cross-posting, daily social analytics",
              "Lead scraper with downstream email discovery",
              "Evening briefing and weekly marketing digest to Slack",
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
          group: "Backend & data",
          items: [
            "Supabase / Postgres",
            "Row Level Security",
            "Stripe Connect",
            "Fiskaly",
          ],
        },
        {
          group: "Infrastructure",
          items: [
            "Hetzner",
            "Coolify",
            "Cloudflare",
            "Docker",
            "Mailcow",
            "n8n",
          ],
        },
        {
          group: "Quality",
          items: [
            "Vitest",
            "Playwright",
            "Sentry",
            "Umami",
            "Lighthouse cron",
            "Bundle budget",
          ],
        },
      ],
      metrics: [
        { value: verified.apiRouten.replace(".", ","), label: "API routes" },
        { value: verified.migrationen, label: "DB migrations" },
        { value: "7,800+", label: "test cases" },
        { value: "EU", label: "hosting & data residency" },
      ],
      links: [
        {
          label: "menucloud-berlin.de",
          href: "https://menucloud-berlin.de",
          kind: "live",
        },
        {
          label: "Status page",
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
        // The English page carried no app links at all, while the German one
        // carried two of four. All four checked on 2 August 2026: status 200
        // and the expected title.
        {
          label: "Restaurant app (Play)",
          href: "https://play.google.com/store/apps/details?id=de.menucloudberlin.app",
          kind: "store",
        },
        {
          label: "Restaurant app (App Store)",
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
      articles: ["german-till-law-in-practice"],
      shots: [
        {
          src: "/shots/menucloud-desktop.webp",
          alt: "Home page of menucloud-berlin.de promising zero commission, GDPR and cash-register compliance, with a preview of the self-service admin.",
          width: 1440,
          height: 1375,
          label: "menucloud-berlin.de",
        },
        {
          src: "/shots/menucloud-app.webp",
          label: "Discovery app · demo data",
          alt: "A restaurant page in the MenuCloud app on iPhone: menu, reservation, opening hours and description of a Berlin restaurant. The listing shown is a demo entry.",
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
        "An autonomous agent that reads the Berlin rental market faster than a human can",
      year: "2026",
      role: "Sole developer",
      statusLabel: "In personal use",
      accent: "cyan",
      problem:
        "A Berlin flat draws applicants in the hundreds. What decides it is not the best application but the first, within minutes of the listing going up. That is a race a human structurally cannot win, because humans sleep.",
      solution:
        "A locally running agent that scans four portals around the clock, checks each new listing against defined criteria, sends borderline cases to an LLM for a full-text assessment, and drafts an individual cover letter. It ships in REVIEW mode: it sends nothing without approval, until you deliberately switch it to automatic.",
      hardPart: {
        title: "An agent that does not act unasked",
        body: "What makes such a system appealing is also its risk: a bot sending applications with real personal data can do real damage. So the shipped state is REVIEW: propose, do not send. Automatic mode exists, but as a deliberate user decision rather than the default. The same logic sits in the watchdogs on my other projects: self-healing always with a cooldown, a cap, and a visible alert on every intervention.",
      },
      highlights: [
        "Playwright with persistent Chrome profiles per portal: real sessions instead of brittle scrapers",
        "LLM full-text assessment with a rule-based fallback when no key is configured",
        "Local SQLite storage; the server binds to 127.0.0.1 by default",
        "REVIEW mode as the shipped state: nothing is sent without human approval",
        "A second ingest path through my own mailbox: ImmoScout24 reports new matches by mail faster than a results page can be polled",
        "Plus freely configurable landlord websites: municipal housing companies and cooperatives that never advertise on a portal. Their hits always go to review, never to automatic mode",
        "Watchdog with automatic restart after a crash",
        "Multi-instance operation for parallel accounts, distributable package without personal data",
      ],
      stack: [
        {
          group: "Runtime",
          items: ["Node.js 22", "TypeScript", "Fastify", "Server-Sent Events"],
        },
        {
          group: "Automation",
          items: [
            "Playwright",
            "Persistent browser profiles",
            "Cron scheduler",
          ],
        },
        {
          group: "Data & AI",
          items: ["node:sqlite", "Anthropic API", "Rule-based fallback"],
        },
      ],
      metrics: [
        { value: "4", label: "portals watched" },
        { value: "24/7", label: "scanning" },
        { value: "2", label: "review stages before sending" },
      ],
      links: [],
      architecture: "wohnungsjaeger",
      keinScreenshot:
        "There is deliberately no image of this project. The dashboard shows real listings, real addresses and my complete application documents. Staging a screenshot with invented data would have been the obvious fix, and would have put a fabricated image on a page that argues from verifiability. The architecture beside it is real.",
    },
    {
      id: "nouri",
      index: "04",
      name: "NOURI",
      tagline:
        "Nutrition and training platform: web app, mobile app, one shared catalogue",
      year: "2026",
      role: "Sole developer",
      statusLabel: "Live on Google Play, iOS in review",
      accent: "violet",
      problem:
        "Nutrition apps are either trackers without planning or planners without real data. And almost all of them treat errors as cosmetic: when the server is unreachable they display “saved” and lose the entry.",
      solution:
        "A platform of a web app and an Expo app sharing a catalogue of nearly 12,000 recipes, with macro tracking, weekly planning, shopping lists, pantry management, allergen filters and training plans. The nutrition values are not sitting in a table, they are computed from the ingredients, and a test holds the entire catalogue against the Atwater cross-check.",
      hardPart: {
        title: "A number nobody recomputes is a made-up number",
        body: "A catalogue of 11,892 recipes invites you to simply write the calories and macros down. Nothing here does that: the values are derived from the ingredients through an own nutrition table, and a test recomputes the whole catalogue with the Atwater formula. The first run found outliers up to 30.5 per cent; today the largest deviation is 2.07. A second test asserts that no recipe title names an ingredient missing from its ingredient list. The same rule governs the write paths: missing credentials are a dry run, an unreachable database is a 503, a rejecting database is a real 4xx carrying the Postgres error code. No “saved” that saved nothing.",
      },
      highlights: [
        "Monorepo with a shared catalogue and shared rules across web and app",
        "63 tables with row level security, 30 foreign keys hanging off the accounts with ON DELETE CASCADE",
        "Nutrition computed from ingredients, the whole catalogue checked against Atwater: largest deviation 2.07 per cent",
        "Using the app without an account stays entirely local, no forced login",
        "Account deletion under Art. 17 GDPR through an edge function, verified against the running project",
        "The link importer cannot point into my own network: what is checked is the resolved IP address, not the name, and every redirect again",
        "Billing happens in the browser only; the app reads the plan from the account and unlocks, without advertising a purchase path (App Store guidelines 3.1.1 and 3.1.3(b))",
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
          group: "Data & accounts",
          items: ["Supabase / Postgres", "Row Level Security", "Edge Functions"],
        },
        {
          group: "Money & delivery",
          items: ["Stripe", "Vercel", "Turborepo", "pnpm 10 workspaces"],
        },
      ],
      metrics: [
        { value: "11,892", label: "recipes in the catalogue" },
        { value: "63", label: "tables" },
        { value: "16", label: "migrations" },
        { value: "538", label: "tests" },
      ],
      links: [
        {
          label: "nouri-fitness.de",
          href: "https://www.nouri-fitness.de",
          kind: "live",
        },
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
          alt: "Home page of nouri-fitness.de with the headline and the buttons that open the app.",
          width: 1440,
          height: 762,
          label: "nouri-fitness.de",
        },
        {
          src: "/shots/nouri/heute.webp",
          alt: "The day screen: calories eaten against the daily target, then protein, carbohydrates and fat each with a bar, then the meals planned for the day.",
          width: 956,
          height: 1685,
          label: "Today · against your own target",
          variant: "phone",
        },
        {
          src: "/shots/nouri/wochenplan.webp",
          alt: "The weekly plan: a strip of weekdays, below it planned calories and planned protein against the target, and the meals of the selected day.",
          width: 956,
          height: 1685,
          label: "Weekly plan · planned, not logged",
          variant: "phone",
        },
        {
          src: "/shots/nouri/allergene.webp",
          alt: "The allergen screen with the note that NOURI is not a medical device, and the selection of excluded allergens.",
          width: 956,
          height: 1685,
          label: "Allergens · not a medical device",
          variant: "phone",
        },
        {
          src: "/shots/nouri/training.webp",
          alt: "The training area with plans and the log of recent sessions.",
          width: 956,
          height: 1685,
          label: "Training · plan and log",
          variant: "phone",
        },
      ],
    },

    {
      id: "bitdojo",
      index: "05",
      name: "BitDojo",
      tagline: "German-language learning platform with exactly one lesson library",
      year: "2026",
      role: "Sole developer · content, code, stores, compliance",
      statusLabel: "Web live, apps in review",
      accent: "acid",
      problem:
        "Anyone who wants to get into software engineering in German finds translated English courses or video series without an exam. And nearly every platform writes the same term anew for every course. Half a year later two explanations of the same word sit side by side, they contradict each other, and neither is identifiable as the wrong one.",
      solution:
        "A platform with exactly one lesson library. A course is an ordering over it plus a weekly schedule; tick a lesson off in one course and it is ticked off in every other. The same texts carry the podcast, the flashcards and the exam, and at the end of each module sits a certificate whose seal can be recomputed.",
      hardPart: {
        title: "Content errors are silent",
        body: "A typo in code breaks the build. A flashcard whose answer no longer appears in the lesson text still looks like a card. It is simply no longer answerable, and nobody notices. So a run in the prebuild checks the content the way it checks code, and fails the build: when the derived files no longer match the lessons, when a published course points at a lesson that does not exist, when a weekly schedule has a gap, when an exam pool is smaller than what the blueprint draws from it, when a term is explained in two places, or when something executable ends up in the generated HTML. The card itself is the very box the reader sees in the text, the same characters. It cannot drift from the text at all.",
      },
      highlights: [
        "One lesson library across eleven courses: tick a lesson off once and it is off everywhere",
        "The flashcard is the term box inside the lesson text, not a copy of it",
        "Exam questions are drawn afresh on every attempt, stratified across the modules; the answers never leave the server",
        "Certificates carry a number and a seal over number, course, name, date and result; the verification page recomputes the seal and also checks the database, because a revoked certificate keeps a valid seal",
        "A podcast made from the same lessons: 36 episodes and 338 minutes with two voices, synthesised block by block and therefore resumable",
        "Paid access hangs off a date, not off a yes/no: a webhook that fails cannot leave anyone unlocked forever",
        "The trial week is granted once per account, checked against a database marker and against the history at Stripe",
        "The notice about the paid renewal sits outside the terms; without it the clause would be a surprising one under § 305c BGB and therefore void",
        "The foundations course needs no account and no payment details",
      ],
      stack: [
        {
          group: "Web",
          items: ["Next.js 16", "React 19", "TypeScript", "Tailwind"],
        },
        {
          group: "Mobile",
          items: ["Expo SDK 57", "React Native", "Shared core"],
        },
        {
          group: "Data & money",
          items: [
            "Supabase / Postgres",
            "Row Level Security",
            "Stripe",
            "Resend",
          ],
        },
        {
          group: "Content",
          items: ["Markdown as the source", "Derived JSON", "ElevenLabs"],
        },
      ],
      metrics: [
        { value: "111", label: "lessons" },
        { value: "813", label: "cards to revise" },
        { value: "664", label: "exam questions" },
        { value: "147", label: "tests" },
      ],
      links: [{ label: "bitdojo.de", href: "https://bitdojo.de", kind: "live" }],
      architecture: "bitdojo",
      shots: [
        {
          src: "/shots/bitdojo-desktop.webp",
          alt: "Home page of bitdojo.de: the headline “from your first term to your own product”, below it the platform’s figures.",
          width: 1440,
          height: 730,
          label: "bitdojo.de",
        },
        {
          src: "/shots/bitdojo/lektion.webp",
          alt: "A lesson in the foundations course: running text with two term boxes for DNS and IP address, on the right the table of contents.",
          width: 1440,
          height: 1220,
          label: "The term box is the flashcard",
        },
        {
          src: "/shots/bitdojo/telefon-lektion.webp",
          alt: "The same lesson in the app: title, the labels foundations and free, twelve minutes of reading time, below it the running text with a highlighted key sentence; a bar at the bottom offers Done and Quiz.",
          width: 1284,
          height: 2778,
          label: "The same lesson, in the app",
          variant: "phone",
        },
        {
          src: "/shots/bitdojo/telefon-quiz.webp",
          alt: "The exam for the lesson: question 1 of 6, four answers to choose from, the correct one outlined in green with a tick, below it the explanation in full.",
          width: 1284,
          height: 2778,
          label: "The exam comes from the same text",
          variant: "phone",
        },
        {
          src: "/shots/bitdojo/telefon-hoeren.webp",
          alt: "The listening area: one episode per module with its running time, the current one marked as playing, at the bottom the player with 15 seconds back, pause and 30 seconds forward.",
          width: 1284,
          height: 2778,
          label: "And as a podcast, from the same texts",
          variant: "phone",
        },
      ],
    },

    {
      id: "dartile",
      index: "06",
      name: "Dartile",
      tagline: "A darts counter that records every single dart",
      year: "2026",
      role: "Sole developer",
      statusLabel: "Web live, apps in review",
      accent: "cyan",
      problem:
        "Darts counters store the total of a visit. From a total you cannot draw a hit map, cannot compute a doubles rate, and cannot say whether someone missed the 20 high or low. Yet those are exactly the numbers that make someone keep a counting app at all.",
      solution:
        "Every dart is recorded on its own, through a grid of five by five tiles and three taps per visit. Hence the name. What gets stored is the event list, not the score: undo is a truncation, merging is an append, and the statistics can be recomputed later and more precisely. On top of that eight game types, a call-out built from pre-recorded audio, and a camera that suggests instead of asserting.",
      hardPart: {
        title: "The camera suggests, it does not assert",
        body: "Detection with a phone camera lands around 95 per cent in the field. Sell that as certainty and every twentieth visit writes a wrong number into a statistic nobody ever corrects. Dartile calibrates by hand over four points, evaluates by image difference rather than a model, shows its confidence, and asks below the threshold. Two real bugs surfaced only in the running image and from no test: with three darts inside a fifth of a second the evaluation reported only the largest changed region, and a dart that landed while a confirmation was open became the new reference state and never appeared at all.",
      },
      highlights: [
        "An event list instead of a score: undo is a truncation, merging two devices is an append. There is no case where somebody has to decide which state wins",
        "The game engine is its own package, pure: no clock, no storage, no React, zero dependencies, 222 tests",
        "Eight game types and two training drills, all free, all offline",
        "175 pre-recorded call-outs per language instead of runtime speech, 350 files for German and English: no server cost per throw and no caller that goes silent without reception",
        "Online play transmits throws with a sequence number; a gap triggers a refetch, a duplicate bounces off the database key",
        "Shout-outs are six fixed keys and not free text: free text between strangers raises the age rating in both stores",
        "24 goals and achievements, computed entirely on the device, showing progress instead of a padlock",
        "Eight languages, and the paywall asks the server first whether there is anything to buy at all",
      ],
      stack: [
        {
          group: "App",
          items: ["Expo SDK 57", "React Native", "TypeScript", "expo-iap"],
        },
        {
          group: "Engine",
          items: ["Plain TypeScript", "Zero dependencies", "Vitest"],
        },
        {
          group: "Web & data",
          items: [
            "Next.js",
            "Vercel",
            "Supabase / Postgres",
            "Row Level Security",
          ],
        },
        {
          group: "Voice & vision",
          items: ["ElevenLabs, pre-recorded", "Image difference, not a model"],
        },
      ],
      metrics: [
        { value: "284", label: "tests" },
        { value: "8", label: "game types" },
        { value: "350", label: "call-outs, two languages" },
        { value: "0", label: "dependencies in the engine" },
      ],
      links: [{ label: "dartile.de", href: "https://dartile.de", kind: "live" }],
      architecture: "dartile",
      articles: ["eighteen-routes-over-the-bull"],
      shots: [
        {
          src: "/shots/dartile-desktop.webp",
          alt: "Home page of dartile.de: the headline “the darts counter that works in the club cellar” next to a drawn dartboard.",
          width: 1440,
          height: 799,
          label: "dartile.de",
        },
        {
          src: "/shots/dartile/spiel.webp",
          alt: "The scoring screen: both players with remaining points and average at the top, below the large remaining score and the grid of input tiles.",
          width: 818,
          height: 1299,
          label: "Readable from two metres",
          variant: "phone",
        },
        {
          src: "/shots/dartile/checkout.webp",
          alt: "The same screen at 141 remaining: below it the suggested route T20, T19, D12.",
          width: 818,
          height: 1299,
          label: "Checkout suggestion · T20 T19 D12",
          variant: "phone",
        },
        {
          src: "/shots/dartile/statistik.webp",
          alt: "The evaluation of a match: three-dart average, first nine, darts thrown, checkout rate, number of 180s and best leg, per player.",
          width: 818,
          height: 1299,
          label: "Computed from every single dart",
          variant: "phone",
        },
      ],
    },

    {
      id: "lexipulse",
      index: "07",
      name: "LexiPulse",
      tagline: "A complete reader for EPUB, PDF and web articles: word stream or running text",
      year: "2026",
      role: "Sole developer",
      statusLabel: "Web live, both stores in review",
      accent: "violet",
      problem:
        "RSVP readers show text word by word in one fixed spot. Two things regularly make them useless. The pivot drifts: if the highlighted character does not land in the same screen column every time, the eye has to re-acquire it, and that is exactly the time the method is supposed to save. And PDFs arrive as garbage: running heads repeat on every page, footers carry page numbers, tables come through as space-aligned noise, and words are cut in half at the line break.",
      solution:
        "A reader that solves both without the document leaving the device. The pivot is arithmetic rather than approximate: translateX((focusColumn − orp)ch) on a monospace face. The cleanup detects running heads, footers, page numbers, table-of-contents dot leaders and table rows, and rejoins split words, before a single word reaches the player. Import from EPUB, PDF, TXT, Markdown, HTML and from a web address.",
      hardPart: {
        title: "The same pace for every word is the mistake",
        body: "Flat RSVP gives a three-letter article the same time budget as a sentence boundary, and that is exactly where comprehension collapses. Here the factors compose: a word core longer than eight characters times 1.25, sentence end times 1.75, clause end times 1.75, paragraph end times 2.0, digits times 1.4, a core of three characters or fewer times 0.9. Abbreviations and ordinals are excluded from the sentence rule so that “e.g.” and “1.” do not stall the stream. On top of that a warm-up: after every resume the first words run at 40 per cent of the target pace, because dropping straight into 900 words per minute from a standstill is the single most common reason for reading nothing at all. And the clock consumes an absolute timestamp rather than frame deltas, so a dropped frame cannot make the stream drift.",
      },
      highlights: [
        "packages/core with no DOM, no React Native and no Node built-ins: the same engine and the same parsers on web and on device, 360 of the 469 tests live there",
        "Two ways to read on one position: pause the word stream, switch to running text, and you are on the same word",
        "The pivot is arithmetic, not an approximation: translateX on a monospace face",
        "Character indices are code points, never UTF-16 offsets: an emoji or a combining mark cannot be split in half",
        "The recognition point derives from a word’s alphanumeric core, so a leading quotation mark does not move it",
        "Seven import paths, one of them a web address; the server fetches the page only to get around CORS and does not store the URL",
        "Looking a word up works offline: the reader shows where else it occurs in the document. Handing it to another app is a separate step; the app itself sends nothing",
        "Everything stays on the device: IndexedDB in the browser, SQLite on the phone, full data export as JSON under Art. 20 GDPR",
        "A backup you can restore: on merge the reader recognises the same book by its content rather than its id, so the reading position does not jump back",
        "The source is fully public, under PolyForm Noncommercial: readable and checkable, but not licensed for commercial use",
      ],
      stack: [
        {
          group: "Core",
          items: ["TypeScript", "Platform-free", "Vitest"],
        },
        {
          group: "Web",
          items: ["Next.js 15 App Router", "PWA", "IndexedDB", "pdf.js"],
        },
        {
          group: "Mobile",
          items: ["Expo SDK 57", "React Native", "SQLite"],
        },
      ],
      metrics: [
        { value: "469", label: "tests" },
        { value: "7", label: "import formats" },
        { value: "0", label: "documents on a server" },
        { value: "2", label: "platforms, one core" },
      ],
      links: [
        { label: "lexipulse.de", href: "https://lexipulse.de", kind: "live" },
        {
          label: "Source code",
          href: "https://github.com/DomenicMoran/lexipulse",
          kind: "code",
        },
      ],
      architecture: "lexipulse",
      shots: [
        {
          src: "/shots/lexipulse-desktop.webp",
          alt: "Home page of lexipulse.de: the headline “reading without the eyes jumping” next to a running demonstration of the reader.",
          width: 1440,
          height: 728,
          label: "lexipulse.de",
        },
        {
          src: "/shots/lexipulse/reader.webp",
          alt: "The reader after importing a Wikipedia article: the word “Wikipedia” sits large in the centre, its recognition letter highlighted in colour between two vertical guides.",
          width: 1440,
          height: 900,
          label: "Read straight from its address",
        },
        {
          src: "/shots/lexipulse/wortstrom.webp",
          alt: "The reader on a phone: at the top the word „zu“ with its coloured recognition character between two strokes, below it the player, and at the bottom the same text as running text with exactly that word highlighted.",
          width: 860,
          height: 1864,
          label: "Word stream and running text on the same word",
          variant: "phone",
        },
        {
          src: "/shots/lexipulse/bibliothek.webp",
          alt: "The library: a web article with 1,656 words, remaining time and progress, plus tags and delete. Below it the My data area with download backup and restore backup.",
          width: 860,
          height: 1864,
          label: "The backup goes back in, not just out",
          variant: "phone",
        },
      ],
    },
  ],

  about: {
    eyebrow: "Who I am",
    portrait: "/portrait-dark.jpg",
    portraitPrint: "/portrait.jpg",
    title: `${learningYears} learning. ${buildTimeTitle} shipping.`,
    paragraphs: [
      `I taught myself software engineering from 2022: first through structured courses from Meta and Udemy, then through my own projects. No computer science degree, no bootcamp. In 2026 it turned serious: seven production systems in ${buildTime}, five apps in the Play Store and three of them in the App Store as well, three more sitting in review there, one of the systems carrying statutory fiscal signing. All of it built alongside a full-time job.`,
      "What I learned doing it now governs how I work: a green test run proves nothing. I had an Android widget whose tests all passed but which rendered empty on a real device. And I spent months believing my update delivery worked, because the tool reported “Published” after every release. Not a single user ever received anything.",
      "Since then the same rule sits in every one of my repositories: “should work now” is not a result. Every change is verified against the live system: by HTTP response, database query, or a screenshot from a real device. That is why I can ship fast with AI agents without quality becoming a claim.",
    ],
    stats: [
      {
        value: verified.commitsHead.replace(".", ","),
        label: "commits since March 2026",
        note: "alongside a full-time job",
      },
      { value: "7", label: "systems in production", note: "all built alone" },
      {
        value: "8",
        label: "store listings live",
        note: "5 Play, 3 App Store",
      },
      {
        value: "2022",
        label: "self-taught since",
        note: "Meta & Udemy certificates",
      },
    ],
    /* `dateLong` und nicht der rohe Wert: Hier stand „Measured on
       2026-08-06“, während drei andere englische Stellen denselben Stempel
       als „6 August 2026“ setzen, zwei Datumsformate auf einer Seite, und
       das maschinenlesbare mitten im Satz. Die Formatierung liegt seitdem in
       `src/lib/date-format.ts`, für beide Sprachen. */
    statsHinweis: `Measured on ${dateLong(verified.date)} through the GitHub API, with git rev-list --count across all ${verified.repos} repositories: the six monorepos behind MenuCloud, Salati, NOURI, BitDojo, Dartile and LexiPulse, this site and the four published packages. Counted on the main branch, and only what is actually on GitHub. Local commits do not count. A scheduled job refreshes the number daily; it keeps growing, so any deviation is higher, not lower.`,
    timelineLabel: "Path",
    timeline: [
      {
        /* „April 2026" statt „04/2026": Das Zahlenformat ist eine deutsche
           Gewohnheit. Ein englischer Leser liest hier eine Zeitangabe, keine
           Aktennummer, und die Zeile daneben sagt schon „since 2022", also
           ohne Monat. */
        period: "since April 2026",
        title: "Founder & sole developer",
        org: "MenuCloud, sole proprietorship, Berlin",
        body: "Building and running seven production systems as the only developer: product, architecture, delivery, operations and compliance in one pair of hands.",
        current: true,
      },
      {
        period: "since 2022",
        title: "Software engineering, self-taught",
        org: "Meta (Coursera) · Udemy · own projects",
        body: "No CS degree, no bootcamp. The evidence is seven systems in production and a git history anyone can check.",
        current: true,
      },
    ],
    openSource: {
      label: "Open source",
      lede: "My production systems stay private, they carry customer data and licensed content. What is published is what could be lifted out of them: the tools built along the way, and the rules that followed from the mistakes.",
      items: [
        {
          name: "verified-done",
          href: "https://github.com/DomenicMoran/verified-done",
          body: "Four Claude Code skills against the claim with nothing behind it. Each comes from a bug that shipped, and says which one.",
          meta: "Claude Code · 4 skills · 16 tests · zero dependencies",
        },
        {
          name: "cron-last-due",
          href: "https://github.com/DomenicMoran/cron-last-due",
          body: "When was this cron job last due? Timezone-aware, built for watchdogs. Came out of a blanket rule that false-alarmed every weekend.",
          meta: "TypeScript · 23 tests · zero dependencies",
        },
        {
          name: "whisper-ggml-header",
          href: "https://github.com/DomenicMoran/whisper-ggml-header",
          body: "Reads a Whisper model header and says whether whisper.cpp will load it. Catches the common mis-conversion that is refused without a message.",
          meta: "TypeScript · CLI · 17 tests",
        },
        {
          name: "arabic-normalize",
          href: "https://github.com/DomenicMoran/arabic-normalize",
          body: "Normalising Arabic script for comparison. Solves a speech model emitting “علی” where the source has “علي”. Identical to the ear, different to ===.",
          meta: "TypeScript · 23 tests · zero dependencies",
        },
        {
          name: "darts-checkout",
          href: "https://github.com/DomenicMoran/darts-checkout",
          body: "The checkout table out of Dartile. On 40 there are more than eighty correct routes and exactly one that gets thrown. The package exists because of a bug: eighteen remainders ran over the bull although an equally long route avoided it, and the test only looked at the finishing dart.",
          meta: "TypeScript · 25 tests · zero dependencies",
        },
        {
          name: "portfolio",
          href: "https://github.com/DomenicMoran/portfolio",
          body: "This site. Next.js 16 with React Server Components, documented architecture decisions, and the reasoning behind why the CSP looks the way it does.",
          meta: "TypeScript · Lighthouse 100 accessibility",
        },
      ],
    },
    certificates: {
      label: "Certificates",
      note: "Every entry opens the issuer’s verification page.",
      noteHref: {
        label: "All ten also kept as PDFs",
        href: "https://github.com/DomenicMoran/certificates",
      },
      groups: [
        {
          issuer: "Meta, via Coursera",
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
          issuer: "LearnQuest, via Coursera",
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
              name: "App development with Swift 5 for iOS 15, incl. SwiftUI 2 (39 h)",
              href: "https://ude.my/UC-0f3b4b66-20ef-4b2b-8bfc-a7da7a1290fc",
              date: "2022-08-17",
            },
          ],
        },
      ],
    },
  },

  workflow: {
    eyebrow: "How I work",
    title: "AI is a tool, not an excuse",
    lede: "I have worked agent-assisted for over a year. It compresses delivery from months to days, but only because there is a system around the agents that catches their mistakes. Without it, AI-assisted development is a machine for producing plausible-looking rubbish.",
    principles: [
      {
        n: "01",
        title: "Context as versioned code",
        /* Siehe die Begründung an derselben Stelle in `site.ts`: Am 08.08.2026
           trugen vier von sechs Repositories eine Konventionsdatei, seither
           alle sechs. */
        body: "Every project carries its conventions as a file in the repository: import rules, test patterns, design tokens, security defaults. Plus a memory that persists across sessions: every lesson becomes an entry with its reasoning, not a note in a chat log that is gone tomorrow. An agent is only as good as the context it reliably finds.",
        artifacts: [
          "A conventions file per repo",
          "Persistent memory",
          "Append-only project log",
        ],
      },
      {
        n: "02",
        title: "Parallel work instead of waiting",
        body: "Long runs such as builds, test suites and store uploads go to the background while I keep working. Independent research goes to specialised sub-agents with their own context window. The bottleneck in agent-assisted development is rarely the model; it is the serialised way of working in front of it.",
        artifacts: ["Sub-agents", "Background tasks", "Turborepo caching"],
      },
      {
        n: "03",
        title: "Verification instead of trust",
        body: "“Should work now” is not a result. Every claim about system state needs evidence: an HTTP response, a database query, a Playwright screenshot, a received email, an actual cron execution. This rule has repeatedly surfaced bugs in my own projects that had slipped through green test suites, because the tests were checking the wrong thing.",
        artifacts: [
          "Playwright against production",
          "Screenshot diffs",
          "Live database checks",
        ],
      },
      {
        n: "04",
        title: "Recurring fixes become automation",
        body: "When I do the same thing a third time, it becomes a workflow. Cron-aware watchdogs monitor services, heal known failures themselves, and report to Slack. Always with guardrails: a cooldown, a cap, an alert on every intervention. A watchdog that repairs blindly does more damage than it prevents.",
        artifacts: [
          "n8n workflows with self-healing",
          "Cooldown and cap",
          "Slack ops alerts",
        ],
      },
      {
        n: "05",
        title: "Compliance as definition of done",
        body: "Every customer-facing feature passes the same gate: is there a lawful basis under GDPR? Does outreach respect German unfair-competition law? EU AI Act Art. 50: is the AI labelled as such? Does the site promise anything we do not deliver? For consumer products in the EU that is not an extra; it is part of the product.",
        artifacts: [
          "GDPR Art. 30",
          "Automated processing agreements",
          "AI Act disclosure",
        ],
      },
    ],
    demo: {
      label: "A real bug, re-enacted:",
      note: "A replay, not a live session. Cause, file and change are in commit bce08f5e.",
      lines: [
        {
          kind: "prompt",
          text: "Widget shows stale prayer times on the phone",
        },
        {
          kind: "think",
          text: "Tests green, typecheck green, not reproducible in the emulator",
        },
        {
          kind: "run",
          text: "Instrumented the headless task: WIDGET_UPDATE fires, finds no handler",
        },
        { kind: "warn", text: "registerWidgetTaskHandler never runs" },
        {
          kind: "think",
          text: "Android is loading index.js instead of index.android.js",
        },
        {
          kind: "think",
          text: 'Metro skips platform resolution for "main" when the extension is spelled out',
        },
        {
          kind: "run",
          text: 'package.json: "main": "index.js" becomes "index"',
        },
        {
          kind: "ok",
          text: "Widget updates in the background · commit bce08f5e",
        },
      ],
    },
    speed: {
      eyebrow: "Delivery pace",
      title: "The difference is not that I type faster.",
      lede: "It is that research, implementation, testing and verification run in parallel rather than in sequence, and that context does not get lost between sessions. What that produces can be counted.",
      facts: [
        {
          value: String(salatiDays),
          label: "days",
          note: `from the first commit on 16 April 2026 until the verification date, ${dateLong(verified.date)}`,
        },
        {
          value: String(SALATI_VERSIONS),
          label: "versions shipped",
          note: `1.0.0 to ${SALATI_STAND}, listed in the app’s own changelog`,
        },
        {
          value: `${salatiHoursPerVersion} h`,
          label: "per version on average",
          note: `${salatiDays} days divided by ${SALATI_VERSIONS} versions`,
        },
      ],
      note: `Figures for Salati, counted on ${dateLong(verified.date)} in the app’s changelog file. Three further systems were in production alongside it.`,
    },
  },

  skills: {
    eyebrow: "Capabilities",
    title:
      "Broad enough for the whole product, deep enough for the hard parts.",
    lede: "There are no percentages here. Nobody can check whether someone knows TypeScript to 93 per cent, so next to each capability stands the evidence it came from.",
    domains: [
      {
        id: "frontend",
        title: "Frontend & product",
        summary:
          "Interfaces that work as well on a five-year-old Android as on a studio display.",
        skills: [
          {
            name: "React / Next.js App Router",
            evidence: "Next.js 16 RSC in production",
          },
          {
            name: "React Native / Expo",
            evidence: "Expo SDK 57, RN 0.86, four device classes",
          },
          {
            name: "TypeScript",
            evidence: "Strict everywhere, 0 errors as a merge gate",
          },
          {
            name: "Motion & interaction",
            evidence: "Reanimated 4, Framer Motion",
          },
          {
            name: "Core Web Vitals",
            evidence:
              "Lighthouse cron against production, per‑route bundle budget",
          },
          {
            name: "Accessibility",
            evidence: "TV focus navigation, reduced motion",
          },
        ],
      },
      {
        id: "backend",
        title: "Backend & data",
        summary:
          "Multi-tenant systems with real money, real tax law and real consequences when they fail.",
        skills: [
          {
            name: "Postgres / Supabase",
            /* Siehe die Begründung in `site.ts`: Die 59 Tabellen sind NOURI,
               RLS ist MenuCloud. */
            evidence: `RLS per tenant, ${verified.migrationen} migrations (MenuCloud)`,
          },
          {
            name: "API design",
            evidence: "Fastify, route handlers, Zod validation",
          },
          { name: "Payments", evidence: "Stripe Connect destination charges" },
          {
            name: "Multi-tenancy",
            evidence: "RLS plus per-tenant provisioning",
          },
          {
            name: "Mail infrastructure",
            evidence: "Self-hosted stack with a fallback chain",
          },
          {
            name: "Compliance systems",
            evidence: "§ 146a AO signing, GDPR Art. 30",
          },
        ],
      },
      {
        id: "cloud",
        title: "Cloud, delivery & operations",
        summary:
          "I run what I build, including the night shift when something falls over.",
        skills: [
          { name: "Vercel / edge", evidence: "Static exports, rewrites, ISR" },
          {
            name: "Docker / Coolify / Hetzner",
            evidence: "Own VPS stack in production",
          },
          { name: "CI/CD", evidence: "GitHub Actions, Turborepo, EAS Build" },
          {
            name: "Store delivery",
            evidence: "App Store & Play, including OTA updates",
          },
          {
            name: "Observability",
            evidence: "Sentry, Uptime Kuma, Slack alerts",
          },
          { name: "Automation", evidence: "n8n workflows with self-healing" },
        ],
      },
      {
        id: "ai",
        title: "AI integration",
        summary:
          "From the agent pipeline in my editor to the answer the user’s phone finds without a network.",
        skills: [
          {
            name: "Agent orchestration",
            evidence: "Sub-agents, tool pipelines, loops",
          },
          {
            name: "On-device inference",
            evidence: "whisper.rn, speech recognition without a network",
          },
          {
            name: "RAG & retrieval",
            evidence: "Own corpus, granularity measured",
          },
          {
            name: "Prompt engineering",
            evidence: "Verse conditioning beats model size",
          },
          {
            name: "Evaluation",
            evidence: "Local iteration against the same Whisper model",
          },
          {
            name: "AI regulation (EU AI Act)",
            evidence: "Art. 50 disclosure as a gate",
          },
        ],
      },
    ],
  },

  recruiter: {
    eyebrow: "For recruiters & CTOs",
    title: "The essentials in two minutes",
    lede: "No cover letter needed. Here is what I can do, what I am looking for, and how to reach me.",
    facts: [
      // Titelschreibung wie überall sonst auf der englischen Fassung. Als
      // Wert einer Beschriftung ist die Rolle ein Titel, kein Fließtext, im
      // Positionierungssatz des Kurzprofils bleibt sie klein, weil sie dort
      // mitten im Satz steht. "Full-stack" mit Bindestrich, so schreibt man es
      // im Englischen.
      { label: "Role", value: "AI Product Engineer / Full-stack" },
      { label: "Focus", value: "Product end to end, AI-assisted delivery" },
      {
        label: "Looking for",
        value:
          "A product team where I take a feature all the way into production",
      },
      { label: "Location", value: LOCATION },
      { label: "Available", value: ENTRY },
      { label: "Languages", value: LANGUAGES },
      { label: "Model", value: "Permanent employment" },
      /* Siehe die Begründung in `site.ts`: Der Kontaktbereich bittet um den
         Gehaltsrahmen, also nennt die Seite ihren eigenen. */
      { label: "Salary", value: SALARY },
      {
        label: "Source code",
        value: "Open source on GitHub · production repos on request",
      },
    ],
    strengths: [
      {
        title: "I ship finished, not nearly finished",
        body: "Seven systems in production, including store reviews, payment processing, GDPR documentation and legal notices. The part most portfolios leave out is exactly the part that takes longest.",
        proof: "#work",
        proofLabel: "The seven case studies",
      },
      {
        title: "I work across the whole stack",
        body: "React Native widget, Postgres migration, Docker Compose on my own VPS, fiscal compliance. No ticket ping-pong because something is “not my area”.",
        proof: "#case-menucloud",
        proofLabel: "MenuCloud in detail",
      },
      {
        title: "I prove it rather than claim it",
        body: "A green test run proves nothing. I learned that twice, expensively. So every change is verified against the live system before it counts as done. That is what makes agent-assisted development dependable.",
        proof: "/en/articles/published-is-not-proof",
        proofLabel: "“Published” is not proof",
      },
      {
        title: "I know the way through the app stores",
        body: `${SALATI_VERSIONS} versions shipped for Salati alone, plus eight public store listings across both stores and three more apps sitting in review right now. 14 languages, four device classes from phone to television. Rejections in review, age ratings, privacy forms and signing chains are routine here, not new ground.`,
        proof: "#case-salati",
        proofLabel: "Salati in detail",
      },
      {
        title: "I treat regulation as part of the product",
        body: "German fiscal requirements under § 146a AO, GDPR processing agreements, disclosure duties for AI features. I know these from shipping them with customers, not from a summary. Handle them after launch and you build the thing twice.",
        proof: "/en/articles/german-till-law-in-practice",
        proofLabel: "German till law in practice",
      },
      {
        title: "I work with agents without handing over control",
        body: "The leverage is not typing speed. It is context, written-down conventions and review loops a model cannot talk its way past. I let agents draft. The architecture, the boundaries and the sign-off stay with me.",
        proof: "https://github.com/DomenicMoran/verified-done",
        proofLabel: "verified-done on GitHub",
      },
    ],
    cta: {
      pdf: { label: "One-pager as PDF", href: "/domenic-moran-one-pager.pdf" },
      // Siehe `site.ts`: Der Name muss ohne den Knopf darüber tragen.
      web: { label: "One-pager in the browser", href: "/en/onepager" },
      mail: { label: "Email me" },
      copy: {
        label: "Copy address",
        done: "Address copied",
        failed: "Copying failed, the address is right there",
      },
    },
  },

  contact: {
    eyebrow: "Contact",
    title: "Let’s build something",
    lede: `A concrete role, a question about one of the projects, or just a technical question: I usually reply within ${REPLY_HOURS} hours.`,
    hinweis:
      "Deliberately no form: that would need a delivery service as a data processor and an endpoint that can fail. A mail address can do neither, and you keep a copy of your message in your own sent folder.",
    copy: "Copy address",
    copied: "Copied",
    checkliste: {
      titel: "What helps me in a first email",
      punkte: [
        "What it is about: role, project or question",
        "What you are building and with what",
        "How soon you want to start",
        // Siehe `site.ts`: „your“ statt nur „the“, seit die Kachel darüber
        // die eigene Spanne nennt.
        "For roles: your salary range, so we both save time",
      ],
    },
    fakten: [
      { label: "Response time", wert: `Usually under ${REPLY_HOURS} hours` },
      { label: "Languages", wert: "German · English" },
      { label: "Location", wert: LOCATION },
    ],
  },

  footer: {
    legalNote:
      "Legal notice and privacy policy are in German. They satisfy German law and are addressed to German authorities.",
    impressum: "Legal notice",
    datenschutz: "Privacy",
    navLabel: "Page",
    contactLabel: "Contact",
    legalLabel: "Legal",
    onepager: "One-pager as PDF",
    sourceLabel: "Source code of this site",
    sourceHref: "https://github.com/DomenicMoran/portfolio",
    printNote: `Printed from domenicmoran.de. Domenic Moran, Berlin. Every figure on this page is verified against the repositories, as of ${dateLong(verified.date)}.`,
  },

  demoNouri: {
    title: "A day, put together",
    lede: "Twelve dishes from the catalogue, with the per-portion values stored there. Set a target and let it run: it checks all 4,096 possible combinations and takes the one with the most protein that stays under the target.",
    mealsLabel: "Choose dishes",
    units: {
      kcal: "kcal",
      /* Kleingeschrieben, weil diese vier zweimal auftauchen: als
         Beschriftung der Kacheln, die das Stylesheet ohnehin in
         Großbuchstaben setzt, und mitten im Satz. Dort stand „198 g
         Protein“ und „Protein 39 % · Carbs 42 %“, deutsche Großschreibung
         in englischem Fließtext. `kcal` machte es schon richtig. */
      protein: "protein",
      carbs: "carbs",
      fat: "fat",
      fiber: "fibre",
    },
    targetLabel: "Daily target",
    solve: "Put a day together",
    solveNote: "{n} combinations checked in {ms} ms",
    noFit: "No meal fits under this target",
    below: "{n} kcal below the target",
    fieldLabel: "All 4,096 combinations, calories across, protein up",
    field: {
      x: "Calories",
      y: "Protein",
      best: "the best possible at that calorie count",
      chosen: "chosen",
      target: "Target",
    },
    note: "Values from the NOURI catalogue (11,892 recipes, these twelve are the curated ones). Energy split via the standard 4/4/9 kcal per gram. The target is the visitor’s: in the app it comes from the profile, and one invented here would be the only figure on this site without evidence.",
  },
  demoDartile: {
    title: "The checkout table, computed here",
    lede: "No lookup in a stored table: this panel loads darts-checkout from npm, the same package that runs in the app. Every move of the slider searches all routes to that remainder and ranks them the way they are thrown: start high, finish on a large even double, and go for the bull only when there is no way around it.",
    restLabel: "Remaining",
    outLabel: "Out mode",
    outs: { doppel: "Double out", master: "Master out", gerade: "Straight" },
    best: "The suggestion",
    alternatives: "Same length, different order",
    noWay: "Not possible with three darts.",
    bogey:
      "Exactly seven remainders below 170 cannot be finished with three darts on a double out: {liste}. They are nowhere in the code as a list, they fall out of the search; the library keeps them only as a fixture in the test.",
    speed: "{n} routes checked in {ms} ms",
    speedOhneZeit: "{n} routes checked",
    fieldLabel:
      "Every remainder from 2 to 170, coloured by how many darts it takes; the gaps are the bogey numbers",
    legend: {
      eins: "one dart",
      zwei: "two",
      drei: "three",
      keiner: "gap: none at all",
    },
    note: "darts-checkout 1.0.0 (MIT), computed in the browser without a single request leaving it. The same package is public on npm: install it and you get the same strings, which is how you check that this is computed rather than read off.",
  },
  demoSalati: {
    title: "A year of prayer times, computed right here",
    lede: "Not a screenshot and not a re-creation: this panel loads the same library that runs in the shipped app. Every stroke is one day, every line one prayer time. The switch on the right is where this got genuinely hard in production.",
    placeLabel: "Choose a city",
    prayers: {
      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    },
    next: "Up next",
    dayDone: "All of today has passed",
    failed: "not computed",
    ruleLabel: "High-latitude rule",
    rules: {
      auto: "as the app ships",
      angle: "twilight angle",
      seventh: "seventh of the night",
      middle: "middle of the night",
    },
    autoIst: "“as the app ships” uses {regel} here",
    dayLabel: "Day of the year",
    spread: "Spread between the rules",
    gap: "{n} days without a result",
    legend: {
      active: "selected rule",
      others: "the other two",
    },
    speed: "{ms} ms",
    today: "today",
    note: "adhan 4.4.4 (MIT), method 13 Diyanet, school 0 Shafi. 8,760 points in time, computed in the browser, without a single request leaving it. This is exactly how the app computes when there is no network.",
    hardPart:
      "Above roughly 48° the sun never drops far enough below the horizon in summer, and Fajr and Isha are no longer well defined. The three common rules then drift apart: in Berlin, in June, by more than two hours. A user report saying “the prayer times are wrong” led exactly here. The app picks the twilight-angle rule, not because it is more correct, but because it matches what users compare against. In Tromsø even that leaves the days shown above without a result: the night the calculation refers to does not happen there.",
  },
  onepager: {
    title: "One-pager",
    description:
      "One-page profile of Domenic Moran, AI product engineer in Berlin: seven systems in production, path and contact on a single page.",
    positioning:
      "AI product engineer with seven systems in production, each built " +
      "alone: apps in both stores, a multi-tenant restaurant SaaS with statutory " +
      "fiscal signing, a learning platform, an autonomous agent. {commits} commits since March 2026, " +
      "alongside a full-time job. Self-taught in software development since 2022. " +
      "Focus: agent-assisted development with strict verification discipline: " +
      "a green test run is not proof.",
    projects: "Projects",
    focus: "Focus areas",
    path: "Path",
    pathNote:
      "Self-taught in software development: no degree, no bootcamp. " +
      "The evidence is seven systems in production.",
    openSource: "Published",
    openSourceNote: "all with tests, CI and an MIT licence on",
    fullCaseStudies: "Full case studies with architecture diagrams:",
    asOf: "As of",
    back: "← Back to the site",
    printHint:
      "Save as PDF: in the print dialogue, pick PDF as the destination instead of a printer.",
    printButton: "Print / PDF",
    atLeast: "Over",
  },

  notFound: {
    eyebrow: "Error 404",
    title: "This page does not exist.",
    body: "Either a typo slipped into the address, or I moved the page without leaving a redirect. If it is the latter: let me know and I will fix it.",
    onward: "Continue to",
    home: "Home",
    report: "Found something broken?",
    reportSubject: "Dead link on domenicmoran.de",
    reportPath: "The address that led nowhere",
    otherLanguage: {
      text: "This address does not exist.",
      link: "Continue on the English version",
    },
  },

  languageSwitch: {
    to: "de",
    label: "Deutsch",
    aria: "Diese Seite auf Deutsch",
  },
};