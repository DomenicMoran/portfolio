#!/usr/bin/env node
/**
 * Prüft, dass der Code in den Artikeln syntaktisch aufgeht.
 *
 * Die fünf Artikel zeigen Code — das ist ihr Kern: Ursache, Fix und der
 * Commit, an dem sich beides nachlesen lässt. Wer sie liest, ist mit hoher
 * Wahrscheinlichkeit jemand, der Code liest, und ein Tippfehler in einem
 * gezeigten Ausschnitt ist für diesen Leser das sichtbarste Zeichen von
 * Nachlässigkeit — sichtbarer als jede Kennzahl daneben.
 *
 * Geprüft wird nur die Syntax, nicht die Typen. Die Blöcke sind Ausschnitte:
 * Sie bringen keine Importe mit, ihre Bezeichner stammen aus einer Datei, die
 * hier niemand kennt, und ein Typecheck würde genau das anmerken. Was er
 * findet, wäre kein Fehler des Artikels. Ein Klammerfehler dagegen schon.
 *
 * Die Sprache steht am Block; `diff` und `sql` bleiben außen vor, für sie ist
 * der TypeScript-Parser das falsche Werkzeug.
 *
 *   npm run check:code
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const ORDNER = join("src", "content", "articles");

/**
 * Die Codeblöcke einer Artikeldatei, mit ihrer Sprache.
 *
 * Gepaart wird über die Stelle im Text und nicht über den Abstand: Zwischen
 * `lang` und `code` steht meist eine `caption`, manchmal mehrere Zeilen
 * Erklärung. Ein Muster mit fester Obergrenze fand deshalb zehn von zwölf
 * Blöcken — und die beiden übersehenen wären genau die gewesen, die niemand
 * mehr angesehen hat.
 */
function bloeckeAus(quelle) {
  const sprachen = [...quelle.matchAll(/\blang:\s*"([^"]+)"/g)].map((t) => ({
    stelle: t.index,
    sprache: t[1],
  }));
  const bloecke = [];

  for (const treffer of quelle.matchAll(/\bcode:\s*`/g)) {
    const anfang = treffer.index + treffer[0].length;
    /* Das Ende des Template-Literals suchen, maskierte Backticks übergehen. */
    let ende = anfang;
    while (ende < quelle.length) {
      if (quelle[ende] === "`" && quelle[ende - 1] !== "\\") break;
      ende++;
    }
    /* Die letzte Sprachangabe vor diesem Block gehört dazu. */
    const davor = sprachen.filter((s) => s.stelle < treffer.index);

    /* Die Maskierung des Template-Literals auflösen.
       -----------------------------------------------
       In der Quelle steht `\\s`, auf der Seite steht `\s`. Wer die Rohfassung
       parst, prüft nicht den Code, den der Leser sieht: `/\\s+/` ist ein
       gültiger Ausdruck und bedeutet etwas anderes als `/\s+/`. Gefunden beim
       Abgleich der geprüften Blöcke gegen die ausgelieferte Seite, wo genau
       diese Stelle als einziger Unterschied übrig blieb. */
    const sichtbar = quelle
      .slice(anfang, ende)
      .replace(/\\`/g, "`")
      .replace(/\\\$\{/g, "${")
      .replace(/\\\\/g, "\\");

    bloecke.push({
      sprache: davor.length ? davor[davor.length - 1].sprache : "?",
      code: sichtbar,
      zeile: quelle.slice(0, treffer.index).split("\n").length,
    });
  }
  return bloecke;
}

const funde = [];
let geprueft = 0;
const nachSprache = {};

for (const datei of readdirSync(ORDNER).sort()) {
  if (!datei.endsWith(".ts") || ["types.ts", "index.ts"].includes(datei)) continue;
  const quelle = readFileSync(join(ORDNER, datei), "utf8");

  for (const block of bloeckeAus(quelle)) {
    nachSprache[block.sprache] = (nachSprache[block.sprache] ?? 0) + 1;
    if (block.sprache !== "ts" && block.sprache !== "tsx") continue;
    geprueft++;

    const gelesen = ts.createSourceFile(
      `${datei}:${block.zeile}`,
      block.code,
      ts.ScriptTarget.ES2022,
      true,
      block.sprache === "tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    for (const fehler of gelesen.parseDiagnostics ?? []) {
      const { line } = gelesen.getLineAndCharacterOfPosition(fehler.start ?? 0);
      funde.push(
        `${datei}, Block ab Zeile ${block.zeile}, dort Zeile ${line + 1}: ` +
          ts.flattenDiagnosticMessageText(fehler.messageText, " "),
      );
    }
  }
}

/* Passt jede Zeile in den Kasten, den der Leser sieht?
 *
 * Der Kasten ist bei 1440 px 614 px breit und scrollt waagerecht, wenn eine
 * Zeile länger ist. Auf einem Telefon ist das offensichtlich und richtig so:
 * Dort läuft ein Block um mehrere hundert Pixel über, man wischt, fertig.
 *
 * Am Schreibtisch ist es das Gegenteil von offensichtlich. Gemessen an der
 * ausgelieferten Seite lief ein Block im Whisper-Artikel um 14 px über —
 * eine Zeile von 75 Zeichen, davon sechs arabische, die breiter setzen. Der
 * Leser sieht einen Kommentar, der vollständig aussieht, und ihm fehlt das
 * letzte Wort. Die anderen neun Artikel hielten die Grenze; die englische
 * Fassung derselben Stelle war schon umbrochen.
 *
 * Gerechnet passen 614 px bei 8,4 px je Zeichen auf rund 73. Geprüft wird
 * gegen 72, und die längste Zeile im Bestand hat 70 — der Abstand ist Absicht,
 * weil nicht jedes Zeichen gleich breit setzt.
 */
const GRENZE = 72;
for (const datei of readdirSync(ORDNER).filter((f) => /^(de|en)-.*\.ts$/.test(f))) {
  const quelle = readFileSync(join(ORDNER, datei), "utf8");
  for (const block of bloeckeAus(quelle)) {
    block.code.split("\n").forEach((zeile, i) => {
      if (zeile.length > GRENZE)
        funde.push(
          `${datei}, Block ab Zeile ${block.zeile}, dort Zeile ${i + 1}: ` +
            `${zeile.length} Zeichen, ${GRENZE} passen in den Kasten`,
        );
    });
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Codeblock ist nicht in Ordnung:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nDie Artikel zeigen Code als Beleg. Wer sie liest, liest Code — ein ` +
      `\nTippfehler darin wiegt mehr als jede Kennzahl daneben, und eine Zeile,` +
      `\ndie am Schreibtisch abgeschnitten wird, sieht vollständig aus.`,
  );
  process.exit(1);
}

const verteilung = Object.entries(nachSprache)
  .sort((a, b) => b[1] - a[1])
  .map(([s, n]) => `${n}× ${s}`)
  .join(", ");

console.log(
  `Jeder Codeblock geht auf: ${geprueft} TypeScript-Blöcke geparst ` +
    `(insgesamt ${verteilung}), keine Zeile über ${GRENZE} Zeichen.`,
);
