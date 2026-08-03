#!/usr/bin/env node
/**
 * Prüft, dass jede Sprachfassung ihre eigene Typografie benutzt.
 *
 * Deutsch und Englisch setzen dieselben Zeichen anders. Anführungszeichen
 * stehen im Deutschen unten und oben („so"), im Englischen beide oben ("so").
 * Vor dem Prozentzeichen steht im Deutschen ein Leerzeichen (100 %), im
 * Englischen nicht (100%). Tausender trennt das Deutsche mit einem Punkt, das
 * Englische mit einem Komma.
 *
 * Bei den Anführungszeichen wird nicht gezählt, welche Zeichen vorkommen,
 * sondern **in welcher Reihenfolge**. Das ist der Unterschied, an dem sich
 * dieser Lauf entschieden hat: Ein Zeichen für sich ist mehrdeutig, weil
 * U+201C im Deutschen schließt und im Englischen öffnet. Erst das Paar sagt,
 * welche Sprache gemeint ist.
 *
 * Gemessen an der ausgelieferten Seite am 03.08.2026: Auf `/en` standen zehn
 * deutsche Öffner, dazu „100 %" in den Kennzahlen. Nach der ersten Korrektur
 * stand dort zwanzigmal derselbe Schließer — falsch in die andere Richtung,
 * und ein Lauf, der nur nach dem deutschen Öffner suchte, meldete sauber.
 * Deshalb die Reihenfolge.
 *
 * Erwartet wird also:
 *
 *   deutsch:   „ …  “   („ …  “)
 *   englisch:  “ …  ”   (“ …  ”)
 *
 * Gemessen am gebauten HTML und ohne Browser: Es geht um Zeichen im Text,
 * nicht um Darstellung. Skripte bleiben draußen — im Datenstrom von React
 * steht Auszeichnung, kein Fließtext.
 *
 *   npm run check:typography
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gebauteSeiten } from "./lib/built-pages.mjs";

const UNTEN = "„"; // U+201E
const OBEN = "“"; // U+201C
const OBEN_RECHTS = "”"; // U+201D

/** Das erwartete Paar je Sprache, als Folge der drei Zeichen. */
const PAAR = {
  de: [UNTEN, OBEN],
  en: [OBEN, OBEN_RECHTS],
};

const NAME = {
  [UNTEN]: "„ (unten)",
  [OBEN]: "“ (oben links)",
  [OBEN_RECHTS]: "” (oben rechts)",
};

/**
 * Tausendertrennung je Sprache — gesucht wird jeweils die *fremde*.
 *
 * Die Zahlen dieser Seite kommen aus `toLocaleString`, aber nicht alle:
 * Einige stehen als Text in den Inhaltsdateien, und dort merkt es niemand.
 * „1.276" liest ein englischer Leser als eine Zahl knapp über eins.
 */
const FREMDER_TRENNER = {
  en: /\b\d{1,3}(?:\.\d{3})+\b/g,
  de: /\b\d{1,3}(?:,\d{3})+\b/g,
};

