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
  /**
   * Kürzere Fassung für das `<title>`, wo die Überschrift zu lang ist.
   *
   * Die Artikelseiten setzen ihren Titel `absolute`, also ohne den Zusatz
   * „ – Domenic Moran": Mit ihm lägen sie bei 64 bis 79 Zeichen, und
   * Suchmaschinen schneiden ab 60 ab. Gemessen am 08.08.2026 überschritten
   * zwei von zehn die Grenze auch ohne Zusatz — 62 und 61 Zeichen, also
   * genau der Fall, für den die Regel gedacht war.
   *
   * Steht hier nichts, gilt `title`. Die Überschrift auf der Seite bleibt in
   * jedem Fall unberührt: Sie hat den Platz, den ein Suchergebnis nicht hat.
   */
  titleShort?: string;
  /** Der Untertitel. Trägt die Aussage, falls jemand nur die Übersicht liest. */
  dek: string;
  /** ISO-Datum. Wird für <time> und die Sortierung gebraucht. */
  date: string;
  minutes: number;
  tags: readonly string[];
  /**
   * Woran die Aussagen des Artikels nachprüfbar sind: Commit, Datei, Messung.
   * Steht sichtbar am Fuß jedes Artikels.
   *
   * Ein Eintrag darf eine Adresse tragen. Der Grund ist der Unterschied
   * zwischen Beleg und Nachweis: Bis hierher zeigte jede Zeile auf eine Datei
   * in einem Repo, das niemand außer mir öffnen kann — gemessen am 02.08.2026
   * waren das alle 21 Belege der damals fünf Artikel. Wo derselben Arbeit ein
   * öffentliches Paket entstammt, gehört es hierher, denn das ist die einzige
   * Zeile, die ein Leser selbst ausführen kann.
   */
  evidence: readonly (string | { text: string; href: string })[];
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
  /** Name des Codekastens für Vorleseprogramme, wenn er keine Bildunterschrift hat. */
  codeLabel: string;
  /** Name der Tabelle für Vorleseprogramme, wenn sie keine Bildunterschrift hat. */
  tableLabel: string;
  /** Beschriftung und Rückmeldungen des Knopfes, der einen Codeblock kopiert. */
  copyCode: { label: string; done: string; failed: string };
  /**
   * Beschriftung der Sprungmarke neben jeder Zwischenüberschrift.
   *
   * Sichtbar steht dort nur ein Doppelkreuz. Das allein ergibt vorgelesen
   * „Nummernzeichen, Link" und sagt nichts darüber, wohin er führt, deshalb
   * bekommt er den Namen der Überschrift dahinter.
   */
  anchorLabel: string;
  publishedLabel: string;
  /**
   * Beschriftung des Rückwegs vom Artikel in die Fallstudie.
   *
   * Gezählt an der ausgelieferten Seite: Aus dem Artikelbereich führte kein
   * Verweis in den Fallstudienbereich. Die Fallstudie zeigt ihre Artikel seit
   * einer Weile; umgekehrt landete jeder, der einen geteilten Artikel öffnet,
   * in einem Text ohne Produkt dahinter.
   */
  fromSystem: string;
  /**
   * Beschriftung des Feed-Verweises unter der Übersicht.
   *
   * Den Feed gibt es seit Langem, und der Seitenkopf nennt ihn — sichtbar
   * stand er nirgends. Wer den Texten folgen wollte, musste in den Quelltext
   * sehen.
   */
  feed: string;
  allArticles: string;
  /** Teaser auf der Startseite. */
  home: { eyebrow: string; title: string; lede: string; cta: string };
};
