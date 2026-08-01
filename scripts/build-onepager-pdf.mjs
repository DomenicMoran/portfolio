#!/usr/bin/env node
/**
 * Druckt die One-Pager-Route in eine echte PDF-Datei unter `public/`.
 *
 * Warum überhaupt: Die Schaltfläche „One-Pager als PDF" führte auf eine
 * HTML-Seite, auf der man selbst den Druckdialog öffnen musste. Ein Recruiter,
 * der ein Profil an die fachliche Führung weiterleiten will, braucht aber eine
 * Datei, keine Anleitung. Zwei zusätzliche Handgriffe an der Stelle kosten
 * genau die Weiterleitung, um die es geht.
 *
 * Die Datei entsteht aus derselben Route, die auch im Browser steht: Es gibt
 * keine zweite Fassung des Inhalts, die auseinanderlaufen könnte.
 *
 * Aufruf nach `npm run build`, gegen den laufenden Produktionsserver:
 *
 *   npx next start -p 3131 &
 *   node scripts/build-onepager-pdf.mjs http://localhost:3131
 */

import { mkdirSync, readFileSync, statSync } from "node:fs";
import { chromium } from "playwright";

const basis = process.argv[2] ?? "http://localhost:3131";
const ziel = "public/domenic-moran-kurzprofil.pdf";

mkdirSync("public", { recursive: true });

const browser = await chromium.launch();
const seite = await browser.newPage();

const antwort = await seite.goto(`${basis}/onepager`, {
  waitUntil: "networkidle",
});
if (!antwort || antwort.status() !== 200) {
  throw new Error(`/onepager antwortete mit ${antwort?.status()}`);
}

// Prüfen, dass dort auch der eben gebaute Stand läuft.
//
// Ohne diese Prüfung ist der Fehler stumm und teuer: Auf dem Standard-Port
// lag noch ein Server aus einer früheren Sitzung. Das Skript hat brav
// gedruckt, gemeldet und die Seitenzahl geprüft, nur eben von einem Build von
// vorgestern. Zwei Änderungsrunden gingen dabei ins Leere, weil die Datei nach
// jeder Korrektur weiter dasselbe zeigte. HTTP 200 belegt, dass jemand
// antwortet, nicht dass der Richtige antwortet.
const gebauteId = readFileSync(".next/BUILD_ID", "utf8").trim();
const html = await seite.content();
if (!html.includes(gebauteId)) {
  throw new Error(
    `Auf ${basis} läuft ein anderer Build als der zuletzt gebaute ` +
      `(${gebauteId}). Server dort beenden und mit dem aktuellen Stand neu ` +
      `starten, sonst druckt dieses Skript einen alten Stand.`,
  );
}

// Die Route bringt ihr eigenes Druck-Stylesheet mit, inklusive der
// zoom-Regel, die den Inhalt auf eine Seite bringt. Deshalb wird hier die
// Druckdarstellung erzwungen statt eine eigene zu erfinden.
await seite.emulateMedia({ media: "print" });
await seite.waitForTimeout(400);

await seite.pdf({
  path: ziel,
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
});

await browser.close();

// Eine Seite ist die Vorgabe des One-Pagers. Mehr wäre ein Fehler im
// Inhalt, nicht im Druck, und soll den Build scheitern lassen.
const { PDFDocument } = await import("pdf-lib");
const doc = await PDFDocument.load(readFileSync(ziel));
const seitenzahl = doc.getPageCount();

const kb = Math.round(statSync(ziel).size / 1024);
console.log(`${ziel}: ${kb} KB, ${seitenzahl} Seite(n)`);

if (seitenzahl !== 1) {
  console.error(
    `Der One-Pager ist ${seitenzahl} Seiten lang. Inhalt kürzen oder die ` +
      `zoom-Regel in globals.css nachziehen.`,
  );
  process.exit(1);
}
