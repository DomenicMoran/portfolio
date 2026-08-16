#!/usr/bin/env node
/**
 * Nimmt die Website-Aufnahmen der eigenen Systeme neu auf.
 *
 * Warum es diesen Lauf gibt: Die Aufnahmen entstanden bisher von Hand, und
 * eine Aufnahme von Hand veraltet still. Gemessen am 16.08.2026 zeigte
 * `nouri-desktop.png` vom 2. August auf der Startseite den Satz "14 Tage
 * kostenlos testen" und eine Sprachumschaltung mit sechs Sprachen. Auf
 * `www.nouri-fitness.de` steht seit dem 15. August "Sieben Tage kostenlos
 * testen", und die Sprachumschaltung ist als vorgetaeuschte Mehrsprachigkeit
 * entfernt. Die Seite warb also mit einer Probezeit, die es nicht gibt, und
 * mit einer Funktion, die es nicht mehr gibt.
 *
 * Ein Bild ist damit dieselbe Sorte Aussage wie eine Zahl, und Zahlen prueft
 * dieses Repo seit jeher gegen ihre Quelle (`check-figures.mjs`). Bilder
 * konnten das nicht, weil niemand sie neu erzeugen konnte, ohne fuenf
 * Browserfenster von Hand zu bedienen. Jetzt ist es ein Befehl.
 *
 *   npm run capture:shots            # alle
 *   npm run capture:shots -- nouri   # nur die genannten
 *
 * Danach `npm run build:shots`, sonst liegt das neue PNG neben dem alten WebP.
 *
 * Aufgenommen wird in der Groesse, die die bisherige Datei hatte. Das ist
 * Absicht: Die Seite legt fuer jedes Bild ein Seitenverhaeltnis fest, und ein
 * anderes Mass verschoebe die Kartenreihen, die `check:cards` auf gleiche
 * Hoehe prueft.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { chromium } from "playwright";

const ORIGINALE = "../assets/shots";

/**
 * Je Aufnahme die Adresse und das Mass der bisherigen Datei.
 *
 * `menucloud-app.png` fehlt hier bewusst: Das ist eine Telefonaufnahme aus der
 * laufenden App (1242 x 2688) und keine Website. Sie stammt vom 04.05.2026 und
 * ist damit die aelteste Aufnahme auf der Seite; neu machen kann sie nur, wer
 * die App auf einem Geraet oder im Emulator startet.
 */
/**
 * `hoehe` ist der Bildausschnitt, `fenster` die Fensterhoehe beim Aufnehmen.
 *
 * Die beiden sind nicht dasselbe, und der Unterschied ist der Grund, warum die
 * bisherigen Aufnahmen mitten durch eine Kennzahlenreihe schnitten. Gemessen am
 * 16.08.2026 an den Live-Seiten, Oberkante des Abschnitts NACH dem Kopfbereich:
 *
 *   nouri      762   menucloud  1375   bitdojo  730   dartile  799   lexipulse  728
 *
 * Bei vier Seiten ist der Kopfbereich so hoch wie sein Inhalt; dort darf das
 * Fenster groesser sein als der Ausschnitt. NOURI ist der Sonderfall: Sein
 * Kopfbereich fuellt die Fensterhoehe, die naechste Kante liegt immer 66 Pixel
 * darueber. Bei einem 828 Pixel hohen Fenster faengt die Kennzahlenreihe also
 * bei 762 an. Wer dort Fenster und Ausschnitt gleichsetzt, jagt sich im Kreis:
 * Ein kleinerer Ausschnitt macht den Kopfbereich mit.
 *
 * Die Zahlen stehen ausgeschrieben und nicht gemessen zur Laufzeit, weil eine
 * Aufnahme reproduzierbar sein muss. Aendert eine Seite ihren Kopfbereich,
 * faellt es an dieser Datei auf und nicht an einem Bild, das seit Wochen
 * jemanden anluegt.
 */
const AUFNAHMEN = [
  { name: "nouri-desktop", adresse: "https://www.nouri-fitness.de/", breite: 1440, hoehe: 762, fenster: 828 },
  { name: "menucloud-desktop", adresse: "https://menucloud-berlin.de/", breite: 1440, hoehe: 1375, fenster: 1600 },
  { name: "bitdojo-desktop", adresse: "https://bitdojo.de/", breite: 1440, hoehe: 730, fenster: 1600 },
  { name: "dartile-desktop", adresse: "https://dartile.de/", breite: 1440, hoehe: 799, fenster: 1600 },
  { name: "lexipulse-desktop", adresse: "https://lexipulse.de/", breite: 1440, hoehe: 728, fenster: 1600 },
];

