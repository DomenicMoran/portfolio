#!/usr/bin/env node
/**
 * Prüft, dass jede Ausfuhr aus `src/` auch einen Abnehmer hat.
 *
 * Ein `export` ist eine Aussage: „Das hier wird woanders gebraucht." Wer den
 * Quelltext liest, folgt ihr, und sucht nach der Stelle, die es benutzt.
 * Gemessen am 03.08.2026 stimmte die Aussage sechsmal nicht: `ARCHITECTURES`,
 * `ARCHITEKTUR_EN`, `bauzeit`, `slugPaare`, `Akzent` und `OgKarte` standen
 * ausgeführt da und wurden nur in ihrer eigenen Datei benutzt. Nichts davon
 * war kaputt; es war nur sechsmal eine falsche Fährte.
 *
 * Der Lauf zählt Vorkommen des Namens in allen anderen Dateien, auch in
 * `scripts/`, denn `build-favicon.mjs` liest die Form der Marke aus
 * `src/lib/mark.tsx` mit einem regulären Ausdruck heraus, ohne sie zu
 * importieren. Ein Namensvergleich findet das; ein Import-Graph nicht.
 *
 * Bewusst kein zusätzliches Werkzeug: `knip` oder `ts-prune` können mehr,
 * bringen aber eine Abhängigkeit samt eigener Konfiguration mit, um eine
 * Frage zu beantworten, die vierzig Zeilen beantworten.
 *
 * Was hier **nicht** geprüft wird: Dateien unter `src/app/`. Dort sind
 * Ausfuhren die Schnittstelle zu Next, `metadata`, `generateStaticParams`,
 * die Vorgabe-Ausfuhr einer Seite, und niemand importiert sie.
 *
 *   npm run check:exports
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Alle Quelldateien unter einem Ordner, ohne Typdeklarationen. */
function dateien(ordner) {
  const gefunden = [];
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) gefunden.push(...dateien(pfad));
    else if (/\.(ts|tsx|mjs)$/.test(eintrag.name) && !eintrag.name.endsWith(".d.ts")) {
      gefunden.push(pfad);
    }
  }
  return gefunden;
}

const quellen = new Map();
for (const pfad of [...dateien("src"), ...dateien("scripts")]) {
  quellen.set(pfad.replace(/\\/g, "/"), readFileSync(pfad, "utf8"));
}

const funde = [];
let geprueft = 0;

for (const [pfad, inhalt] of quellen) {
  if (!pfad.startsWith("src/")) continue;
  if (pfad.startsWith("src/app/")) continue;
  if (pfad.endsWith(".test.ts") || pfad.endsWith(".test.tsx")) continue;

  for (const treffer of inhalt.matchAll(/^export (?:const|function|type|interface|class) (\w+)/gm)) {
    const name = treffer[1];
    geprueft++;
    const muster = new RegExp(`\\b${name}\\b`);
    const abnehmer = [...quellen].some(([q, t]) => q !== pfad && muster.test(t));
    if (!abnehmer) funde.push(`${pfad}: ${name}`);
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Ausfuhr(en) ohne Abnehmer:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nEntweder fehlt die Stelle, die es benutzen soll, oder das \`export\` ` +
      `davor. Ein \`export\` ohne Abnehmer schickt jeden Leser auf die Suche ` +
      `nach einer Stelle, die es nicht gibt.`,
  );
  process.exit(1);
}

console.log(`Jede Ausfuhr hat einen Abnehmer: ${geprueft} Ausfuhren aus src/ geprüft.`);
