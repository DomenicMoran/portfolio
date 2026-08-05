#!/usr/bin/env node
/**
 * Prüft, dass das ausgelieferte Kurzprofil zum aktuellen Inhalt passt.
 *
 * Jede andere Datei dieser Seite entsteht beim Bau. Die beiden PDFs nicht:
 * Sie werden gedruckt, und Drucken braucht einen Browser, den es auf Vercel
 * nicht gibt. `npm run onepager:pdf` läuft deshalb von Hand — und ein Schritt,
 * der von Hand läuft, wird irgendwann vergessen.
 *
 * Das Blatt ist ausgerechnet die Datei, die weitergereicht wird. Ein
 * Recruiter, der das PDF an die fachliche Führung schickt, verschickt dann
 * einen Stand, den es auf der Seite nicht mehr gibt.
 *
 * Verglichen wird die Prüfsumme über die Quellen: Der Druck schreibt sie als
 * `/Quellstand` in die Dokumenteigenschaften, dieser Lauf rechnet sie neu.
 * Gelesen wird mit `pdf-lib` und nicht mit einer Textsuche — die Eigenschaften
 * landen beim Speichern in einem Objektstrom, im Rohtext steht dort nichts.
 *
 *   npm run check:onepager
 */

import { existsSync, readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join } from "node:path";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { QUELLEN, quellstand } from "./lib/onepager-quellstand.mjs";

/** Welches gebaute Blatt zu welcher PDF gehört. */
const SEITEN = {
  "public/domenic-moran-kurzprofil.pdf": join(".next", "server", "app", "onepager.html"),
  "public/domenic-moran-one-pager.pdf": join(".next", "server", "app", "en", "onepager.html"),
};

const BLAETTER = [
  "public/domenic-moran-kurzprofil.pdf",
  "public/domenic-moran-one-pager.pdf",
];

const erwartet = quellstand();
const funde = [];
let geprueft = 0;

for (const pfad of BLAETTER) {
  if (!existsSync(pfad)) {
    funde.push(`${pfad} fehlt`);
    continue;
  }

  const doc = await PDFDocument.load(readFileSync(pfad));
  const eintrag = doc.getInfoDict().get(PDFName.of("Quellstand"));
  const gefunden = eintrag instanceof PDFString ? eintrag.asString() : null;

  if (!gefunden) {
    funde.push(
      `${pfad} nennt keinen Quellstand — vor dem nächsten Vergleich einmal neu drucken`,
    );
    continue;
  }
  if (gefunden !== erwartet) {
    funde.push(
      `${pfad} stammt aus Quellstand ${gefunden}, aktuell ist ${erwartet}`,
    );
    continue;
  }

  /* Ein Kurzprofil ist eine Seite.
     ------------------------------
     Das steht als Regel in AGENTS.md und war der einzige Handgriff daran, den
     niemand nachgezählt hat: „nach Inhaltsänderungen die Druckansicht
     gegenprüfen". Wer eine Zeile ergänzt und neu druckt, bekommt ein zweites
     Blatt — und sieht es nur, wenn er die Datei öffnet.
     Die zweite Seite trüge dann drei Zeilen Rest, und genau so kommt sie beim
     Empfänger an. */
  const seiten = doc.getPageCount();
  if (seiten !== 1) {
    funde.push(
      `${pfad} hat ${seiten} Seiten. Ein Kurzprofil ist eine Seite: ` +
        `Inhalt kürzen, dann neu drucken.`,
    );
    continue;
  }
  geprueft++;
}

/* ---------------------------------------------------------------------------
   Der Text im Blatt ist maschinenlesbar

   Ein Kurzprofil wird nicht nur gelesen, es wird eingelesen: Wer sich bewirbt,
   lädt die Datei in ein Bewerbermanagementsystem, und das zieht den Text
   heraus, bevor ein Mensch sie sieht. Kommt dabei nichts an, ist die Bewerbung
   leer, ohne dass es jemand merkt.

   Chromium bettet die Schriften dieses Blattes als Type3 ein, also als
   Vektorzeichnungen statt als Schriftdatei — bei variablen Schriften der
   Normalfall. Lesbar bleibt der Text trotzdem, aber nur über die
   ToUnicode-Tabellen. Genau die benutzt dieser Lauf: Was er herausbekommt,
   bekommt ein Extraktor auch.

   Geprüft wird nicht die Zeichenzahl allein, sondern ob die Angaben ankommen,
   auf die es bei einer Bewerbung ankommt. Eine Datei mit 3.000 Zeichen
   Kauderwelsch sähe in einer reinen Mengenprüfung gesund aus. */
const KERNANGABEN = [
  "Domenic Moran",
  "AI Product Engineer",
  "Berlin",
  "gmail.com",
  "Salati",
  "MenuCloud",
];

/**
 * Welche Zeichen auf einem Blatt stehen — aus der gebauten Seite, nicht aus
 * dem PDF.
 *
 * Eine Schrift bettet nur ein, was gebraucht wird: Auf dem englischen Blatt
 * kommt kein „ß" vor, also fehlt es dort zu Recht. Ein fester Katalog meldet
 * genau solche Zeichen als Lücke, die keine ist. Die Quelle ist deshalb das
 * ausgelieferte HTML desselben Blattes.
 */
function zeichenAufDemBlatt(html) {
  const nurInhalt = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const text = nurInhalt
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return new Set([...text].filter((z) => /[\p{L}\p{N}]/u.test(z)));
}

