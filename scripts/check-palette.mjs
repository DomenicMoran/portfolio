#!/usr/bin/env node
/**
 * Prüft, dass die Befehlspalette findet und hinführt.
 *
 * Sie ist das einzige Bedienelement, das die ganze Seite erschließt: Suche
 * über Abschnitte, Fallstudien und Artikel, erreichbar mit Strg+K von überall.
 * Wer sie benutzt, hat es eilig, ein Recruiter, der etwas Bestimmtes sucht.
 *
 * Und sie ist die Sorte Bauteil, die stumm versagt. Ihre Liste kommt aus dem
 * Inhalt; verschiebt sich dort ein Schlüssel, liefert die Suche nichts mehr
 * und meldet „Nichts gefunden.“, was aussieht wie eine Antwort und keine ist.
 * Kein anderer Lauf sieht sie: `check:a11y` prüft den geladenen Zustand,
 * `check:focus` die Reihenfolge beim Tabben, `check:links` die Adressen im
 * Dokument. Eine Palette muss man bedienen.
 *
 * Geprüft wird die ganze Kette, wie ein Besucher sie durchläuft: öffnen,
 * tippen, auswählen, ankommen. Dazu der leere Fall, denn eine Suche ohne
 * Treffer muss das sichtbar sagen und nicht nur ansagen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:palette
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/**
 * Was gesucht wird und wohin es führen muss, je Sprachfassung.
 *
 * Getrennt, weil die Titel es sind: Der Kassen-Artikel heißt auf Englisch
 * „German till law in practice", und „kassen“ kommt dort in keinem Wort vor.
 * Der erste Entwurf suchte beidseitig danach und meldete auf `/en` einen
 * Fehler der Palette, es war einer des Suchworts. Der zweite nahm „till“ und
 * traf damit auch „still“ im Titel eines anderen Artikels: Die Suche geht
 * über Teilzeichenketten, und das Wort muss eindeutig sein.
 */
const SUCHEN = {
  de: [
    { wort: "salati", ziel: /case-salati|salati/i },
    { wort: "kassen", ziel: /kassensichv/i },
  ],
  en: [
    { wort: "salati", ziel: /case-salati|salati/i },
    { wort: "whisper", ziel: /whisper/i },
  ],
};

/** Ein Wort, das nirgends steht. */
const OHNE_TREFFER = "xyzq";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];
let geprueft = 0;

for (const pfad of ["/", "/en"]) {
  await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  await seite.waitForTimeout(800);

  /* Der Fokus vor dem Öffnen: Er muss nachher wieder dort stehen. Ohne ein
     Element davor läge er auf `body`, und die Rückkehr wäre nicht prüfbar. */
  const knopf = await seite.$('button[aria-label*="efehlspalette"], button[aria-label*="ommand palette"]');
  if (!knopf) {
    funde.push(`${pfad}: kein Knopf zur Befehlspalette`);
    continue;
  }
  await knopf.focus();

  await seite.keyboard.press("Control+k");
  await seite.waitForTimeout(500);
  geprueft++;

  const offen = await seite.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const liste = document.querySelector('[role="listbox"]');
    return {
      dialog: Boolean(dialog),
      eintraege: liste ? liste.querySelectorAll('[role="option"]').length : 0,
      imFeld: document.activeElement?.tagName === "INPUT",
    };
  });

  if (!offen.dialog) funde.push(`${pfad}: Strg+K öffnet die Palette nicht`);
  if (!offen.imFeld) funde.push(`${pfad}: nach dem Öffnen steht der Fokus nicht im Suchfeld`);
  if (offen.eintraege < 5) {
    funde.push(`${pfad}: die Palette bietet nur ${offen.eintraege} Einträge an`);
  }

  /* Eine Suche ohne Treffer muss das sichtbar sagen.
     Eine Ansage allein reicht nicht: Sie erreicht nur, wer vorlesen lässt. */
  await seite.keyboard.press("Control+a");
  await seite.keyboard.type(OHNE_TREFFER, { delay: 25 });
  await seite.waitForTimeout(500);
  geprueft++;

  const leer = await seite.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return null;
    const sichtbarerText = [...dialog.querySelectorAll("*")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== "hidden";
      })
      .map((e) => e.textContent.trim())
      .join(" ");
    return {
      treffer: document.querySelectorAll('[role="option"]').length,
      hatHinweis: /nichts gefunden|nothing found|no results/i.test(sichtbarerText),
    };
  });

  if (leer?.treffer !== 0) {
    funde.push(`${pfad}: „${OHNE_TREFFER}“ liefert ${leer?.treffer} Treffer`);
  } else if (!leer.hatHinweis) {
    funde.push(
      `${pfad}: bei null Treffern steht nichts Sichtbares da. Eine Ansage ` +
        `allein erreicht nur, wer vorlesen lässt.`,
    );
  }

  /* Escape schließt und gibt den Fokus zurück. */
  await seite.keyboard.press("Escape");
  await seite.waitForTimeout(400);
  geprueft++;
  const nachEscape = await seite.evaluate(() => ({
    dialog: Boolean(document.querySelector('[role="dialog"]')),
    fokus: document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName,
  }));
  if (nachEscape.dialog) funde.push(`${pfad}: Escape schließt die Palette nicht`);
  if (!/efehlspalette|ommand palette/.test(String(nachEscape.fokus))) {
    funde.push(
      `${pfad}: nach dem Schließen steht der Fokus auf „${nachEscape.fokus}“ ` +
        `statt auf dem Knopf, der die Palette geöffnet hat.`,
    );
  }

  /* Und die Suche führt hin, wo sie hinzeigt. */
  for (const { wort, ziel } of SUCHEN[pfad === "/en" ? "en" : "de"]) {
    await seite.evaluate(() => window.scrollTo(0, 0));
    await seite.waitForTimeout(250);
    await seite.keyboard.press("Control+k");
    await seite.waitForTimeout(400);
    await seite.keyboard.press("Control+a");
    await seite.keyboard.type(wort, { delay: 25 });
    await seite.waitForTimeout(450);
    geprueft++;

    const treffer = await seite.evaluate(
      () => document.querySelectorAll('[role="option"]').length,
    );
    if (treffer === 0) {
      funde.push(`${pfad}: „${wort}" findet nichts, obwohl es im Inhalt steht`);
      await seite.keyboard.press("Escape");
      continue;
    }

    const vorher = { adresse: seite.url(), y: await seite.evaluate(() => window.scrollY) };
    await seite.keyboard.press("Enter");
    await seite.waitForTimeout(1300);

    const nachher = { adresse: seite.url(), y: await seite.evaluate(() => window.scrollY) };
    const gewechselt = nachher.adresse !== vorher.adresse;
    const gescrollt = nachher.y > vorher.y + 200;

    if (!gewechselt && !gescrollt) {
      funde.push(`${pfad}: Auswahl von „${wort}" führt nirgendwohin`);
    } else if (gewechselt && !ziel.test(nachher.adresse)) {
      funde.push(`${pfad}: „${wort}" führt nach ${nachher.adresse}, erwartet war ${ziel}`);
    }

    if (gewechselt) {
      await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
      await seite.waitForTimeout(700);
    }
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Stelle an der Befehlspalette trägt nicht:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nSie ist das einzige Bedienelement, das die ganze Seite erschließt. ` +
      `\nWer sie benutzt, hat es eilig.`,
  );
  process.exit(1);
}

console.log(
  `Die Befehlspalette findet und führt hin: ${geprueft} Schritte über beide ` +
    `Sprachfassungen, öffnen, leerer Fall, schließen, ${SUCHEN.de.length} Suchen je Fassung.`,
);
