import { datumLang } from "@/lib/date-format";
import type { Content } from "./types";
import verified from "./verified.json";
import {
  about as aboutDe,
  caseStudies,
  contact as contactDe,
  hero as heroDe,
  recruiter as recruiterDe,
  site as siteDe,
  skillDomains,
  workflow as workflowDe,
} from "./site";

/**
 * Deutsche Fassung in der gemeinsamen Form.
 *
 * Bewusst ein Adapter und keine zweite Textdatei: Der deutsche Text bleibt in
 * `site.ts`, hier kommen nur die Felder dazu, die erst durch die
 * Zweisprachigkeit entstehen: Beschriftungen für Tabs, Fußzeile, 404 und
 * Sprachumschalter. So gibt es weiterhin genau eine Stelle je Sprache.
 */

/**
 * Tage seit dem ersten Salati-Commit, gerechnet statt getippt.
 *
 * Hier stand "107 Tage … bis heute". Zum Zeitpunkt des Schreibens richtig, am
 * Tag darauf 108 — dasselbe wandernde Fenster, das bei den Commits schon
 * abgeschafft wurde ("3.971 Commits in 4 Monaten"). Eine Zahl, die von selbst
 * weiterläuft, kann man nicht pflegen.
 *
 * Gerechnet wird bis zum Prüfdatum aus `verified.json`, nicht bis zum
 * Aufrufzeitpunkt: Die Seite wird vorab erzeugt, und ein `new Date()` im
 * Render fröre ohnehin auf den Bauzeitpunkt ein. Der Stempel wandert täglich
 * mit dem Automaten weiter, und die Angabe daneben nennt ihn.
 */
const SALATI_ERSTER_COMMIT = "2026-04-16";
const salatiTage = Math.round(
  (Date.parse(verified.date) - Date.parse(SALATI_ERSTER_COMMIT)) / 86_400_000,
);
/** Im Changelog der App gezählt, siehe check-figures.mjs. */
const SALATI_VERSIONEN = 65;
const salatiStundenJeVersion = Math.round((salatiTage * 24) / SALATI_VERSIONEN);

