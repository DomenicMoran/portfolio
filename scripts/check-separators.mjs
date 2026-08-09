#!/usr/bin/env node
/**
 * Prüft, dass kein Trennzeichen allein am Zeilenende steht.
 *
 * Kopfzeilen wie „31. Juli 2026 · 5 Min. Lesezeit · Salati“ bestehen aus
 * gleichrangigen Kästchen in einem umbrechenden Flexkasten. Wird es eng,
 * bricht die Zeile an irgendeiner Fuge, und die Fuge kann hinter dem Punkt
 * liegen. Dann steht am Ende der ersten Zeile ein Mittelpunkt, der nichts
 * mehr trennt, und darunter allein das, was er einleiten sollte.
 *
 * Gefunden am 03.08.2026 auf der Artikelübersicht bei 390 px:
 *
 *     31. Juli 2026  ·  5 Min. Lesezeit  ·
 *     Salati
 *
 * Auf 1440 px sieht man davon nichts, und kein Prüflauf sah es: Es ist kein
 * Verstoß gegen WCAG, kein toter Verweis und keine falsche Zahl. Es ist ein
 * Satzfehler, und der fällt nur im Bild auf.
 *
 * Der Fix ist immer derselbe: Das Trennzeichen gehört mit dem, was es
 * einleitet, in **eine** Einheit, statt als eigenes Geschwister danebenzustehen.
 * Dann wandert es beim Umbruch mit.
 *
 * Gemessen wird an der ausgelieferten Seite bei den Breiten, an denen es eng
 * wird. Gesucht werden Elemente, deren sichtbarer Text nur aus einem
 * Trennzeichen besteht und die in ihrer Zeile das letzte sind.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:separators
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Die engen Breiten. Bei 1440 px bricht keine dieser Zeilen um. */
const BREITEN = [320, 360, 390, 430, 768];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

const pfade = gebauteSeiten();
const browser = await chromium.launch();
let fehler = 0;
let geprueft = 0;

