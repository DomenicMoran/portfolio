#!/usr/bin/env node
/**
 * Prüft, dass jede Tafel hinter einem Reiter etwas zeigt.
 *
 * Die Fallstudien legen ihren Inhalt auf vier Reiter: Überblick, Automation,
 * Architektur, Stack. Sichtbar ist immer nur einer. Was hinter den anderen
 * liegt, sieht niemand — auch kein Prüflauf, denn `check:a11y`, `check:links`
 * und `check:parity` messen die Seite, wie sie geladen wird.
 *
 * Damit ist ein leerer Reiter der unauffälligste Fehler, den diese Seite
 * haben kann: Ein Diagramm, dessen Schlüssel nicht mehr passt, rendert
 * nichts, und der Reiter darüber verspricht es weiter. Das Kurzprofil, das
 * ein Recruiter weiterreicht, endet mit „Vollständige Fallstudien mit
 * Architekturdiagrammen: domenicmoran.de" — die Zusage steht also auch auf
 * dem Blatt, das aus der Hand gegeben wird.
 *
 * Geprüft wird je Reiter: Die Tafel trägt Text, und wo ein Diagramm hingehört,
 * trägt sie ein beschriftetes SVG. Beschriftet ist der entscheidende Teil —
 * eine leere Fläche in der richtigen Größe würde eine Größenprüfung bestehen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:panels
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/** Beide Sprachfassungen: Die Beschriftungen kommen aus getrennten Dateien. */
const SEITEN = ["/", "/en"];

/** Unter so vielen Zeichen ist eine Tafel keine Tafel. */
const MINDESTTEXT = 40;

/** Ein Diagramm braucht Beschriftungen, keine Fläche. */
const MINDESTTEXTE_IM_DIAGRAMM = 8;

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];
let tafeln = 0;
let strecken = 0;

for (const pfad of SEITEN) {
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) {
    funde.push(`${pfad}: HTTP ${antwort?.status()}`);
    continue;
  }

  // Die Fallstudien erscheinen erst beim Hineinscrollen.
  await seite.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await seite.waitForTimeout(700);

  const studien = await seite.$$("article[id^='case-']");
  if (studien.length === 0) funde.push(`${pfad}: keine Fallstudie gefunden`);

  for (const studie of studien) {
    const kennung = await studie.evaluate((el) => el.id);
    const reiter = await studie.$$('[role="tab"]');
    if (reiter.length === 0) {
      funde.push(`${pfad} ${kennung}: keine Reiter`);
      continue;
    }

    for (const knopf of reiter) {
      const beschriftung = ((await knopf.textContent()) ?? "").trim();
      await knopf.click();
      await seite.waitForTimeout(500);
      tafeln++;

      const stand = await studie.evaluate(
        (el, mindestTexte) => {
          const tafel = el.querySelector('[role="tabpanel"]');
          if (!tafel) return { fehlt: true };
          const text = tafel.innerText.trim();

          /* Das größte SVG der Tafel ist das Diagramm — die kleinen sind
             Symbole aus der Icon-Bibliothek, und eines davon ist eine
             Deko-Fläche ohne Beschriftung. Der erste Anlauf nahm das erste
             gefundene und hielt zwei fertige Diagramme für leer. */
          const svgs = [...tafel.querySelectorAll("svg")]
            .map((e) => ({ e, r: e.getBoundingClientRect() }))
            .filter(({ r }) => r.width > 200 && r.height > 120)
            .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height);

          const groesstes = svgs[0];
          return {
            text,
            laenge: text.length,
            diagramm: groesstes
              ? {
                  breite: Math.round(groesstes.r.width),
                  hoehe: Math.round(groesstes.r.height),
                  texte: groesstes.e.querySelectorAll("text").length,
                  reicht: groesstes.e.querySelectorAll("text").length >= mindestTexte,
                }
              : null,
          };
        },
        MINDESTTEXTE_IM_DIAGRAMM,
      );

      const wo = `${pfad} ${kennung} · „${beschriftung}"`;
      if (stand.fehlt) {
        funde.push(`${wo}: keine Tafel zum Reiter`);
        continue;
      }
      if (stand.laenge < MINDESTTEXT) {
        funde.push(`${wo}: nur ${stand.laenge} Zeichen — „${stand.text.slice(0, 30)}"`);
      }
      // Wo ein Diagramm steht, muss es beschriftet sein.
      if (/architek|architec/i.test(beschriftung)) {
        if (!stand.diagramm) {
          funde.push(`${wo}: kein Diagramm`);
        } else if (!stand.diagramm.reicht) {
          funde.push(
            `${wo}: Diagramm ${stand.diagramm.breite}×${stand.diagramm.hoehe} px ` +
              `mit ${stand.diagramm.texte} Beschriftungen — eine leere Fläche`,
          );
        }
      }
    }
  }
}

