#!/usr/bin/env node
/**
 * Hält die Menge JavaScript je Seite gegen ein Budget.
 *
 * Die Seite nennt unter „Core Web Vitals" ein Bundle-Budget je Route. Bis
 * hierher gab es keines: `check:vitals` misst, was am Ende herauskommt, und
 * das ist die richtige Kennzahl — aber sie schlägt erst an, wenn es schon
 * langsam ist. Ein Budget schlägt vorher an, beim Zuwachs.
 *
 * Gemessen wird, was im ausgelieferten HTML als `<script src>` steht, mit den
 * Dateigrößen aus dem Bau: also das, was ein Besucher wirklich anfordert,
 * nicht das, was ein Bündelbericht zusammenzählt. Ungepackt, weil diese Zahl
 * ohne Server und ohne Netz stabil dieselbe ist; über die Leitung geht rund
 * ein Drittel davon.
 *
 * Die Budgets stehen unten und haben Luft über dem heutigen Stand. Sie sollen
 * Wachstum melden, nicht jede Verschiebung.
 *
 *   npm run check:bundle
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gebauteSeiten } from "./lib/built-pages.mjs";

/**
 * Was eine Seite höchstens mitbringen darf, ungepackt in KiB.
 *
 * Drei Klassen statt einer Zahl: Die Startseite trägt vier Fallstudien mit
 * zwei Vorführungen, eine Artikelseite trägt Prosa und einen Codekasten, eine
 * Rechtsseite trägt nichts davon. Ein gemeinsames Budget wäre für die
 * Rechtsseiten wirkungslos und für die Startseite zu eng.
 */
const BUDGETS = [
  { muster: /^\/(en)?$/, grenze: 1200, name: "Startseite" },
  { muster: /^\/(en\/articles|artikel)/, grenze: 1100, name: "Artikel" },
  { muster: /onepager/, grenze: 800, name: "Kurzprofil" },
  { muster: /impressum|datenschutz/, grenze: 750, name: "Rechtsseite" },
];

const groesse = (adresse) => {
  const pfad = join(".next", adresse.replace("/_next/", ""));
  try {
    return statSync(pfad).size;
  } catch {
    return 0;
  }
};

const zeilen = [];
const funde = [];
let geprueft = 0;

for (const route of gebauteSeiten()) {
  const datei = join(
    ".next",
    "server",
    "app",
    `${route === "/" ? "/index" : route}.html`,
  );
  if (!existsSync(datei)) continue;

  const html = readFileSync(datei, "utf8");
  const skripte = [
    ...new Set(
      [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]),
    ),
  ];
  const kib = Math.round(
    skripte.reduce((summe, adresse) => summe + groesse(adresse), 0) / 1024,
  );

  const klasse = BUDGETS.find((b) => b.muster.test(route));
  if (!klasse) continue;

  geprueft++;
  const marke = kib > klasse.grenze ? "  <-- über Budget" : "";
  zeilen.push(
    `${route.padEnd(48)} ${String(kib).padStart(5)} KiB   ${klasse.name} bis ${klasse.grenze}${marke}`,
  );
  if (kib > klasse.grenze) {
    funde.push(
      `${route}: ${kib} KiB in ${skripte.length} Dateien, Budget ${klasse.grenze} KiB (${klasse.name})`,
    );
  }
}

console.log(zeilen.join("\n"));

if (funde.length > 0) {
  console.error(`\n${funde.length} Seite(n) über Budget:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nGemessen an den <script src> der gebauten Seiten, ungepackt. ` +
      `Über die Leitung geht rund ein Drittel davon.`,
  );
  process.exit(1);
}

console.log(
  `\nAlle ${geprueft} Seiten im Bündelbudget: gemessen an den ausgelieferten ` +
    `Skripten, ungepackt.`,
);
