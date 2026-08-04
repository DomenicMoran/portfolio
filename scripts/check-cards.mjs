#!/usr/bin/env node
/**
 * In einer Kartenreihe beginnen die Texte auf gleicher Höhe.
 *
 * Karten in einem Raster sind gleich hoch, ihre Überschriften nicht. Braucht
 * eine davon zwei Zeilen und die daneben eine, rutscht der Fließtext um eine
 * Zeilenhöhe nach unten, und die Reihe steht schief. Auf einem Bildschirmfoto
 * sieht man es sofort, in keinem Build-Log.
 *
 * Gemessen am 04.08.2026 im Recruiter-Bereich: 22 px Versatz bei 1280 und
 * 1440 px auf Deutsch, bei 768 und 1280 px auf Englisch. Auf 1024 px fiel es
 * nicht auf, weil dort zufällig alle drei Überschriften der Reihe zweizeilig
 * waren — genau deshalb reicht eine Breite nicht.
 *
 * Geprüft wird die ausgelieferte Seite: Ob ein Titel umbricht, entscheidet die
 * Schrift, nicht der Quelltext.
 *
 *   npm run check:cards
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Dieselben Breiten, an denen die Rasterpunkte liegen, plus zwei dazwischen. */
const BREITEN = [768, 1024, 1280, 1440];

/** Ab wie viel Versatz es auffällt. Unter zwei Pixeln ist es Rundung. */
const TOLERANZ = 2;

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const pfade = gebauteSeiten();
const browser = await chromium.launch();
const funde = [];
let reihen = 0;

for (const breite of BREITEN) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 1000 } });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, {
      waitUntil: "domcontentloaded",
    });
    if (!antwort || antwort.status() !== 200) continue;

    /* Erst durchscrollen: Die Karten stehen bis zum Hineinscrollen auf
       `opacity: 0` und einer Verschiebung. Wer vorher misst, misst die
       Verschiebung und nicht das Raster. */
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await seite.evaluate(() => {
      for (const b of document.getAnimations()) {
        try {
          b.finish();
        } catch {
          /* Endlosschleifen haben kein Ende. */
        }
      }
    });
    await seite.waitForTimeout(200);

    const messung = await seite.evaluate((toleranz) => {
      /* Eine Karte ist ein Element mit der Klasse `lit`: So heißt in diesem
         Projekt die Fläche mit Rand und Lichtschein, und genau die stehen in
         Rastern nebeneinander. */
      const karten = [...document.querySelectorAll(".lit")].filter((k) => {
        const kasten = k.getBoundingClientRect();
        return kasten.width > 0 && kasten.height > 0;
      });

      /* Nach Oberkante gruppieren ergibt die Reihen. Gerundet auf vier Pixel,
         weil eine Karte mit Rahmen einen halben Pixel danebenliegen darf. */
      const reihen = new Map();
      for (const k of karten) {
        const oben = Math.round(k.getBoundingClientRect().top / 4) * 4;
        if (!reihen.has(oben)) reihen.set(oben, []);
        reihen.get(oben).push(k);
      }

      const raus = [];
      let gezaehlt = 0;

      for (const [, gruppe] of reihen) {
        if (gruppe.length < 2) continue;
        gezaehlt++;

        /* Verglichen wird der erste Absatz jeder Karte, nicht die Überschrift:
           Die Überschriften stehen ohnehin oben bündig. Schief wird es eine
           Ebene darunter. */
        const anfaenge = gruppe
          .map((k) => {
            const p = k.querySelector("p");
            return p
              ? {
                  y: p.getBoundingClientRect().top - k.getBoundingClientRect().top,
                  titel: (k.querySelector("h2,h3,h4")?.textContent ?? "")
                    .trim()
                    .slice(0, 34),
                }
              : null;
          })
          .filter(Boolean);

        if (anfaenge.length < 2) continue;
        const werte = anfaenge.map((a) => a.y);
        const versatz = Math.max(...werte) - Math.min(...werte);
        if (versatz > toleranz) {
          raus.push({
            versatz: Math.round(versatz),
            karten: anfaenge.map((a) => `„${a.titel}" +${Math.round(a.y)}`),
          });
        }
      }

      return { raus, gezaehlt };
    }, TOLERANZ);

    reihen += messung.gezaehlt;
    for (const f of messung.raus) {
      funde.push(
        `${pfad} bei ${breite} px: ${f.versatz} px Versatz — ${f.karten.join(" · ")}`,
      );
    }
  }

  await seite.close();
}

await browser.close();
beenden();

if (funde.length) {
  console.error(
    `\n${funde.length} Kartenreihe(n), in denen der Text nicht auf einer Höhe beginnt:\n`,
  );
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nDie Überschrift braucht eine Mindesthöhe in Zeilen (\`min-h-[2lh]\`), ` +
      `damit eine zweizeilige daneben nichts verschiebt.`,
  );
  process.exit(1);
}

console.log(
  `Jede Kartenreihe beginnt auf einer Höhe: ${reihen} Reihen auf ` +
    `${pfade.length} Seiten × ${BREITEN.length} Breiten geprüft.`,
);
