#!/usr/bin/env node
/**
 * Prüft die angegebene Lesezeit jedes Artikels gegen seinen Wortbestand.
 *
 * Die Zahlen waren von Hand gesetzt und stimmten nicht: rund doppelt zu hoch
 * und untereinander nicht einmal sortiert. Der längste Artikel trug neun
 * Minuten, ein kürzerer elf. Auf einer Seite, die mit Nachprüfbarkeit
 * argumentiert, ist eine geschätzte Zahl neben einer gemessenen ein Fehler.
 *
 * 180 Wörter je Minute, nicht die üblichen 200 bis 250. Deutscher Fachtext
 * liest sich langsamer als englische Blogprosa, und die Code-Blöcke zählen
 * hier nicht als Wörter mit, kosten beim Lesen aber Zeit. Der niedrigere Wert
 * gleicht beides aus.
 *
 *   node scripts/check-reading-time.mjs          nur prüfen
 *   node scripts/check-reading-time.mjs --setzen  Werte korrigieren
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ORDNER = "src/content/articles";
const WOERTER_JE_MINUTE = 180;
const setzen = process.argv.includes("--setzen");

/** Textfelder aus einer Artikeldatei ziehen, ohne den Code-Block. */
function woerterZaehlen(quelle) {
  let wort = 0;

  // Zuerst die Code-Blöcke entfernen, damit ihre Inhalte nicht mitzählen.
  const ohneCode = quelle.replace(/code:\s*`[\s\S]*?`,/g, "");

  for (const feld of ["text", "dek", "title", "caption"]) {
    const muster = new RegExp(`${feld}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g");
    for (const treffer of ohneCode.matchAll(muster)) {
      wort += treffer[1].split(/\s+/).filter(Boolean).length;
    }
  }

  // Aufzählungen stehen als nackte Zeichenketten in items-Feldern.
  for (const treffer of ohneCode.matchAll(/^\s{6,}"((?:[^"\\]|\\.)*)",\s*$/gm)) {
    wort += treffer[1].split(/\s+/).filter(Boolean).length;
  }

  return wort;
}

const befunde = [];

for (const datei of readdirSync(ORDNER)) {
  if (!datei.endsWith(".ts") || ["types.ts", "index.ts"].includes(datei)) continue;

  const pfad = join(ORDNER, datei);
  const quelle = readFileSync(pfad, "utf8");
  const m = /minutes:\s*(\d+)/.exec(quelle);
  if (!m) continue;

  const woerter = woerterZaehlen(quelle);
  const angegeben = Number(m[1]);
  const berechnet = Math.max(1, Math.round(woerter / WOERTER_JE_MINUTE));

  const abweichung = Math.abs(angegeben - berechnet);
  befunde.push({ datei, woerter, angegeben, berechnet, abweichung });

  if (setzen && abweichung > 0) {
    writeFileSync(pfad, quelle.replace(/minutes:\s*\d+/, `minutes: ${berechnet}`), "utf8");
  }
}

befunde.sort((a, b) => b.woerter - a.woerter);
for (const b of befunde) {
  const marke = b.abweichung > 1 ? "  <-- weicht ab" : "";
  console.log(
    `${b.datei.padEnd(22)} ${String(b.woerter).padStart(5)} Wörter | ` +
      `angegeben ${String(b.angegeben).padStart(2)} | berechnet ${String(b.berechnet).padStart(2)}${marke}`,
  );
}

const schief = befunde.filter((b) => b.abweichung > 1);
if (schief.length && !setzen) {
  console.error(`\n${schief.length} Artikel mit falscher Lesezeit. Beheben: --setzen`);
  process.exit(1);
}
if (setzen) console.log("\nWerte gesetzt.");
