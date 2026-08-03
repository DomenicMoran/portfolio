#!/usr/bin/env node
/**
 * Prüft, dass das Datum der Datenschutzerklärung zu ihrem Text passt.
 *
 * Das Datum steht von Hand in `stand.ts`, und das ist Absicht: Vorher stand
 * dort `new Date()`, und weil ein Automat die Commit-Zahlen täglich
 * auffrischt, datierte sich die Erklärung jeden Morgen neu, ohne dass sich
 * ein Wort geändert hatte. Bei einem Rechtstext ist das Datum die Zusage,
 * dass der Text an diesem Tag so galt.
 *
 * Von Hand gepflegt heißt aber: Es kann stehen bleiben, während der Text
 * weiterwandert — die stillere und schlechtere Hälfte desselben Problems.
 * Deshalb liegt neben dem Datum eine Prüfsumme über den ausgelieferten Text.
 * Dieser Lauf rechnet sie neu.
 *
 * Gemessen wird der sichtbare Text der gebauten Seite, nicht der Quelltext:
 * Was zählt, ist das, was ein Leser vor sich hat. Der Abschnitt „Stand"
 * bleibt außen vor, sonst änderte jedes neue Datum die Prüfsumme, und der
 * Lauf verlangte nach jeder Korrektur eine weitere.
 *
 *   npm run check:legal
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const STAND_DATEI = join("src", "app", "(de)", "(legal)", "stand.ts");

/* Gelesen und nicht importiert: `stand.ts` ist TypeScript, und Node müsste
   dafür die Typen entfernen. Die Datei hat zwei Zeilen mit festem Aufbau —
   sie zu lesen ist ehrlicher als eine Abhängigkeit dafür einzugehen. */
function ausStandDatei(name) {
  const quelle = readFileSync(STAND_DATEI, "utf8");
  return quelle.match(new RegExp(`export const ${name} = "([^"]+)"`))?.[1];
}

const STAND = ausStandDatei("STAND");
const TEXT_PRUEFSUMME = ausStandDatei("TEXT_PRUEFSUMME");

const SEITE = join(".next", "server", "app", "datenschutz.html");

/**
 * Der sichtbare Text der Erklärung, ohne den Abschnitt „Stand".
 *
 * Der Abschnitt wird an seiner Überschrift abgeschnitten. Sie steht als
 * letzte auf der Seite; alles danach gehört zur Fußzeile und ist auf jeder
 * Seite gleich.
 */
function textOhneStand() {
  const html = readFileSync(SEITE, "utf8");
  const nurInhalt = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const text = nurInhalt
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stelle = text.lastIndexOf("Stand");
  return stelle > 0 ? text.slice(0, stelle).trim() : text;
}

let text;
try {
  text = textOhneStand();
} catch {
  console.log(
    "  --  Datenschutzerklärung: kein Bau vorhanden, übersprungen (npm run build)",
  );
  process.exit(0);
}

const gerechnet = createHash("sha256").update(text).digest("hex").slice(0, 16);

if (gerechnet !== TEXT_PRUEFSUMME) {
  console.error(
    `Die Datenschutzerklärung trägt den Stand „${STAND}", ihr Text ist aber ein anderer.\n\n` +
      `  in stand.ts:   ${TEXT_PRUEFSUMME}\n` +
      `  ausgeliefert:  ${gerechnet}\n\n` +
      `Beides gehört zusammen: Wenn der Text sich geändert hat, gehört das ` +
      `heutige Datum hinein und diese Prüfsumme daneben. Hat er sich nicht ` +
      `geändert, ist etwas anderes passiert, das erst geklärt gehört.`,
  );
  process.exit(1);
}

console.log(
  `Die Datenschutzerklärung passt zu ihrem Stand: ${text.split(" ").length} Wörter, ` +
    `Stand ${STAND}.`,
);
