import type { Content } from "./types";
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
export const de: Content = {
  lang: "de",

  site: {
    url: "https://domenicmoran.de",
    name: siteDe.name,
    role: siteDe.role,
    location: siteDe.location,
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
    { label: "Kontakt", href: "#contact" },
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
      eyebrow: "Größenordnung",
      title: "Der Unterschied ist nicht, dass ich schneller tippe.",
      lede: "Er ist, dass Recherche, Implementierung, Test und Verifikation parallel statt nacheinander laufen, und dass der Kontext zwischen den Sitzungen nicht verloren geht.",
      rows: [
        { label: "Klassisch, allein", weeks: 100, note: "Wochen bis Store-Release" },
        { label: "Mit Agenten-Setup", weeks: 22, note: "dieselbe Feature-Tiefe" },
      ],
      note: "Relative Darstellung aus meinen eigenen Projekten, kein Branchen-Benchmark. Die belastbare Zahl daneben: Salati steht bei 44 ausgelieferten Versionen über fünf Gerätetypen, gebaut neben drei weiteren Systemen in Produktion.",
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
