#!/usr/bin/env node
/**
 * Prüft jede gebaute Seite mit axe-core gegen WCAG 2.2 AA.
 *
 * Warum ein eigener Lauf, obwohl es schon Prüfungen für Druckbild, Unterlängen
 * und Zahlen gibt: Die messen je eine Sache, die einmal falsch war. axe prüft
 * gut hundert Regeln auf einmal und findet damit auch das, wonach hier noch
 * niemand gesucht hat — fehlende Beschriftungen, zu schwache Kontraste,
 * Überschriften-Sprünge, doppelte Kennungen, Landmarken ohne Namen.
 *
 * Gemessen wird die ausgelieferte Seite im Browser, nicht das Bauteil: Ein
 * `aria-label` im Quelltext sagt nichts darüber, was am Ende im
 * Barrierefreiheitsbaum steht.
 *
 * Zwei Breiten, weil sich das Layout unterscheidet und mit ihm die
 * Trefferflächen und die Kontraste über Verläufen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:a11y
 */

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

const require = createRequire(import.meta.url);
const axeQuelle = readFileSync(require.resolve("axe-core"), "utf8");

/** Dieselben zwei Breiten wie beim Unterlängen-Lauf. */
const BREITEN = [1440, 390];

/**
 * Welche Regelwerke gelten.
 *
 * WCAG 2.2 AA ist der Maßstab, auf den sich europäische Vergaben und das BFSG
 * beziehen. `best-practice` bleibt draußen: Darin stecken Empfehlungen, die
 * keine Norm verlangt, und ein Lauf, der ständig etwas meldet, wird abgestellt.
 */
const REGELWERKE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Jede gebaute Seite, ohne die Bau-Interna. */
const bauOrdner = join(".next", "server", "app");
const pfade = [];
{
  const suchen = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) suchen(pfad);
      else if (eintrag.name.endsWith(".html")) {
        const route = pfad.slice(bauOrdner.length).replace(/\\/g, "/").replace(/\.html$/, "");
        if (!route.split("/").pop().startsWith("_")) pfade.push(route === "/index" ? "/" : route);
      }
    }
  };
  suchen(bauOrdner);
  pfade.sort();
}

/*
  Die 404-Seite über eine erfundene Adresse, nicht über ihre Datei.

  Sie liegt als `_not-found.html` im Bau und fällt damit durch das Filter, das
  Bau-Interna auslässt — der erste Lauf dieses Wächters prüfte sie deshalb
  nicht. Ausgerechnet die Seite, die jeder Vertipper zu sehen bekommt. Über eine
  erfundene Adresse kommt sie so heraus, wie Next sie ausliefert, samt eigenem
  Dokument und Sprachauszeichnung.
*/
const UNBEKANNTE_ADRESSE = "/diese-adresse-gibt-es-nicht";
/*
  Und einmal unterhalb von `/en`: Das ist eine andere Antwort. Die 404-Seite
  liest die Sprache aus einer Kopfzeile, die der Proxy setzt, und rendert
  englischen Text mit `lang="en"`. Ohne diesen Pfad pruefte der Waechter nur
  die Haelfte der Seite, die jeder Vertipper zu sehen bekommt.
*/
const UNBEKANNTE_ADRESSE_EN = "/en/this-address-does-not-exist";
pfade.push(UNBEKANNTE_ADRESSE, UNBEKANNTE_ADRESSE_EN);

const browser = await chromium.launch();
let verstoesse = 0;
let geprueft = 0;

for (const breite of BREITEN) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 900 } });
  await seite.addInitScript({ content: axeQuelle });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "domcontentloaded" });
    if (!antwort || antwort.status() >= 500) continue;

    // Die erfundene Adresse muss mit 404 antworten. Ein 200 hiesse, dass eine
    // Route sie doch bedient, und dann prüft dieser Durchgang etwas anderes
    // als die 404-Seite.
    if (
      (pfad === UNBEKANNTE_ADRESSE || pfad === UNBEKANNTE_ADRESSE_EN) &&
      antwort.status() !== 404
    ) {
      console.error(`  ${pfad} antwortet mit ${antwort.status()} statt 404.`);
      verstoesse++;
      continue;
    }

    /*
      Erst durchscrollen, dann messen.

      Die Abschnitte unterhalb der Falz stehen bis zum Hineinscrollen auf
      `opacity: 0`, und axe überspringt, was nicht sichtbar ist. Ohne diesen
      Durchlauf prüfte der Lauf die halbe Seite und meldete trotzdem "sauber" —
      derselbe blinde Fleck, an dem der Druck-Wächter schon einmal hing.
    */
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    // Endliche Animationen ans Ende setzen: Ein Element mitten im Auftritt hat
    // eine andere Deckkraft, und daran hängt die Kontrastmessung.
    await seite.evaluate(() => {
      for (const bewegung of document.getAnimations()) {
        try {
          bewegung.finish();
        } catch {
          /* Endlosschleifen haben kein Ende. */
        }
      }
    });
    await seite.waitForTimeout(500);

    const ergebnis = await seite.evaluate(
      (regelwerke) => window.axe.run(document, { runOnly: { type: "tag", values: regelwerke } }),
      REGELWERKE,
    );

    geprueft++;
    if (ergebnis.violations.length === 0) continue;

    verstoesse += ergebnis.violations.length;
    console.log(`  FEHLER ${pfad} bei ${breite} px`);
    for (const v of ergebnis.violations) {
      console.log(`        ${v.id} (${v.impact}): ${v.help}`);
      for (const knoten of v.nodes.slice(0, 3)) {
        console.log(`          ${knoten.target.join(" ")}`);
        const grund = knoten.failureSummary?.split("\n").filter(Boolean)[1];
        if (grund) console.log(`          ${grund.trim().slice(0, 110)}`);
      }
      if (v.nodes.length > 3) console.log(`          … und ${v.nodes.length - 3} weitere Stellen`);
    }
  }

  await seite.close();
}

await browser.close();
beenden();

if (verstoesse > 0) {
  console.error(
    `\n${verstoesse} Verstoß${verstoesse === 1 ? "" : "e"} gegen WCAG 2.2 AA. ` +
      `Gemessen an der gebauten Seite im Browser, nicht am Quelltext.`,
  );
  process.exit(1);
}

console.log(
  `Keine Verstöße gegen WCAG 2.2 AA: ${geprueft} Seitenaufrufe ` +
    `(${pfade.length} Seiten × ${BREITEN.length} Breiten) mit axe-core geprüft.`,
);
