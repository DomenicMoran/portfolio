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
 * Aufruf nach `npm run build`:
 *
 *   npm run onepager:pdf
 *
 * Das Skript startet seinen Server selbst und beendet ihn wieder. Vorher war
 * das ein Zweischritt von Hand — `next start -p 3131 &`, dann drucken —, und
 * genau daraus entstand der Fehler, gegen den weiter unten die BUILD_ID-Prüfung
 * steht: Ein Server aus einer früheren Sitzung blieb auf dem Port liegen und
 * lieferte einen alten Stand. Ein Ablauf, der einen manuellen Handgriff
 * voraussetzt, wird irgendwann ohne ihn ausgeführt.
 *
 * Wer gegen eine andere Adresse drucken will, gibt sie als Argument an; dann
 * startet das Skript nichts und erwartet, dass dort schon etwas läuft.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium } from "playwright";

const ziel = "public/domenic-moran-kurzprofil.pdf";
const vorgegebeneBasis = process.argv[2];

mkdirSync("public", { recursive: true });

/** Einen Port suchen, den gerade niemand hält. */
async function freierPort() {
  return new Promise((fertig, scheitern) => {
    const horcher = createServer();
    horcher.unref();
    horcher.on("error", scheitern);
    horcher.listen(0, "127.0.0.1", () => {
      const { port } = horcher.address();
      horcher.close(() => fertig(port));
    });
  });
}

/** Wartet, bis die Adresse antwortet — oder gibt nach `versuche` auf. */
async function warteAufAntwort(adresse, versuche = 60) {
  for (let i = 0; i < versuche; i++) {
    try {
      const antwort = await fetch(adresse, { signal: AbortSignal.timeout(1000) });
      if (antwort.ok) return true;
    } catch {
      // Noch nicht oben. Nächster Versuch.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

let server = null;
let basis = vorgegebeneBasis;

if (!basis) {
  const port = await freierPort();
  basis = `http://127.0.0.1:${port}`;
  // Next direkt mit Node starten, nicht über npx.
  //
  // Mit `shell: true` warnt Node zu Recht, dass Argumente nur verkettet und
  // nicht maskiert werden. Ohne Shell lässt sich `npx.cmd` unter Windows seit
  // Node 20 gar nicht mehr starten. Der Einstiegspunkt liegt ohnehin im Repo,
  // und ihn direkt aufzurufen umgeht beides — dasselbe Muster wie in
  // check-figures.mjs für vitest.
  server = spawn(process.execPath, [join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], {
    stdio: "ignore",
  });
  if (!(await warteAufAntwort(`${basis}/onepager`))) {
    server.kill();
    throw new Error(`Der eigene Server auf ${basis} kam nicht hoch.`);
  }
}

/** Den selbst gestarteten Server in jedem Fall wieder beenden. */
function serverBeenden() {
  if (server && !server.killed) server.kill();
}
process.on("exit", serverBeenden);
process.on("SIGINT", () => {
  serverBeenden();
  process.exit(130);
});

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

// Dokumenteigenschaften nachtragen.
//
// Chromium setzt nur den Titel aus <title> und sich selbst als Producer.
// Autor, Betreff und Schlagwörter bleiben leer — und genau die liest ein
// Bewerbermanagement-System aus, wenn die Datei dort abgelegt wird. Eine PDF
// ohne Autor ist im Archiv eines Unternehmens eine Datei ohne Absender.
doc.setAuthor("Domenic Moran");
doc.setSubject("Kurzprofil: vier Systeme in Produktion, Werdegang und Kontakt auf einer Seite");
doc.setKeywords([
  "AI Product Engineer",
  "Fullstack",
  "TypeScript",
  "React Native",
  "Next.js",
  "Berlin",
]);
doc.setCreator("domenicmoran.de");
writeFileSync(ziel, await doc.save());

const kb = Math.round(statSync(ziel).size / 1024);
console.log(`${ziel}: ${kb} KB, ${seitenzahl} Seite(n)`);

if (seitenzahl !== 1) {
  console.error(
    `Der One-Pager ist ${seitenzahl} Seiten lang. Inhalt kürzen oder die ` +
      `zoom-Regel in globals.css nachziehen.`,
  );
  process.exit(1);
}
