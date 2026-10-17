/** Anrede der /for-Seite. Default "sie"; "du" nur bei Firmen, die öffentlich duzen (2026-10-14). */
export type TargetedAnrede = "sie" | "du";

/**
 * Eintritt auf den /for-Seiten und in den Pitch-Vorlagen.
 * Kein Kalenderdatum: der volle Satz im Fließtext, die Kurzform wo der Platz knapp ist.
 */
export const targetedAvailability = {
  full: "Eintritt frühestens 3 Monate nach Vertragsunterschrift, früher nach Absprache möglich",
  short: "Verfügbar 3 Monate nach Vertragsunterschrift",
  english: "Available 3 months after signing, earlier by arrangement",
} as const;

/** Anredeneutrale Texte. Alles, was den Leser direkt anspricht, steht in targetedAnredeCopy. */
export const targetedPageCopy = {
  eyebrow: "Persönliche Produktperspektive",
  titleSuffix: " | Domenic Moran",
  fallbackTitle: "Domenic Moran | AI Product Engineer",
  fallbackDescription: "Portfolio von Domenic Moran, Product Engineer aus Berlin.",
  availability: targetedAvailability.short,
  heroBeforeName: "Hallo",
  heroAfterName: "ich habe mir",
  heroEnd: "angesehen.",
  heroPerspective: "Kein Pitch aus der Schublade: ein offener Blick darauf, wie ich an eine produktnahe Aufgabe herangehe und welche Arbeit ich dafür mitbringe.",
  backToPortfolio: "Domenic Moran",
  nav: {
    label: "Seitennavigation",
    perspective: "Perspektive",
    work: "Arbeit",
    github: "GitHub",
    linkedin: "LinkedIn",
    contact: "Kontakt",
  },
  contextLabel: "Öffentlicher Produktkontext",
  technologyLabel: "Technologie-Schwerpunkte",
  heroFacts: [
    { label: "Arbeitsweise", value: "Produkt bis Betrieb" },
    { label: "Ort", value: "Berlin · Remote" },
    { label: "Verfügbar", value: "3 Monate nach Vertragsunterschrift" },
  ],
  stackKicker: "Mein Engineering-Baukasten",
  stackLabel: "Werkzeuge, mit denen ich Verantwortung übernehme",
  ogAlt: "Persönliche Product-Engineering-Seite",
  stackHeading: "Erst die Produktfrage. Dann der passende technische Weg.",
  overlap: "Kernfokus",
  adjacent: "Ergänzender Baustein",
  directDelivery: "Darin arbeite ich täglich. So kann ich vom Interface über Daten und APIs bis zum Deployment Verantwortung übernehmen, ohne Übergabe zwischen Schichten.",
  adjacentDelivery: "Das setze ich gezielt ein, wenn es den Produktflow verbessert. Erst die lokalen Konventionen verstehen, dann den nächsten Release spürbar leichter machen.",
  emptyStack: "Der Stack ist der Ausgangspunkt. Die Produktfrage entscheidet über die Arbeit.",
  signalLabel: "Produktkontext",
  signalDetail: "Eine Seite für den nächsten sinnvollen Release.",
  about: {
    kicker: "Kurz zu mir",
    heading: "Domenic Moran, Product Engineer aus Berlin.",
    body: "Ich baue digitale Produkte nicht nur bis zum ersten Screen: Interface, API, Datenmodell und Release gehören für mich zusammen. Dazu zählen SaaS-Produkte wie MenuCloud genauso wie Salati, eine Gebetszeiten-App für Mobile und TV. Am liebsten arbeite ich mit einem kleinen Team an einer klaren Aufgabe, die Nutzer wirklich spüren.",
    github: "GitHub ansehen",
    linkedin: "LinkedIn-Profil",
    portfolio: "Portfolio mit Live-Demos",
  },
  workKicker: "Belege statt Behauptungen",
  projectLabel: "Live-Projekt öffnen",
  fallbackProject: {
    name: "Weitere Produktarbeit",
    description: "Weitere Live-Projekte, technische Entscheidungen und die ganze Bandbreite meiner Arbeit im Portfolio ansehen.",
    tags: ["Portfolio", "Live-Projekte"],
  },
  projectDescriptions: {
    "MenuCloud Berlin": "Mandantenfähige SaaS für Betrieb, Zahlungen und Datenflüsse, von Produktidee bis Betrieb umgesetzt.",
    NOURI: "Produkt-App mit einem klaren täglichen Ablauf, über Web und Mobile konsequent aus einer Hand entwickelt.",
    Salati: "Mobile App im Live-Betrieb mit verlässlicher Auslieferung und Plattform-Integration.",
    "WohnungsJäger": "KI-gestützter Produkt-Workflow für eine vertrauenswürdige Nutzerreise im Consumer-Bereich.",
  },
  challengeKicker: "Ein guter Gesprächseinstieg",
  challengeContext: "Öffentlicher Produktkontext, bewusst ohne Annahmen über interne Prioritäten.",
  challengeHeading: "Ein Gespräch, das bei einer echten Produktfrage anfängt.",
  observationLabel: "Beobachtung",
  challengeBody: "Der Blick hier kommt ausschließlich von außen. Im Gespräch würde ich erst verstehen, was gerade wirklich zählt, und dann den kleinsten Schritt mit spürbarer Wirkung schärfen.",
  contactKicker: "Das nächste Gespräch",
  contactHeading: "Lust auf ein konkretes Produktgespräch?",
  contactBody: `${targetedAvailability.full}. Ich suche eine Vollzeitrolle als Product Engineer. Statt allgemeiner CV-Stichpunkte zeige ich lieber Arbeit, höre zu und spreche über eine konkrete Aufgabe.`,
  contactAction: "Gespräch starten",
  portfolioAction: "Ganzes Portfolio ansehen",
  workAction: "Arbeitsproben ansehen",
  contactCards: [
    { title: "20 Minuten, konkret", body: "Kein Recruiting-Smalltalk, sondern ein echter Produktflow." },
    { title: "Von Idee bis Betrieb", body: "Frontend, APIs, Daten und Release-Verantwortung aus einer Hand." },
    { title: targetedAvailability.short, body: "Früher nach Absprache möglich. Vollzeit, Berlin oder remote mit echtem Produktfokus." },
  ],
  copyEmail: { label: "E-Mail-Adresse kopieren", done: "Adresse kopiert", failed: "Kopieren nicht möglich" },
  skills: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Supabase", "Tailwind CSS", "Vercel", "KI-Workflows"],
} as const;

/** Texte, die den Leser direkt ansprechen, je Anrede. Neue direkte Ansprache NUR hier ergänzen. */
const targetedAnredeCopy = {
  sie: {
    scrollPrompt: "Weiter zur Perspektive",
    stackIntro: "Das ist mein Baukasten, keine Behauptung über Ihren internen Stack. Klicken Sie einen Schwerpunkt an und sehen Sie, wofür ich ihn in echter Produktarbeit nutze.",
    workHeading: "Arbeit, an der Sie meine Art zu bauen beurteilen können.",
  },
  du: {
    scrollPrompt: "Scroll für die Perspektive",
    stackIntro: "Das ist mein Baukasten, keine Behauptung über euren internen Stack. Klick einen Schwerpunkt an und sieh, wofür ich ihn in echter Produktarbeit nutze.",
    workHeading: "Arbeit, an der du meine Art zu bauen beurteilen kannst.",
  },
} as const satisfies Record<TargetedAnrede, Record<string, string>>;

export function getTargetedPageCopy(anrede: TargetedAnrede) {
  return { ...targetedPageCopy, ...targetedAnredeCopy[anrede] };
}
