#!/usr/bin/env node
/**
 * Prüft, dass der Tastaturfokus sichtbar bleibt.
 *
 * Die Seite sagt WCAG 2.2 AA zu. Zwei Kriterien daraus lassen sich nicht aus
 * dem Dokument ablesen, sondern nur im Gebrauch messen, und `check:a11y`
 * greift sie deshalb nicht:
 *
 * **2.4.11 Focus Not Obscured.** Neu in WCAG 2.2. Wer sich mit der Tastatur
 * bewegt, dem scrollt der Browser zum nächsten Ziel — und rechnet dabei die
 * feste Kopfleiste nicht mit. Das Element hat dann den Fokus und liegt
 * darunter: Der Nutzer sieht keinen Ring, weiß nicht, wo er ist, und drückt
 * blind weiter.
 *
 * **2.4.7 Focus Visible.** Ein `outline: none` ohne Ersatz macht dasselbe,
 * nur überall gleichzeitig.
 *
 * Gemessen wird nicht über eine Liste fester Kästen. Die Kopfleiste trägt
 * ihre Fläche auf einem Kind und fällt durch jede solche Heuristik — der
 * erste Anlauf meldete deshalb „kein Befund", obwohl er nichts prüfte.
 * Gefragt wird stattdessen der Browser: `elementFromPoint` sagt, was an
 * dieser Stelle wirklich obenauf liegt, und überspringt dabei von selbst,
 * was `pointer-events: none` trägt.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:focus
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Telefon und Desktop: Die Kopfleiste ist auf beiden anders gebaut. */
const BREITEN = [390, 1440];

/** Genug für jede Seite dieser Größe; der Lauf endet ohnehin am Rundlauf. */
const SCHRITTE = 120;

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const pfade = gebauteSeiten();
const funde = [];
let geprueft = 0;
let stationen = 0;

const browser = await chromium.launch();

for (const breite of BREITEN) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 800 } });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
    if (!antwort || antwort.status() !== 200) continue;

    /* Erst messen, wenn nichts mehr fährt.

       Die Kopfleiste kommt von `y: -80` herein, mit 0,9 s Verzögerung und
       0,9 s Dauer. Eine feste Wartezeit von 500 ms traf mitten hinein: Der
       Lauf meldete auf /en bei 390 px drei Bedienelemente „außerhalb des
       Sichtfelds, oben -53" — die Leiste war schlicht noch unterwegs. Auf /
       ging derselbe Lauf durch, weil die Zeit dort knapp reichte. Ein
       Wächter, der je nach Seite etwas anderes meldet, ist keiner.

       Dieselbe Bedingung wie in check-headings: beenden, was endlich ist,
       und weitermachen, wenn nichts mehr läuft. */
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
            // Marquee und Puls laufen absichtlich weiter.
            return bewegung.effect?.getComputedTiming().iterations === Infinity;
          });
        },
        null,
        { timeout: 20000, polling: 200 },
      )
      .catch(() => {
        // Auch dann messen: Was steht, wird geprüft.
      });
    // Rest für das, was die Animationsbibliothek über requestAnimationFrame
    // fährt und was `getAnimations` deshalb nicht kennt.
    await seite.waitForTimeout(1400);
    geprueft++;

    let vorher = "";
    for (let i = 0; i < SCHRITTE; i++) {
      await seite.keyboard.press("Tab");

      const stand = await seite.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;

        const r = el.getBoundingClientRect();
        const name = (el.innerText || el.getAttribute("aria-label") || el.tagName)
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 34);
        const tag = el.tagName;

        /* Ein Element ohne Fläche ist der Sprungverweis vor seinem Auftritt
           und Ähnliches: Es hat den Fokus, zeigt aber nichts. */
        if (r.width < 1 || r.height < 1) return { name, tag, ohneFlaeche: true };

        const draussen =
          r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth;

        /* An fünf Stellen nachsehen: Mitte und die vier Ecken, je zwei Pixel
           nach innen. Sichtbar ist das Element, sobald an einer davon es
           selbst liegt — 2.4.11 verlangt nicht, dass alles frei ist, sondern
           dass nicht alles verdeckt ist. */
        const punkte = [
          [r.left + r.width / 2, r.top + r.height / 2],
          [r.left + 2, r.top + 2],
          [r.right - 2, r.top + 2],
          [r.left + 2, r.bottom - 2],
          [r.right - 2, r.bottom - 2],
        ].filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);

        let sichtbar = false;
        let davor = null;
        for (const [x, y] of punkte) {
          const oben = document.elementFromPoint(x, y);
          if (!oben) continue;
          if (oben === el || el.contains(oben) || oben.contains(el)) {
            sichtbar = true;
            break;
          }
          davor = `${oben.tagName.toLowerCase()}.${oben.className.toString().slice(0, 26)}`;
        }

        const stil = getComputedStyle(el);
        const ring =
          stil.outlineStyle !== "none" && parseFloat(stil.outlineWidth) > 0;

        return {
          name,
          tag,
          draussen,
          sichtbar,
          davor,
          /* Ein Schatten zählt als Ring: Mehrere Schaltflächen zeichnen ihren
             Fokus über `box-shadow`, und das ist genauso sichtbar. */
          markiert: ring || stil.boxShadow !== "none",
          top: Math.round(r.top),
        };
      });

      if (!stand) break;
      // Der Rundlauf ist zu Ende, sobald dasselbe Ziel zweimal kommt.
      const kennung = `${stand.tag}:${stand.name}`;
      if (kennung === vorher) break;
      vorher = kennung;
      if (stand.ohneFlaeche) continue;
      stationen++;

      if (stand.draussen) {
        funde.push(
          `${pfad} bei ${breite} px: „${stand.name}" hat den Fokus außerhalb des Sichtfelds (oben ${stand.top})`,
        );
      } else if (!stand.sichtbar) {
        funde.push(
          `${pfad} bei ${breite} px: „${stand.name}" hat den Fokus, sichtbar ist ${stand.davor} (oben ${stand.top})`,
        );
      }
      if (!stand.markiert) {
        funde.push(`${pfad} bei ${breite} px: „${stand.name}" zeigt keinen Fokus`);
      }
    }
  }

  await seite.close();
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Stelle verliert den Tastaturfokus:\n`);
  for (const f of [...new Set(funde)]) console.error(`  ${f}`);
  console.error(
    `\nWCAG 2.2 verlangt in 2.4.11, dass feste Bedienung den Fokus nicht` +
      `\nverdeckt, und in 2.4.7, dass er zu sehen ist. Ein Ziel unter der` +
      `\nKopfleiste braucht \`scroll-mt-*\`, ein \`outline: none\` einen Ersatz.`,
  );
  process.exit(1);
}

console.log(
  `Der Tastaturfokus bleibt sichtbar: ${stationen} Stationen auf ` +
    `${geprueft} Seitenaufrufen, je ${BREITEN.join(" und ")} px.`,
);
