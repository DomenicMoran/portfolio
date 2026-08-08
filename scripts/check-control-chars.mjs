#!/usr/bin/env node
/**
 * Kein Steuerzeichen im Quelltext.
 *
 * Ein Steuerzeichen sieht man nicht. `sed`, `grep` und jeder Editor zeigen die
 * Zeile unauffällig; erst `cat -A` macht daraus ein `^H`. Der Weg dorthin ist
 * immer derselbe: Ein Skript schreibt eine Datei, und in der Zeichenkette steht
 * `\b` mit einem Backslash statt mit zweien. Aus der Wortgrenze eines regulären
 * Ausdrucks wird dann ein Rückschritt-Zeichen, 0x08.
 *
 * Gemessen am 07.08.2026 in `check-figures.mjs`: Der frisch eingebaute Wächter
 * für die Portalzahl las statt `/\b([a-z0-9]+)\b/` einen Ausdruck mit zwei
 * Rückschritt-Zeichen und fand deshalb null Portale — bei sechs eingetragenen.
 * Er meldete daraufhin eine Abweichung an der Seite, die keine war. Ein
 * Prüflauf, der falsch misst, ist schlimmer als keiner: Er schickt die Suche in
 * die falsche Richtung, und der Quelltext daneben sieht richtig aus.
 *
 * Erlaubt bleiben Tabulator, Wagenrücklauf und Zeilenvorschub. Alles andere
 * unter 0x20, dazu 0x7f, ist ein Fund.
 *
 * Dieselbe Frage stellt `check-figures.mjs` schon, dort über alle sieben
 * erreichbaren Repos. Der Unterschied ist der Aufrufweg: Dieser Lauf braucht
 * keine Nachbarordner und läuft deshalb in der CI mit, jener nicht. Genau
 * dadurch stand das Rückschritt-Zeichen oben zwei Läufe lang im Bericht,
 * ohne dass es jemand las: Es kam in einer Zeile mit zwei anderen Funden.
 *
 * Wer die Regel ändert, ändert beide Stellen. Sie sind bewusst gleich
 * streng, damit ein Fund nicht davon abhängt, welcher Lauf gerade dran ist.
 *
 *   npm run check:chars
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Was gelesen wird: alles, was ein Mensch hier schreibt. */
const ENDUNGEN = /\.(ts|tsx|mjs|js|json|md|css|yml|yaml|txt)$/;

/** Was nicht dazugehört: fremder Code und Bauergebnisse. */
const AUSSEN = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "playwright-report",
]);

const dateien = [];
const suchen = (ordner) => {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    if (AUSSEN.has(eintrag.name)) continue;
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) suchen(pfad);
    else if (ENDUNGEN.test(eintrag.name)) dateien.push(pfad);
  }
};
suchen(".");

const verboten = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const funde = [];

for (const pfad of dateien) {
  const zeilen = readFileSync(pfad, "utf8").split(/\r?\n/);
  zeilen.forEach((zeile, i) => {
    const treffer = zeile.match(verboten);
    if (!treffer) return;
    const stelle = zeile.indexOf(treffer[0]);
    funde.push(
      `${pfad.split("\\").join("/")}:${i + 1} enthält 0x${treffer[0]
        .charCodeAt(0)
        .toString(16)
        .padStart(2, "0")} — „…${zeile.slice(Math.max(0, stelle - 30), stelle + 20).replace(verboten, "␈")}…“`,
    );
  });
}

/* Und kein Sonderzeichen im Dateinamen.

   AGENTS.md verlangt englische Dateinamen, und der Grund steht dort: Umlaute
   brechen über Betriebssysteme hinweg, und die Ersatzschreibung `ue/ae/oe` ist
   die Krücke, die man sich dafür einhandelt. Ob ein Name englisch ist, kann
   eine Maschine nicht entscheiden — ob er ausserhalb von ASCII liegt, schon,
   und das ist der Teil der Regel mit dem harten Grund.

   Gezählt am 08.08.2026: kein einziger von 186 gelesenen Namen. Die Prüfung
   hält diesen Stand, sie stellt ihn nicht her. */
for (const datei of dateien) {
  const name = datei.split(/[\/]/).pop();
  if ([...name].some((zeichen) => zeichen.codePointAt(0) > 127)) {
    funde.push(`${datei}: Sonderzeichen im Dateinamen`);
  }
}

if (funde.length > 0) {
  console.log(`\n${funde.length} Fund(e) im Quelltext:\n`);
  for (const f of funde) console.log(`  ${f}`);
  console.log(
    `\n  Meist ein einfacher Backslash, wo zwei hingehören: \\b wird zu 0x08.`,
  );
  process.exit(1);
}

console.log(
  `Kein Steuerzeichen im Quelltext und kein Sonderzeichen in einem Dateinamen: ` +
    `${dateien.length} Dateien gelesen.`,
);