/** Der sichtbare Text einer gebauten Seite. */
function sichtbarerText(pfad) {
  return readFileSync(pfad, "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
}

/*
   Deutsche Woerter auf einer englischen Seite.

   Die Architekturdiagramme trugen ihre Beschriftungen im Bauteil und gab es
   nur einmal: Auf `/en` stand deshalb „GETEILTE LOGIK", „ZUGAENGE",
   „QR-Bestellung". Kein Lauf sah das. `check-parity` zaehlt Elemente, nicht
   Woerter, und ein Suchlauf ueber `innerText` findet Text in einem SVG nicht.
   Dieser Lauf liest das HTML und damit auch `<text>`-Knoten.

   Gesucht wird nach Umlauten und nach einer kurzen Liste von Woertern, die es
   im Englischen nicht gibt. Eigennamen bleiben draussen: „WohnungsJaeger",
   „WG-Gesucht" und „Kleinanzeigen" heissen so, wie sie heissen.
*/
const NUR_DEUTSCH = new RegExp(
  String.raw`\b(und|oder|nicht|eine[nmr]?|mit|für|über|durch|wird|werden|sind|keine?|Seite|Daten|Zugänge|Betrieb|Anwendung|Freigabe|Quellen|Versand|Persistenz|Oberflächen|Geteilte[rs]?|Bestellung|Konten|Inhalte|Mensch|entscheidet|Fokus|Kette|Gebetszeiten|Verträge|Rezepte|Tabellen|Migrationen|Regeln|Suche)\b`,
  "g",
);

/** Eigennamen heißen, wie sie heißen — auch auf einer englischen Seite. */
const EIGENNAMEN =
  /WohnungsJäger|WG-Gesucht|Kleinanzeigen|Immowelt|ImmoScout24|Salati|MenuCloud|NOURI/g;

const funde = [];
let geprueft = 0;
let paare = 0;

for (const route of gebauteSeiten()) {
  const sprache = route === "/en" || route.startsWith("/en/") ? "en" : "de";
  const datei = join(".next", "server", "app", `${route === "/" ? "/index" : route}.html`);

  let text;
  try {
    text = sichtbarerText(datei);
  } catch {
    continue;
  }
  geprueft++;

  /* Im Englischen steht das Prozentzeichen direkt an der Zahl. Auch das
     geschützte Leerzeichen zählt, sonst rutscht es genau dort durch, wo
     jemand den Umbruch verhindern wollte. */
  if (sprache === "en") {
    const luecken = [...text.matchAll(/\d[\s  ]%/g)];
    if (luecken.length > 0) {
      funde.push(
        `${route}: ${luecken.length}× Leerzeichen vor dem Prozentzeichen — ` +
          `im Englischen steht es direkt an der Zahl (100%).`,
      );
    }
  }

  if (sprache === "en") {
    const ohneNamen = text.replace(EIGENNAMEN, " ");
    const deutsch = [...new Set([...ohneNamen.matchAll(NUR_DEUTSCH)].map((m) => m[0]))];
    if (deutsch.length > 0) {
      funde.push(
        `${route}: deutsche Wörter auf einer englischen Seite — ${deutsch.slice(0, 6).join(", ")}`,
      );
    }
  }

  const falsch = [...new Set([...text.matchAll(FREMDER_TRENNER[sprache])].map((m) => m[0]))];
  if (falsch.length > 0) {
    funde.push(
      `${route} (${sprache}): ${falsch.slice(0, 5).join(", ")} — Tausender trennt ` +
        `${sprache === "en" ? "das Englische mit einem Komma" : "das Deutsche mit einem Punkt"}.`,
    );
  }

  const [auf, zu] = PAAR[sprache];
  const folge = [...text].filter((z) => z === UNTEN || z === OBEN || z === OBEN_RECHTS);
  paare += Math.floor(folge.length / 2);

  for (let i = 0; i < folge.length; i += 2) {
    const erwartet = i + 1 < folge.length ? [auf, zu] : [auf];
    const gefunden = folge.slice(i, i + 2);
    if (gefunden[0] === erwartet[0] && (erwartet.length === 1 || gefunden[1] === erwartet[1])) {
      continue;
    }
    /* Nur das erste kaputte Paar je Seite: Steht die Reihenfolge einmal
       falsch, ist meist der ganze Absatz betroffen, und zwanzig gleiche
       Zeilen verdecken den nächsten Befund. */
    funde.push(
      `${route} (${sprache}): Paar ${i / 2 + 1} ist ${gefunden.map((z) => NAME[z]).join(" … ")}, ` +
        `erwartet ${erwartet.map((z) => NAME[z]).join(" … ")}`,
    );
    break;
  }

  if (folge.length % 2 !== 0) {
    funde.push(`${route}: ${folge.length} Anführungszeichen, also eines ohne Gegenstück.`);
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Fundstelle(n) mit fremder Typografie:\n`);
  for (const f of funde) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `Jede Sprachfassung setzt ihre eigene Typografie: ${geprueft} Seiten, ` +
    `${paare} Anführungspaare in der richtigen Reihenfolge.`,
);
