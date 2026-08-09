#!/usr/bin/env node
/**
 * Prüft, dass der Tastaturfokus sichtbar bleibt.
 *
 * Die Seite sagt WCAG 2.2 AA zu. Zwei Kriterien daraus lassen sich nicht aus
 * dem Dokument ablesen, sondern nur im Gebrauch messen, und `check:a11y`
 * greift sie deshalb nicht:
 *
 * **2.4.11 Focus Not Obscured.** Neu in WCAG 2.2. Wer sich mit der Tastatur
 * bewegt, dem scrollt der Browser zum nächsten Ziel, und rechnet dabei die
 * feste Kopfleiste nicht mit. Das Element hat dann den Fokus und liegt
 * darunter: Der Nutzer sieht keinen Ring, weiß nicht, wo er ist, und drückt
 * blind weiter.
 *
 * **2.4.7 Focus Visible.** Ein `outline: none` ohne Ersatz macht dasselbe,
 * nur überall gleichzeitig.
 *
 * Gemessen wird nicht über eine Liste fester Kästen. Die Kopfleiste trägt
 * ihre Fläche auf einem Kind und fällt durch jede solche Heuristik, der
 * erste Anlauf meldete deshalb „kein Befund“, obwohl er nichts prüfte.
 * Gefragt wird stattdessen der Browser: `elementFromPoint` sagt, was an
 * dieser Stelle wirklich obenauf liegt, und überspringt dabei von selbst,
 * was `pointer-events: none` trägt.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:focus
 */

import { chromium } from "playwright";
import { FEHLERSEITEN, gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Telefon und Desktop: Die Kopfleiste ist auf beiden anders gebaut. */
const BREITEN = [390, 1440];

/** Genug für jede Seite dieser Größe; der Lauf endet ohnehin am Rundlauf. */
const SCHRITTE = 120;

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

/* Dazu die Fehlerseite unter beiden Sprachen: Sie steht in keiner Liste
   gebauter Seiten, im Bau liegt sie als `_not-found.html`, und fiel damit
   aus jedem Lauf heraus, der seine Liste aus dem Bau nimmt. Sie ist die
   Seite, die jeder Vertipper zu sehen bekommt. */
const pfade = [...gebauteSeiten(), ...FEHLERSEITEN];
const funde = [];
let geprueft = 0;
let stationen = 0;

const browser = await chromium.launch();

for (const breite of BREITEN) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 800 } });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
    /* Die Fehlerseite antwortet mit 404, und das ist ihre richtige
     Antwort. Wer hier auf 200 besteht, nimmt sie auf und misst sie nie:
     die Zeile darunter zählte weiter 18 Seiten, obwohl 20 in der Liste
     standen. */
  const erwartet = FEHLERSEITEN.includes(pfad) ? 404 : 200;
  if (!antwort || antwort.status() !== erwartet) continue;

    /* Erst messen, wenn nichts mehr fährt.

       Die Kopfleiste kommt von `y: -80` herein, mit 0,9 s Verzögerung und
       0,9 s Dauer. Eine feste Wartezeit von 500 ms traf mitten hinein: Der
       Lauf meldete auf /en bei 390 px drei Bedienelemente „außerhalb des
       Sichtfelds, oben -53", die Leiste war schlicht noch unterwegs. Auf /
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
           selbst liegt, 2.4.11 verlangt nicht, dass alles frei ist, sondern
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
          /* Hat der Sprung zum Ziel eine Sektion seitwaerts geschoben?

             Fuenf Sektionen tragen `overflow-hidden` gegen die Glueh-Kreise,
             die breiter sind als das Viewport. Damit wird jede von ihnen zum
             Bildlaufbereich: Bei 390 px meldet `#hire` 504 px Inhalt auf 390
             sichtbar, `#workflow` 467 und `#contact` 435. Der Ueberstand ist
             heute reine Deko und ohne Wirkung.

             Er hat aber eine Bedingung, und die steht bisher nur als Merksatz
             in AGENTS.md: Sobald ein Bedienelement so weit rechts sitzt, dass
             es in diesen Bereich faellt, scrollt der Browser die Sektion beim
             Fokussieren seitwaerts, und scrollt nicht zurueck. Der Nutzer
             sieht die Seite verschoben und findet keinen Weg heraus.

             Gemessen am 07.08.2026 bei 390 und 320 px: kein einziges
             Bedienelement liegt jenseits der Kante, jede Sektion steht auf
             `scrollLeft: 0`. Geprueft wird ab jetzt genau das, an jeder der
             Stationen. */
          verschoben: (() => {
            for (let e = el.parentElement; e; e = e.parentElement) {
              if (e.scrollLeft > 1) return `${e.tagName.toLowerCase()}#${e.id || "?"} um ${Math.round(e.scrollLeft)} px`;
            }
            return null;
          })(),
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
          `${pfad} bei ${breite} px: „${stand.name}“ hat den Fokus außerhalb des Sichtfelds (oben ${stand.top})`,
        );
      } else if (!stand.sichtbar) {
        funde.push(
          `${pfad} bei ${breite} px: „${stand.name}“ hat den Fokus, sichtbar ist ${stand.davor} (oben ${stand.top})`,
        );
      }
      if (!stand.markiert) {
        funde.push(`${pfad} bei ${breite} px: „${stand.name}“ zeigt keinen Fokus`);
      }
      if (stand.verschoben) {
        funde.push(
          `${pfad} bei ${breite} px: „${stand.name}“ schiebt beim Fokussieren ` +
            `${stand.verschoben} zur Seite`,
        );
      }
    }
  }

  await seite.close();
}

