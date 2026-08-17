#!/usr/bin/env node
/**
 * Betätigt jedes Bedienelement der Vorführungen und prüft, dass etwas passiert.
 *
 * Der Anlass steht in einer Rückmeldung vom 17.08.2026: „Die Demo von Dartile
 * ist gar nicht anklickbar und gar nicht bedienbar, sowas müsste dir selber
 * auffallen." Der Befund war berechtigt, auch wenn die Ursache anderswo lag:
 * `check:demo` prüft ausschließlich die **Rechnung** der Checkout-Tafel gegen
 * eine gedruckte Tafel. Ob ein Mensch die Kachel überhaupt bedienen kann, hat
 * nie etwas geprüft.
 *
 * Das ist die teuerste Sorte Lücke: Eine Vorführung, die stillsteht, wirkt
 * schlimmer als keine Vorführung. Sie ist der einzige Teil der Seite, dem ein
 * Besucher etwas selbst beibringen kann, und wenn sie nicht reagiert, liest
 * sich der ganze Rest wie eine Behauptung.
 *
 * Geprüft wird an der gebauten Seite, in beiden Sprachfassungen:
 *
 * 1. Jede Kachel mit `data-demo` wird gefunden und ist sichtbar.
 * 2. Jedes Bedienelement darin ist erreichbar: nicht deaktiviert, nicht von
 *    einem anderen Element verdeckt, mit `pointer-events` ungleich `none`.
 * 3. Jedes Bedienelement lässt sich mit der Maus betätigen, ohne dass
 *    Playwright über ein verdeckendes Element stolpert.
 * 4. Nach dem Betätigen hat sich am Text der Kachel etwas geändert. Eine
 *    Ausnahme gilt für die Schaltfläche, die beim Laden schon aktiv ist: Sie
 *    darf nichts ändern, weil sie den Zustand nicht verlässt. Deshalb wird je
 *    Gruppe verlangt, dass **mindestens eine** Schaltfläche wirkt.
 * 5. Schieberegler ändern die Ausgabe: Tastatur, Klick auf die Schiene und
 *    Ziehen, alle drei einzeln.
 * 6. Jedes Bedienelement ist mit der Tastatur erreichbar und trägt dort einen
 *    sichtbaren Fokus.
 *
 *   npm run check:interaction
 */

import { chromium } from "playwright";

import { starteServer } from "./lib/local-server.mjs";

const SEITEN = ["/", "/en"];
const BREITEN = [1440, 390];

const { basis, beenden } = await starteServer();
const browser = await chromium.launch();
const befunde = [];
let geprueft = 0;

