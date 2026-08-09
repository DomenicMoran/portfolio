#!/usr/bin/env node
/**
 * Prüft, dass keine Rechtsangabe zwischen Kürzel und Ziffer umbricht.
 *
 * „§ 146a AO“, „Art. 30 DSGVO", „Abs. 1 lit. f“, ein Kürzel und die Zahl
 * dahinter sind eine Einheit. Bricht die Zeile dazwischen um, steht am Ende
 * der einen Zeile „Art." und am Anfang der nächsten „30“, und beides sagt für
 * sich nichts:
 *
 *     … beachtet? EU AI Act Art.
 *     50: Ist die KI als solche …
 *
 * Gefunden am 03.08.2026 an der ausgelieferten Seite: auf der Startseite bei
 * 390 px, auf /en bei 320 px und zweimal in der Datenschutzerklärung. Kein
 * bestehender Lauf sah es, es ist kein Verstoß gegen WCAG, kein toter
 * Verweis und keine falsche Zahl, sondern ein Satzfehler, und der fällt nur
 * im Bild auf. Dieselbe Klasse wie der Trennpunkt am Zeilenende, den
 * `check:separators` abfängt.
 *
 * Der Fix ist ein geschütztes Leerzeichen (U+00A0) in der Inhaltsquelle.
 * Nicht das schmale U+202F: Es fehlt in mancher Schrift und wird dann als
 * leeres Kästchen gezeichnet. U+00A0 hat jede.
 *
 * Geprüft wird an der gebauten Seite bei den Breiten, an denen es eng wird,
 * und zwar an der Geometrie: Steht die Ziffer tiefer als ihr Kürzel, ist
 * dazwischen umbrochen worden.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:nbsp
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
const seite = await browser.newPage({
  viewport: { width: BREITEN[0], height: 900 },
});

const funde = [];
let geprueft = 0;

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, {
    waitUntil: "domcontentloaded",
  });
  if (!antwort || antwort.status() !== 200) continue;

  // Einmal durchscrollen: Was unter der Falz liegt, ist vorher unsichtbar
  // und hat keine gemessene Position.
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });
  await seite.waitForTimeout(300);

  /* Je Seite ein Aufruf, dann die Breiten durchfahren, dieselbe Aufteilung
     wie bei `check:separators`, aus demselben Grund: Gemessen wird dasselbe
     Dokument, nur schmaler oder breiter. */
  for (const breite of BREITEN) {
    await seite.setViewportSize({ width: breite, height: 900 });
    await seite.waitForTimeout(100);

    const { treffer, anzahl } = await seite.evaluate(() => {
      /** Kürzel, die mit ihrer Zahl zusammengehören. */
      const MUSTER = /(§§?|Art\.|Abs\.|Nr\.|Kap\.)([  ])(\d)/g;

      const treffer = [];
      let anzahl = 0;
      const laeufer = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );

      for (
        let knoten = laeufer.nextNode();
        knoten;
        knoten = laeufer.nextNode()
      ) {
        const text = knoten.textContent ?? "";
        for (const m of text.matchAll(MUSTER)) {
          anzahl++;
          const anfang = m.index;
          const ziffer = anfang + m[0].length - 1;

          const kuerzel = document.createRange();
          kuerzel.setStart(knoten, anfang);
          kuerzel.setEnd(knoten, anfang + m[1].length);
          const zahl = document.createRange();
          zahl.setStart(knoten, ziffer);
          zahl.setEnd(knoten, ziffer + 1);

          const a = kuerzel.getBoundingClientRect();
          const z = zahl.getBoundingClientRect();
          if (a.width === 0 || z.width === 0) continue;

          // Tiefer als die Unterkante des Kürzels heißt: neue Zeile.
          if (z.top > a.bottom - 2) {
            treffer.push({
              stelle: m[0].trim(),
              umgebung: text
                .slice(Math.max(0, anfang - 40), anfang + 30)
                .replace(/\s+/g, " "),
            });
          }
        }
      }
      return { treffer, anzahl };
    });

    geprueft += anzahl;

    if (treffer.length > 0) {
      console.log(`  FEHLER ${pfad} bei ${breite} px`);
      for (const t of treffer) {
        funde.push(t);
        console.log(`        „${t.stelle}“ umbrochen in: …${t.umgebung}…`);
      }
    }
  }
}

await seite.close();
await browser.close();
beenden();

if (funde.length > 0) {
  console.error(
    `\n${funde.length} Rechtsangabe${funde.length === 1 ? "" : "n"} zwischen Kürzel und ` +
      `Ziffer umbrochen. In der Inhaltsquelle gehört dort ein geschütztes ` +
      `Leerzeichen (U+00A0) statt eines gewöhnlichen.`,
  );
  process.exit(1);
}

console.log(
  `Keine Rechtsangabe umbrochen: ${geprueft} Vorkommen auf ${pfade.length} Seiten × ` +
    `${BREITEN.length} Breiten geprüft.`,
);
