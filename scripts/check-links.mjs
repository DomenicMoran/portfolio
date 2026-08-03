#!/usr/bin/env node
/**
 * Prüft, dass kein Verweis der Seite ins Leere zeigt.
 *
 * Zwei Sorten von totem Verweis, beide unsichtbar:
 *
 * 1. **Ein Anker ohne Ziel.** `href="#hire"` auf einer Seite ohne `id="hire"`
 *    springt nirgendwohin — der Browser meldet nichts, die Adresse ändert
 *    sich, und der Leser bleibt stehen. Das trifft die Kopfleiste, die
 *    Fußzeile, die 404-Seite und seit heute die sechs Belegverweise im
 *    Recruiter-Bereich.
 * 2. **Eine interne Adresse ohne Route.** `/artikel/falscher-slug` beantwortet
 *    Next mit der 404-Seite, und die sieht niemand, der den Verweis nur
 *    einbaut.
 *
 * Gemessen wird an der ausgelieferten Seite, nicht am Quelltext: Ein Verweis,
 * der aus einer Inhaltsdatei zusammengesetzt wird, existiert erst dort.
 *
 * Äußere Adressen bleiben draußen. Die prüft `check-figures.mjs` dort, wo sie
 * herkommen, und ein Lauf, der bei jedem Netzwackler rot wird, wird ignoriert.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:links
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

/** Jede gebaute Seite, ohne die Bau-Interna. */
const pfade = gebauteSeiten();

/*
  Dazu die 404, über zwei erfundene Adressen.

  Sie liegt als `_not-found` im Bau und fällt damit durch das Filter, das
  Bau-Interna auslässt — geprüft hat sie hier deshalb niemand. Dabei ist sie
  die Seite mit der höchsten Wahrscheinlichkeit für einen toten Verweis: Sie
  zeigt auf sieben Sprungmarken der Startseite, auf beide Rechtsseiten und auf
  die andere Sprachfassung, und sie wird bei keiner Inhaltsänderung
  mitgedacht. Ändert sich eine Abschnittskennung, springt sie ins Leere, und
  auffallen würde das erst jemandem, der sich vertippt hat.

  Zwei Adressen, weil es zwei Antworten sind: Unterhalb von `/en` rendert die
  Seite englischen Text und verweist auf die englischen Ziele.
*/
pfade.push("/diese-adresse-gibt-es-nicht", "/en/this-address-does-not-exist");

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];
let anker = 0;
let bilder = 0;
let adressen = 0;
const gesehen = new Map();

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() >= 500) continue;

  /*
     Erst durchscrollen: Abschnitte, die auf das Hineinscrollen warten, hängen
     ihre Verweise sonst gar nicht ein, und der Lauf prüfte die halbe Seite.
  */
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });

  const ergebnis = await seite.evaluate(() => {
    const ziele = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    const ohneZiel = [
      ...new Set(ziele.filter((h) => h.startsWith("#") && h.length > 1).map((h) => h.slice(1))),
    ].filter((id) => !document.getElementById(id));
    const intern = [...new Set(ziele.filter((h) => h.startsWith("/") && !h.startsWith("//")))];
    return {
      ohneZiel,
      intern,
      gesamt: ziele.length,
      bilder: document.querySelectorAll("img").length,
    };
  });

  /*
     Bilder, die nichts zeigen.

     Ein `img` mit falschem Pfad rendert einen leeren Kasten: kein Fehler im
     Bau, keine Meldung, und der Verweis-Lauf sah es nicht, weil er nur `a`
     zählt. Aufgefallen ist die Lücke, als die elf Produktaufnahmen von PNG
     auf WebP wechselten — hätte ich einen Pfad falsch geschrieben, wäre die
     Fallstudie mit leeren Rahmen online gegangen und jeder Lauf grün
     geblieben.

     `naturalWidth === 0` heißt: geladen wurde nichts. Der Lauf wartet vorher
     auf `networkidle` und scrollt durch, verzögerte Bilder sind also da.
  */
  const leere = await seite.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((bild) => bild.naturalWidth === 0)
      .map((bild) => bild.getAttribute("src")?.slice(0, 70) ?? "(ohne src)"),
  );
  for (const quelle of leere) funde.push(`${pfad}: Bild ohne Inhalt — ${quelle}`);
  bilder += ergebnis.bilder ?? 0;

  anker += ergebnis.gesamt;
  for (const id of ergebnis.ohneZiel) funde.push(`${pfad}: Anker #${id} hat kein Ziel`);

  for (const adresse of ergebnis.intern) {
    /* Dateien mit Endung (PDF, Feed, Bilder) beantwortet der Server direkt. */
    const ohneAnker = adresse.split("#")[0] || "/";
    if (gesehen.has(ohneAnker)) continue;
    const status = (await seite.request.get(`${basis}${ohneAnker}`)).status();
    gesehen.set(ohneAnker, status);
    adressen++;
    if (status >= 400) funde.push(`${pfad}: ${ohneAnker} antwortet mit ${status}`);
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} toter Verweis${funde.length === 1 ? "" : "e"}:\n`);
  for (const f of funde) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `Kein toter Verweis: ${anker} Verweise auf ${pfade.length} Seiten, ` +
    `${adressen} interne Adressen abgerufen, ${bilder} Bilder mit Inhalt.`,
);
