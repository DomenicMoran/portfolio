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
const SALATI_VERSIONEN = 64;
const salatiStundenJeVersion = Math.round((salatiTage * 24) / SALATI_VERSIONEN);

/** "2026-08-01" als "1. August 2026". */
function datumLang(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const de: Content = {
  lang: "de",

  site: {
    url: "https://domenicmoran.de",
    name: siteDe.name,
    role: siteDe.role,
    location: siteDe.location,
    ogTagline: siteDe.ogTagline,
    email: siteDe.email,
    availability: {
      label: siteDe.availability.label,
      detail: siteDe.availability.detail,
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
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    commandPalette: "Befehlspalette öffnen",
    currentSection: "Aktueller Abschnitt",
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
    jump: "Springen",
    pdf: { label: "One-Pager als PDF", hint: "Druckfertige Kurzfassung" },
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
          note: `erster Commit am 16.04.2026 bis zum Prüfdatum ${datumLang(verified.date)}`,
        },
        {
          value: String(SALATI_VERSIONEN),
          label: "ausgelieferte Versionen",
          note: "1.0.0 bis 1.46.0, im Changelog der App nachlesbar",
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
    title: "Breit genug für das ganze Produkt, tief genug für die harten Stellen.",
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
  },

  notFound: {
    eyebrow: "Fehler 404",
    title: "Diese Seite gibt es nicht.",
    body: "Entweder hat sich ein Tippfehler in die Adresse geschlichen, oder ich habe die Seite verschoben, ohne eine Weiterleitung zu hinterlassen. Falls Letzteres: Sag mir Bescheid, dann korrigiere ich es.",
    onward: "Weiter zu",
    home: "Startseite",
    report: "Etwas kaputt gefunden?",
  },

  languageSwitch: { to: "en", label: "English", aria: "This page in English" },
};