/* ---------------------------------------------------------------------------
   Die beiden Überlagerer halten den Fokus fest

   Ein Kasten, der die Seite verdeckt, muss den Fokus behalten, solange er
   offen ist. Sonst tabbt jemand aus dem sichtbaren Bereich hinaus und bedient
   Verweise, die er nicht sieht.

   Beide Fälle standen einmal offen und wurden einzeln gefunden, jeder beim
   Bedienen: die Befehlspalette am 03.08.2026, das Telefonmenü am 05.08. Zwei
   Bauteile mit demselben Fehler und zwei Monaten dazwischen sind ein Muster,
   kein Zufall, deshalb steht die Prüfung hier und nicht bei einem von beiden.

   Geprüft wird, was ein Nutzer merkt: Der Fokus liegt nach dem Öffnen im
   Kasten, bleibt über eine ganze Runde Tabulator darin, Escape schließt, und
   danach steht er wieder auf dem Knopf, der geöffnet hat. */
const UEBERLAGERER = [
  { name: "Befehlspalette", breite: 1440, taste: "Control+k", knopf: 'button[aria-label*="efehlspalette"], button[aria-label*="ommand palette"]' },
  { name: "Telefonmenü", breite: 390, taste: null, knopf: 'button[aria-label*="enü öffnen"], button[aria-label*="pen menu"]' },
];

for (const { name, breite, taste, knopf: auswahl } of UEBERLAGERER) {
  /* Jedes Bauteil bei der Breite, bei der es bedient wird: Das Telefonmenü
     gibt es nur unterhalb von , und der Knopf der Palette ist dort
     ausgeblendet. Ein verstecktes Element kann den Fokus nicht
     zurückbekommen, der erste Anlauf maß beides bei 390 px und meldete für
     die Palette einen Fehler, den es bei ihrer Bedienbreite nicht gibt. */
  const seite = await browser.newPage({ viewport: { width: breite, height: 844 } });
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });
  await seite.waitForTimeout(900);

  const knopf = await seite.$(auswahl);
  if (!knopf) {
    funde.push(`${name}: kein Knopf zum Öffnen gefunden`);
    await seite.close();
    continue;
  }

  await knopf.focus();
  if (taste) await seite.keyboard.press(taste);
  else await knopf.click();
  await seite.waitForTimeout(700);

  const drin = () =>
    seite.evaluate(() => {
      const el = document.activeElement;
      const kasten = document.querySelector('[role="dialog"]');
      return {
        offen: Boolean(kasten),
        innen: Boolean(kasten && el && kasten.contains(el)),
        wo: `${el?.tagName} „${(el?.getAttribute("aria-label") || el?.textContent || "").trim().slice(0, 24)}"`,
      };
    });

  const nachOeffnen = await drin();
  if (!nachOeffnen.offen) {
    funde.push(`${name}: öffnet nicht`);
    await seite.close();
    continue;
  }
  if (!nachOeffnen.innen) {
    funde.push(
      `${name}: nach dem Öffnen steht der Fokus auf ${nachOeffnen.wo}, außerhalb`,
    );
  }

  /* Eine ganze Runde: Wer hinausläuft, tut es meist nach einigen Schritten,
     nicht beim ersten. */
  let entwichen = null;
  for (let i = 0; i < 15 && !entwichen; i++) {
    await seite.keyboard.press("Tab");
    await seite.waitForTimeout(90);
    const stand = await drin();
    if (!stand.innen) entwichen = `${stand.wo} nach ${i + 1} Schritten`;
  }
  if (entwichen) {
    funde.push(`${name}: der Fokus entweicht zu ${entwichen}`);
  }

  await seite.keyboard.press("Escape");
  await seite.waitForTimeout(600);
  const nachEscape = await seite.evaluate(() => ({
    offen: Boolean(document.querySelector('[role="dialog"]')),
    wo: document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName,
  }));
  if (nachEscape.offen) funde.push(`${name}: Escape schließt nicht`);
  else if (!/efehlspalette|ommand palette|enü öffnen|pen menu/.test(String(nachEscape.wo))) {
    funde.push(
      `${name}: nach dem Schließen steht der Fokus auf „${nachEscape.wo}“ ` +
        `statt auf dem Knopf, der geöffnet hat`,
    );
  }

  stationen += 4;
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
