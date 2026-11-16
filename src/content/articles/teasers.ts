/**
 * Nur Slug und Titel für Verweise aus Fallstudien — ohne die sieben
 * vollständigen Artikelblöcke in den Client-Chunk zu ziehen.
 */
type ArticleTeaser = {
  readonly slug: string;
  readonly title: string;
};

const artikelTeasersDe: readonly ArticleTeaser[] = [
  {
    slug: "achtzehn-wege-ueber-das-bull",
    title:
      "Achtzehn Wege über das Bull, und der Test sah nur den letzten Pfeil",
  },
  {
    slug: "gruen-lokal-rot-in-der-ci",
    title: "Der Lauf war lokal grün und in der CI rot. Beide hatten recht.",
  },
  {
    slug: "kleineres-whisper-modell",
    title: "Warum ein kleineres Whisper-Modell mein größeres schlug",
  },
  {
    slug: "kassensichv-in-der-praxis",
    title: "KassenSichV in der Praxis: was die Dokumentation auslässt",
  },
  {
    slug: "widget-leer-trotz-gruener-tests",
    title: "Alle Tests grün. Widget trotzdem leer auf dem echten Gerät.",
  },
  {
    slug: "published-ist-kein-beleg",
    title: "„Published“ ist kein Beleg. Meine Updates kamen nie an.",
  },
  {
    slug: "gestrichelter-kreis-kam-nicht-aus-der-schrift",
    title: "Der gestrichelte Kreis kam nicht aus der Schrift",
  },
];

const artikelTeasersEn: readonly ArticleTeaser[] = [
  {
    slug: "eighteen-routes-over-the-bull",
    title: "Eighteen routes over the bull, and the test only saw the last dart",
  },
  {
    slug: "green-locally-red-in-ci",
    title: "The check was green locally and red in CI. Both were right.",
  },
  {
    slug: "a-smaller-whisper-model",
    title: "Why a smaller Whisper model beat my bigger one",
  },
  {
    slug: "german-till-law-in-practice",
    title: "German till law in practice: what the documentation leaves out",
  },
  {
    slug: "green-tests-empty-widget",
    title: "All tests green. Widget still empty on a real device.",
  },
  {
    slug: "published-is-not-proof",
    title: "“Published” is not proof. My updates never arrived.",
  },
  {
    slug: "the-dotted-circle-was-not-the-font",
    title: "The dotted circle was not the font’s fault",
  },
];

export const artikelBasis = {
  de: "/artikel",
  en: "/en/articles",
} as const;

export function artikelTeasersIn(lang: "de" | "en"): readonly ArticleTeaser[] {
  return lang === "de" ? artikelTeasersDe : artikelTeasersEn;
}
