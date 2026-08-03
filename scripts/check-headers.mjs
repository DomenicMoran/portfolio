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
      funde.push(
        `${pfad}: ${key}\n        vorgegeben: ${value}\n        geliefert:  ${ist}`,
      );
    }
    geprueft++;
  }
}

/*
   Die Zwischenspeicher-Regeln, an je einer Datei ihrer Art.

   Sie stehen in `vercel.json` als eigene Blöcke mit einem regulären Ausdruck
   als Quelle, und ein Ausdruck, der auf nichts passt, fällt genauso wenig auf
   wie ein fehlender Block: Die Antwort trägt dann still die Voreinstellung
   `max-age=0, must-revalidate`. Genau die stand bis zum 03.08.2026 auf jeder
   Datei unter `public/`, auch auf dem Porträt und den Bildschirmfotos.

   Geprüft wird je Block eine Beispieldatei. Mehr wäre Aufwand ohne Erkenntnis:
   Passt der Ausdruck für eine `.jpg`, passt er für alle.
*/
let zwischenspeicher = 0;
const KANDIDATEN = ["/portrait-dark.jpg", "/domenic-moran-kurzprofil.pdf"];

for (const block of vorgabe.headers ?? []) {
  if (block.source === "/(.*)" || block.source.startsWith("/api/")) continue;

  /* Der Ausdruck aus der Datei entscheidet, welche Beispieldatei gemeint ist —
     eine zweite Liste mit denselben Mustern waere die Stelle, an der beide
     auseinanderlaufen. */
  const muster = new RegExp("^" + block.source + "$");
  const beispiel = KANDIDATEN.find((k) => muster.test(k));
  if (!beispiel) {
    funde.push(
      `Kein Beispiel fuer ${block.source} — Kandidaten: ${KANDIDATEN.join(", ")}`,
    );
    continue;
  }

  zwischenspeicher++;
  const antwort = await fetch(`${basis}${beispiel}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  for (const { key, value } of block.headers) {
    const ist = antwort.headers.get(key);
    geprueft++;
    if (ist === null) funde.push(`${beispiel}: ${key} fehlt`);
    else if (ist.trim() !== value.trim()) {
      funde.push(
        `${beispiel}: ${key}` +
          `
        vorgegeben: ${value}` +
          `
        geliefert:  ${ist}`,
      );
    }
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
  `Alle ${fuerAlles.length} Schutz-Kopfzeilen und ${zwischenspeicher} ` +
    `Zwischenspeicher-Regeln stimmen: ${geprueft} Prüfungen auf ${basis}.`,
);
