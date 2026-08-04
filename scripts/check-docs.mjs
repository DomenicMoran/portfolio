#!/usr/bin/env node
/**
 * Prüft, dass README.md und AGENTS.md noch beschreiben, was hier wirklich steht.
 *
 * Diese beiden Dateien sind das Erste, was jemand im Repo liest. Sie zählen
 * Dinge — Prüfläufe, Regeln, Skripte —, und gezählte Dinge veralten leise:
 * Wer einen Lauf hinzufügt, ändert package.json und den Workflow, aber nicht
 * den Satz drei Verzeichnisse weiter, der eine Zahl nennt.
 *
 * Gefunden am 03.08.2026 beim Lesen, nicht durch einen Lauf:
 *
 *   - „Drei Regeln, alle nicht verhandelbar“ — darunter standen vier
 *   - „Nach dem Bau laufen dreizehn Prüfungen“ — aufgezählt waren vierzehn
 *   - „Typen, Linter, Bau und die sechs Prüfungen“ — der Workflow hatte 21 Schritte
 *   - der Verzeichnisbaum listete 13 von 22 Skripten
 *   - acht deutsche Anführungspaare schlossen mit einem geraden Zoll-Zeichen,
 *     während `check:typography` genau das auf jeder ausgelieferten Seite verbietet
 *
 * Eine Konventionsdatei, die ihre eigene Konvention bricht, ist schlimmer als
 * keine: Sie sagt dem Leser, dass hier niemand nachsieht.
 *
 * Geprüft wird nur, was sich aus dem Repo ableiten lässt. Prosa bleibt Prosa.
 *
 *   npm run check:docs
 */

import { readFileSync, readdirSync } from "node:fs";

const funde = [];
let geprueft = 0;

const readme = readFileSync("README.md", "utf8");
const agents = readFileSync("AGENTS.md", "utf8");
const paket = JSON.parse(readFileSync("package.json", "utf8"));

/** Ein Befund mit Fundstelle, damit niemand suchen muss. */
function melde(datei, was) {
  funde.push(`${datei}: ${was}`);
}

/** Zahlwörter, wie sie in diesen Texten vorkommen. */
const ZAHLWORT = {
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  dreizehn: 13,
  vierzehn: 14,
  fünfzehn: 15,
  sechzehn: 16,
  siebzehn: 17,
  achtzehn: 18,
  neunzehn: 19,
  zwanzig: 20,
};
/** Zahlwort zu Zahl, Groß- und Kleinschreibung egal: Am Satzanfang steht
    „Sieben“, mitten im Satz „sieben“.

    Ziffern zählen mit, und das ist keine Bequemlichkeit: Die Tabelle endet bei
    zwanzig, weil Zahlen darüber ausgeschrieben schwer lesbar werden. Als der
    einundzwanzigste Prüflauf dazukam, schlug dieser Lauf „21“ vor und fand
    seinen eigenen Vorschlag danach nicht wieder — der Satz galt als
    verschwunden. */
const alsZahl = (wort) =>
  ZAHLWORT[wort.toLowerCase()] ??
  (/^[0-9]+$/.test(wort) ? Number(wort) : undefined);
const alsWort = (n) =>
  Object.keys(ZAHLWORT).find((w) => ZAHLWORT[w] === n) ?? String(n);

// ---------------------------------------------------------------------------
// 1. Die Prüfläufe: Anzahl, Vollständigkeit, und wie viele einen Browser öffnen
// ---------------------------------------------------------------------------

const laeufe = Object.keys(paket.scripts).filter((s) => s.startsWith("check:"));
/* Gesucht ist die Einfuhr am Zeilenanfang, nicht die Zeichenkette irgendwo.

   Der erste Entwurf suchte nach `from "playwright"` im ganzen Text — und
   zählte damit diese Datei mit, weil genau diese Suche hier steht. Ein
   Wächter, der sich selbst erkennt, meldet dann eine Abweichung, die es nicht
   gibt: „acht Läufe am Browser“ bei sieben. */
const amBrowser = laeufe.filter((lauf) => {
  const datei = paket.scripts[lauf].match(/scripts\/([\w-]+\.mjs)/)?.[1];
  if (!datei) return false;
  return /^import .*from "playwright"/m.test(
    readFileSync(`scripts/${datei}`, "utf8"),
  );
});

geprueft += 2;

for (const [datei, text] of [
  ["README.md", readme],
  ["AGENTS.md", agents],
]) {
  /* Jeder Lauf muss in beiden Dateien auftauchen. Ein Wächter, den das
     Handbuch nicht kennt, wird von niemandem aufgerufen. */
  const fehlend = laeufe.filter((lauf) => !text.includes(lauf));
  geprueft += laeufe.length;
  if (fehlend.length > 0) {
    melde(
      datei,
      `nennt ${fehlend.length} Prüflauf/-läufe nicht: ${fehlend.join(", ")}`,
    );
  }
}

/* Und die Zahl im Fließtext davor. */
const anzahlSatz = readme.match(/laufen ([\p{L}0-9]+) Prüfungen/u);
geprueft++;
if (!anzahlSatz) {
  melde(
    "README.md",
    "der Satz mit der Anzahl der Prüfungen ist nicht mehr auffindbar",
  );
} else if (alsZahl(anzahlSatz[1]) !== laeufe.length) {
  melde(
    "README.md",
    `nennt „${anzahlSatz[1]} Prüfungen“, package.json hat ${laeufe.length} ` +
      `(richtig wäre „${alsWort(laeufe.length)}“)`,
  );
}