for (const pfad of BLAETTER) {
  if (!existsSync(pfad)) continue;
  const daten = readFileSync(pfad);
  const text = textAusPdf(daten);
  const fehlend = KERNANGABEN.filter((b) => !text.includes(b));
  if (fehlend.length) {
    funde.push(
      `${pfad}: aus ${text.length} lesbaren Zeichen fehlen ` +
        fehlend.map((f) => `„${f}“`).join(", "),
    );
  }

  /* Jedes Zeichen des Blattes muss eine Zuordnung haben.

     Ohne ToUnicode-Eintrag kann kein Extraktor es lesen, egal wie gut er ist —
     und ein Kurzprofil wird eingelesen, bevor ein Mensch es sieht. Geprüft
     wird gegen das ausgelieferte HTML desselben Blattes, also gegen eine
     Quelle außerhalb des PDF. */
  const blatt = SEITEN[pfad];
  if (blatt && existsSync(blatt)) {
    const abgebildet = abgebildeteZeichen(daten);
    const ohne = [...zeichenAufDemBlatt(readFileSync(blatt, "utf8"))].filter(
      (z) => !abgebildet.has(z),
    );
    if (ohne.length) {
      funde.push(
        `${pfad}: ${ohne.length} Zeichen ohne Zuordnung — ` +
          `${ohne.map((z) => `„${z}“`).join(", ")}. Ohne ToUnicode-Eintrag ` +
          `kann kein Extraktor sie lesen.`,
      );
    }
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Befund am ausgelieferten Blatt:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nEine der Quellen hat sich geändert:\n  ${QUELLEN.join("\n  ")}\n\n` +
      `Neu drucken mit:  npm run build && npm run onepager:pdf`,
  );
  process.exit(1);
}

console.log(
  `Beide Blätter stammen aus dem aktuellen Inhalt: ` +
    `${geprueft} PDF geprüft, Quellstand ${erwartet}.`,
);

/**
 * Den sichtbaren Text eines PDF über seine ToUnicode-Tabellen lesen.
 *
 * Kein Fremdpaket dafür: Die Aufgabe ist klein und der Weg gut dokumentiert.
 * Streams entpacken, die Zuordnungen aus `beginbfchar`/`beginbfrange` sammeln,
 * dann die Hex-Strings vor `Tj` abbilden. Chromium schreibt die Zeichen als
 * Hex, nicht in Klammern.
 */
/** Alle entpackten Ströme einer Datei als ein Text. */
function stroeme(daten) {
  const teile = [];
  let stelle = 0;
  while (true) {
    const anfang = daten.indexOf("stream", stelle);
    if (anfang < 0) break;
    /* "endstream" enthält "stream": Ohne diese Prüfung fängt die Suche mitten
       im Schlusswort an und gerät aus dem Tritt. */
    if (daten.subarray(anfang - 3, anfang).toString("latin1") === "end") {
      stelle = anfang + 6;
      continue;
    }
    const ende = daten.indexOf("endstream", anfang);
    if (ende < 0) break;
    let von = anfang + "stream".length;
    if (daten[von] === 0x0d) von++;
    if (daten[von] === 0x0a) von++;
    try {
      teile.push(inflateSync(daten.subarray(von, ende)));
    } catch {
      // Kein Flate-Stream: uebergehen.
    }
    stelle = ende + 1;
  }
  return Buffer.concat(teile).toString("latin1");
}

/**
 * Jedes Zeichen, für das die Datei eine Zuordnung mitbringt.
 *
 * Ohne ToUnicode-Eintrag kann kein Extraktor ein Zeichen lesen, egal wie gut
 * er ist. Diese Menge beantwortet damit die Frage, die für ein
 * Bewerbermanagementsystem zählt — und sie hängt nicht daran, ob die
 * Zusammensetzung unten die Schriften auseinanderhält.
 */
function abgebildeteZeichen(daten) {
  const alle = stroeme(daten);
  const zeichen = new Set();
  for (const abschnitt of alle.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const paar of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      zeichen.add(String.fromCharCode(parseInt(paar[2].slice(0, 4), 16)));
    }
  }
  for (const abschnitt of alle.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const reihe of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      const start = parseInt(reihe[1], 16);
      const schluss = Math.min(parseInt(reihe[2], 16), start + 400);
      const ziel = parseInt(reihe[3].slice(0, 4), 16);
      for (let i = start; i <= schluss; i++) {
        zeichen.add(String.fromCharCode(ziel + i - start));
      }
    }
  }
  return zeichen;
}

function textAusPdf(daten) {
  const alle = stroeme(daten);
  const zuordnung = new Map();

  for (const abschnitt of alle.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const paar of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      zuordnung.set(
        parseInt(paar[1], 16),
        String.fromCharCode(parseInt(paar[2].slice(0, 4), 16)),
      );
    }
  }
  for (const abschnitt of alle.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const reihe of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      const start = parseInt(reihe[1], 16);
      const schluss = Math.min(parseInt(reihe[2], 16), start + 400);
      const ziel = parseInt(reihe[3].slice(0, 4), 16);
      for (let i = start; i <= schluss; i++) {
        zuordnung.set(i, String.fromCharCode(ziel + i - start));
      }
    }
  }

  const heraus = [];
  for (const treffer of alle.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
    const hex = treffer[1];
    for (let i = 0; i + 1 < hex.length; i += 2) {
      heraus.push(zuordnung.get(parseInt(hex.slice(i, i + 2), 16)) ?? "?");
    }
  }
  return heraus.join("");
}
