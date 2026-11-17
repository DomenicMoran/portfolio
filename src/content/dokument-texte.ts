/**
 * Wenige feste Texte für das Dokumentgerüst und die Fehlerseite.
 *
 * `global-error.tsx` ist eine Client-Komponente und hängt im Graphen jeder
 * Seite. Ein Import von `@/content/de` zog deshalb das ganze Inhaltsobjekt
 * in das erste JavaScript, auch auf Seiten, die den Provider nicht brauchen.
 * Diese Datei trägt nur die wenigen Zeichenketten, die jene beiden Stellen
 * wirklich setzen.
 */
export const dokumentTexte = {
  de: {
    name: "Domenic Moran",
    email: "kontakt@domenicmoran.de",
    mailSubject: "Anfrage über domenicmoran.de",
    notFoundReport: "Etwas kaputt gefunden?",
    impressum: "Impressum",
    datenschutz: "Datenschutz",
    humansTitel: "Über diese Seite und wer sie gebaut hat",
    llmsTitel: "Fakten für Sprachmodelle (englisch)",
  },
  en: {
    humansTitel: "About this site and who built it (German)",
    llmsTitel: "Facts for language models",
  },
} as const;
