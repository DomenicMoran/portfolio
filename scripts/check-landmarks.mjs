#!/usr/bin/env node
/**
 * Prüft, dass jede Seite dieselben Landmarken anbietet.
 *
 * Wer mit einem Vorleseprogramm arbeitet, springt nicht durch die Seite,
 * sondern durch ihre Landmarken: Navigation, Hauptbereich, Fußzeile. Fehlt
 * eine, fehlt der Sprung — und gemeldet wird das von niemandem. axe prüft, ob
 * eine vorhandene Landmarke richtig gebaut ist, nicht, ob sie da ist.
 *
 * Dreimal gefunden, jedes Mal von Hand:
 *
 *   - der Belegblock der Artikel war eine `section` ohne Namen und damit
 *     keine Landmarke
 *   - die Artikelliste war eine `ul` statt einer benannten Navigation
 *   - die beiden Rechtsseiten hatten genau eine Landmarke, den Hauptbereich:
 *     kein Rückweg, keine Fußzeile — ausgerechnet dort, wo jemand eine
 *     Anschrift oder eine Rechtsgrundlage sucht
 *
 * Zwei Fallen, die dieser Lauf kennt:
 *
 *   - `footer` und `header` **innerhalb** von `main` sind keine Landmarken.
 *     Die Norm nimmt ihnen die Rolle dort, und im Quelltext sieht man es nicht.
 *   - Zwei Landmarken derselben Rolle brauchen verschiedene Namen. Zweimal
 *     „Hauptnavigation" in einer Liste hilft niemandem beim Zielen.
 *
 * Gemessen wird an der gebauten Seite über die tatsächlichen Rollen, nicht
 * über die Elementnamen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:landmarks
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Was jede Seite tragen muss. */
const PFLICHT = ["main", "navigation", "contentinfo"];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

const pfade = gebauteSeiten();
const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];
let geprueft = 0;
let landmarken = 0;

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, {
    waitUntil: "domcontentloaded",
  });
  if (!antwort || antwort.status() !== 200) continue;
  geprueft++;

  const gefunden = await seite.evaluate(() => {
    /** Elementname zu Landmarkenrolle. */
    const ROLLE = {
      MAIN: "main",
      NAV: "navigation",
      FOOTER: "contentinfo",
      HEADER: "banner",
      ASIDE: "complementary",
      FORM: "form",
      SECTION: "region",
    };

    const raus = [];
    for (const el of document.querySelectorAll(
      "main, nav, footer, header, aside, section",
    )) {
      const rolle = el.getAttribute("role") ?? ROLLE[el.tagName];
      if (!rolle) continue;

      /* `footer` und `header` verlieren ihre Rolle innerhalb von `main`,
         `article` oder `section`; `section` und `form` haben ohne Namen gar
         keine. Beides steht in der Norm und ist im Quelltext unsichtbar. */
      if (
        (el.tagName === "FOOTER" || el.tagName === "HEADER") &&
        el.closest("main, article, section, aside")
      ) {
        continue;
      }

      const name =
        el.getAttribute("aria-label") ??
        document
          .getElementById(el.getAttribute("aria-labelledby") ?? "")
          ?.textContent?.trim() ??
        "";

      if ((el.tagName === "SECTION" || el.tagName === "FORM") && !name)
        continue;

      raus.push({ rolle, name });
    }
    return raus;
  });

  landmarken += gefunden.length;

  /* Zierzeichen im Namen einer Überschrift.

     Die Sprungmarke jeder Zwischenüberschrift ist ein Doppelkreuz, und es
     stand als Text im `h2`. Der Name der Überschrift im Barrierefreiheitsbaum
     lautete damit „Warum ein größeres Modell hier nichts bringt#“, und wer
     eine Überschrift markierte, kopierte es mit. Gefunden an allen sieben
     Überschriften eines Artikels; axe prüft Namen auf Vorhandensein, nicht
     auf Zierrat.

     Geprüft wird der Name, wie ein Vorleseprogramm ihn bildet: sichtbarer
     Text ohne die Teile, die `aria-hidden` trägt. */
  const zierrat = await seite.evaluate(() => {
    const raus = [];
    for (const h of document.querySelectorAll("h1, h2, h3, h4")) {
      const klon = h.cloneNode(true);
      for (const weg of klon.querySelectorAll("[aria-hidden='true']"))
        weg.remove();
      const name = (klon.textContent ?? "").trim();
      if (/[#*•·→↗]$/.test(name)) {
        raus.push(name.slice(-45));
      }
    }
    return raus;
  });

  for (const z of zierrat) {
    funde.push(`${pfad}: Überschrift endet auf ein Zierzeichen — „…${z}“`);
  }

  /* Eine Fallstudie trägt genau eine Überschrift der Ebene 3: ihren Namen.

     Wer mit einem Vorleseprogramm arbeitet, liest den Abschnitt oft nur als
     Überschriftenliste. Dort stand unter „Vier Produkte. Alle live.“ sechsmal
     eine Ebene 3: die vier Projekte und dazwischen die beiden Vorführungen,
     „Ein Jahr Gebetszeiten, hier gerechnet“ und „Ein Tag, zusammengestellt“.
     Sie sehen in dieser Liste aus wie zwei weitere Projekte, und weil eine
     neue Ebene 3 den vorigen Zweig schließt, hing Salatis „Ausführlich
     nachzulesen" anschließend unter der Vorführung statt unter Salati.

     Die Stufen selbst sprangen dabei nie, es fehlte keine Ebene — genau
     deshalb meldet axe hier nichts. Geprüft wird die Zugehörigkeit, nicht die
     Reihenfolge. */
  const fallstudien = await seite.evaluate(() =>
    [...document.querySelectorAll('[id^="case-"]')].map((s) => ({
      id: s.id,
      titel: [...s.querySelectorAll("h3")].map((h) =>
        (h.textContent ?? "").trim().slice(0, 40),
      ),
    })),
  );
  for (const f of fallstudien) {
    if (f.titel.length !== 1) {
      funde.push(
        `${pfad}: #${f.id} hat ${f.titel.length} Überschriften der Ebene 3 statt einer — ` +
          `„${f.titel.join("“, „")}“`,
      );
    }
  }

  for (const pflicht of PFLICHT) {
    if (!gefunden.some((l) => l.rolle === pflicht)) {
      funde.push(`${pfad}: keine Landmarke „${pflicht}"`);
    }
  }

  /* Gleiche Rolle, gleicher Name: In der Landmarkenliste stehen dann zwei
     Einträge, die sich nicht unterscheiden lassen. */
  const gesehen = new Map();
  for (const l of gefunden) {
    const schluessel = `${l.rolle} ${l.name}`;
    if (gesehen.has(schluessel)) {
      funde.push(
        `${pfad}: ${l.rolle} „${l.name || "(ohne Namen)"}" kommt mehrfach vor — ` +
          `in der Landmarkenliste nicht zu unterscheiden`,
      );
    }
    gesehen.set(schluessel, true);
  }
}

await seite.close();
await browser.close();
beenden();

if (funde.length > 0) {
  console.error(
    `${funde.length} Seite(n) mit fehlender oder doppelter Landmarke:\n`,
  );
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nJede Seite braucht Hauptbereich, Navigation und Fußzeile. ` +
      `\`footer\` und \`header\` innerhalb von \`main\` zählen nicht.`,
  );
  process.exit(1);
}

console.log(
  `Jede Seite bietet ihre Landmarken an: ${landmarken} auf ${geprueft} Seiten, ` +
    `keine Rolle doppelt benannt.`,
);
