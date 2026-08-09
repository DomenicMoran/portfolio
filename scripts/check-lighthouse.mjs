#!/usr/bin/env node
/**
 * Hält die Zahl „Lighthouse 100“ auf der Seite gegen einen Lighthouse-Lauf.
 *
 * Unter den quelloffenen Paketen steht dieses Portfolio selbst, und daneben
 * die Angabe „TypeScript · Lighthouse 100 Barrierefreiheit". Das ist die
 * einzige Kennzahl der Seite, die auf ein fremdes Werkzeug zeigt, und sie
 * war als einzige nicht nachgerechnet. `check:a11y` prüft mit axe gegen
 * WCAG 2.2 AA; daraus folgt der Lighthouse-Wert nahe, aber nicht zwingend:
 * Die Kategorie enthält Prüfungen, die axe in dieser Zusammenstellung nicht
 * fährt, und ihre Gewichtung ändert sich mit jeder Hauptversion.
 *
 * Der Lauf ist bewusst nicht Teil von `npm run build`: Er braucht Netz, einen
 * Browser und rund eine Minute. Er gehört in den Prüfworkflow und vor eine
 * Aussage über die Zahl.
 *
 *   npm run check:lighthouse
 *   node scripts/check-lighthouse.mjs https://domenicmoran.de
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const ADRESSE = process.argv[2] ?? "https://domenicmoran.de";


/* Die Zahl steht im Inhalt, nicht hier. Ein fest verdrahteter Erwartungswert
   wäre die zweite Stelle, an der sie gepflegt werden müsste. */
const inhalt = readFileSync("src/content/site.ts", "utf8");
const treffer = inhalt.match(/Lighthouse (\d+) Barrierefreiheit/);
if (!treffer) {
  console.log(
    "Die Seite nennt keine Lighthouse-Zahl mehr, nichts zu prüfen.",
  );
  process.exit(0);
}
const behauptet = Number(treffer[1]);

const ordner = mkdtempSync(join(tmpdir(), "lighthouse-"));
const bericht = join(ordner, "bericht.json");

try {
  execFileSync(
    process.execPath,
    [
      createRequire(import.meta.url).resolve("lighthouse/cli/index.js"),
      ADRESSE,
      "--only-categories=accessibility",
      "--output=json",
      `--output-path=${bericht}`,
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      "--quiet",
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "ignore", "ignore"],
      /* Lighthouse startet Chrome selbst. Ohne diesen Pfad sucht es eine
         Installation im System, die auf einem Bauserver fehlt, der von
         Playwright mitgebrachte Browser ist ohnehin da. */
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      timeout: 180000,
    },
  );
} catch {
  /* Lighthouse beendet den Browser auf Windows mit einem Fehler, nachdem der
     Bericht geschrieben ist. Entscheidend ist deshalb die Datei, nicht der
     Rückgabewert. */
}

if (!existsSync(bericht)) {
  rmSync(ordner, { recursive: true, force: true });
  console.error(
    `Lighthouse hat keinen Bericht geschrieben. Adresse erreichbar? ${ADRESSE}`,
  );
  process.exit(1);
}

const daten = JSON.parse(readFileSync(bericht, "utf8"));
rmSync(ordner, { recursive: true, force: true });

const gemessen = Math.round(daten.categories.accessibility.score * 100);
const teil = new Set(
  daten.categories.accessibility.auditRefs.map((r) => r.id),
);
const durchgefallen = Object.values(daten.audits).filter(
  (a) => teil.has(a.id) && a.score !== null && a.score < 1,
);

if (gemessen < behauptet) {
  console.error(
    `Die Seite nennt Lighthouse ${behauptet}: gemessen sind ${gemessen}.\n`,
  );
  for (const a of durchgefallen) {
    console.error(`  ${a.id}: ${a.title}`);
  }
  console.error(`\nGemessen an ${ADRESSE}, Kategorie Barrierefreiheit.`);
  process.exit(1);
}

console.log(
  `Lighthouse ${gemessen} für Barrierefreiheit an ${ADRESSE}, ` +
    `die Seite nennt ${behauptet}. ${teil.size} Prüfungen, keine durchgefallen.`,
);
