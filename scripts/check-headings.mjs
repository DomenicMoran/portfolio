#!/usr/bin/env node
/**
 * Prüft, dass keine Überschrift ihre Unterlängen abschneidet.
 *
 * Die Überschriften kommen wortweise aus einer Maske hervor: Jedes Wort sitzt
 * in einem `inline-block` mit `overflow: hidden`, und dessen untere Kante
 * schneidet mit. Wie viel Platz darunter bleibt, hängt an drei Werten, die
 * nichts voneinander wissen — Schriftgröße, `line-height` und das Polster der
 * Maske. Ändert jemand einen davon, verschwinden Buchstaben, und zwar nur die
 * mit Unterlänge und nur in manchen Wörtern.
 *
 * Gefunden hat das am 02.08.2026 ein Leser, kein Prüflauf: Das „g" in
 * „fertige" und das „y" in „Prototypen" endeten flach. Gemessen bei 1440 px
 * lagen unter der Grundlinie 16,8 px Platz bei 28 px Tinte der kursiven
 * Auszeichnungsschrift.
 *
 * Gemessen wird die tatsächliche Tinte über `actualBoundingBoxDescent` der
 * jeweils gerenderten Schrift — nicht ein Tabellenwert, denn Grundschrift und
 * kursive Auszeichnung unterscheiden sich hier um ein Drittel.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:headings
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/** Zwei Breiten: die Schrift skaliert über `clamp`, das Polster über `em`. */
const BREITEN = [1440, 390];

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

const browser = await chromium.launch();
let fehler = 0;

for (const breite of BREITEN) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 900 } });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "domcontentloaded" });
    if (!antwort || antwort.status() !== 200) continue;

    // Einmal durchscrollen: Die Überschriften unterhalb der Falz erscheinen
    // erst dabei, und vorher haben sie keine gemessene Größe.
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    /*
      Und dann warten, bis die Wörter stehen.

      Der erste Anlauf maß sofort und meldete drei Überschriften auf /en als
      abgeschnitten — mit „nur 0 px Platz", was es gar nicht geben kann. Die
      Wörter waren mitten im Auftritt: Sie kommen von unten aus der Maske
      hervor, und solange sie unterwegs sind, liegt ihre Unterkante unter der
      des Kastens. Gemessen wurde die Bewegung, nicht das Ergebnis.

      Endliche Animationen springen ans Ende, Endlosschleifen bleiben; der
      Rest ist Wartezeit für das, was die Animationsbibliothek über
      requestAnimationFrame fährt und was `getAnimations` deshalb nicht kennt.
    */
    await seite.evaluate(() => {
      for (const bewegung of document.getAnimations()) {
        try {
          bewegung.finish();
        } catch {
          // Endlos, also ohne Endwert.
        }
      }
    });
    await seite.waitForTimeout(1400);

    const funde = await seite.evaluate(() => {
      const messer = document.createElement("canvas").getContext("2d");
      const raus = [];

      for (const ueberschrift of document.querySelectorAll("h1, h2, h3")) {
        const masken = [...ueberschrift.querySelectorAll("span")].filter(
          (s) => getComputedStyle(s).overflow === "hidden",
        );
        for (const maske of masken) {
          const wort = maske.textContent ?? "";
          if (!/[gyqpjß,;]/.test(wort)) continue;

          const kind = maske.firstElementChild ?? maske;
          const stil = getComputedStyle(kind);
          messer.font = `${stil.fontStyle} ${stil.fontWeight} ${stil.fontSize} ${stil.fontFamily}`;
          const tinte = messer.measureText(wort).actualBoundingBoxDescent;

          // Platz unter der Zeilenbox des Wortes plus der Teil der Unterlänge,
          // der noch in der Zeilenbox selbst liegt. Letzteren liefert die
          // Differenz zwischen Zeilenbox und Inhaltsbox nicht direkt, deshalb
          // wird er über die Schriftmetrik der Zeile geschätzt: `line-height`
          // gegen `font-size`.
          const unterKante =
            maske.getBoundingClientRect().bottom - kind.getBoundingClientRect().bottom;
          const groesse = parseFloat(stil.fontSize);
          const zeile = parseFloat(stil.lineHeight) || groesse;
          const inDerZeile = Math.max(0, (zeile - groesse) / 2) + groesse * 0.07;

          if (unterKante + inDerZeile < tinte) {
            raus.push({
              wort: wort.trim().slice(0, 20),
              groesse: Math.round(groesse),
              tinte: Math.round(tinte * 10) / 10,
              platz: Math.round((unterKante + inDerZeile) * 10) / 10,
            });
          }
        }
      }
      return raus;
    });

    if (funde.length > 0) {
      fehler += funde.length;
      console.log(`  FEHLER ${pfad} bei ${breite} px`);
      for (const f of funde) {
        console.log(
          `        „${f.wort}" bei ${f.groesse} px: ${f.tinte} px Tinte, nur ${f.platz} px Platz`,
        );
      }
    }
  }

  await seite.close();
}

await browser.close();
beenden();

if (fehler > 0) {
  console.error(
    `\n${fehler} abgeschnittene Unterlänge${fehler === 1 ? "" : "n"}. Das Polster der ` +
      `Maske steht in Hero.tsx und Reveal.tsx als \`pb-[…em]\`, ausgeglichen durch ` +
      `ein gleich großes negatives \`-mb-[…em]\`.`,
  );
  process.exit(1);
}

console.log(
  `Keine abgeschnittene Unterlänge: ${pfade.length} Seiten × ${BREITEN.length} Breiten geprüft.`,
);
