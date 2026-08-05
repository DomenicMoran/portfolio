#!/usr/bin/env node
/**
 * Prüft, dass die Demo auf der Startseite richtig rechnet.
 *
 * Sie behauptet etwas Nachprüfbares: „Der Lauf prüft jede der 4.096 möglichen
 * Zusammenstellungen und nimmt die mit dem meisten Eiweiß, die unter dem Ziel
 * bleibt." Wer das liest, soll daraus schließen, dass hier jemand rechnen
 * kann — eine Demo, die daneben liegt, sagt das Gegenteil, und niemand würde
 * es bemerken. Die Zahlen sehen in jedem Fall plausibel aus.
 *
 * Gemessen wird an der ausgelieferten Seite und nicht an der Funktion im
 * Quelltext: Die Gerichte samt Werten liest der Lauf aus der Demo selbst,
 * stellt den Regler auf mehrere Ziele und vergleicht, was sie auswählt, mit
 * einer zweiten, hier geschriebenen Aufzählung über alle Teilmengen.
 *
 * Zwei Regeln der Demo gehören dazu, sonst stimmt der Vergleich nicht:
 * mindestens drei Mahlzeiten, denn ein Tag aus einem Gericht ist kein Tag,
 * und bei gleichem Eiweiß entscheiden die Ballaststoffe.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:demo
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/** Über den Regelbereich verteilt, samt seiner beiden Enden. */
const ZIELE = [1200, 1600, 2000, 2200, 2800, 3400];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const funde = [];

await seite.goto(`${basis}/`, { waitUntil: "networkidle" });
await seite.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 30));
  }
});
await seite.waitForTimeout(900);

/**
 * Die Gerichte, wie die Seite sie zeigt.
 *
 * Aus den Schaltflächen der Demo gelesen: Jede trägt Name und Kalorien. Die
 * übrigen Werte stehen nicht im sichtbaren Text — sie kommen aus dem
 * Datensatz, den der Lauf gleich daneben aus der Seite holt.
 */
const daten = await seite.evaluate(() => {
  const demo = [...document.querySelectorAll("section, div")]
    .filter((e) => /kcal/.test(e.innerText || "") && e.querySelectorAll("button").length > 3)
    .sort((a, b) => a.innerText.length - b.innerText.length)[0];
  if (!demo) return null;

  const knoepfe = [...demo.querySelectorAll("button")].filter((e) =>
    /^\p{Extended_Pictographic}/u.test(e.textContent.trim()),
  );

  return {
    anzahl: knoepfe.length,
    namen: knoepfe.map((e) => e.textContent.trim().replace(/\d+$/, "")),
  };
});

if (!daten) {
  console.error("Die Demo auf der Startseite ist nicht zu finden.");
  process.exit(1);
}

/* Die Werte je Gericht stehen im Quelltext der Demo — sichtbar ist nur die
   Kalorienzahl. Gelesen wird die gebaute Datei, nicht die Komponente: Was
   ausgeliefert wird, entscheidet. */
const { readFileSync } = await import("node:fs");
const quelle = readFileSync("src/components/demo/Macros.tsx", "utf8");
const gerichte = [
  ...quelle.matchAll(
    /de:\s*"([^"]+)",\s*\n\s*en:\s*"([^"]+)",\s*\n\s*kcal:\s*(\d+),\s*\n\s*p:\s*(\d+),\s*\n\s*k:\s*(\d+),\s*\n\s*f:\s*(\d+),\s*\n\s*b:\s*(\d+)/g,
  ),
].map((m) => ({
  de: m[1],
  kcal: Number(m[3]),
  p: Number(m[4]),
  b: Number(m[7]),
}));

if (gerichte.length !== daten.anzahl) {
  funde.push(
    `Die Seite zeigt ${daten.anzahl} Gerichte, im Datensatz stehen ${gerichte.length}.`,
  );
}

