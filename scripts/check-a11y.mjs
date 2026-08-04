#!/usr/bin/env node
/**
 * Prüft jede gebaute Seite mit axe-core gegen WCAG 2.2 AA.
 *
 * Warum ein eigener Lauf, obwohl es schon Prüfungen für Druckbild, Unterlängen
 * und Zahlen gibt: Die messen je eine Sache, die einmal falsch war. axe prüft
 * gut hundert Regeln auf einmal und findet damit auch das, wonach hier noch
 * niemand gesucht hat — fehlende Beschriftungen, zu schwache Kontraste,
 * Überschriften-Sprünge, doppelte Kennungen, Landmarken ohne Namen.
 *
 * Gemessen wird die ausgelieferte Seite im Browser, nicht das Bauteil: Ein
 * `aria-label` im Quelltext sagt nichts darüber, was am Ende im
 * Barrierefreiheitsbaum steht.
 *
 * Zwei Breiten, weil sich das Layout unterscheidet und mit ihm die
 * Trefferflächen und die Kontraste über Verläufen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:a11y
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

const require = createRequire(import.meta.url);
const axeQuelle = readFileSync(require.resolve("axe-core"), "utf8");

/** Dieselben zwei Breiten wie beim Unterlängen-Lauf. */
const BREITEN = [1440, 390];

/**
 * Welche Regelwerke gelten.
 *
 * WCAG 2.2 AA ist der Maßstab, auf den sich europäische Vergaben und das BFSG
 * beziehen. `best-practice` bleibt draußen: Darin stecken Empfehlungen, die
 * keine Norm verlangt, und ein Lauf, der ständig etwas meldet, wird abgestellt.
 */
const REGELWERKE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Jede gebaute Seite, ohne die Bau-Interna. */
const pfade = gebauteSeiten();

/*
  Die 404-Seite über eine erfundene Adresse, nicht über ihre Datei.

  Sie liegt als `_not-found.html` im Bau und fällt damit durch das Filter, das
  Bau-Interna auslässt — der erste Lauf dieses Wächters prüfte sie deshalb
  nicht. Ausgerechnet die Seite, die jeder Vertipper zu sehen bekommt. Über eine
  erfundene Adresse kommt sie so heraus, wie Next sie ausliefert, samt eigenem
  Dokument und Sprachauszeichnung.
*/
const UNBEKANNTE_ADRESSE = "/diese-adresse-gibt-es-nicht";
/*
  Und einmal unterhalb von `/en`: Das ist eine andere Antwort. Die 404-Seite
  liest die Sprache aus einer Kopfzeile, die der Proxy setzt, und rendert
  englischen Text mit `lang="en"`. Ohne diesen Pfad pruefte der Waechter nur
  die Haelfte der Seite, die jeder Vertipper zu sehen bekommt.
*/
const UNBEKANNTE_ADRESSE_EN = "/en/this-address-does-not-exist";
pfade.push(UNBEKANNTE_ADRESSE, UNBEKANNTE_ADRESSE_EN);

const browser = await chromium.launch();
let verstoesse = 0;
let geprueft = 0;

for (const breite of BREITEN) {
  const seite = await browser.newPage({
    viewport: { width: breite, height: 900 },
  });
  await seite.addInitScript({ content: axeQuelle });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, {
      waitUntil: "domcontentloaded",
    });
    if (!antwort || antwort.status() >= 500) continue;

    // Die erfundene Adresse muss mit 404 antworten. Ein 200 hiesse, dass eine
    // Route sie doch bedient, und dann prüft dieser Durchgang etwas anderes
    // als die 404-Seite.
    if (
      (pfad === UNBEKANNTE_ADRESSE || pfad === UNBEKANNTE_ADRESSE_EN) &&
      antwort.status() !== 404
    ) {
      console.error(`  ${pfad} antwortet mit ${antwort.status()} statt 404.`);
      verstoesse++;
      continue;
    }

    /*
      Erst durchscrollen, dann messen.

      Die Abschnitte unterhalb der Falz stehen bis zum Hineinscrollen auf
      `opacity: 0`, und axe überspringt, was nicht sichtbar ist. Ohne diesen
      Durchlauf prüfte der Lauf die halbe Seite und meldete trotzdem "sauber" —
      derselbe blinde Fleck, an dem der Druck-Wächter schon einmal hing.
    */
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    // Endliche Animationen ans Ende setzen: Ein Element mitten im Auftritt hat
    // eine andere Deckkraft, und daran hängt die Kontrastmessung.
    await seite.evaluate(() => {
      for (const bewegung of document.getAnimations()) {
        try {
          bewegung.finish();
        } catch {
          /* Endlosschleifen haben kein Ende. */
        }
      }
    });
    await seite.waitForTimeout(500);

    const ergebnis = await seite.evaluate(
      (regelwerke) =>
        window.axe.run(document, {
          runOnly: { type: "tag", values: regelwerke },
        }),
      REGELWERKE,
    );

    geprueft++;
    if (ergebnis.violations.length === 0) continue;

    verstoesse += ergebnis.violations.length;
    console.log(`  FEHLER ${pfad} bei ${breite} px`);
    for (const v of ergebnis.violations) {
      console.log(`        ${v.id} (${v.impact}): ${v.help}`);
      for (const knoten of v.nodes.slice(0, 3)) {
        console.log(`          ${knoten.target.join(" ")}`);
        const grund = knoten.failureSummary?.split("\n").filter(Boolean)[1];
        if (grund) console.log(`          ${grund.trim().slice(0, 110)}`);
      }
      if (v.nodes.length > 3)
        console.log(`          … und ${v.nodes.length - 3} weitere Stellen`);
    }
  }

  await seite.close();
}

