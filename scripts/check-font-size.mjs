#!/usr/bin/env node
/**
 * Prüft, dass die Seite eine hochgestellte Standardschriftgröße verträgt.
 *
 * Chrome bietet in seinen Einstellungen 20 und 24 px als Standardschrift an,
 * Firefox und Safari genauso. Wer sie braucht, stellt sie einmal ein und lässt
 * sie stehen — auf jeder Seite, für immer. Das ist keine Randgruppe, und WCAG
 * 1.4.4 verlangt ausdrücklich, dass Text sich vergrößern lässt, ohne dass
 * Inhalt verlorengeht.
 *
 * Anders als Zoom vergrößert diese Einstellung **nur** Längen in `rem` und
 * `em`. Der Viewport bleibt, die Spalten bleiben, die Wörter wachsen. Genau
 * dort reißt ein Layout, und ein Zoom-Test zeigt es nicht: Beim Zoom wächst
 * alles gleichmäßig mit, hier nicht.
 *
 * Gemessen wird die rechte Kante des Textes gegen die rechte Kante des
 * Fensters — nicht `scrollWidth > clientWidth`. Der Unterschied ist wesentlich:
 * `html` und `body` tragen `overflow-x: clip`, damit auf Telefonen nichts
 * seitwärts scrollt. Was über die Kante ragt, erzeugt deshalb keine
 * Bildlaufleiste. Es ist einfach weg, ohne Hinweis und ohne Weg dorthin.
 *
 * Gemessen am 05.08.2026 bei 24 px Grundschrift und 320 px Breite, der
 * Bezugsbreite von WCAG 1.4.10: 58 Elemente der Startseite ragten über die
 * Kante, bis zu 63 px weit — Überschriften, Fließtext, Kennzahlen. Bei 16 px
 * war dieselbe Messung leer, deshalb sah kein bestehender Lauf etwas.
 *
 * Behoben wurden dabei fuenf Muster, keine 88 Einzelfaelle: `overflow-wrap`
 * als Grundregel fuer Textelemente, `min-w-0` an Flex- und Grid-Kindern,
 * deren `min-width: auto` sie nicht unter ihre Inhaltsbreite schrumpfen
 * laesst, `max-w-full` an `w-fit`-Verweisen, `flex-wrap` ohne `shrink-0` an
 * Schaltflaechenreihen und `break-all` an Adressen.
 *
 * Der letzte Fall ist der lehrreiche: `overflow-wrap: break-word` half der
 * LinkedIn-Adresse im Kurzprofil nicht. Es aendert die Mindestbreite eines
 * Elements nicht, und ein `inline-block` misst sich genau daran — eine
 * Adresse ohne Leerzeichen bleibt damit so breit wie sie ist. Erst
 * `break-all` bricht sie.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:font-size
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** 16 px als Gegenprobe, 24 px als der Fall, um den es geht. */
const GROESSEN = [16, 24];

/** 320 px ist die Bezugsbreite von WCAG 1.4.10, 390 px ein heutiges Telefon. */
const BREITEN = [320, 390];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const pfade = gebauteSeiten();
const funde = [];
let geprueft = 0;

for (const grundschrift of GROESSEN) {
  const browser = await chromium.launch({
    args: [`--blink-settings=defaultFontSize=${grundschrift}`],
  });

  for (const breite of BREITEN) {
    const seite = await browser.newPage({ viewport: { width: breite, height: 900 } });

    for (const pfad of pfade) {
      const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
      if (!antwort || antwort.status() !== 200) continue;

      // Die Abschnitte erscheinen erst beim Hineinscrollen und haben vorher
      // keine gemessene Größe.
      await seite.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 25));
        }
        window.scrollTo(0, 0);
      });
      await seite.waitForTimeout(300);
      geprueft++;

      const raus = await seite.evaluate(() => {
        const fensterbreite = window.innerWidth;
        const treffer = [];

        for (const el of document.querySelectorAll("body *")) {
          const stil = getComputedStyle(el);
          if (stil.display === "none" || stil.visibility === "hidden") continue;
          /* Die Kopfleiste steht fest über dem Inhalt und richtet sich nach dem
             Fenster, nicht nach der Spalte. */
          if (stil.position === "fixed") continue;

          // Nur Elemente mit eigenem Text: Sonst meldet jede Hülle mit.
          const eigen = [...el.childNodes]
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent.trim())
            .join(" ");
          if (!eigen) continue;

          /* Ein Codeblock darf breiter sein als seine Spalte: Er bringt einen
             eigenen Bildlauf mit, und umbrechender Code wäre schlechter
             lesbar als scrollender. */
          if (el.closest("pre, code")) continue;

          /* Wessen Vorfahre selbst klemmt oder scrollt, dessen Bezugsgröße ist
             diese Kante und nicht die des Fensters. Das Laufband der Techniken
             gehört dazu, obwohl es keinen solchen Vorfahren hat: Es läuft
             absichtlich aus dem Bild und verlässt sich dabei auf die Klemmung
             an `body`. Seine Position hängt außerdem am Zeitpunkt der
             Messung — ein Befund daraus wäre je nach Lauf ein anderer. */
          let frei = true;
          for (let v = el.parentElement; v && v !== document.body; v = v.parentElement) {
            if (getComputedStyle(v).overflowX !== "visible") { frei = false; break; }
            if (v.classList.contains("animate-marquee")) { frei = false; break; }
          }
          if (!frei) continue;

          const rechteck = el.getBoundingClientRect();
          if (rechteck.width < 1 || rechteck.height < 1) continue;

          const drueber = Math.round(rechteck.right - fensterbreite);
          if (drueber > 1) {
            treffer.push(
              `${el.tagName.toLowerCase()} ragt ${drueber} px über die Kante: ` +
                `„${eigen.slice(0, 40)}"`,
            );
          }
        }
        return [...new Set(treffer)];
      });

      for (const t of raus) {
        funde.push(`${pfad} bei ${grundschrift} px Grundschrift und ${breite} px Breite: ${t}`);
      }
    }

    await seite.close();
  }

  await browser.close();
}

beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Stelle geht bei größerer Grundschrift verloren:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nWas über die rechte Kante ragt, klemmt \`overflow-x: clip\` ab: Es ist` +
      `\nweg, nicht erscrollbar. Ein Wort ohne Umbruchpunkt braucht` +
      `\n\`overflow-wrap\`, ein Flex- oder Grid-Kind \`min-w-0\`, ein` +
      `\n\`w-fit\`-Element \`max-w-full\`.`,
  );
  process.exit(1);
}

console.log(
  `Kein Text geht bei größerer Grundschrift verloren: ` +
    `${geprueft} Seitenaufrufe über ${GROESSEN.join(" und ")} px Grundschrift ` +
    `bei ${BREITEN.join(" und ")} px Breite.`,
);
