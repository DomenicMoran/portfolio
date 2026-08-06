#!/usr/bin/env node
/**
 * Prüft die angegebene Lesezeit jedes Artikels gegen seinen Wortbestand.
 *
 * Die Zahlen waren von Hand gesetzt und stimmten nicht: rund doppelt zu hoch
 * und untereinander nicht einmal sortiert. Der längste Artikel trug neun
 * Minuten, ein kürzerer elf. Auf einer Seite, die mit Nachprüfbarkeit
 * argumentiert, ist eine geschätzte Zahl neben einer gemessenen ein Fehler.
 *
 * 180 Wörter je Minute, nicht die üblichen 200 bis 250. Deutscher Fachtext
 * liest sich langsamer als englische Blogprosa, und die Code-Blöcke zählen
 * hier nicht als Wörter mit, kosten beim Lesen aber Zeit. Der niedrigere Wert
 * gleicht beides aus.
 *
 *   node scripts/check-reading-time.mjs          nur prüfen
 *   node scripts/check-reading-time.mjs --setzen  Werte korrigieren
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ORDNER = "src/content/articles";
const WOERTER_JE_MINUTE = 180;
const setzen = process.argv.includes("--setzen");

/** Textfelder aus einer Artikeldatei ziehen, ohne den Code-Block. */
function woerterZaehlen(quelle) {
  let wort = 0;

  // Zuerst die Code-Blöcke entfernen, damit ihre Inhalte nicht mitzählen.
  const ohneCode = quelle.replace(/code:\s*`[\s\S]*?`,/g, "");

  for (const feld of ["text", "dek", "title", "caption"]) {
    const muster = new RegExp(`${feld}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g");
    for (const treffer of ohneCode.matchAll(muster)) {
      wort += treffer[1].split(/\s+/).filter(Boolean).length;
    }
  }

  // Aufzählungen stehen als nackte Zeichenketten in items-Feldern.
  for (const treffer of ohneCode.matchAll(
    /^\s{6,}"((?:[^"\\]|\\.)*)",\s*$/gm,
  )) {
    wort += treffer[1].split(/\s+/).filter(Boolean).length;
  }

  return wort;
}

const befunde = [];

for (const datei of readdirSync(ORDNER)) {
  if (!datei.endsWith(".ts") || ["types.ts", "index.ts"].includes(datei))
    continue;

  const pfad = join(ORDNER, datei);
  const quelle = readFileSync(pfad, "utf8");
  const m = /minutes:\s*(\d+)/.exec(quelle);
  if (!m) continue;

  const woerter = woerterZaehlen(quelle);
  const angegeben = Number(m[1]);
  const berechnet = Math.max(1, Math.round(woerter / WOERTER_JE_MINUTE));

  const abweichung = Math.abs(angegeben - berechnet);
  befunde.push({ datei, woerter, angegeben, berechnet, abweichung });

  if (setzen && abweichung > 0) {
    writeFileSync(
      pfad,
      quelle.replace(/minutes:\s*\d+/, `minutes: ${berechnet}`),
      "utf8",
    );
  }
}

befunde.sort((a, b) => b.woerter - a.woerter);
for (const b of befunde) {
  const marke = b.abweichung > 0 ? "  <-- weicht ab" : "";
  console.log(
    `${b.datei.padEnd(22)} ${String(b.woerter).padStart(5)} Wörter | ` +
      `angegeben ${String(b.angegeben).padStart(2)} | berechnet ${String(b.berechnet).padStart(2)}${marke}`,
  );
}

/*
   Keine Toleranz mehr.

   Erlaubt war eine Minute Unterschied, und genau darin verschwand ein
   Befund: `de-ota` und `de-shaper` gaben vier Minuten an, gerechnet waren es
   fünf — und dieselben beiden Texte nannten auf Englisch fünf. Derselbe
   Artikel sagte dem deutschen Leser vier und dem englischen fünf.

   Die Zahl wird gerechnet, nicht geschätzt. Wenn sie gerechnet ist, gibt es
   keinen Grund, warum die angezeigte eine andere sein sollte. Wer den Text
   ändert, ruft `--setzen` — derselbe Handgriff wie beim Kurzprofil. */
const schief = befunde.filter((b) => b.abweichung > 0);
if (schief.length && !setzen) {
  console.error(
    `\n${schief.length} Artikel mit falscher Lesezeit. Beheben: --setzen`,
  );
  process.exit(1);
}
if (setzen) console.log("\nWerte gesetzt.");
/* Eine Bilanz zum Schluss, wie bei jedem anderen Lauf.

   Ohne sie endete die Ausgabe mit der letzten Tabellenzeile, und in der
   Actions-Ansicht sah ein bestandener Lauf aus wie einer, der mittendrin
   abgebrochen ist. Sechzehn Läufe sagen dort, was sie geprüft haben;
   dieser sagte nichts. */
else
  console.log(
    `
Jede Lesezeit stimmt mit dem Wortbestand: ${befunde.length} Artikel gezählt, ` +
      `${befunde.reduce((n, b) => n + b.woerter, 0).toLocaleString("de-DE")} Wörter.`,
  );

/* ---------------------------------------------------------------------------
   Die Zeitangabe über dem Recruiter-Bereich

   Sie stand dort als Überschrift und war die einzige Lesezeit der Seite, die
   niemand nachgerechnet hat: "Das Wichtigste in 60 Sekunden". Gemessen mit
   denselben 180 Wörtern je Minute wie oben brauchte allein der Fließtext
   82 Sekunden, mit den Eckdaten 113.

   Das ist die unglücklichste Stelle für eine ungeprüfte Zahl: Zwei Absätze
   darunter steht "Ich weise nach, statt zu behaupten".

   Gezählt wird aus der gebauten Seite und nicht aus `site.ts`: Der Bereich
   ist dort durch `id="hire"` eindeutig begrenzt und enthält genau das, was
   der Leser sieht. Der erste Anlauf schnitt den Block aus dem Quelltext und
   kam auf 109 Wörter, wo die ausgelieferte Seite 339 zeigt — die Grenzen
   eines Objektliterals sind mit einem Regex nicht zuverlässig zu finden. */
const ZAHLWORT = {
  de: { 1: "einer Minute", 2: "zwei Minuten", 3: "drei Minuten", 4: "vier Minuten" },
  en: { 1: "one minute", 2: "two minutes", 3: "three minutes", 4: "four minutes" },
};

const bereiche = [
  { sprache: "de", datei: join(".next", "server", "app", "index.html") },
  { sprache: "en", datei: join(".next", "server", "app", "en.html") },
];

/** Der Abschnitt mit `id="hire"`, samt seiner verschachtelten Abschnitte. */
function abschnitt(html) {
  const start = html.indexOf('id="hire"');
  if (start < 0) return null;
  const von = html.lastIndexOf("<section", start);
  if (von < 0) return null;
  let tiefe = 0;
  const muster = /<section\b|<\/section>/g;
  muster.lastIndex = von;
  for (let t; (t = muster.exec(html)); ) {
    tiefe += t[0] === "</section>" ? -1 : 1;
    if (tiefe === 0) return html.slice(von, t.index);
  }
  return null;
}

const zeitfunde = [];
for (const { sprache, datei } of bereiche) {
  if (!existsSync(datei)) {
    zeitfunde.push(`${datei} fehlt — erst npm run build`);
    continue;
  }
  const block = abschnitt(readFileSync(datei, "utf8"));
  if (!block) {
    zeitfunde.push(`${datei}: kein Abschnitt mit id="hire"`);
    continue;
  }
  const text = block
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&(?:#\d+|[a-z]+);/g, "");
  const woerter = text.split(/\s+/).filter(Boolean).length;
  const minuten = Math.max(1, Math.round(woerter / WOERTER_JE_MINUTE));
  const erwartet = ZAHLWORT[sprache][minuten];
  const titel = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(block)?.[1].replace(/<[^>]+>/g, "").trim() ?? "";

  if (!erwartet) {
    zeitfunde.push(`${datei}: ${woerter} Wörter sind ${minuten} Minuten, dafür fehlt das Zahlwort`);
  } else if (!titel.includes(erwartet)) {
    zeitfunde.push(
      `${datei}: „${titel}“ bei ${woerter} Wörtern — gerechnet sind das ${erwartet}`,
    );
  }
}

if (zeitfunde.length && !setzen) {
  console.error(`\n${zeitfunde.length} Zeitangabe stimmt nicht mit dem Text darunter:`);
  for (const f of zeitfunde) console.error(`  ${f}`);
  process.exit(1);
}
if (!setzen) {
  console.log(
    `Die Zeitangabe über dem Recruiter-Bereich stimmt in beiden Sprachfassungen.`,
  );
}