/* ---------------------------------------------------------------------------
   Lesbar ohne JavaScript

   Die Einblendungen unterhalb der Falz starten mit `opacity: 0` und werden von
   Framer Motion sichtbar gemacht, sobald der Abschnitt ins Bild kommt. Läuft
   kein JavaScript, passiert das nie: Gemessen an der gebauten Startseite
   blieben nach vollständigem Durchscrollen 160 von 181 Überschriften und
   Faktenzeilen unsichtbar. Der Text steht im HTML, er wird nur nicht gezeigt.

   Betroffen sind Firmennetze, die Skripte filtern, und alles, was eine Seite
   liest, ohne sie auszuführen. Für einen Recruiter, der die Seite im
   Unternehmensnetz öffnet, ist das der Unterschied zwischen einem Portfolio
   und einer fast leeren Seite.

   Geprüft wird die Startseite, weil dort jedes Bewegungsmuster der Seite
   mindestens einmal vorkommt. */
const ohneSkript = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const seite = await kontext.newPage();
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });

  const versteckt = await seite.evaluate(() => {
    const wichtig = [
      ...document.querySelectorAll("h1, h2, h3, dt, dd, p, li, a"),
    ];
    const raus = [];
    for (const element of wichtig) {
      let knoten = element;
      let deckung = 1;
      while (knoten && knoten !== document.body) {
        deckung *= parseFloat(getComputedStyle(knoten).opacity || "1");
        knoten = knoten.parentElement;
      }
      if (deckung < 0.5) {
        raus.push((element.textContent ?? "").trim().slice(0, 40));
      }
    }
    return raus;
  });

  if (versteckt.length) {
    ohneSkript.push(
      `${versteckt.length} Textelemente bleiben ohne JavaScript unsichtbar`,
      ...versteckt.slice(0, 5).map((t) => `    „${t}“`),
    );
  }

  await kontext.close();
}

/* ---------------------------------------------------------------------------
   Wartezeit, die nur aus einer Animation kommt

   `prefers-reduced-motion` nimmt die Bewegung heraus — die Zeit nimmt es nicht
   mit. Bei den Reitern der Fallstudien blendet `AnimatePresence mode="wait"`
   die alte Tafel aus, bevor die neue kommt; gemessen dauerte der Wechsel mit
   der Einstellung 452 ms und ohne sie 439. Wer Bewegung abstellt, wartete also
   genauso lang auf eine Animation, die er gar nicht sieht.

   Geprueft wird das Ergebnis und nicht die Umsetzung: Nach dem Klick auf einen
   Reiter muss die zugehoerige Tafel da sein, und zwar schnell. Die Grenze ist
   grosszuegig — sie soll eine halbe Sekunde Animation finden, nicht ein paar
   Millisekunden Renderzeit. */
const GRENZE_MS = 200;
const wartefunde = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const seite = await kontext.newPage();
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });

  for (const liste of await seite.locator("[role=tablist]").all()) {
    const name = (await liste.getAttribute("aria-label")) ?? "?";
    const reiter = await liste.locator("[role=tab]").all();
    if (reiter.length < 2) continue;

    await liste.scrollIntoViewIfNeeded();
    const zweiter = reiter[1];
    const kennung = await zweiter.getAttribute("id");
    const beginn = Date.now();
    await zweiter.click();

    let dauer = null;
    for (let versuch = 0; versuch < 40; versuch++) {
      const jetzt = await seite.evaluate(
        (id) =>
          document
            .querySelector(`[role="tabpanel"][aria-labelledby="${id}"]`)
            ?.getAttribute("aria-labelledby") ?? null,
        kennung,
      );
      if (jetzt === kennung) {
        dauer = Date.now() - beginn;
        break;
      }
      await seite.waitForTimeout(25);
    }

    if (dauer === null || dauer > GRENZE_MS) {
      wartefunde.push(
        `${name}: die Tafel steht erst nach ${dauer ?? "über 1.000"} ms, ` +
          `Grenze ${GRENZE_MS} ms bei reduzierter Bewegung`,
      );
    }
  }

  await kontext.close();
}

if (ohneSkript.length > 0) {
  console.error(`
${ohneSkript[0]}:
`);
  for (const f of ohneSkript.slice(1)) console.error(`  ${f}`);
}

if (wartefunde.length > 0) {
  console.error(
    `\n${wartefunde.length} ${wartefunde.length === 1 ? "Stelle" : "Stellen"} ` +
      `mit Wartezeit, die nur aus einer Animation kommt:\n`,
  );
  for (const f of wartefunde) console.error(`  ${f}`);
}

await browser.close();
beenden();

/* Getrennt gezählt und getrennt benannt: WCAG 2.2 AA kennt keine Regel gegen
   Wartezeit, und ein Befund unter falscher Flagge ist schwerer zu beurteilen
   als einer unter eigener. Rot wird der Lauf trotzdem. */
if (verstoesse > 0) {
  console.error(
    `\n${verstoesse} ${verstoesse === 1 ? "Verstoß" : "Verstöße"} gegen ` +
      `WCAG 2.2 AA. Gemessen an der gebauten Seite im Browser, nicht am ` +
      `Quelltext.`,
  );
}

if (verstoesse > 0 || wartefunde.length > 0 || ohneSkript.length > 0)
  process.exit(1);

console.log(
  `Keine Verstöße gegen WCAG 2.2 AA: ${geprueft} Seitenaufrufe ` +
    `(${pfade.length} Seiten × ${BREITEN.length} Breiten) mit axe-core geprüft. ` +
    `Keine Wartezeit aus einer Animation bei reduzierter Bewegung, ` +
    `nichts unsichtbar ohne JavaScript.`,
);
