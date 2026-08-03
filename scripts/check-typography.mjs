#!/usr/bin/env node
/**
 * Prüft, dass jede Sprachfassung ihre eigene Typografie benutzt.
 *
 * Deutsch und Englisch setzen dieselben Zeichen anders. Anführungszeichen
 * stehen im Deutschen unten und oben („so"), im Englischen beide oben ("so").
 * Vor dem Prozentzeichen steht im Deutschen ein Leerzeichen (100 %), im
 * Englischen nicht (100%).
 *
 * Beides fällt niemandem auf, der die Seite baut — und jedem, der sie in
 * seiner Muttersprache liest. Gemessen an der ausgelieferten Seite am
 * 03.08.2026: zehn deutsche Anführungszeichen auf `/en`, weitere auf jeder
 * englischen Artikelseite und dem englischen Kurzprofil, dazu „100 %" und
 * „15–30 %". Kein Prüflauf sah das, weil kein Prüflauf danach sah.
 *
 * Gemessen wird am gebauten HTML und ohne Browser: Es geht um Zeichen im
 * Text, nicht um Darstellung. Skripte bleiben draußen — im Datenstrom von
 * React steht Auszeichnung, kein Fließtext.
 *
 *   npm run check:typography
 */

import { readFileSync } from "node:fs";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { join } from "node:path";

/** Deutsch: öffnend unten, schließend oben. Englisch: beide oben. */
const DEUTSCH_AUF = "„";
const DEUTSCH_ZU = "“";
const ENGLISCH_ZU = "”";

const REGELN = {
  en: [
    {
      name: "deutsches Anführungszeichen",
      muster: new RegExp(`[${DEUTSCH_AUF}]`, "g"),
      rat: `„ gehört ins Deutsche. Englisch öffnet mit ${DEUTSCH_ZU}.`,
    },
    {
      name: "Leerzeichen vor dem Prozentzeichen",
      /* Auch das geschützte Leerzeichen, sonst rutscht es genau dort durch,
         wo jemand den Umbruch verhindern wollte. */
      muster: /\d[\s  ]%/g,
      rat: "Im Englischen steht das Zeichen direkt an der Zahl: 100%.",
    },
  ],
  de: [
    {
      name: "englisches Anführungszeichen",
      muster: new RegExp(`[${ENGLISCH_ZU}]`, "g"),
      rat: `” gehört ins Englische. Deutsch schließt mit ${DEUTSCH_ZU}.`,
    },
  ],
};

/** Der sichtbare Text einer gebauten Seite. */
function sichtbarerText(pfad) {
  const html = readFileSync(pfad, "utf8");
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
}

const funde = [];
let geprueft = 0;

for (const route of gebauteSeiten()) {
  const sprache = route === "/en" || route.startsWith("/en/") ? "en" : "de";
  const datei = join(
    ".next",
    "server",
    "app",
    `${route === "/" ? "/index" : route}.html`,
  );

  let text;
  try {
    text = sichtbarerText(datei);
  } catch {
    continue;
  }
  geprueft++;

  for (const regel of REGELN[sprache]) {
    const treffer = [...text.matchAll(regel.muster)];
    if (treffer.length === 0) continue;
    /* Eine Fundstelle mit Umgebung reicht: Wer sie sieht, findet die
       anderen im selben Absatz von selbst. */
    const stelle = text
      .slice(Math.max(0, treffer[0].index - 45), treffer[0].index + 45)
      .replace(/\s+/g, " ")
      .trim();
    funde.push(
      `${route}: ${treffer.length}× ${regel.name} — …${stelle}…\n      ${regel.rat}`,
    );
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Fundstelle(n) mit fremder Typografie:\n`);
  for (const f of funde) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`Jede Sprachfassung setzt ihre eigene Typografie: ${geprueft} Seiten geprüft.`);
