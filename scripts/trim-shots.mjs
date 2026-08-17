#!/usr/bin/env node
/**
 * Schneidet den fremden Streifen am oberen Rand der App-Aufnahmen weg.
 *
 * Der Befund, der diesen Lauf ausgeloest hat: Auf den NOURI-Aufnahmen lag oben
 * ein Streifen mit abgerundeten Ecken, durch den der Bildschirm hinter der App
 * zu sehen war, bei `training` sogar cremefarben. Auf einer Seite, die mit
 * Belegen argumentiert, liest sich so ein Streifen wie ein Darstellungsfehler
 * der App. Bei Dartile war es dasselbe.
 *
 * Die Hoehe wird **gemessen und nicht festgeschrieben**. Ein erster Versuch mit
 * festen 14 Pixeln fuer alle vier NOURI-Bilder ging schief: Bei `training` war
 * der Streifen 44 Pixel hoch, und nach dem Schnitt lag er weiter da. Eine Zahl
 * im Quelltext haette dieselbe Falle beim naechsten Bild wieder gestellt.
 *
 * Erkannt wird der Streifen daran, dass die aeussersten 40 Pixel links oder
 * rechts einer Zeile nicht zur Farbe in der Zeilenmitte passen. Genau so sehen
 * eine abgerundete Ecke, ein Schatten und ein Rest des Bildschirms darunter
 * aus; eine Zeile mitten in der App sieht so nicht aus.
 *
 * Geschnitten wird je Gruppe **gleich viel**, naemlich das Maximum der Gruppe.
 * Sonst haetten die vier NOURI-Aufnahmen vier verschiedene Hoehen, und
 * `check:shots` beanstandet das zu Recht, weil eine Kartenreihe daran bricht.
 *
 * Der Lauf ist wiederholbar: Ist oben nichts Fremdes mehr, schneidet er nicht.
 *
 *   npm run trim:shots
 *
 * Danach `npm run build:shots`.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

const ORIGINALE = "../assets/shots";

/** Wie viele Pixel am Rand geprueft werden und wie streng. */
const RANDBREITE = 40;
const TOLERANZ = 12;

/** So viele saubere Zeilen in Folge gelten als „der Streifen ist zu Ende". */
const RUHE = 6;

/**
 * Hoehe des fremden Streifens am oberen Rand, in Pixeln.
 *
 * Gesucht wird die erste Zeile, ab der `RUHE` Zeilen in Folge an beiden
 * Raendern zur Zeilenmitte passen.
 */
async function fremderStreifen(pfad) {
  const bild = sharp(pfad);
  const { width, height } = await bild.metadata();
  const roh = await bild.raw().toBuffer();
  const kan = roh.length / (width * height);

  const passt = (y) => {
    const m = (y * width + Math.floor(width / 2)) * kan;
    const [r0, g0, b0] = [roh[m], roh[m + 1], roh[m + 2]];
    for (const bereich of [
      [0, RANDBREITE],
      [width - RANDBREITE, width],
    ]) {
      for (let x = bereich[0]; x < bereich[1]; x++) {
        const i = (y * width + x) * kan;
        if (
          Math.abs(roh[i] - r0) > TOLERANZ ||
          Math.abs(roh[i + 1] - g0) > TOLERANZ ||
          Math.abs(roh[i + 2] - b0) > TOLERANZ
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const grenze = Math.min(140, height - RUHE);
  for (let y = 0; y < grenze; y++) {
    let ruhig = true;
    for (let k = 0; k < RUHE; k++) {
      if (!passt(y + k)) {
        ruhig = false;
        break;
      }
    }
    if (ruhig) return { streifen: y, width, height };
  }
  return { streifen: 0, width, height };
}

/** Alle Gruppen, also alle Unterordner mit App-Aufnahmen. */
const gruppen = readdirSync(ORIGINALE)
  .filter((n) => statSync(join(ORIGINALE, n)).isDirectory())
  .map((n) => ({
    name: n,
    dateien: readdirSync(join(ORIGINALE, n)).filter((f) => f.endsWith(".png")),
  }));

let geschnitten = 0;

for (const g of gruppen) {
  const gemessen = [];
  for (const datei of g.dateien) {
    const pfad = join(ORIGINALE, g.name, datei);
    if (!existsSync(pfad)) continue;
    gemessen.push({ datei, pfad, ...(await fremderStreifen(pfad)) });
  }
  if (!gemessen.length) continue;

  const max = Math.max(...gemessen.map((m) => m.streifen));
  const einzeln = gemessen.map((m) => `${m.datei.replace(".png", "")} ${m.streifen}`).join(", ");
  if (max === 0) {
    console.log(`  ${g.name.padEnd(10)} oben sauber (${einzeln})`);
    continue;
  }
  console.log(`  ${g.name.padEnd(10)} Streifen bis ${max} px (${einzeln})`);

  for (const m of gemessen) {
    const puffer = await sharp(m.pfad)
      .extract({ left: 0, top: max, width: m.width, height: m.height - max })
      .png()
      .toBuffer();
    await sharp(puffer).toFile(m.pfad);
    console.log(`      ${m.datei}  ${m.width} x ${m.height} -> ${m.width} x ${m.height - max}`);
    geschnitten += 1;
  }
}

console.log(
  geschnitten
    ? `\n${geschnitten} Aufnahme(n) geschnitten. Jetzt \`npm run build:shots\`.`
    : `\nNichts zu schneiden, alle oberen Raender sind sauber.`,
);
