/**
 * Gemeinsame Form beider Sprachfassungen.
 *
 * Ein Typ statt zweier Dateien, die auseinanderlaufen: Fehlt in `en.ts` ein
 * Feld, das `de.ts` hat, schlägt der Typecheck fehl. Eine Übersetzung kann
 * damit nicht stillschweigend unvollständig werden.
 */

export type Shot = {
  src: string;
  alt: string;
  width: number;
  height: number;
  label?: string;
  variant?: "browser" | "phone" | "screen";
};

export type CaseStudy = {
  id: string;
  index: string;
  name: string;
  tagline: string;
  year: string;
  role: string;
  statusLabel: string;
  accent: "acid" | "violet" | "cyan";
  problem: string;
  solution: string;
  hardPart: { title: string; body: string };
  highlights: readonly string[];
  stack: readonly { group: string; items: readonly string[] }[];
  metrics: readonly { value: string; label: string }[];
  links: readonly {
    label: string;
    href: string;
    kind: "live" | "store" | "code" | "social";
  }[];
  architecture: string;
  automation?: {
    title: string;
    lede: string;
    groups: readonly { title: string; items: readonly string[] }[];
  };
  shots?: readonly Shot[];
  keinScreenshot?: string;
};

export type Content = {
  lang: "de" | "en";

  site: {
    url: string;
    name: string;
    role: string;
    location: string;
    email: string;
    availability: { label: string; detail: string };
    meta: { title: string; description: string };
  };

  nav: readonly { label: string; href: string }[];
  navContact: string;
  skipToContent: string;

  hero: {
    eyebrow: string;
    headline: readonly { text: string; accent?: boolean }[];
    lede: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
    proof: readonly { value: string; label: string }[];
  };

  work: {
    eyebrow: string;
    title: string;
    lede: string;
    tabs: {
      highlights: string;
      automation: string;
      architecture: string;
      stack: string;
    };
    labels: { problem: string; solution: string; hardPart: string };
  };

  caseStudies: readonly CaseStudy[];

  about: {
    eyebrow: string;
    portrait: string;
    title: string;
    paragraphs: readonly string[];
    stats: readonly { value: string; label: string; note: string }[];
    statsHinweis: string;
    timelineLabel: string;
    timeline: readonly {
      period: string;
      title: string;
      org: string;
      body: string;
      current: boolean;
    }[];
    openSource: {
      label: string;
      lede: string;
      items: readonly { name: string; href: string; body: string; meta: string }[];
    };
    certificates: {
      label: string;
      groups: readonly { issuer: string; items: readonly string[] }[];
    };
  };

  workflow: {
    eyebrow: string;
    title: string;
    lede: string;
    principles: readonly {
      n: string;
      title: string;
      body: string;
      artifacts: readonly string[];
    }[];
    demo: {
      label: string;
      note: string;
      lines: readonly { kind: string; text: string }[];
    };
    speed: {
      eyebrow: string;
      title: string;
      lede: string;
      rows: readonly { label: string; weeks: number; note: string }[];
      note: string;
    };
  };

  skills: {
    eyebrow: string;
    title: string;
    lede: string;
    domains: readonly {
      id: string;
      title: string;
      summary: string;
      skills: readonly { name: string; evidence: string }[];
    }[];
  };

  recruiter: {
    eyebrow: string;
    title: string;
    lede: string;
    facts: readonly { label: string; value: string }[];
    strengths: readonly { title: string; body: string }[];
    cta: { pdf: { label: string; href: string }; mail: { label: string } };
  };

  contact: {
    eyebrow: string;
    title: string;
    lede: string;
    hinweis: string;
    copy: string;
    copied: string;
    checkliste: { titel: string; punkte: readonly string[] };
    fakten: readonly { label: string; wert: string }[];
  };

  footer: { legalNote: string; impressum: string; datenschutz: string };

  notFound: {
    eyebrow: string;
    title: string;
    body: string;
    onward: string;
    home: string;
    report: string;
  };

  /** Verweist jeweils auf die andere Sprachfassung. */
  languageSwitch: { to: "de" | "en"; label: string; aria: string };
};

/** Links, die in beiden Fassungen identisch sind. */
export const SOCIALS = {
  github: "https://github.com/DomenicMoran" as string,
  // TODO(domenic): vollständige Profil-URL — siehe USER-TODO.
  linkedin: "" as string,
};

export const TECH_TICKER = [
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
] as const;