/**
 * Zustimmungsbanner wegklicken, und zwar auf der ablehnenden Seite.
 *
 * Ein Banner im Bild waere nicht nur haesslich, es zeigte dem Besucher der
 * Portfolioseite einen Zustand, den ein echter Nutzer nach dem ersten Klick
 * nie wieder sieht. Geklickt wird ausschliesslich das, was Nicht-Notwendiges
 * ablehnt; ein "Alle akzeptieren" fasst dieser Lauf nicht an.
 */
const ABLEHNEN = [
  "Nur notwendige",
  "Nur essenzielle",
  "Alle ablehnen",
  "Ablehnen",
  "Reject all",
  "Only necessary",
];

async function bannerWegklicken(seite) {
  for (const text of ABLEHNEN) {
    const knopf = seite.getByRole("button", { name: text, exact: false }).first();
    if (await knopf.isVisible().catch(() => false)) {
      await knopf.click().catch(() => {});
      await seite.waitForTimeout(600);
      return text;
    }
  }
  return null;
}

const gewuenscht = process.argv.slice(2);
const liste = gewuenscht.length
  ? AUFNAHMEN.filter((a) => gewuenscht.some((g) => a.name.includes(g)))
  : AUFNAHMEN;

if (!liste.length) {
  console.error(`Keine Aufnahme passt auf ${gewuenscht.join(", ")}.`);
  console.error(`Bekannt sind: ${AUFNAHMEN.map((a) => a.name).join(", ")}`);
  process.exit(1);
}

const browser = await chromium.launch();
let fehler = 0;

for (const { name, adresse, breite, hoehe, fenster } of liste) {
  const ziel = join(ORIGINALE, `${name}.png`);
  mkdirSync(dirname(ziel), { recursive: true });

  const kontext = await browser.newContext({
    viewport: { width: breite, height: fenster },
    deviceScaleFactor: 1,
    locale: "de-DE",
    // Ohne diese Angabe blenden die Seiten ihre Inhalte beim Hineinscrollen
    // ein, und der Kopf steht im Bild auf halber Deckkraft. Mit ihr sind die
    // Einblendungen aus, und das Bild zeigt den Endzustand.
    reducedMotion: "reduce",
  });
  const seite = await kontext.newPage();

  try {
    const antwort = await seite.goto(adresse, { waitUntil: "networkidle", timeout: 60_000 });
    if (!antwort || !antwort.ok()) {
      throw new Error(`${antwort ? antwort.status() : "keine Antwort"} auf ${adresse}`);
    }

    const banner = await bannerWegklicken(seite);
    await seite.evaluate(() => document.fonts.ready);
    // Die Kopfbereiche laden Bilder nach; ohne diese Pause steht im Bild ein
    // grauer Platzhalter, wo ein Foto hingehoert.
    await seite.waitForTimeout(2500);
    await seite.evaluate(() => window.scrollTo(0, 0));
    await seite.waitForTimeout(400);

    await seite.screenshot({ path: ziel, clip: { x: 0, y: 0, width: breite, height: hoehe } });
    console.log(`  ok  ${name.padEnd(20)} ${breite} x ${hoehe}${banner ? `  (Banner: ${banner})` : ""}`);
  } catch (e) {
    fehler += 1;
    console.error(`  FEHLER ${name}: ${e.message}`);
  } finally {
    await kontext.close();
  }
}

await browser.close();

if (fehler) {
  console.error(`\n${fehler} Aufnahme(n) fehlgeschlagen. Nichts anderes wurde angefasst.`);
  process.exit(1);
}

console.log(`\n${liste.length} Aufnahme(n) neu in ${ORIGINALE}.`);
console.log("Jetzt `npm run build:shots`, sonst liegt das neue PNG neben dem alten WebP.");

if (!existsSync(ORIGINALE)) process.exit(1);
try {
  execFileSync("git", ["status", "--porcelain", ORIGINALE], { stdio: "ignore" });
} catch {
  // Die Originale liegen ausserhalb des Repos, ein git-Aufruf darf dort
  // scheitern. Der Lauf ist trotzdem fertig.
}
