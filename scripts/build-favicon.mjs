#!/usr/bin/env node
/**
 * Erzeugt `src/app/favicon.ico` aus derselben Form wie alles andere.
 *
 * Das Zeichen steht in `src/lib/mark.tsx` und wird von der Kopfleiste, dem
 * PNG-Symbol, dem Startbildschirm-Symbol und der Vorschaukarte gelesen. Die
 * `.ico` konnte das nicht: Sie ist eine Binärdatei und lag als Rest eines
 * früheren Entwurfs im Verzeichnis. Zwei Formen für dieselbe Seite entstehen
 * genau so, nicht durch eine Entscheidung, sondern durch eine Datei, die
 * niemand mitzieht.
 *
 * Drei Größen, weil Windows und ältere Browser aus einer `.ico` die passende
 * ziehen: 16, 32 und 48 Pixel. Gerendert wird über Chromium, damit die Kanten
 * dieselbe Glättung bekommen wie im PNG daneben.
 *
 * Aufruf nach jeder Änderung an `src/lib/mark.tsx`:
 *
 *   npm run build:favicon
 */

import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const GROESSEN = [16, 32, 48];

/* Die Form aus der Quelldatei lesen statt sie hier zu wiederholen: Eine
   zweite Abschrift wäre wieder die zweite Marke. */
const quelle = readFileSync(join("src", "lib", "mark.tsx"), "utf8");
const grund = quelle.match(/MARKE_GRUND = "([^"]+)"/)?.[1];
const zeichen = quelle.match(/MARKE_ZEICHEN = "([^"]+)"/)?.[1];
const stamm = quelle.match(/MARKE_STAMM = (\{[^}]+\})/)?.[1];
const bogen = quelle.match(/MARKE_BOGEN =\s*\n?\s*"([^"]+)"/)?.[1];

if (!grund || !zeichen || !stamm || !bogen) {
  console.error("src/lib/mark.tsx: Form nicht lesbar. Wurden die Namen geändert?");
  process.exit(1);
}

const s = JSON.parse(stamm.replace(/(\w+):/g, '"$1":'));
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
  `<rect width="64" height="64" rx="13" fill="${grund}"/>` +
  `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.rx}" fill="${zeichen}"/>` +
  `<path d="${bogen}" fill="${zeichen}"/></svg>`;

const browser = await chromium.launch();
const bilder = [];

for (const groesse of GROESSEN) {
  const seite = await browser.newPage({
    viewport: { width: groesse, height: groesse },
  });
  await seite.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block}</style>` +
      svg.replace("<svg ", `<svg width="${groesse}" height="${groesse}" `),
  );
  const datei = join(tmpdir(), `favicon-${groesse}.png`);
  await seite.screenshot({ path: datei, omitBackground: true });
  await seite.close();
  bilder.push(datei);
}

await browser.close();

/* Python setzt die .ico zusammen: Node hat dafür nichts an Bord, und eine
   Abhängigkeit für drei Bilder lohnt nicht. */
/* Die groesste Fassung ist die Vorlage. Pillow rechnet aus ihr herunter und
   laesst jede angeforderte Groesse aus, die groesser waere als das Original:
   mit der 16er als Vorlage enthielt die Datei am Ende genau eine Groesse. */
const skript = `
from PIL import Image
vorlage = Image.open(${JSON.stringify(bilder[bilder.length - 1])})
vorlage.save(${JSON.stringify(join("src", "app", "favicon.ico"))},
             format="ICO",
             sizes=[${GROESSEN.map((g) => `(${g}, ${g})`).join(", ")}])
with Image.open(${JSON.stringify(join("src", "app", "favicon.ico"))}) as fertig:
    print(" ".join(f"{b}x{h}" for b, h in sorted(fertig.info["sizes"])))
`;

const ergebnis = execFileSync("python", ["-c", skript], { encoding: "utf8" }).trim();
for (const datei of bilder) unlinkSync(datei);

const groesse = readFileSync(join("src", "app", "favicon.ico")).length;
console.log(`favicon.ico neu gebaut: ${ergebnis}, ${(groesse / 1024).toFixed(1)} kB.`);

/* Der Aufrufer soll wissen, ob die Datei sich geändert hat: Ohne diesen Hinweis
   sieht ein unveränderter Lauf genauso aus wie ein wirksamer. */
try {
  const status = execFileSync("git", ["status", "--porcelain", "src/app/favicon.ico"], {
    encoding: "utf8",
  }).trim();
  console.log(status ? "Die Datei hat sich geändert." : "Unverändert gegenüber dem Stand im Repo.");
} catch {
  /* Ohne git ist das nur eine fehlende Zusatzangabe. */
}