const browserSatz = readme.match(/([\p{L}0-9]+) davon\s+öffnen einen Browser/u);
geprueft++;
if (!browserSatz) {
  melde(
    "README.md",
    "der Satz über die Läufe am Browser ist nicht mehr auffindbar",
  );
} else if (alsZahl(browserSatz[1]) !== amBrowser.length) {
  melde(
    "README.md",
    `nennt „${browserSatz[1]} davon“ am Browser, tatsächlich sind es ` +
      `${amBrowser.length} (richtig wäre „${alsWort(amBrowser.length)}“)`,
  );
}

const agentsSatz = agents.match(
  /([\p{L}0-9]+) der Prüfläufe öffnen einen Browser/u,
);
geprueft++;
if (!agentsSatz) {
  melde(
    "AGENTS.md",
    "der Satz über die Läufe am Browser ist nicht mehr auffindbar",
  );
} else if (alsZahl(agentsSatz[1]) !== amBrowser.length) {
  melde(
    "AGENTS.md",
    `nennt „${agentsSatz[1]} der Prüfläufe“ am Browser, tatsächlich sind es ` +
      `${amBrowser.length} (richtig wäre „${alsWort(amBrowser.length)}“)`,
  );
}

// ---------------------------------------------------------------------------
// 2. Der Verzeichnisbaum im README gegen scripts/
// ---------------------------------------------------------------------------

const vorhanden = readdirSync("scripts").filter((d) => d.endsWith(".mjs"));
const imBaum = readme.match(/^scripts\/$[\s\S]*?^```$/m)?.[0] ?? "";
geprueft += vorhanden.length;

const nichtGelistet = vorhanden.filter((d) => !imBaum.includes(d));
if (nichtGelistet.length > 0) {
  melde(
    "README.md",
    `der Verzeichnisbaum lässt ${nichtGelistet.length} Skript(e) aus: ` +
      nichtGelistet.join(", "),
  );
}

const erfunden = [...imBaum.matchAll(/([\w-]+\.mjs)/g)]
  .map((t) => t[1])
  .filter((d) => d !== "local-server.mjs" && !vorhanden.includes(d));
geprueft += erfunden.length;
if (erfunden.length > 0) {
  melde(
    "README.md",
    `der Verzeichnisbaum nennt Skripte, die es nicht gibt: ${erfunden.join(", ")}`,
  );
}

// ---------------------------------------------------------------------------
// 3. Aufzählungen, die sich selbst ankündigen
// ---------------------------------------------------------------------------

/* „Vier Regeln, alle nicht verhandelbar:“ gefolgt von einer nummerierten
   Liste — die Ankündigung und die Liste müssen dieselbe Zahl ergeben. */
for (const [datei, text] of [
  ["README.md", readme],
  ["AGENTS.md", agents],
]) {
  for (const treffer of text.matchAll(
    /^(\p{L}+) (Regeln|Fallen|Entscheidungen)[^\n]*:?\s*$/gmu,
  )) {
    const erwartet = alsZahl(treffer[1]);
    if (!erwartet) continue;
    geprueft++;

    // Die Liste unmittelbar danach: nummerierte Punkte oder fette Absätze.
    const danach = text.slice(treffer.index + treffer[0].length);
    const bisZurNaechstenUeberschrift = danach.split(/^## /m)[0];
    const nummeriert = (bisZurNaechstenUeberschrift.match(/^\d+\. /gm) ?? [])
      .length;
    const fett = (bisZurNaechstenUeberschrift.match(/^\*\*/gm) ?? []).length;
    const tatsaechlich = nummeriert || fett;

    if (tatsaechlich && tatsaechlich !== erwartet) {
      melde(
        datei,
        `„${treffer[0].trim()}“ kündigt ${erwartet} an, darunter stehen ${tatsaechlich}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Deutsche Anführungszeichen
// ---------------------------------------------------------------------------

/* Dieselbe Regel, die `check:typography` auf jeder ausgelieferten Seite
   durchsetzt: Deutsch öffnet mit „ und schließt mit “. Ein gerades Zoll-Zeichen
   als Abschluss ist der Fehler, den eine Tastatur macht und den niemand sieht. */
for (const [datei, text] of [
  ["README.md", readme],
  ["AGENTS.md", agents],
]) {
  // Code-Blöcke und Code im Satz bleiben außen vor: dort ist " ein Zeichen
  // der Programmiersprache und keine Anführung.
  const prosa = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const auf = (prosa.match(/„/g) ?? []).length;
  const zu = (prosa.match(/“/g) ?? []).length;
  geprueft += auf;

  if (auf !== zu) {
    melde(
      datei,
      `${auf} öffnende „ stehen ${zu} schließenden “ gegenüber — ` +
        `wahrscheinlich schließt eines mit einem geraden Zoll-Zeichen`,
    );
  }
}

// ---------------------------------------------------------------------------

if (funde.length > 0) {
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\n${funde.length} Abweichung${funde.length === 1 ? "" : "en"} zwischen Handbuch und Repo. ` +
      `Diese beiden Dateien sind das Erste, was jemand hier liest.`,
  );
  process.exit(1);
}

console.log(
  `README.md und AGENTS.md stimmen mit dem Repo überein: ${geprueft} Angaben geprüft ` +
    `(${laeufe.length} Prüfläufe, davon ${amBrowser.length} am Browser, ` +
    `${vorhanden.length} Skripte).`,
);