export const de: Content = {
  lang: "de",

  site: {
    url: "https://domenicmoran.de",
    name: siteDe.name,
    role: siteDe.role,
    location: siteDe.location,
    ogTagline: siteDe.ogTagline,
    email: siteDe.email,
    mailSubject: siteDe.mailSubject,
    availability: {
      label: siteDe.availability.label,
      detail: siteDe.availability.detail,
      entry: siteDe.availability.entry,
      languages: siteDe.availability.languages,
      salary: siteDe.availability.salary,
    },

    meta: siteDe.meta,
  },

  nav: [
    { label: "Projekte", href: "#work" },
    { label: "Über mich", href: "#about" },
    { label: "Arbeitsweise", href: "#workflow" },
    { label: "Skills", href: "#skills" },
    { label: "Artikel", href: "#writing" },
    { label: "Für Recruiter", href: "#hire" },
  ],
  navContact: "Kontakt",
  skipToContent: "Zum Inhalt springen",
  a11y: {
    toTop: "Zum Seitenanfang",
    mainNav: "Hauptnavigation",
    footerNav: "Navigation in der Fußzeile",
    legalNav: "Zurück zur Seite",
    onepagerNav: "Blatt drucken, herunterladen, Sprache wechseln",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    commandPalette: "Befehlspalette öffnen",
    currentSection: "Aktueller Abschnitt",
    llmsTitel: "Fakten für Sprachmodelle (englisch)",
    replay: "Ablauf erneut abspielen",
    shots: {
      label: "Bildschirmfotos, waagerecht blätterbar",
      vor: "Nächstes Bild",
      zurueck: "Vorheriges Bild",
      von: "von",
    },
  },
  palette: {
    title: "Befehlspalette",
    searchLabel: "Suche",
    placeholder: "Suchen oder springen …",
    empty: "Nichts gefunden.",
    results: "Treffer: {n}",
    jump: "Springen",
    modifier: "Strg",
    pdf: { label: "One-Pager als PDF", hint: "Druckfertige Kurzfassung" },
    onepagerWeb: { label: "Kurzprofil im Browser", hint: "Dieselbe Kurzfassung als Seite" },
    mail: "E-Mail schreiben",
    github: "Quellcode und Profil",
    linkedin: "Beruflicher Werdegang",
  },

  hero: heroDe,

  work: {
    eyebrow: "Ausgewählte Arbeiten",
    title: "Vier Produkte. Alle live. Alle allein gebaut.",
    lede: "Kein Übungsprojekt, kein Tutorial-Klon. Jedes System hier hat echte Nutzer, echte Zahlungen oder echte rechtliche Verpflichtungen, und ich habe jedes davon von der ersten Zeile bis zum Store-Review verantwortet.",
    tabs: {
      highlights: "Was drinsteckt",
      automation: "Automatisierung",
      architecture: "Architektur",
      stack: "Tech-Stack",
    },
    labels: {
      problem: "Das Problem",
      solution: "Die Lösung",
      hardPart: "Die harte Stelle",
      readOn: "Ausführlich nachzulesen",
    },
  },

  caseStudies,

  about: {
    ...aboutDe,
    timelineLabel: "Werdegang",
  },

  workflow: {
    eyebrow: workflowDe.eyebrow,
    title: workflowDe.title,
    lede: workflowDe.lede,
    principles: workflowDe.principles,
    demo: {
      label: workflowDe.demo.label,
      note: "Nachgestellter Ablauf, keine Live-Sitzung. Ursache, Datei und Änderung stehen in Commit bce08f5e.",
      lines: workflowDe.demo.lines,
    },
    speed: {
      eyebrow: "Liefertempo",
      title: "Der Unterschied ist nicht, dass ich schneller tippe.",
      lede: "Er ist, dass Recherche, Implementierung, Test und Verifikation parallel statt nacheinander laufen, und dass der Kontext zwischen den Sitzungen nicht verloren geht. Wie sich das auswirkt, lässt sich zählen.",
      facts: [
        {
          value: String(salatiTage),
          label: "Tage",
          // Beide Daten in derselben Schreibweise. In einem Satz standen
          // "16.04.2026" und "2. August 2026" nebeneinander — zwei Formate
          // für dieselbe Sache, und das auf einer Seite, deren Argument
          // Genauigkeit ist. Die englische Fassung war schon einheitlich.
          note: `erster Commit am ${datumLang(SALATI_ERSTER_COMMIT)} bis zum Prüfdatum ${datumLang(verified.date)}`,
        },
        {
          value: String(SALATI_VERSIONEN),
          label: "ausgelieferte Versionen",
          note: "1.0.0 bis 1.47.0, im Changelog der App nachlesbar",
        },
        {
          value: `${salatiStundenJeVersion} h`,
          label: "im Schnitt je Version",
          note: `${salatiTage} Tage geteilt durch ${SALATI_VERSIONEN} Versionen`,
        },
      ],
      note: `Zahlen für Salati, gezählt am ${datumLang(verified.date)} in der Changelog-Datei der App. Parallel dazu liefen drei weitere Systeme in Produktion.`,
    },
  },

  skills: {
    eyebrow: "Fähigkeiten",
    title:
      "Breit genug für das ganze Produkt, tief genug für die harten Stellen.",
    lede: "Hier stehen keine Prozentzahlen. Niemand kann prüfen, ob jemand TypeScript zu 93 Prozent beherrscht. Deshalb steht neben jeder Fähigkeit das System, an dem sie entstanden ist.",
    domains: skillDomains,
  },

  recruiter: recruiterDe,
  contact: {
    ...contactDe,
    copy: "Adresse kopieren",
    copied: "Kopiert",
  },

  footer: {
    legalNote: "",
    impressum: "Impressum",
    datenschutz: "Datenschutz",
    navLabel: "Seite",
    contactLabel: "Kontakt",
    legalLabel: "Rechtliches",
    onepager: "Kurzprofil als PDF",
    sourceLabel: "Quellcode dieser Seite",
    sourceHref: "https://github.com/DomenicMoran/portfolio",
    printNote: `Gedruckt von domenicmoran.de. Domenic Moran, Berlin. Alle Zahlen auf dieser Seite sind gegen die Repositories geprüft, Stand ${datumLang(verified.date)}.`,
  },

  demoNouri: {
    title: "Ein Tag, zusammengestellt",
    lede: "Zwölf Gerichte aus dem Katalog, mit den Werten, die dort je Portion hinterlegt sind. Ziel setzen, rechnen lassen: Der Lauf prüft jede der 4.096 möglichen Zusammenstellungen und nimmt die mit dem meisten Eiweiß, die unter dem Ziel bleibt.",
    mealsLabel: "Gerichte wählen",
    units: {
      kcal: "kcal",
      protein: "Eiweiß",
      carbs: "Kohlenhydrate",
      fat: "Fett",
      fiber: "Ballaststoffe",
    },
    targetLabel: "Tagesziel",
    solve: "Tag zusammenstellen",
    solveNote: "{n} Zusammenstellungen geprüft in {ms} ms",
    noFit: "Unter diesem Ziel passt keine Mahlzeit",
    below: "{n} kcal unter dem Ziel",
    fieldLabel:
      "Alle 4.096 Zusammenstellungen, waagerecht die Kalorien, senkrecht das Eiweiß",
    field: {
      x: "Kalorien",
      y: "Eiweiß",
      best: "das Beste, was bei dieser Kalorienzahl möglich ist",
      chosen: "gewählt",
      target: "Ziel",
    },
    note: "Werte aus dem NOURI-Katalog (11.892 Rezepte, hier die zwölf handkuratierten). Energieverteilung über 4/4/9 kcal je Gramm. Das Ziel setzt der Besucher: In der App hängt es am Profil, und ein hier erfundenes wäre die einzige Zahl auf dieser Seite ohne Beleg.",
  },
  demoSalati: {
    title: "Ein Jahr Gebetszeiten, hier gerechnet",
    lede: "Kein Bildschirmfoto und keine Nachbildung: Diese Kachel lädt dieselbe Bibliothek, die in der ausgelieferten App rechnet. Jeder Strich ist ein Tag, jede Linie eine Gebetszeit. Der Schalter rechts ist die Stelle, an der es in Produktion wirklich schwierig wurde.",
    placeLabel: "Ort wählen",
    prayers: {
      fajr: "Fadschr",
      sunrise: "Sonnenaufgang",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Ischa",
    },
    next: "Als Nächstes",
    dayDone: "Für heute sind alle Zeiten vorbei",
    failed: "nicht berechnet",
    ruleLabel: "Regel für hohe Breiten",
    rules: {
      auto: "wie in der App",
      angle: "winkelbasiert",
      seventh: "Siebtel der Nacht",
      middle: "Mitte der Nacht",
    },
    autoIst: "„wie in der App“ rechnet hier {regel}",
    dayLabel: "Tag im Jahr",
    spread: "Spanne zwischen den Regeln",
    gap: "{n} Tage ohne Ergebnis",
    legend: {
      active: "gewählte Regel",
      others: "die beiden anderen",
    },
    speed: "{ms} ms",
    today: "heute",
    note: "adhan 4.4.4 (MIT), Methode 13 Diyanet, Schule 0 schafiitisch. 8.760 Zeitpunkte, im Browser gerechnet, ohne eine einzige Anfrage nach außen. Genau so rechnet die App, wenn kein Netz da ist.",
    hardPart: "Oberhalb von etwa 48° geht die Sonne im Sommer nie tief genug unter den Horizont, und Fadschr und Ischa sind nicht mehr eindeutig bestimmt. Die drei üblichen Regeln laufen dann auseinander, in Berlin im Juni um über zwei Stunden. Eine Nutzermeldung „Gebetszeiten stimmen nicht“ führte genau hierher. Die App wählt die winkelbasierte Regel, nicht weil sie richtiger wäre, sondern weil sie zu dem passt, womit Nutzer vergleichen. In Tromsø bleiben auch damit die Tage ohne Ergebnis, die oben stehen: Dort gibt es die Nacht nicht, auf die sich die Rechnung bezieht.",
  },
  onepager: {
    title: "Kurzprofil",
    description: `Kurzprofil von ${siteDe.name}, ${siteDe.role} aus Berlin: vier Systeme in Produktion, Werdegang und Kontakt auf einer Seite.`,
    positioning:
      "AI Product Engineer mit vier eigenständig gebauten Systemen in " +
      "Produktion: Apps in beiden Stores, eine mandantenfähige Gastro-SaaS mit " +
      "gesetzlich vorgeschriebener Fiskalisierung, ein autonomer Agent. " +
      "{commits} Commits seit März 2026, neben einem Vollzeitjob. " +
      "Softwareentwicklung autodidaktisch seit 2022. Schwerpunkt: " +
      "agentengestützte Entwicklung mit strikter Verifikationsdisziplin, " +
      "ein grüner Testlauf ist kein Beweis.",
    projects: "Projekte",
    focus: "Schwerpunkte",
    path: "Werdegang",
    pathNote:
      "Softwareentwicklung autodidaktisch, kein Studium, kein Bootcamp. " +
      "Der Nachweis sind vier Systeme in Produktion.",
    openSource: "Veröffentlicht",
    openSourceNote:
      "alle mit Tests, CI und MIT-Lizenz auf",
    fullCaseStudies: "Vollständige Fallstudien mit Architekturdiagrammen:",
    asOf: "Stand:",
    back: "← Zurück zur Seite",
    printHint: "Als PDF speichern: im Druckdialog „Als PDF sichern“ wählen.",
    printButton: "Drucken / PDF",
    atLeast: "Über",
  },

  notFound: {
    eyebrow: "Fehler 404",
    title: "Diese Seite gibt es nicht.",
    body: "Entweder hat sich ein Tippfehler in die Adresse geschlichen, oder ich habe die Seite verschoben, ohne eine Weiterleitung zu hinterlassen. Falls Letzteres: Sag mir Bescheid, dann korrigiere ich es.",
    onward: "Weiter zu",
    home: "Startseite",
    report: "Etwas kaputt gefunden?",
    reportSubject: "Toter Verweis auf domenicmoran.de",
    otherLanguage: {
      text: "Diese Adresse gibt es nicht.",
      link: "Weiter auf der deutschen Fassung",
    },
  },

  languageSwitch: { to: "en", label: "English", aria: "This page in English" },
};
