import type { Content } from "./types";

/**
 * English content.
 *
 * Not a literal translation. The German original leans on constructions that
 * do not survive word-for-word. What is preserved is the argument and the
 * evidence behind every number.
 *
 * The legal pages stay German: they exist to satisfy German law and are
 * addressed to German authorities. Translating them would create a second
 * version whose legal standing is unclear.
 */
export const en: Content = {
  lang: "en",
  site: {
    // The origin, not the path: buildMetadata appends "/en" itself. With the
    // full /en address here, the canonical came out as
    // "https://domenicmoran.de/en/en".
    url: "https://domenicmoran.de",
    name: "Domenic Moran",
    role: "AI Product Engineer",
    location: "Berlin, Germany",
    email: "domenicmoran@gmail.com",
    availability: {
      label: "Open to employment & freelance",
      detail: "Remote (EU) or hybrid in Berlin",
    },
    meta: {
      title: "Domenic Moran – AI Product Engineer",
      description:
        "Four systems in production, all built solo: apps in both stores, a multi-tenant SaaS with statutory fiscal signing, an autonomous agent. 3,971 commits in four months, alongside a full-time job.",
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
    openMenu: "Open menu",
    closeMenu: "Close menu",
    commandPalette: "Open command palette",
    currentSection: "Current section",
    replay: "Play the sequence again",
  },
  palette: {
    title: "Command palette",
    searchLabel: "Search",
    placeholder: "Search or jump …",
    empty: "Nothing found.",
    jump: "Jump to",
    pdf: { label: "One-pager as PDF", hint: "Print-ready summary" },
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
    lede: "Fullstack product engineer in Berlin. Four systems in production, built in four months alongside a full-time job: apps in both stores, a multi-tenant SaaS with statutory fiscal signing, an autonomous agent. All of it mine, from the migrations to the legal notice.",
    ctaPrimary: { label: "See the work", href: "#work" },
    ctaSecondary: { label: "For recruiters", href: "#hire" },
    proof: [
      { value: "4", label: "systems in production" },
      { value: "3,971", label: "commits in 4 months" },
      { value: "1,276", label: "API routes (MenuCloud)" },
      { value: "7,568", label: "test cases" },
    ],
  },

  work: {
    eyebrow: "Selected work",
    title: "Four products. All live. All built alone.",
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
    },
  },

  caseStudies: [
    {
      id: "salati",
      index: "01",
      name: "Salati",
      tagline: "Prayer and Quran platform for German speakers, with AI that runs offline",
      year: "2026",
      role: "Sole developer · product, code, stores, licensing",
      statusLabel: "Live in both stores",
      accent: "acid",
      problem:
        "Existing prayer apps are ad-funded, track aggressively, and treat the Quran reader as an afterthought. Anyone wanting to study in German (tafsir, translation, transliteration, isolated and connected letters) finds nothing coherent. And all of it breaks the moment the network drops.",
      solution:
        "An ad-free platform across five device classes: iOS, Android, Android TV, Wear OS and an HDMI stick for mosques. Prayer times are computed locally, the full reader with multiple reciters and translations works offline, and the question-answering model runs quantised on the device. No query ever leaves the phone.",
      hardPart: {
        title: "Speech recognition for Quranic recitation",
        body: "The memorisation mode has to hear whether a verse was recited correctly. The obvious route, a larger Whisper model, was the wrong one. The leverage was in the method: condition the model on the expected verse as a prompt, normalise Persian and Urdu letter variants before comparing, and score leniently rather than as pass or fail. A base model fine-tuned on Tarteel now beats one three times its size, at a fraction of the on-device latency.",
      },
      highlights: [
        "Five device classes from one monorepo: phone, tablet, Android TV, Wear OS, HDMI stick",
        "On-device LLM (GGUF via llama.cpp) with custom RAG over a curated corpus, no cloud call",
        "Whisper-based recitation checking with verse-conditioned prompting",
        "Complete Mushaf reader: four typefaces, tafsir, translation, word-level timestamps",
        "A 15-part German Quranic-Arabic podcast, produced through a two-voice ElevenLabs pipeline",
        "Over-the-air updates via EAS: content corrections without a store cycle",
        "iOS Live Activities and Android widgets for the next prayer time",
        "App and store copy maintained in 14 languages, across four device classes",
        "AI answers cite their source and carry an EU AI Act Art. 50 disclosure",
      ],
      stack: [
        { group: "Mobile", items: ["React Native 0.86", "Expo SDK 57", "Expo Router", "Reanimated 4", "TypeScript"] },
        { group: "On-device AI", items: ["llama.cpp / GGUF", "whisper.rn", "Custom RAG", "Prompt conditioning"] },
        { group: "Backend & delivery", items: ["Supabase", "Cloudflare R2", "EAS Build & Update", "Vercel", "Turborepo"] },
        { group: "Native", items: ["Android TV (Leanback)", "Wear OS", "Live Activities", "App Widgets"] },
      ],
      metrics: [
        { value: "5", label: "device classes" },
        { value: "14", label: "languages" },
        { value: "100 %", label: "AI runs on the device" },
        { value: "1,058", label: "commits" },
      ],
      links: [
        { label: "salati.pro", href: "https://www.salati.pro", kind: "live" },
        { label: "Instagram", href: "https://instagram.com/salatibox", kind: "social" },
      ],
      architecture: "salati",
      shots: [
        {
          src: "/shots/salati-tv.png",
          alt: "Salati's Quran reader on Android TV: the Arabic verse set large, transliteration and German translation below, remote-control hints at the bottom.",
          width: 1920,
          height: 1080,
          label: "Android TV · Leanback",
          variant: "screen",
        },
        {
          src: "/shots/salati-ki.png",
          alt: "Salati's AI answering a question from Quran and hadith on a phone, explicitly marked as AI-assisted and naming the source of the answer.",
          width: 1080,
          height: 2400,
          variant: "phone",
        },
      ],
    },
    {
      id: "menucloud",
      index: "02",
      name: "MenuCloud Berlin",
      tagline: "Multi-tenant SaaS for restaurants, including statutory fiscal signing",
      year: "2025–2026",
      role: "Founder & sole developer",
      statusLabel: "Live in production",
      accent: "violet",
      problem:
        "Berlin restaurants hand 15–30 % commission to delivery platforms and have no control over their own menu. The alternatives are website builders with no till integration, or enterprise systems with four-figure setup fees. Neither solves the problem every German restaurateur actually has: compliance with the cash-register law.",
      solution:
        "A platform covering the whole path: a restaurant site with a self-editable menu, QR ordering that pays out directly through Stripe Connect, reservations, reputation management. Underneath sits a multi-tenant cloud signing unit that signs every transaction under § 146a AO and anchors it in a hash chain. Plus native apps for owners and staff.",
      hardPart: {
        title: "Fiscal signing as a tenancy problem",
        body: "A signing unit is not simply an API call. Each tenant needs its own legally attributable unit, every transaction must sit in an unbroken hash chain, and an outage must never quietly produce unsigned revenue, which for the restaurateur would be an audit catastrophe. The answer is a per-tenant provisioned Fiskaly cloud unit with the chain persisted in `tse_transactions`, and a fail-closed path: no signature, no transaction.",
      },
      highlights: [
        "1,276 API routes across 812 versioned Postgres migrations",
        "Multi-tenant architecture with row level security per restaurant",
        "Stripe Connect destination charges: restaurants are paid directly, the platform fee is settled automatically",
        "§ 146a AO compliance: per-tenant Fiskaly cloud signing unit, hash chain persisted",
        "5,340 test cases (5,163 unit, 177 end-to-end), the end-to-end suite running against production",
        "Menu scanner: a PDF or a photo goes in, a structured menu comes out",
        "Self-hosted mail stack with a three-stage fallback chain",
        "GDPR Art. 30 record, data-processing agreement dispatched automatically on payment",
        "iOS and Android apps for owners and service staff",
      ],
      automation: {
        title: "46 workflows that keep the business running",
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
        { group: "Frontend", items: ["Next.js 16 App Router", "React 19 RSC", "TypeScript", "Tailwind"] },
        { group: "Backend & data", items: ["Supabase / Postgres", "Row Level Security", "Stripe Connect", "Fiskaly"] },
        { group: "Infrastructure", items: ["Hetzner", "Coolify", "Cloudflare", "Docker", "Mailcow", "n8n"] },
        { group: "Quality", items: ["Vitest", "Playwright", "Sentry", "Umami", "Lighthouse budgets"] },
      ],
      metrics: [
        { value: "1,276", label: "API routes" },
        { value: "812", label: "DB migrations" },
        { value: "5,340", label: "test cases" },
        { value: "EU", label: "hosting & data residency" },
      ],
      links: [
        { label: "menucloud-berlin.de", href: "https://menucloud-berlin.de", kind: "live" },
        { label: "Status page", href: "https://menucloud-berlin.de/status", kind: "live" },
        { label: "Instagram", href: "https://instagram.com/menucloudberlin", kind: "social" },
        { label: "YouTube", href: "https://youtube.com/@menucloudberlin", kind: "social" },
        ],
      architecture: "menucloud",
      shots: [
        {
          src: "/shots/menucloud-desktop.png",
          alt: "Home page of menucloud-berlin.de promising zero commission, GDPR and cash-register compliance, with a preview of the self-service admin.",
          width: 1440,
          height: 900,
          label: "menucloud-berlin.de",
        },
        {
          src: "/shots/menucloud-app.png",
          alt: "A restaurant page in the MenuCloud app on iPhone: menu, reservation, opening hours and description of a Berlin restaurant.",
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
      tagline: "An autonomous agent that reads the Berlin rental market faster than a human can",
      year: "2026",
      role: "Sole developer",
      statusLabel: "In personal use",
      accent: "cyan",
      problem:
        "A Berlin flat draws applicants in the hundreds. What decides it is not the best application but the first, within minutes of the listing going up. That is a race a human structurally cannot win, because humans sleep.",
      solution:
        "A locally running agent that scans five portals around the clock, checks each new listing against defined criteria, sends borderline cases to an LLM for a full-text assessment, and drafts an individual cover letter. It ships in REVIEW mode: it sends nothing without approval, until you deliberately switch it to automatic.",
      hardPart: {
        title: "An agent that does not act unasked",
        body: "What makes such a system appealing is also its risk: a bot sending applications with your real personal data can do real damage. So the shipped state is REVIEW: propose, do not send. Automatic mode exists, but as a deliberate user decision rather than the default. The same logic sits in the watchdogs on my other projects: self-healing always with a cooldown, a cap, and a visible alert on every intervention.",
      },
      highlights: [
        "Playwright with persistent Chrome profiles per portal: real sessions instead of brittle scrapers",
        "LLM full-text assessment with a rule-based fallback when no key is configured",
        "Local SQLite storage; the server binds to 127.0.0.1 by default",
        "REVIEW mode as the shipped state: nothing is sent without human approval",
        "Watchdog with automatic restart after a crash",
        "Multi-instance operation for parallel accounts, distributable package without personal data",
      ],
      stack: [
        { group: "Runtime", items: ["Node.js 22", "TypeScript", "Fastify", "Server-Sent Events"] },
        { group: "Automation", items: ["Playwright", "Persistent browser profiles", "Cron scheduler"] },
        { group: "Data & AI", items: ["node:sqlite", "Anthropic API", "Rule-based fallback"] },
      ],
      metrics: [
        { value: "5", label: "portals watched" },
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
      tagline: "Fitness and nutrition platform with a web app, a mobile app and its own API",
      year: "2026",
      role: "Sole developer",
      statusLabel: "Beta",
      accent: "violet",
      problem:
        "Nutrition apps are either trackers without planning or planners without real data. And almost all of them treat errors as cosmetics: when the server is unreachable they display “saved” and lose the entry.",
      solution:
        "A platform of web app, Expo app and Fastify API sharing a catalogue of nearly 12,000 recipes, with macro tracking, weekly planning, shopping lists, pantry management and training plans. And with an API that separates three states cleanly instead of obscuring them.",
      hardPart: {
        title: "Reporting failure honestly",
        body: "Every write endpoint distinguishes explicitly: secrets missing (dry run, no pretence that data was saved), database unreachable (503), database reachable but rejecting (a real 4xx carrying the Postgres error code). It sounds like a detail, but it is the difference between a system you can believe while debugging and one that lies to you.",
      },
      highlights: [
        "Monorepo with a shared catalogue across web, mobile and API",
        "59 tables across 12 versioned migrations, row level security active",
        "Supabase auth with cross-device profile sync",
        "Using the app without an account stays entirely local, no forced login",
        "Explicit failure states instead of silent 500s",
      ],
      stack: [
        { group: "Apps", items: ["Next.js", "Expo", "TypeScript", "Turborepo"] },
        { group: "Services", items: ["Fastify", "Supabase", "Postgres", "RLS"] },
        { group: "Delivery", items: ["Vercel", "pnpm workspaces"] },
      ],
      metrics: [
        { value: "11,892", label: "recipes in the catalogue" },
        { value: "59", label: "tables" },
        { value: "12", label: "migrations" },
      ],
      links: [
        { label: "nouri-fitness.vercel.app", href: "https://nouri-fitness.vercel.app", kind: "live" },
      ],
      architecture: "nouri",
      shots: [
        {
          src: "/shots/nouri-desktop.png",
          alt: "Home page of the NOURI platform showing the recipe catalogue, weekly planning and training section.",
          width: 1440,
          height: 900,
          label: "nouri-fitness.vercel.app",
        },
      ],
    },
  ],

  about: {
    eyebrow: "Who I am",
    portrait: "",
    title: "Four years learning. Four months shipping.",
    paragraphs: [
      "I taught myself software engineering from 2022: first through structured courses from Meta and Udemy, then through my own projects. No computer science degree, no bootcamp. In 2026 it turned serious: four production systems in four months, two of them shipping in both app stores, one carrying statutory fiscal signing, all of it built alongside a full-time job.",
      "What I learned doing it now governs how I work: a green test run proves nothing. I had an Android widget where every test passed and which rendered empty on a real device. And I spent months believing my update delivery worked, because the tool reported “Published” after every release. Not a single user ever received anything.",
      "Since then the same rule sits in every one of my repositories: “should work now” is not a result. Every change is verified against the live system: by HTTP response, database query, or a screenshot from a real device. That is why I can ship fast with AI agents without quality becoming a claim.",
    ],
    stats: [
      { value: "3,971", label: "commits in 4 months", note: "alongside a full-time job" },
      { value: "4", label: "systems in production", note: "all built alone" },
      { value: "2", label: "app stores", note: "iOS and Android, live" },
      { value: "2022", label: "self-taught since", note: "Meta & Udemy certificates" },
    ],
    statsHinweis:
      "All figures were measured on 1 August 2026 using git rev-list HEAD --count across the three monorepos behind Salati, MenuCloud and NOURI. Only the main branch is counted; across all refs it would be 4,162. Commit counts keep growing, so any deviation is upward, not downward.",
    timelineLabel: "Path",
    timeline: [
      {
        period: "since 04/2026",
        title: "Founder & product engineer",
        org: "MenuCloud, sole proprietorship, Berlin",
        body: "Building and running four production systems as the only developer: product, architecture, delivery, operations and compliance in one pair of hands.",
        current: true,
      },
      {
        period: "since 2022",
        title: "Software engineering, self-taught",
        org: "Meta (Coursera) · Udemy · own projects",
        body: "No CS degree, no bootcamp. The evidence is four systems in production and a git history anyone can check.",
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
          meta: "Claude Code · 4 skills · frontmatter validated in CI",
        },
        {
          name: "cron-last-due",
          href: "https://github.com/DomenicMoran/cron-last-due",
          body: "When was this cron job last due? Timezone-aware, built for watchdogs. Came out of a blanket rule that false-alarmed every weekend.",
          meta: "TypeScript · 21 tests · zero dependencies",
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
          name: "portfolio",
          href: "https://github.com/DomenicMoran/portfolio",
          body: "This site. Next.js 16 with React Server Components, documented architecture decisions, and the reasoning behind why the CSP looks the way it does.",
          meta: "TypeScript · Lighthouse 100 accessibility",
        },
      ],
    },
    certificates: {
      label: "Certificates",
      note: "Every entry opens the issuer's verification page. All ten are also kept as PDFs in the Zertifikate repository.",
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
        body: "Every project carries its conventions as a file in the repository: import rules, test patterns, design tokens, security defaults. Plus a memory that persists across sessions: every lesson becomes an entry with its reasoning, not a note in a chat log that is gone tomorrow. An agent is only as good as the context it reliably finds.",
        artifacts: ["A conventions file per repo", "Persistent memory", "Append-only project log"],
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
        artifacts: ["Playwright against production", "Screenshot diffs", "Live database checks"],
      },
      {
        n: "04",
        title: "Recurring fixes become automation",
        body: "When I do the same thing a third time, it becomes a workflow. Cron-aware watchdogs monitor services, heal known failures themselves, and report to Slack. Always with guardrails: a cooldown, a cap, an alert on every intervention. A watchdog that repairs blindly does more damage than it prevents.",
        artifacts: ["46 n8n workflows", "Self-healing with a cap", "Slack ops alerts"],
      },
      {
        n: "05",
        title: "Compliance as definition of done",
        body: "Every customer-facing feature passes the same gate: is there a lawful basis under GDPR? Does outreach respect German unfair-competition law? EU AI Act Art. 50: is the AI labelled as such? Does the site promise anything we do not deliver? For consumer products in the EU that is not an extra; it is part of the product.",
        artifacts: ["GDPR Art. 30", "Automated processing agreements", "AI Act disclosure"],
      },
    ],
    demo: {
      label: "A real bug, re-enacted:",
      note: "A replay, not a live session. Cause, file and change are in commit bce08f5e.",
      lines: [
        { kind: "prompt", text: "Widget shows stale prayer times on the phone" },
        { kind: "think", text: "Tests green, typecheck green, not reproducible in the emulator" },
        { kind: "run", text: "Instrumented the headless task: WIDGET_UPDATE fires, finds no handler" },
        { kind: "warn", text: "registerWidgetTaskHandler never runs" },
        { kind: "think", text: "Android is loading index.js instead of index.android.js" },
        { kind: "think", text: "Metro skips platform resolution for \"main\" when the extension is spelled out" },
        { kind: "run", text: "package.json: \"main\": \"index.js\" becomes \"index\"" },
        { kind: "ok", text: "Widget updates in the background · commit bce08f5e" },
      ],
    },
    speed: {
      eyebrow: "Delivery pace",
      title: "The difference is not that I type faster.",
      lede: "It is that research, implementation, testing and verification run in parallel rather than in sequence, and that context does not get lost between sessions. What that produces can be counted.",
      facts: [
        { value: "107", label: "days", note: "first commit on 16 April 2026 until today" },
        { value: "63", label: "versions shipped", note: "1.0.0 to 1.45.0, listed in the app's own changelog" },
        { value: "40 h", label: "per version on average", note: "107 days divided by 63 versions" },
      ],
      note: "Figures for Salati, counted on 1 August 2026 in the app's changelog file. Three further systems were in production alongside it.",
    },
  },

  skills: {
    eyebrow: "Capabilities",
    title: "Broad enough for the whole product, deep enough for the hard parts.",
    lede: "There are no percentages here. Nobody can check whether someone knows TypeScript to 93 per cent, so next to each capability stands the system it came from.",
    domains: [
      {
        id: "frontend",
        title: "Frontend & product",
        summary: "Interfaces that work as well on a five-year-old Android as on a studio display.",
        skills: [
          { name: "React / Next.js App Router", evidence: "Next.js 16 RSC in production" },
          { name: "React Native / Expo", evidence: "Expo SDK 57, RN 0.86, five device types" },
          { name: "TypeScript", evidence: "Strict everywhere, 0 errors as a merge gate" },
          { name: "Motion & interaction", evidence: "Reanimated 4, Framer Motion" },
          { name: "Core Web Vitals", evidence: "LCP/CLS/INP budgets in CI" },
          { name: "Accessibility", evidence: "TV focus navigation, reduced motion" },
        ],
      },
      {
        id: "backend",
        title: "Backend & data",
        summary: "Multi-tenant systems with real money, real tax law and real consequences when they fail.",
        skills: [
          { name: "Postgres / Supabase", evidence: "59-table schema, RLS, migrations" },
          { name: "API design", evidence: "Fastify, route handlers, Zod validation" },
          { name: "Payments", evidence: "Stripe Connect destination charges" },
          { name: "Multi-tenancy", evidence: "RLS plus per-tenant provisioning" },
          { name: "Mail infrastructure", evidence: "Self-hosted stack with a fallback chain" },
          { name: "Compliance systems", evidence: "§ 146a AO signing, GDPR Art. 30" },
        ],
      },
      {
        id: "cloud",
        title: "Cloud, delivery & operations",
        summary: "I run what I build, including the night shift when something falls over.",
        skills: [
          { name: "Vercel / edge", evidence: "Static exports, rewrites, ISR" },
          { name: "Docker / Coolify / Hetzner", evidence: "Own VPS stack in production" },
          { name: "CI/CD", evidence: "GitHub Actions, Turborepo, EAS Build" },
          { name: "Store delivery", evidence: "App Store & Play, including OTA updates" },
          { name: "Observability", evidence: "Sentry, Uptime Kuma, Slack alerts" },
          { name: "Automation", evidence: "46 n8n workflows, self-healing" },
        ],
      },
      {
        id: "ai",
        title: "AI integration",
        summary: "From the agent pipeline in my editor to the quantised model on the user's phone.",
        skills: [
          { name: "Agent orchestration", evidence: "Sub-agents, tool pipelines, loops" },
          { name: "On-device inference", evidence: "llama.cpp/GGUF, whisper.rn" },
          { name: "RAG & retrieval", evidence: "Own corpus, granularity measured" },
          { name: "Prompt engineering", evidence: "Verse conditioning beats model size" },
          { name: "Evaluation", evidence: "Local iteration against the same GGUF" },
          { name: "AI regulation (EU AI Act)", evidence: "Art. 50 disclosure as a gate" },
        ],
      },
    ],
  },

  recruiter: {
    eyebrow: "For recruiters & CTOs",
    title: "The essentials in 60 seconds",
    lede: "No cover letter needed. Here is what I can do, what I am looking for, and how to reach me.",
    facts: [
      { label: "Role", value: "AI product engineer / fullstack" },
      { label: "Focus", value: "Product end to end, AI-assisted delivery" },
      { label: "Location", value: "Berlin · remote EU" },
      { label: "Available", value: "By arrangement" },
      { label: "Languages", value: "German (native) · English" },
      { label: "Model", value: "Employment or freelance" },
      { label: "Source code", value: "Open source on GitHub · production repos on request" },
    ],
    strengths: [
      {
        title: "I ship finished, not nearly finished",
        body: "Four systems in production, including store reviews, payment processing, GDPR documentation and legal notices. The part most portfolios leave out is exactly the part that takes longest.",
      },
      {
        title: "I work across the whole stack",
        body: "React Native widget, Postgres migration, Docker Compose on my own VPS, fiscal compliance. No ticket ping-pong because something is “not my area”.",
      },
      {
        title: "Evidence over gut feeling",
        body: "A green test run proves nothing. I learned that twice, expensively. So every change is verified against the live system before it counts as done. That is what makes agent-assisted development dependable.",
      },
    ],
    cta: {
      pdf: { label: "One-pager as PDF", href: "/onepager" },
      mail: { label: "Email me" },
    },
  },

  contact: {
    eyebrow: "Contact",
    title: "Let's build something",
    lede: "A concrete role, a project enquiry, or just a technical question: I reply within 24 hours.",
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
        "For roles: the salary range, so we both save time",
      ],
    },
    fakten: [
      { label: "Response time", wert: "Usually under 24 hours" },
      { label: "Languages", wert: "German · English" },
      { label: "Location", wert: "Berlin · remote EU" },
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
  },

  notFound: {
    eyebrow: "Error 404",
    title: "This page does not exist.",
    body: "Either a typo slipped into the address, or I moved the page without leaving a redirect. If it is the latter: let me know and I will fix it.",
    onward: "Continue to",
    home: "Home",
    report: "Found something broken?",
  },

  languageSwitch: { to: "de", label: "Deutsch", aria: "Diese Seite auf Deutsch" },
};
