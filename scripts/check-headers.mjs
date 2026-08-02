#!/usr/bin/env node
/**
 * Prüft, dass die ausgelieferte Seite die Schutz-Kopfzeilen wirklich trägt.
 *
 * `vercel.json` schreibt acht davon vor, darunter eine Content-Security-Policy,
 * die alles außer dem eigenen Ursprung verbietet, und HSTS mit zwei Jahren und
 * `preload`. Nur: Diese Datei wird vom Bau nicht gelesen und vom örtlichen
 * Server nicht angewandt. `npm run build` ist grün, wenn sie fehlt, wenn ein
 * Tippfehler in einem Schlüssel steht und wenn jemand die Werte über die
 * Weboberfläche von Vercel überschreibt. Gemessen wird die Wirkung erst an der
 * Antwort, die ein Besucher bekommt.
 *
 * Der Lauf liest die Vorgabe aus `vercel.json` und stellt sie gegen die
 * Antwort der Live-Adresse — Wert für Wert, nicht nur „vorhanden".
 *
 * Er misst damit den Stand, der gerade ausgeliefert wird, nicht den des
 * Arbeitsbaums. Läuft er unmittelbar nach einem Push, gehört die Antwort noch
 * zur vorherigen Auslieferung; die Kopfzeilen ändern sich aber nur mit
 * `vercel.json`, und dann fällt genau das auf.
 *
 * Aufruf:
 *
 *   npm run check:headers
 *   node scripts/check-headers.mjs https://eine-vorschau.vercel.app
 */

import { readFileSync } from "node:fs";

const basis = (process.argv[2] ?? "https://domenicmoran.de").replace(/\/$/, "");

const vorgabe = JSON.parse(readFileSync("vercel.json", "utf8"));
const fuerAlles = vorgabe.headers?.find((e) => e.source === "/(.*)")?.headers;

if (!fuerAlles?.length) {
  console.error("vercel.json enthält keinen Kopfzeilen-Block für /(.*).");
  process.exit(1);
}

/*
   Drei Adressen, weil sie auf verschiedenen Wegen entstehen: eine vorgerenderte
   Seite, eine dynamisch gerenderte (die 404 liest die Sprache aus einer
   Kopfzeile) und eine statische Datei. Eine Regel, die nur für den ersten Weg
   greift, sähe sonst vollständig aus.
*/
const adressen = ["/", "/en", "/diese-adresse-gibt-es-nicht", "/robots.txt"];

const funde = [];
let geprueft = 0;

for (const pfad of adressen) {
  let antwort;
  try {
    antwort = await fetch(`${basis}${pfad}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
  } catch (fehler) {
    console.error(`${basis}${pfad} ist nicht erreichbar: ${fehler.message}`);
    process.exit(1);
  }

  for (const { key, value } of fuerAlles) {
    const ist = antwort.headers.get(key);
    if (ist === null) funde.push(`${pfad}: ${key} fehlt`);
    else if (ist.trim() !== value.trim()) {
      funde.push(`${pfad}: ${key}\n        vorgegeben: ${value}\n        geliefert:  ${ist}`);
    }
    geprueft++;
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Abweichung(en) bei den Schutz-Kopfzeilen:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nvercel.json schreibt sie vor. Entweder ist die Auslieferung nicht auf ` +
      `dem Stand der Datei, oder jemand hat sie an Vercel vorbei geändert.`,
  );
  process.exit(1);
}

console.log(
  `Alle ${fuerAlles.length} Schutz-Kopfzeilen stimmen: ${geprueft} Prüfungen ` +
    `über ${adressen.length} Adressen auf ${basis}.`,
);