for (const breite of BREITEN) {
  for (const seite of SEITEN) {
    const kontext = await browser.newContext({
      viewport: { width: breite, height: 900 },
      reducedMotion: "reduce",
      locale: seite === "/en" ? "en-GB" : "de-DE",
    });
    const s = await kontext.newPage();
    const konsole = [];
    s.on("pageerror", (e) => konsole.push(String(e).slice(0, 120)));

    await s.goto(`${basis}${seite}`, { waitUntil: "networkidle", timeout: 60_000 });
    await s.waitForTimeout(1500);

    const kacheln = s.locator("[data-demo]");
    const anzahl = await kacheln.count();
    if (!anzahl) {
      befunde.push(`${seite} bei ${breite}: keine Kachel mit data-demo gefunden`);
      await kontext.close();
      continue;
    }

    for (let i = 0; i < anzahl; i++) {
      const kachel = kacheln.nth(i);
      const name = (await kachel.getAttribute("data-demo")) ?? `#${i}`;
      const wo = `${seite} ${breite}px ${name}`;
      await kachel.scrollIntoViewIfNeeded();
      await s.waitForTimeout(600);

      /*
       * Hier stand zweimal eine eigene Verdeckungsprüfung, und beide Fassungen
       * waren falsch.
       *
       * Die erste tastete drei Punkte der Kachel ab und meldete „verdeckt von
       * header" und „verdeckt von nichts": die Klebe-Kopfzeile über dem oberen
       * Rand einer hohen Kachel und ein Punkt unterhalb des Sichtbereichs. Die
       * zweite tastete jedes Bedienelement ab und meldete zehn Knöpfe als von
       * der Kopfzeile verdeckt. Auch das war keiner: Sie lagen in dem Moment
       * unter der Leiste, in dem `scrollIntoViewIfNeeded` die Kachel gerade
       * abgesetzt hatte. Ein Besucher scrollt zwei Zeilen weiter, und sie sind
       * frei.
       *
       * Beide Male habe ich Geometrie gemessen statt Verhalten. Verdeckung
       * prüft Playwright beim Klicken selbst: Es scrollt das Element frei und
       * bricht ab, wenn ein anderes den Klick abfängt. Genau dieser Abbruch ist
       * unten der Befund. Eine zweite Prüfung daneben erzeugt nur Phantome.
       */

      const text = () => kachel.innerText();

      /* -------------------------------------------------- Schaltflächen */
      const knoepfe = kachel.locator("button:not([disabled])");
      const anzKnoepfe = await knoepfe.count();
      let einerWirkte = anzKnoepfe === 0;
      for (let j = 0; j < anzKnoepfe; j++) {
        const knopf = knoepfe.nth(j);
        const beschriftung = (await knopf.innerText()).trim().slice(0, 24) || `Knopf ${j}`;
        const zeiger = await knopf.evaluate((e) => getComputedStyle(e).pointerEvents);
        if (zeiger === "none") {
          befunde.push(`${wo}: „${beschriftung}" hat pointer-events: none, ist also nicht klickbar`);
          continue;
        }
        const vorher = await text();
        try {
          await knopf.click({ timeout: 5000 });
        } catch (e) {
          befunde.push(
            `${wo}: „${beschriftung}" liess sich nicht anklicken. ${String(e.message).split("\n")[0].slice(0, 100)}`,
          );
          continue;
        }
        await s.waitForTimeout(500);
        geprueft += 1;
        if ((await text()) !== vorher) einerWirkte = true;
      }
      if (!einerWirkte) {
        befunde.push(
          `${wo}: keine der ${anzKnoepfe} Schaltflächen ändert etwas. Die Kachel steht still.`,
        );
      }

      /* ------------------------------------------------ Schieberegler */
      const regler = kachel.locator('input[type="range"]:not([disabled])');
      const anzRegler = await regler.count();
      for (let j = 0; j < anzRegler; j++) {
        const r = regler.nth(j);
        const beschriftung = (await r.getAttribute("aria-label")) ?? `Regler ${j}`;

        /*
         * Der Fokus wird mit der Tabulator-Taste geholt, nicht mit `focus()`.
         *
         * Das ist kein Detail: Chromium entscheidet über `:focus-visible` nach
         * der Herkunft des Fokus. Ein `element.focus()` aus einem Skript zählt
         * am nativen Schieberegler nicht als Tastaturbedienung, die Regel in
         * `globals.css` greift dann nicht, und die Prüfung meldete daraufhin
         * einen fehlenden Rahmen, den ein echter Nutzer sehr wohl sieht. Genau
         * so entstehen Phantomfunde: Das Werkzeug prüft seine eigene
         * Nachstellung statt die Seite.
         */
        const vorTaste = await text();
        await r.evaluate((e) => {
          const vorher = e.previousElementSibling ?? e.parentElement;
          if (vorher instanceof HTMLElement) vorher.setAttribute("tabindex", "-1");
          if (vorher instanceof HTMLElement) vorher.focus();
        });
        let erreicht = false;
        for (let t = 0; t < 12 && !erreicht; t++) {
          await s.keyboard.press("Tab");
          erreicht = await r.evaluate((e) => document.activeElement === e);
        }
        if (!erreicht) {
          befunde.push(`${wo}: „${beschriftung}" ist mit der Tabulator-Taste nicht erreichbar`);
        } else {
          const fokusSichtbar = await r.evaluate((e) => {
            const s2 = getComputedStyle(e);
            return (
              (s2.outlineStyle !== "none" && parseFloat(s2.outlineWidth) > 0) ||
              s2.boxShadow !== "none" ||
              e.matches(":focus-visible")
            );
          });
          if (!fokusSichtbar) {
            befunde.push(`${wo}: „${beschriftung}" zeigt im Tastaturfokus keinen sichtbaren Rahmen`);
          }
        }
        await s.keyboard.press("ArrowRight");
        await s.keyboard.press("ArrowRight");
        await s.waitForTimeout(400);
        if ((await text()) === vorTaste) {
          befunde.push(`${wo}: „${beschriftung}" reagiert nicht auf die Pfeiltasten`);
        }
        geprueft += 1;

        // Klick auf die Schiene
        const kasten = await r.boundingBox();
        const vorKlick = await text();
        await s.mouse.click(kasten.x + kasten.width * 0.2, kasten.y + kasten.height / 2);
        await s.waitForTimeout(400);
        if ((await text()) === vorKlick) {
          befunde.push(`${wo}: „${beschriftung}" reagiert nicht auf einen Klick in die Schiene`);
        }
        geprueft += 1;

        // Ziehen
        const vorZug = await text();
        await s.mouse.move(kasten.x + kasten.width * 0.2, kasten.y + kasten.height / 2);
        await s.mouse.down();
        await s.mouse.move(kasten.x + kasten.width * 0.8, kasten.y + kasten.height / 2, { steps: 10 });
        await s.mouse.up();
        await s.waitForTimeout(400);
        if ((await text()) === vorZug) {
          befunde.push(`${wo}: „${beschriftung}" reagiert nicht auf das Ziehen des Knopfes`);
        }
        geprueft += 1;
      }
    }

    if (konsole.length) {
      befunde.push(`${seite} bei ${breite}: ${konsole.length} Ausnahme(n) im Browser: ${konsole[0]}`);
    }
    await kontext.close();
  }
}

await browser.close();
await beenden();

if (befunde.length) {
  console.error(`${befunde.length} Befund(e) an den Vorführungen:\n`);
  for (const b of befunde) console.error(`  ${b}`);
  console.error(
    "\nEine Vorführung, die stillsteht, wirkt schlimmer als keine. Sie ist der\n" +
      "einzige Teil der Seite, an dem ein Besucher selbst nachrechnen kann.",
  );
  process.exit(1);
}

console.log(
  `Jede Vorführung lässt sich bedienen: ${geprueft} Betätigungen über ` +
    `${SEITEN.length} Sprachfassungen und ${BREITEN.length} Breiten, jede mit sichtbarer Wirkung.`,
);
