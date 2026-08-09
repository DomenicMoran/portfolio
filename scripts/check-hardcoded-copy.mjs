#!/usr/bin/env node
/**
 * Keine Beschriftung steht fest in einer Komponente.
 *
 * AGENTS.md sagt es seit Langem: „Nichts wird fest in eine Komponente
 * geschrieben, auch keine `aria-label`. Auf der englischen Fassung las ein
 * Screenreader sonst deutsche Ansagen vor." Nachgesehen hat es niemand.
 *
 * Gefunden am 07.08.2026: Der Kopf beider Fassungen trug am Verweis auf
 * llms.txt `title="Facts for language models"`, ein englischer Satz im
 * deutschen Dokument, unsichtbar auf der Seite und sichtbar für jedes
 * Werkzeug, das den Kopf liest.
 *
 * Warum am Quelltext und nicht an der gebauten Seite: Auf der Seite ist ein
 * fester Wert von einem zusammengesetzten nicht zu unterscheiden. „App Store:
 * Salati" steht in keinem Inhaltsmodul und ist trotzdem richtig, weil es aus
 * zwei Teilen entsteht. Im Quelltext ist der Unterschied eindeutig: `{…}` ist
 * ein Ausdruck, `"…"` ist ein fester Text.
 *
 * Ausgenommen sind die Rechtsseiten. Impressum und Datenschutzerklärung gibt
 * es nur auf Deutsch, ein deutsches Rechtsdokument ist in Übersetzung nicht
 * mehr dieselbe Erklärung, und ihre Abschnittsüberschriften sind deshalb
 * keine zweisprachige Beschriftung, sondern Teil des Dokuments.
 *
 * Aufruf:
 *
 *   npm run check:copy
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Attribute, deren Wert ein Mensch liest oder hört. */
const ATTRIBUTE = /\b(title|aria-label|aria-description|placeholder|alt)="([^"{}]{4,})"/g;

/** Nur auf Deutsch, mit Absicht, siehe oben. */
const AUSGENOMMEN = /\(legal\)/;

const funde = [];
let gelesen = 0;
let ausgenommen = 0;

function durchlaufe(ordner) {
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) {
      durchlaufe(pfad);
      continue;
    }
    if (!eintrag.endsWith(".tsx")) continue;
    gelesen++;
    const text = readFileSync(pfad, "utf8");
    for (const treffer of text.matchAll(ATTRIBUTE)) {
      if (AUSGENOMMEN.test(pfad)) {
        ausgenommen++;
        continue;
      }
      const zeile = text.slice(0, treffer.index).split("\n").length;
      funde.push(
        `${pfad}:${zeile}  ${treffer[1]}="${treffer[2].slice(0, 60)}"`,
      );
    }
  }
}

for (const wurzel of ["src/components", "src/app", "src/lib"]) {
  try {
    durchlaufe(wurzel);
  } catch {
    // Ordner gibt es nicht: nichts zu lesen.
  }
}

if (funde.length > 0) {
  console.error(
    `\n${funde.length} Beschriftung(en) stehen fest in einer Komponente:\n`,
  );
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    "\nSie erscheinen damit in beiden Sprachfassungen gleich. Der Wert gehört " +
      "nach src/content/, je Sprache einmal, und wird von dort gelesen.",
  );
  process.exit(1);
}

console.log(
  `Keine Beschriftung steht fest in einer Komponente: ${gelesen} Dateien gelesen` +
    (ausgenommen ? `, ${ausgenommen} auf den deutschen Rechtsseiten erlaubt` : "") +
    ".",
);
