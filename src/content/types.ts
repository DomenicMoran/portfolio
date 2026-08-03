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
  /**
   * Die Fachartikel, die aus genau diesem System stammen — als Adressteil,
   * je Sprachfassung.
   *
   * Vier der fünf Artikel handeln von einem Fehler in einem dieser Systeme,
   * und die Fallstudie verwies auf keinen davon: Gezählt an der
   * ausgelieferten Seite gab es aus dem Fallstudien-Bereich null Verweise in
   * den Artikelbereich. Wer wissen will, wie tief das geht, musste erst
   * weiterscrollen und dann raten, welcher Artikel zu welchem System gehört.
   */
  articles?: readonly string[];
};

export type Content = {
  lang: "de" | "en";

  site: {
    url: string;
    name: string;
    role: string;
    location: string;
    email: string;
    /**
     * Vorbelegter Betreff jeder Mail von dieser Seite.
     *
     * Ohne ihn oeffnet sich ein leeres Fenster. Mit ihm steht die Herkunft
     * schon drin, bevor jemand tippt — aenderbar wie jeder Betreff.
     */
    mailSubject: string;
    availability: { label: string; detail: string };
    meta: { title: string; description: string };
    /** Ein Satz auf der Social-Vorschaukarte, je Sprache eigener Text. */
    ogTagline: string;
  };

  nav: readonly { label: string; href: string }[];
  navContact: string;
  skipToContent: string;

  /**
   * Beschriftungen, die nur Screenreader und Tastaturnutzer erreichen.
   *
   * Sie standen vorher fest verdrahtet auf Deutsch in den Komponenten. Auf
   * der englischen Fassung las ein Screenreader damit deutsche Ansagen vor.
   */
  a11y: {
    toTop: string;
    mainNav: string;
    footerNav: string;
    /**
     * Name des Rückwegs auf den Rechtsseiten.
     *
     * Nicht „Hauptnavigation": Dort steht ein einziger Verweis zurück auf die
     * Startseite, und zwei Landmarken desselben Namens auf einer Webseite
     * helfen niemandem, der die Landmarkenliste benutzt.
     */
    legalNav: string;
    /** Name der Bedienleiste über dem Kurzprofil. */
    onepagerNav: string;
    openMenu: string;
    closeMenu: string;
    commandPalette: string;
    currentSection: string;
    replay: string;
    /** Bedienung der Bildstrecke in den Fallstudien. */
    shots: { label: string; vor: string; zurueck: string; von: string };
  };

  /** Beschriftungen der Befehlspalette. */
  palette: {
    title: string;
    searchLabel: string;
    placeholder: string;
    empty: string;
    jump: string;
    pdf: { label: string; hint: string };
    mail: string;
    github: string;
    linkedin: string;
  };

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
    labels: {
      problem: string;
      solution: string;
      hardPart: string;
      readOn: string;
    };
  };

  caseStudies: readonly CaseStudy[];

  about: {
    eyebrow: string;
    portrait: string;
    /**
     * Dieselbe Aufnahme auf hellem Grund, für Papier.
     *
     * Am Bildschirm steht die Seite auf fast Schwarz, und ein Porträt mit
     * heller Wand ist darin die einzige helle Fläche weit und breit — es
     * sieht aufgeklebt aus. Gedruckt ist es genau umgekehrt.
     */
    portraitPrint: string;
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
      items: readonly {
        name: string;
        href: string;
        body: string;
        meta: string;
      }[];
    };
    certificates: {
      label: string;
      /**
       * `href` ist der Prüf-Link des Ausstellers. Coursera und Udemy vergeben
       * je Zertifikat eine öffentliche Bestätigungsseite; die gehört hierhin,
       * nicht eine hochgeladene Datei. Eine Datei kann jeder bauen, die
       * Bestätigungsseite des Ausstellers nicht.
       *
       * `date` ist das Ausstellungsdatum als ISO-Wert und wird lokalisiert
       * ausgegeben. Fehlt ein `href`, bleibt der Eintrag reiner Text und sieht
       * bewusst nicht wie ein Link aus.
       */
      note?: string;
      /** Verweis auf die hinterlegten Dateien, wenn es welche gibt. */
      noteHref?: { label: string; href: string };
      groups: readonly {
        issuer: string;
        items: readonly { name: string; href?: string; date?: string }[];
      }[];
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
      /**
       * Drei gezählte Werte, keine Balken.
       *
       * Vorher standen hier zwei Balken ohne Skala und ohne Zahl, überschrieben
       * mit „relative Darstellung, kein Benchmark". Auf einer Seite, deren
       * Kernaussage Belegbarkeit ist, war das der schwächste Punkt: ein
       * Diagramm, das aussieht wie Daten und keine sind.
       */
      facts: readonly { value: string; label: string; note: string }[];
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
    /**
     * Je Behauptung ein Beleg, den man anklicken kann.
     *
     * Der Abschnitt ist eine Landeadresse: Die Kopfleiste, die 404-Seite und
     * jeder geteilte Verweis auf `#hire` setzen jemanden mitten hinein. Von
     * dort führte kein Weg in die Fallstudien oder Artikel — gezählt an der
     * ausgelieferten Seite: vier Verweise, alle nach draußen (PDF, Mail,
     * LinkedIn, GitHub). Wer die Behauptung prüfen wollte, musste hochscrollen
     * und raten.
     *
     * `proof` ist die Adresse, `proofLabel` das, was dort steht.
     */
    strengths: readonly {
      title: string;
      body: string;
      proof?: string;
      proofLabel?: string;
    }[];
    cta: {
      pdf: { label: string; href: string };
      mail: { label: string };
      /** Der Knopf, der die Adresse in die Zwischenablage legt. */
      copy: { label: string; done: string; failed: string };
    };
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

  footer: {
    legalNote: string;
    impressum: string;
    datenschutz: string;
    /** Spaltenüberschriften. Ohne sie ist die Fußzeile eine Linksammlung. */
    navLabel: string;
    contactLabel: string;
    legalLabel: string;
    onepager: string;
    sourceLabel: string;
    sourceHref: string;
    /**
     * Herkunftszeile, die nur im Ausdruck erscheint.
     *
     * Ein ausgedrucktes Blatt verliert die Adresszeile des Browsers und damit
     * jeden Hinweis darauf, woher es stammt und wie alt es ist. Auf einer
     * Seite, deren Argument „jede Zahl ist belegt" lautet, gehört beides
     * aufs Papier.
     */
    printNote: string;
  };

  /**
   * Die Vorführung der Gebetszeit-Rechnung aus Salati.
   *
   * Vier Systeme in Produktion, alle privat. Wer die Seite liest, kann bis
   * dahin nichts davon anfassen. Dies ist der eine Teil, der sich herauslösen
   * und im Browser rechnen lässt, mit derselben Bibliothek und denselben
   * Voreinstellungen wie in der ausgelieferten App.
   */
  demoSalati: {
    title: string;
    lede: string;
    /** Name der Ortswahl für Vorleseprogramme. */
    placeLabel: string;
    /** Die sechs Zeiten des Tages, in der Sprache der Fassung. */
    prayers: {
      fajr: string;
      sunrise: string;
      dhuhr: string;
      asr: string;
      maghrib: string;
      isha: string;
    };
    /** Steht statt einer Zeit, wenn die Rechnung nicht zustande kam. */
    failed: string;
    /** Woher die Rechnung stammt und was sie nicht tut. */
    note: string;
  };

  /**
   * Die Tagesrechnung aus NOURI.
   *
   * Zwölf Gerichte aus dem Katalog des Produktivrepos, mit den Werten, die
   * dort je Portion hinterlegt sind. Kein Tagesziel: Das hängt in der App am
   * Profil, und ein hier erfundenes wäre die einzige Zahl auf dieser Seite
   * ohne Beleg.
   */
  demoNouri: {
    title: string;
    lede: string;
    /** Name der Gerichteauswahl für Vorleseprogramme. */
    mealsLabel: string;
    units: {
      kcal: string;
      protein: string;
      carbs: string;
      fat: string;
      fiber: string;
    };
    note: string;
  };

  /**
   * Die Beschriftungen des Kurzprofils.
   *
   * Bis eben stand der One-Pager nur auf Deutsch, und die englische Fußzeile
   * verlinkte trotzdem darauf: Wer „One-pager as PDF" anklickte, bekam ein
   * deutsches Dokument, ausgerechnet das Blatt, das weitergereicht wird.
   */
  onepager: {
    /** Seitentitel und Beschreibung für die Metadaten. */
    title: string;
    description: string;
    /** Der Absatz unter dem Namen. `{commits}` wird durch die Untergrenze ersetzt. */
    positioning: string;
    projects: string;
    focus: string;
    path: string;
    /** Ein Satz unter dem Werdegang. */
    pathNote: string;
    /**
     * Überschrift der Zeile mit den veröffentlichten Paketen.
     *
     * Auf dem Blatt stehen vier Produktivsysteme, und alle vier sind privat:
     * Kundendaten und lizenzierte Inhalte. Wer das Blatt liest und prüfen
     * will, kann genau nichts davon öffnen. Die vier Pakete sind der Teil,
     * der offen liegt — mit Tests, CI und Lizenz.
     */
    openSource: string;
    /** Der Nachsatz dazu, ohne die Namen: die kommen aus dem Inhalt. */
    openSourceNote: string;
    /** Fußzeile des Blattes. */
    fullCaseStudies: string;
    asOf: string;
    back: string;
    /** Leiste über dem Blatt, nur am Bildschirm. */
    printHint: string;
    printButton: string;
    /** Präfix vor einer abgerundeten Zahl: „über 4.000" / „over 4,000". */
    atLeast: string;
  };

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
  linkedin: "https://www.linkedin.com/in/domenicmoran" as string,
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
  "Whisper",
  "Tailwind",
  "Turborepo",
  "Vitest",
] as const;
