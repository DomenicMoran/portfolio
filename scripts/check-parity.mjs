#!/usr/bin/env node
/**
 * Prüft, dass die englische Fassung dasselbe zeigt wie die deutsche.
 *
 * Die Typen erzwingen, dass `en.ts` jedes Feld hat — eine Übersetzung kann
 * nicht stillschweigend unvollständig werden. Was sie nicht erzwingen: dass
 * beide Fassungen am Ende gleich viel *rendern*. Ein Eintrag, der nur in der
 * deutschen Liste steht, eine Fallstudie ohne englische Aufnahmen, ein
 * Verweisfeld, das nur auf einer Seite gefüllt ist — all das kommt durch den
 * Typecheck und fällt erst jemandem auf, der beide Seiten nebeneinander legt.
 *
 * Genau das macht dieser Lauf, und zwar an der gebauten Seite: Gezählt werden
 * die Dinge, die ein Leser sieht. Absolute Zahlen, keine Stichproben — zwei
 * Seiten, die dasselbe sagen, haben dieselbe Anzahl Abschnitte, Überschriften,
 * Verweise, Bilder, Reiter und Kennzahlen.
 *
 * Was bewusst **nicht** verglichen wird: der Text selbst. Englisch ist kürzer
 * als Deutsch, und eine Prüfung auf gleiche Zeichenzahl wäre eine Prüfung auf
 * eine falsche Erwartung.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:parity
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Die Seitenpaare, die dasselbe zeigen sollen. */
const PAARE = [
  { de: "/", en: "/en", name: "Startseite" },
  { de: "/artikel", en: "/en/articles", name: "Artikelübersicht" },
  { de: "/onepager", en: "/en/onepager", name: "One-Pager" },
  {
    de: "/artikel/published-ist-kein-beleg",
    en: "/en/articles/published-is-not-proof",
    name: "Artikel (Stichprobe)",
  },
];

const browser = await chromium.launch();

/** Was ein Leser sieht, in Zahlen. */
async function zaehle(pfad) {
  const seite = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });

  /* Erst durchscrollen: Was auf das Hineinscrollen wartet, hängt sich sonst
     gar nicht ein, und der Vergleich liefe über die halbe Seite. */
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
  });

  const werte = await seite.evaluate(() => ({
    Abschnitte: [...document.querySelectorAll("section[id]")].map((s) => s.id).join(","),
    Überschriften2: document.querySelectorAll("h2").length,
    Überschriften3: document.querySelectorAll("h3").length,
    Verweise: document.querySelectorAll("a[href]").length,
    Bilder: document.querySelectorAll("img").length,
    Reiter: document.querySelectorAll('[role="tab"]').length,
    Kennzahlen: document.querySelectorAll("dt").length,
    Listeneinträge: document.querySelectorAll("li").length,
  }));

  await seite.close();
  return werte;
}

const funde = [];
let verglichen = 0;

for (const paar of PAARE) {
  const de = await zaehle(paar.de);
  const en = await zaehle(paar.en);

  for (const schluessel of Object.keys(de)) {
    verglichen++;
    if (String(de[schluessel]) !== String(en[schluessel])) {
      funde.push(
        `${paar.name}: ${schluessel} — deutsch ${de[schluessel]}, englisch ${en[schluessel]}`,
      );
    }
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Abweichung(en) zwischen den Sprachfassungen:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nBeide Fassungen sollen dasselbe zeigen. Entweder fehlt der einen etwas, ` +
      `oder die andere hat etwas zu viel.`,
  );
  process.exit(1);
}

console.log(
  `Beide Sprachfassungen zeigen dasselbe: ${PAARE.length} Seitenpaare, ` +
    `${verglichen} Vergleiche ohne Abweichung.`,
);
