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
/** Wörter, die beim Messen noch in Bewegung waren: ein Befund am Lauf. */
let nichtMessbar = 0;

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

      Eine feste Wartezeit reichte dafür nicht.

      Sie stand hier auf 1.400 ms, und lokal ging das immer gut. Auf dem
      Bauserver scheiterte derselbe Lauf am 02.08.2026 an „gebaut." mit
      „12 px Tinte, nur -55,8 px Platz" — eine negative Zahl, die es als
      Befund nicht geben kann: Sie heißt, dass das Wort zum Messzeitpunkt
      noch 56 px unter seiner Maske stand, also mitten im Auftritt war.

      Die Wörter im Hero starten gestaffelt, das letzte mit gut einer halben
      Sekunde Verzögerung. Auf einer langsamen Maschine liegt die Hydration
      hinter dem `finish()`-Aufruf: Die Animation entsteht danach neu, läuft
      erneut an, und 1.400 ms treffen genau ihr Ende. Ein Wächter, der je nach
      Maschine etwas anderes meldet, ist kein Wächter.

      Deshalb eine Bedingung statt einer Frist: In Runden wird beendet, was
      endlich ist, und erst weitergemacht, wenn nichts mehr läuft.
    */
    await seite
      .waitForFunction(
        () => {
          for (const bewegung of document.getAnimations()) {
            try {
              bewegung.finish();
            } catch {
              // Endlos, also ohne Endwert.
            }
          }
          return document.getAnimations().every((bewegung) => {
            if (bewegung.playState !== "running") return true;
            // Endlosschleifen (Marquee, Puls) laufen absichtlich weiter.
            return bewegung.effect?.getComputedTiming().iterations === Infinity;
          });
        },
        null,
        { timeout: 20000, polling: 200 },
      )
      .catch(() => {
        // Auch dann noch messen: Der Verschiebungstest unten fängt ab, was
        // sich nicht beruhigt hat, und meldet es als nicht messbar.
      });
    // Rest für das, was die Animationsbibliothek über requestAnimationFrame
    // fährt und was `getAnimations` deshalb nicht kennt.
    await seite.waitForTimeout(1400);

    const { raus: funde, unruhig } = await seite.evaluate(() => {
      const messer = document.createElement("canvas").getContext("2d");
      const raus = [];
      const unruhig = [];

      for (const ueberschrift of document.querySelectorAll("h1, h2, h3")) {
        const masken = [...ueberschrift.querySelectorAll("span")].filter(
          (s) => getComputedStyle(s).overflow === "hidden",
        );
        for (const maske of masken) {
          const wort = maske.textContent ?? "";
          if (!/[gyqpjß,;]/.test(wort)) continue;

          const kind = maske.firstElementChild ?? maske;
          const stil = getComputedStyle(kind);

          /* Ein noch verschobenes Wort ist keine abgeschnittene Unterlänge.

             Die Kastenmaße kommen aus `getBoundingClientRect`, und die zählt
             Transformationen mit. Steht das Wort noch unter seiner Maske,
             kommt eine negative Platzangabe heraus — ein Befund, den es so
             nicht gibt. Solche Fälle werden gezählt und gemeldet, nicht
             stillschweigend übergangen: Ein Wächter, der beim Messfehler
             „alles in Ordnung" sagt, ist schlimmer als einer, der schweigt. */
          if (stil.transform !== "none" && stil.transform !== "matrix(1, 0, 0, 1, 0, 0)") {
            unruhig.push(`${wort.trim().slice(0, 20)} (${stil.transform})`);
            continue;
          }
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
      return { raus, unruhig };
    });

    if (unruhig.length > 0) {
      nichtMessbar += unruhig.length;
      console.log(`  NICHT MESSBAR ${pfad} bei ${breite} px`);
      for (const u of unruhig) console.log(`        ${u} stand noch verschoben`);
    }

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
}

if (nichtMessbar > 0) {
  console.error(
    `\n${nichtMessbar} ${nichtMessbar === 1 ? "Wort stand" : "Wörter standen"} beim ` +
      `Messen noch verschoben. Das ist kein Befund ` +
      `an der Schrift, sondern einer am Lauf: Die Wartebedingung oben hat die ` +
      `Bewegung nicht abgewartet.`,
  );
}

if (fehler > 0 || nichtMessbar > 0) process.exit(1);

console.log(
  `Keine abgeschnittene Unterlänge: ${pfade.length} Seiten × ${BREITEN.length} Breiten geprüft.`,
);
