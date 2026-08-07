#!/usr/bin/env node
/**
 * Prüft WCAG 2.2 AA, 1.4.12 Textabstand.
 *
 * Wer Zeilen, Buchstaben, Wörter und Absätze auseinanderzieht, darf keinen
 * Inhalt und keine Funktion verlieren. Das trifft Leser mit Legasthenie und
 * alle, die eine eigene Stilvorlage benutzen — und es ist das einzige
 * Kriterium der Stufe AA, das axe grundsätzlich nicht prüfen kann: Es verlangt,
 * die Seite zu verändern und danach zu messen.
 *
 * Die vier Werte stehen so in der Norm: Zeilenhöhe 1,5, Buchstabenabstand
 * 0,12em, Wortabstand 0,16em, Absatzabstand 2em. Gefunden wird, was danach
 * höher ist als sein Kasten und abgeschnitten wird statt zu scrollen.
 *
 * Absichtlich verborgener Text bleibt draußen: `sr-only` klemmt seinen Kasten
 * auf 1 × 1 px, und das ist kein Verlust, sondern der Zweck. Ohne diese
 * Ausnahme meldete der Lauf jede Sprungmarke „Zum Inhalt springen“ als Fund —
 * vierzehn Zeilen, in denen keine einzige stimmte.
 *
 * Nach `npm run build`:
 *
 *   npm run check:spacing
 */

import { chromium } from "playwright";
import { FEHLERSEITEN, gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/* WCAG 2.2 AA, 1.4.12 Textabstand: Wer diese vier Werte setzt, darf keinen
   Inhalt und keine Funktion verlieren. */
const ABSTAENDE = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p { margin-bottom: 2em !important; }
`;

const vorgegeben = process.argv[2];
let beenden = () => {};
let basis = vorgegeben;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const funde = [];
let gemessen = 0;

for (const pfad of [...gebauteSeiten(), ...FEHLERSEITEN]) {
  for (const breite of [1440, 390]) {
    const seite = await browser.newPage({ viewport: { width: breite, height: 900 } });
    const antwort = await seite.goto(basis + pfad, { waitUntil: "networkidle" });
    const erwartet = FEHLERSEITEN.includes(pfad) ? 404 : 200;
    if (!antwort || antwort.status() !== erwartet) {
      await seite.close();
      continue;
    }
    await seite.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
    });
    await seite.addStyleTag({ content: ABSTAENDE });
    await seite.waitForTimeout(400);
    gemessen++;

    const d = await seite.evaluate(() => {
      const raus = [];
      for (const el of document.querySelectorAll("body *")) {
        const eigen = [...el.childNodes]
          .filter((n) => n.nodeType === 3 && n.textContent.trim())
          .map((n) => n.textContent.trim())
          .join(" ");
        if (!eigen) continue;
        const stil = getComputedStyle(el);
        if (stil.overflow === "auto" || stil.overflow === "scroll") continue;
        if (stil.overflowY === "auto" || stil.overflowY === "scroll") continue;
        /* Absichtlich verborgen: `sr-only` klemmt den Kasten auf 1 × 1 px und
           versteckt den Rest. Das ist kein verlorener Inhalt, sondern Text,
           der nur vorgelesen werden soll. */
        const kasten = el.getBoundingClientRect();
        if (kasten.width <= 1 || kasten.height <= 1) continue;
        /* Abgeschnitten: Der Inhalt ist höher als der Kasten und wird
           versteckt statt gescrollt. Zwei Punkte Spielraum für Rundung. */
        if (
          stil.overflowY === "hidden" &&
          el.scrollHeight > el.clientHeight + 2 &&
          el.clientHeight > 0
        )
          raus.push(
            `${el.tagName.toLowerCase()}: ${el.scrollHeight} px Inhalt in ${el.clientHeight} px — „${eigen.slice(0, 34)}“`,
          );
      }
      return {
        abgeschnitten: [...new Set(raus)],
        waagerecht: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });

    for (const a of d.abgeschnitten) funde.push(`${pfad} @ ${breite}: ${a}`);
    if (d.waagerecht) funde.push(`${pfad} @ ${breite}: Dokument scrollt waagerecht`);
    await seite.close();
  }
}

await browser.close();
beenden();

if (funde.length) {
  console.log(`\n${funde.length} Stelle(n) verlieren Inhalt bei größerem Textabstand:\n`);
  for (const f of funde.slice(0, 20)) console.log("  " + f);
  process.exit(1);
}
console.log(
  `Größerer Textabstand kostet keinen Inhalt: ${gemessen} Seitenaufrufe geprüft.`,
);
