#!/usr/bin/env node
/**
 * Haelt die Produktaufnahmen gegen das, was die Seite ueber sie behauptet.
 *
 * Zahlen prueft dieses Repo seit jeher gegen ihre Quelle. Bilder nicht, und das
 * war eine Luecke mit Ansage: Am 16.08.2026 stand auf der Startseite eine
 * Aufnahme von nouri-fitness.de vom 2. August mit dem Satz "14 Tage kostenlos
 * testen", waehrend live seit dem 15. August sieben Tage stehen. Vier von fuenf
 * Website-Aufnahmen schnitten ausserdem quer durch eine Kennzahlenreihe oder
 * endeten mitten im naechsten Abschnitt.
 *
 * Geprueft wird viererlei:
 *
 * 1. Jede Aufnahme, die der Inhalt nennt, liegt auch in `public/shots`.
 * 2. Das ausgelieferte Bild hat genau das Mass, das der Inhalt deklariert.
 *    Weicht es ab, rechnet `next/image` mit einem falschen Seitenverhaeltnis
 *    und die Karte springt beim Laden.
 * 3. Aufnahmen derselben Gruppe teilen ein Seitenverhaeltnis. Eine Reihe von
 *    Telefonaufnahmen, in der eine anders hoch ist, bricht die Zeile; gemessen
 *    an `salati/shot-study.png`, das 720 x 1477 war, waehrend seine fuenf
 *    Geschwister 720 x 1600 sind.
 * 4. Das Original zu jedem ausgelieferten Bild existiert und ist nicht
 *    unverhaeltnismaessig alt. Alt heisst hier nicht falsch, aber es ist die
 *    Stelle, an der man nachsieht.
 *
 *   npm run check:shots
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

const AUSGELIEFERT = "public/shots";
const ORIGINALE = "../assets/shots";

/** Ab wann eine Aufnahme im Bericht als alt auffaellt. */
const ALTER_TAGE = 21;

/** Wie weit zwei Seitenverhaeltnisse einer Gruppe auseinanderliegen duerfen. */
const VERHAELTNIS_TOLERANZ = 0.03;

const inhalt = ["src/content/site.ts", "src/content/en.ts"]
  .map((p) => readFileSync(p, "utf8"))
  .join("\n");

/** Jede Aufnahme mit dem Mass, das der Inhalt fuer sie deklariert. */
const genannt = new Map();
const muster = /"\/shots\/([^"]+)"[\s\S]{0,600}?width:\s*(\d+),\s*height:\s*(\d+)/g;
for (const [, datei, w, h] of inhalt.matchAll(muster)) {
  if (!genannt.has(datei)) genannt.set(datei, { breite: Number(w), hoehe: Number(h) });
}

if (!genannt.size) {
  console.error("Kein einziger Verweis auf /shots/ gefunden. Hat sich die Schreibweise geaendert?");
  process.exit(1);
}

const befunde = [];
const hinweise = [];
const gruppen = new Map();

for (const [datei, soll] of genannt) {
  const ausgeliefert = join(AUSGELIEFERT, datei);
  if (!existsSync(ausgeliefert)) {
    befunde.push(`${datei}: die Seite nennt sie, ${ausgeliefert} gibt es nicht`);
    continue;
  }

  const { width, height } = await sharp(ausgeliefert).metadata();
  if (width !== soll.breite || height !== soll.hoehe) {
    befunde.push(
      `${datei}: Datei ist ${width} x ${height}, der Inhalt deklariert ${soll.breite} x ${soll.hoehe}`,
    );
  }

  const gruppe = datei.includes("/") ? datei.split("/")[0] : "start";
  if (!gruppen.has(gruppe)) gruppen.set(gruppe, []);
  gruppen.get(gruppe).push({ datei, verhaeltnis: width / height });

  // Das Original tragen die Aufnahmen als PNG neben dem Repo.
  const original = join(ORIGINALE, datei.replace(/\.webp$/, ".png"));
  if (!existsSync(original)) {
    befunde.push(`${datei}: kein Original unter ${original}, neu erzeugen geht damit nicht`);
    continue;
  }
  const tage = Math.floor((Date.now() - statSync(original).mtimeMs) / 86_400_000);
  if (tage > ALTER_TAGE) hinweise.push(`${datei}: Original ist ${tage} Tage alt`);
}

/**
 * Innerhalb eines Ordners darf es mehrere Formate geben, aber kein "fast".
 *
 * `salati/` haelt Telefonaufnahmen (0,450) und Fernsehaufnahmen (1,778)
 * nebeneinander. Das sind zwei Geraeteklassen, keine Abweichung: Sie stehen
 * auf der Seite auch in getrennten Reihen. Ein Format, das einem anderen nahe
 * kommt, ohne es zu treffen, ist dagegen genau der Fehler, den niemand sieht
 * und der die Reihe bricht.
 *
 * Deshalb werden die Verhaeltnisse eines Ordners zu Buendeln zusammengefasst,
 * und beanstandet wird nur, was innerhalb von 20 Prozent neben einem anderen
 * Buendel liegt.
 */
const NAHE = 0.2;

for (const [gruppe, bilder] of gruppen) {
  if (gruppe === "start" || bilder.length < 2) continue;

  const buendel = [];
  for (const b of bilder) {
    const treffer = buendel.find(
      (x) => Math.abs(b.verhaeltnis - x.mittel) / x.mittel <= VERHAELTNIS_TOLERANZ,
    );
    if (treffer) {
      treffer.bilder.push(b);
      treffer.mittel =
        treffer.bilder.reduce((s, y) => s + y.verhaeltnis, 0) / treffer.bilder.length;
    } else {
      buendel.push({ mittel: b.verhaeltnis, bilder: [b] });
    }
  }

  for (const b of buendel) {
    const nachbar = buendel.find(
      (x) => x !== b && Math.abs(b.mittel - x.mittel) / x.mittel <= NAHE,
    );
    if (!nachbar) continue;
    // Das kleinere Buendel ist der Ausreisser.
    if (b.bilder.length <= nachbar.bilder.length) {
      for (const bild of b.bilder) {
        befunde.push(
          `${bild.datei}: Seitenverhaeltnis ${bild.verhaeltnis.toFixed(3)} liegt neben ` +
            `${nachbar.mittel.toFixed(3)}, dem Format der uebrigen ${nachbar.bilder.length} ` +
            `Aufnahmen in "${gruppe}". In einer Reihe bricht das die Zeile.`,
        );
      }
    }
  }
}

if (befunde.length) {
  console.error(`${befunde.length} Aufnahme(n) stimmen nicht:\n`);
  for (const b of befunde) console.error(`  ${b}`);
  console.error(
    "\nEin Bild ist dieselbe Sorte Aussage wie eine Zahl. Website-Aufnahmen\n" +
      "erneuert `npm run capture:shots`, danach `npm run build:shots`.\n" +
      "App-Aufnahmen kommen aus dem jeweiligen Projekt.",
  );
  process.exit(1);
}

console.log(
  `Jede Aufnahme passt zu dem, was die Seite ueber sie sagt: ${genannt.size} Bilder, ` +
    `${gruppen.size} Gruppen mit einheitlichem Seitenverhaeltnis.`,
);
if (hinweise.length) {
  console.log(`\n  Aelter als ${ALTER_TAGE} Tage, ohne Beanstandung:`);
  for (const h of hinweise) console.log(`    ${h}`);
}