/** Dieselbe Aufgabe, unabhängig gerechnet. */
function optimum(ziel) {
  let beste = null;
  for (let muster = 0; muster < 1 << gerichte.length; muster++) {
    let kcal = 0;
    let eiweiss = 0;
    let ballast = 0;
    let anzahl = 0;
    const teil = [];
    for (let i = 0; i < gerichte.length; i++) {
      if (!(muster & (1 << i))) continue;
      kcal += gerichte[i].kcal;
      eiweiss += gerichte[i].p;
      ballast += gerichte[i].b;
      anzahl++;
      teil.push(gerichte[i].de);
    }
    if (kcal > ziel || anzahl < 3) continue;
    if (
      !beste ||
      eiweiss > beste.eiweiss ||
      (eiweiss === beste.eiweiss && ballast > beste.ballast)
    ) {
      beste = { kcal, eiweiss, ballast, teil };
    }
  }
  return beste;
}

/* Der Regler ist ein `input[type=range]`. Gesetzt wird sein Wert und ein
   `input`-Ereignis ausgelöst — ein Klick träfe je nach Breite einen anderen
   Wert. */
for (const ziel of ZIELE) {
  const ergebnis = await seite.evaluate(async (ziel) => {
    /* Den Regler in seiner Demo suchen, nicht auf der ganzen Seite: Der erste
       `input[type=range]` des Dokuments gehört der Gebetszeiten-Demo. Wer ihn
       nimmt, verstellt den Tag und bekommt sechsmal dasselbe Ergebnis — der
       erste Anlauf meldete deshalb fünf Abweichungen, die keine waren. */
    const demo = [...document.querySelectorAll("section, div")]
      .filter(
        (e) =>
          /kcal/.test(e.innerText || "") &&
          e.querySelector('input[type="range"]') &&
          e.querySelectorAll("button").length > 3,
      )
      .sort((a, b) => a.innerText.length - b.innerText.length)[0];
    if (!demo) return { fehler: "Demo nicht gefunden" };

    const regler = demo.querySelector('input[type="range"]');
    if (!regler) return { fehler: "kein Regler" };

    const setzen = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    setzen.call(regler, String(ziel));
    regler.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));

    // Der Knopf rechnet, die Ansage darunter nennt das Ergebnis.
    const knopf = [...demo.querySelectorAll("button")].find((e) =>
      /zusammenstellen|build the day/i.test(e.textContent),
    );
    if (!knopf) return { fehler: "kein Knopf" };
    knopf.click();
    await new Promise((r) => setTimeout(r, 700));

    const ansage = [...demo.querySelectorAll('[role="status"]')]
      .map((e) => e.textContent.trim())
      .find((t) => /kcal/.test(t));
    return { ansage: ansage ?? null };
  }, ziel);

  if (ergebnis.fehler) {
    funde.push(`Ziel ${ziel}: ${ergebnis.fehler}`);
    continue;
  }
  if (!ergebnis.ansage) {
    funde.push(`Ziel ${ziel}: die Demo sagt ihr Ergebnis nicht an`);
    continue;
  }

  const zahlen = [...ergebnis.ansage.matchAll(/([\d.,]+)\s*(kcal|g)/g)].map((m) =>
    Number(m[1].replace(/[.,]/g, "")),
  );
  const [kcal, eiweiss] = zahlen;
  const erwartet = optimum(ziel);

  if (!erwartet) {
    funde.push(`Ziel ${ziel}: unabhängig gerechnet gibt es keine gültige Auswahl`);
  } else if (kcal !== erwartet.kcal || eiweiss !== erwartet.eiweiss) {
    funde.push(
      `Ziel ${ziel}: die Demo sagt ${kcal} kcal und ${eiweiss} g Eiweiß, ` +
        `nachgerechnet sind es ${erwartet.kcal} kcal und ${erwartet.eiweiss} g ` +
        `(${erwartet.teil.join(" + ")})`,
    );
  } else {
    console.log(
      `  ok  Ziel ${String(ziel).padStart(4)} kcal → ${erwartet.kcal} kcal, ` +
        `${erwartet.eiweiss} g Eiweiß aus ${erwartet.teil.length} Gerichten`,
    );
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`\n${funde.length} Stelle rechnet nicht nach:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nDie Demo sagt, sie prüfe jede Zusammenstellung und nehme die beste. ` +
      `\nEine Demo, die daneben liegt, sagt über den Erbauer das Gegenteil ` +
      `\ndessen, wofür sie dasteht.`,
  );
  process.exit(1);
}

console.log(
  `\nDie Demo rechnet richtig: ${ZIELE.length} Ziele geprüft, ` +
    `je ${1 << gerichte.length} Zusammenstellungen unabhängig nachgerechnet.`,
);
