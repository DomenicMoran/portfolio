#!/usr/bin/env node
/**
 * Prüft, dass keine Seite eine Verbindung nach außen aufbaut.
 *
 * Die Datenschutzerklärung sagt es als Tatsache: „Diese Website lädt keine
 * Skripte, Schriften, Karten, Videos oder Analysedienste von fremden Servern
 * nach, weder beim Aufruf noch bei einer Interaktion." Und: „Alle Schriftarten
 * werden vom eigenen Server ausgeliefert. Beim Besuch dieser Seite wird keine
 * Verbindung zu Google Fonts oder einem anderen Schriftanbieter aufgebaut."
 *
 * Das ist keine Absichtserklärung, sondern eine Aussage über den Ist-Zustand,
 * und sie steht auf einer Seite, die rechtlich zählt. Sie bricht leise: Ein
 * eingebundenes Video, eine Schrift von einem CDN, ein Zählpixel in einem
 * neuen Bauteil — nichts davon fällt beim Ansehen auf, und die Erklärung wäre
 * ab diesem Commit falsch.
 *
 * Gemessen wird deshalb der Netzverkehr der gebauten Seite, nicht der
 * Quelltext. Jede Anfrage an einen anderen Host als den eigenen ist ein
 * Befund, `data:` und `blob:` ausgenommen — die verlassen den Rechner nicht.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:privacy
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

const eigenerHost = new URL(basis).host;

/** Jede gebaute Seite, ohne die Bau-Interna. */
const pfade = gebauteSeiten();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const seite = await ctx.newPage();

const funde = new Map();
seite.on("request", (anfrage) => {
  const adresse = anfrage.url();
  if (adresse.startsWith("data:") || adresse.startsWith("blob:")) return;
  const host = new URL(adresse).host;
  if (!host || host === eigenerHost) return;
  const schluessel = `${anfrage.resourceType()} ${host}`;
  funde.set(schluessel, (funde.get(schluessel) ?? 0) + 1);
});

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() >= 500) continue;

  /*
     Nicht nur laden, sondern bedienen.

     Die Erklärung sagt ausdrücklich „weder beim Aufruf noch bei einer
     Interaktion". Ein Nachladen bei Klick — eine Karte, ein Video, eine
     Schrift für ein Symbol — bliebe beim bloßen Aufruf unsichtbar.
  */
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);

    // Jede Registerkarte einmal wählen, jeden Knopf einmal drücken, der
    // nichts verlässt oder verschickt.
    for (const reiter of document.querySelectorAll('[role="tab"]')) reiter.click();
    for (const knopf of document.querySelectorAll("button")) {
      const name = (knopf.getAttribute("aria-label") || knopf.innerText || "").toLowerCase();
      if (/druck|print|schließ|close/.test(name)) continue;
      knopf.click();
    }
  });
  await seite.waitForTimeout(900);
}

await browser.close();
beenden();

if (funde.size > 0) {
  console.error("Verbindungen zu fremden Hosts:\n");
  for (const [was, anzahl] of funde) console.error(`  ${was}  (${anzahl}×)`);
  console.error(
    `\nDie Datenschutzerklärung sagt, dass es diese nicht gibt. Entweder die ` +
      `Einbindung entfernen oder die Erklärung ändern.`,
  );
  process.exit(1);
}

console.log(
  `Keine Verbindung nach außen: ${pfade.length} Seiten geladen und bedient, ` +
    `alle Anfragen gingen an ${eigenerHost}.`,
);
