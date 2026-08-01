/**
 * Form der Fachartikel.
 *
 * Bewusst getippte Blöcke statt MDX: MDX brächte einen Compiler-Schritt, eine
 * zweite Auszeichnungssprache und eine Abhängigkeit, die bei jedem Next-Sprung
 * mitziehen muss. Die Artikel hier brauchen sieben Bausteine, und die stehen
 * unten. Dafür prüft der Typecheck jede Fassung, und eine fehlende Übersetzung
 * lässt den Build scheitern statt still eine Lücke zu lassen.
 */

export type Block =
  /** Fließtext. `code` markiert Bezeichner im laufenden Satz: `wie hier`. */
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "list"; items: readonly string[]; ordered?: boolean }
  | { kind: "code"; lang: string; code: string; caption?: string }
  /** Hervorgehobener Einschub, etwa eine Regel oder ein Messwert. */
  | { kind: "note"; title: string; text: string }
  | {
      kind: "table";
      head: readonly string[];
      rows: readonly (readonly string[])[];
      caption?: string;
    };

export type Article = {
  slug: string;
  title: string;
  /** Der Untertitel. Trägt die Aussage, falls jemand nur die Übersicht liest. */
  dek: string;
  /** ISO-Datum. Wird für <time> und die Sortierung gebraucht. */
  date: string;
  minutes: number;
  tags: readonly string[];
  /**
   * Woran die Aussagen des Artikels nachprüfbar sind: Commit, Datei, Messung.
   * Steht sichtbar am Fuß jedes Artikels.
   */
  evidence: readonly string[];
  blocks: readonly Block[];
};

/** Beschriftungen rund um die Artikel, je Sprache. */
export type ArticleChrome = {
  /** Der Pfad, unter dem die Übersicht liegt, ohne Schrägstrich am Ende. */
  base: string;
  eyebrow: string;
  title: string;
  lede: string;
  readingTime: (m: number) => string;
  backToIndex: string;
  evidenceLabel: string;
  publishedLabel: string;
  allArticles: string;
  /** Teaser auf der Startseite. */
  home: { eyebrow: string; title: string; lede: string; cta: string };
};
