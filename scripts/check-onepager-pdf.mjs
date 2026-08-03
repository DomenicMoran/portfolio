#!/usr/bin/env node
/**
 * Prüft, dass das ausgelieferte Kurzprofil zum aktuellen Inhalt passt.
 *
 * Jede andere Datei dieser Seite entsteht beim Bau. Die beiden PDFs nicht:
 * Sie werden gedruckt, und Drucken braucht einen Browser, den es auf Vercel
 * nicht gibt. `npm run onepager:pdf` läuft deshalb von Hand — und ein Schritt,
 * der von Hand läuft, wird irgendwann vergessen.
 *
 * Das Blatt ist ausgerechnet die Datei, die weitergereicht wird. Ein
 * Recruiter, der das PDF an die fachliche Führung schickt, verschickt dann
 * einen Stand, den es auf der Seite nicht mehr gibt.
 *
 * Verglichen wird die Prüfsumme über die Quellen: Der Druck schreibt sie als
 * `/Quellstand` in die Dokumenteigenschaften, dieser Lauf rechnet sie neu.
 * Gelesen wird mit `pdf-lib` und nicht mit einer Textsuche — die Eigenschaften
 * landen beim Speichern in einem Objektstrom, im Rohtext steht dort nichts.
 *
 *   npm run check:onepager
 */

import { existsSync, readFileSync } from "node:fs";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { QUELLEN, quellstand } from "./lib/onepager-quellstand.mjs";

const BLAETTER = [
  "public/domenic-moran-kurzprofil.pdf",
  "public/domenic-moran-one-pager.pdf",
];

const erwartet = quellstand();
const funde = [];
let geprueft = 0;

for (const pfad of BLAETTER) {
  if (!existsSync(pfad)) {
    funde.push(`${pfad} fehlt`);
    continue;
  }

  const doc = await PDFDocument.load(readFileSync(pfad));
  const eintrag = doc.getInfoDict().get(PDFName.of("Quellstand"));
  const gefunden = eintrag instanceof PDFString ? eintrag.asString() : null;

  if (!gefunden) {
    funde.push(`${pfad} nennt keinen Quellstand — vor dem nächsten Vergleich einmal neu drucken`);
    continue;
  }
  if (gefunden !== erwartet) {
    funde.push(`${pfad} stammt aus Quellstand ${gefunden}, aktuell ist ${erwartet}`);
    continue;
  }
  geprueft++;
}

if (funde.length > 0) {
  console.error(`${funde.length} veraltetes Blatt:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nEine der Quellen hat sich geändert:\n  ${QUELLEN.join("\n  ")}\n\n` +
      `Neu drucken mit:  npm run build && npm run onepager:pdf`,
  );
  process.exit(1);
}

console.log(
  `Beide Blätter stammen aus dem aktuellen Inhalt: ` +
    `${geprueft} PDF geprüft, Quellstand ${erwartet}.`,
);