/* ---------------------------------------------------------------------------
   Und die Bildstrecke erreicht ihr letztes Bild

   Eine Bildstrecke muss man durchklicken, und genau deshalb sah sie kein Lauf:
   `check:links` prüft Adressen, `check:a11y` den Barrierefreiheitsbaum, dieser
   hier die Reiter. Gefunden wurde der Fehler beim Bedienen — der Zähler blieb
   bei „7 von 8", weil das letzte Bild am rechten Anschlag nie einrastet, und
   der Weiter-Knopf blieb dabei aktiv, ohne noch etwas zu bewirken.

   Geprüft wird auf beiden Breiten, denn sie verhalten sich verschieden: Bei
   1440 px sind mehrere Aufnahmen gleichzeitig zu sehen und der Anschlag kommt
   früher, bei 390 px rückt jeder Druck genau eine weiter. Am Ende muss der
   Zähler die letzte Nummer zeigen und der Knopf abgeschaltet sein. */
for (const breite of [390, 1440]) {
  const streckenseite = await browser.newPage({ viewport: { width: breite, height: 900 } });
  await streckenseite.goto(`${basis}/`, { waitUntil: "networkidle" });
  await streckenseite.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await streckenseite.waitForTimeout(700);

  for (const studie of await streckenseite.$$("article[id^='case-']")) {
    const weiter = await studie.$('button[aria-label="Nächstes Bild"]');
    if (!weiter) continue; // Nicht jede Fallstudie hat eine Strecke.

    const kennung = await studie.evaluate((el) => el.id);
    const zaehlerLesen = () =>
      studie.evaluate((el) => {
        const text = [...el.querySelectorAll("span")]
          .map((s) => s.textContent.trim())
          .find((t) => /^\d+\s+\S+\s+\d+$/.test(t));
        const teile = text?.match(/^(\d+)\s+\S+\s+(\d+)$/);
        return teile ? { bei: Number(teile[1]), von: Number(teile[2]) } : null;
      });

    const start = await zaehlerLesen();
    if (!start) {
      funde.push(`${kennung} bei ${breite} px: kein Zähler an der Bildstrecke`);
      continue;
    }

    /* Ein Druck mehr als Bilder: Wer am Ende ist, kommt über den
       deaktivierten Knopf nicht weiter, und die Schleife endet von selbst. */
    let drucke = 0;
    for (let i = 0; i < start.von + 1; i++) {
      if (await weiter.isDisabled()) break;
      await weiter.click();
      drucke++;
      await streckenseite.waitForTimeout(600);
    }

    const ende = await zaehlerLesen();
    if (ende?.bei !== start.von) {
      funde.push(
        `${kennung} bei ${breite} px: nach ${drucke} Druck steht der Zähler auf ` +
          `${ende?.bei ?? "?"} von ${start.von}. Das letzte Bild ist nicht erreichbar.`,
      );
    } else if (!(await weiter.isDisabled())) {
      funde.push(
        `${kennung} bei ${breite} px: am letzten Bild bleibt „Nächstes Bild" ` +
          `anklickbar und bewirkt nichts.`,
      );
    } else {
      strecken++;
    }
  }
  await streckenseite.close();
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Tafel zeigt nicht, was ihr Reiter verspricht:\n`);
  for (const f of funde) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `Jede Tafel zeigt ihren Inhalt: ${tafeln} Reiter über ${SEITEN.length} Sprachfassungen, ` +
    `${strecken} Bildstrecke bis zum letzten Bild durchgeklickt.`,
);