/*
   Je Seite ein Aufruf, dann die Breiten durchfahren.

   Der erste Entwurf lief andersherum: fuenf Browserfenster, jedes mit allen
   achtzehn Seiten, neunzig Aufrufe mit je einem Durchscrollen und einer
   halben Sekunde Wartezeit, zusammen 112 s im Bauserver. Gemessen wird aber
   dasselbe Dokument, nur schmaler oder breiter. Achtzehn Aufrufe reichen, der
   Rest ist ein Wechsel der Fenstergroesse.

   Das Durchscrollen bleibt einmalig, weil die Einblendungen nur in eine
   Richtung laufen: Was einmal sichtbar ist, bleibt es auch, wenn ein
   schmaleres Fenster es wieder unter die Falz schiebt.
*/
const seite = await browser.newPage({
  viewport: { width: BREITEN[0], height: 900 },
});

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, {
    waitUntil: "domcontentloaded",
  });
  if (!antwort || antwort.status() !== 200) continue;

  // Einmal durchscrollen: Was unter der Falz liegt, ist vorher unsichtbar
  // und hat keine gemessene Position.
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await seite.waitForTimeout(500);

  for (const breite of BREITEN) {
    await seite.setViewportSize({ width: breite, height: 900 });
    // Nach dem Umbruch einmal durchatmen lassen, bevor gemessen wird.
    await seite.waitForTimeout(120);

    const { funde, anzahl } = await seite.evaluate(() => {
      /** Zeichen, die zwischen zwei Angaben stehen und für sich nichts sagen. */
      const TRENNER = /^[·•|/–,]$/;

      const alle = [...document.querySelectorAll("body *")];
      const trenner = alle.filter((e) => {
        if (!TRENNER.test((e.textContent ?? "").trim())) return false;
        const stil = getComputedStyle(e);
        if (stil.display === "none" || stil.visibility === "hidden")
          return false;
        return e.getBoundingClientRect().width > 0;
      });

      /* Alle Textstücke innerhalb eines Kastens, jedes mit den Rechtecken
         seiner Zeilenstücke.

         Über Geschwisterelemente allein lässt sich das nicht entscheiden: Ein
         Trennzeichen kann in derselben Hülle stehen wie die Beschriftung, die
         es einleitet, und die ist dann ein Textknoten und kein Element. Der
         erste Anlauf verglich nur `children` und meldete deshalb hundert
         Stellen, an denen rechts sehr wohl etwas stand. Gemessen wird
         stattdessen die Tinte: jeder Textknoten über einen `Range`, der pro
         Zeile ein eigenes Rechteck liefert. */
      function textRechtecke(wurzel) {
        const laeufer = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
        const rechtecke = [];
        for (let k = laeufer.nextNode(); k; k = laeufer.nextNode()) {
          if (!(k.textContent ?? "").trim()) continue;
          const bereich = document.createRange();
          bereich.selectNodeContents(k);
          for (const r of bereich.getClientRects()) {
            if (r.width > 0) rechtecke.push({ rect: r, knoten: k });
          }
        }
        return rechtecke;
      }

      /** Der nächste Vorfahr, der eine eigene Zeile aufspannt. */
      function zeilenKasten(el) {
        for (let e = el.parentElement; e; e = e.parentElement) {
          const d = getComputedStyle(e).display;
          if (
            d === "block" ||
            d === "flex" ||
            d === "grid" ||
            d === "list-item"
          )
            return e;
        }
        return document.body;
      }

      const funde = [];

      for (const t of trenner) {
        const meins = t.getBoundingClientRect();
        const kasten = zeilenKasten(t);

        /* „Letztes in seiner Zeile" heißt: Auf derselben Höhe beginnt keine
           Tinte weiter rechts. Verglichen wird die Mitte, weil unterschiedlich
           hohe Stücke in einer Zeile weder Ober- noch Unterkante teilen. */
        const meineMitte = meins.top + meins.height / 2;
        const nachbarn = textRechtecke(kasten).filter(({ rect, knoten }) => {
          if (t.contains(knoten)) return false;
          return rect.top < meineMitte && rect.bottom > meineMitte;
        });
        const rechtsDaneben = nachbarn.some(
          ({ rect }) => rect.left >= meins.right - 0.5,
        );

        /* Ein Trennzeichen trennt zwei Angaben, links von ihm muss also
           etwas stehen. Steht nichts, ist es kein Trenner, sondern eine
           Marke: Die Konsolenspur auf der Startseite setzt vor jede Zeile
           einen Mittelpunkt, und der gehört ans Ende seiner Zeile genauso
           wenig wie ein Aufzählungspunkt ans Ende seines Absatzes. Der erste
           Anlauf unterschied das nicht und meldete beides. */
        const linksDaneben = nachbarn.some(
          ({ rect }) => rect.right <= meins.left + 0.5,
        );

        if (linksDaneben && !rechtsDaneben) {
          funde.push({
            zeichen: (t.textContent ?? "").trim(),
            umgebung: (kasten.textContent ?? "").trim().slice(0, 70),
          });
        }
      }

      return { funde, anzahl: trenner.length };
    });

    geprueft += anzahl;

    if (funde.length > 0) {
      fehler += funde.length;
      console.log(`  FEHLER ${pfad} bei ${breite} px`);
      for (const f of funde) {
        console.log(`        „${f.zeichen}“ am Zeilenende in: ${f.umgebung}`);
      }
    }
  }
}

await seite.close();
await browser.close();
beenden();

if (fehler > 0) {
  console.error(
    `\n${fehler} Trennzeichen am Zeilenende. Ein Punkt, hinter dem nichts mehr ` +
      `folgt, trennt nichts. Das Zeichen gehört mit dem, was es einleitet, in ` +
      `dieselbe Einheit, dann bricht die Zeile davor um statt dahinter.`,
  );
  process.exit(1);
}

console.log(
  `Kein Trennzeichen am Zeilenende: ${geprueft} Vorkommen auf ${pfade.length} Seiten × ` +
    `${BREITEN.length} Breiten geprüft.`,
);
