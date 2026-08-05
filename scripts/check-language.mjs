#!/usr/bin/env node
/**
 * Prüft, dass die beiden Sprachfassungen sauber aneinandergebunden sind.
 *
 * Die Seite gibt es zweimal, unter getrennten Adressen und mit getrennten
 * Wurzel-Layouts. Was sie zusammenhält, sind drei Dinge, die alle unsichtbar
 * sind, solange sie stimmen:
 *
 * **Die `hreflang`-Angaben.** Sie sagen einer Suchmaschine, welche Adresse
 * dieselbe Sache in der anderen Sprache ist. Zeigen sie ins Falsche, führt
 * ein englischer Treffer auf die deutsche Seite; zeigen sie nur auf die
 * Startseite, verliert jede Unterseite ihre Entsprechung.
 *
 * **Der sichtbare Sprachwechsel.** Er muss dorthin führen, wo `hreflang`
 * hinzeigt. Sonst sagt die Seite der Suchmaschine etwas anderes als dem
 * Leser, und der Leser landet auf der Startseite statt bei dem Artikel, den
 * er gerade liest.
 *
 * **Der Rückweg aus den Rechtsseiten.** Impressum und Datenschutzerklärung
 * gibt es nur auf Deutsch — ein deutsches Rechtsdokument ist in Übersetzung
 * nicht mehr dieselbe Erklärung. Wer aus der englischen Fassung dorthin
 * klickt, braucht deshalb einen ausdrücklichen Weg zurück.
 *
 * Dazu WCAG 3.1.2 (Stufe AA): Ein deutscher Textteil auf einer englischen
 * Seite braucht `lang="de"`, sonst spricht ein Vorleseprogramm ihn englisch
 * aus. Eigennamen sind ausgenommen — „WohnungsJäger" bleibt „WohnungsJäger".
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:language
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Nur auf Deutsch, mit Absicht: ein Rechtsdokument übersetzt man nicht. */
const NUR_DEUTSCH = ["/impressum", "/datenschutz"];

/**
 * Eigennamen tragen ihre Umlaute in jede Sprache mit. WCAG 3.1.2 nimmt sie
 * ausdrücklich aus, und eine Auszeichnung würde die Aussprache eher
 * verschlechtern als verbessern.
 */
const EIGENNAMEN = /^(WohnungsJäger|Salati|MenuCloud|NOURI|Domenic Moran)$/;

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const pfade = gebauteSeiten();
const funde = [];

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

/** Was eine Seite über sich und ihre Gegenfassung sagt. */
const stand = new Map();

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "domcontentloaded" });
  if (!antwort || antwort.status() !== 200) continue;

  const daten = await seite.evaluate((eigennamenQuelle) => {
    const eigennamen = new RegExp(eigennamenQuelle);

    const alternativen = {};
    for (const el of document.querySelectorAll('link[rel="alternate"][hreflang]')) {
      alternativen[el.getAttribute("hreflang")] = el.getAttribute("href");
    }

    const wechsel = [...document.querySelectorAll("a")]
      .filter((e) => /^(English|Deutsch)$/i.test(e.textContent.trim()))
      .map((e) => e.getAttribute("href"));

    const rueckweg = [...document.querySelectorAll("a")].some(
      (e) => e.getAttribute("href") === "/en",
    );

    /* Deutscher Text ohne Auszeichnung. Umlaute und ß sind der verlässliche
       Marker: Ein englischer Satz hat keine. */
    const deutsch = [];
    const lauf = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let knoten; (knoten = lauf.nextNode()); ) {
      const text = knoten.textContent.trim();
      if (!text || !/[äöüßÄÖÜ]/.test(text)) continue;
      if (eigennamen.test(text)) continue;
      const el = knoten.parentElement;
      if (!el || !el.offsetParent) continue;
      if (el.closest('[lang="de"]')) continue;
      deutsch.push(text.slice(0, 44));
    }

    return {
      lang: document.documentElement.lang,
      alternativen,
      wechsel: [...new Set(wechsel)],
      rueckweg,
      deutsch: [...new Set(deutsch)],
    };
  }, EIGENNAMEN.source);

  stand.set(pfad, daten);
}

/** Adresse zu Pfad, damit sich die Angaben gegeneinander prüfen lassen. */
const alsPfad = (adresse) => {
  try {
    return new URL(adresse).pathname.replace(/\/$/, "") || "/";
  } catch {
    return adresse;
  }
};

for (const [pfad, daten] of stand) {
  const englisch = pfad === "/en" || pfad.startsWith("/en/");
  const erwartet = englisch ? "en" : "de";
  if (daten.lang !== erwartet) {
    funde.push(`${pfad}: <html lang="${daten.lang}">, erwartet "${erwartet}"`);
  }

  if (NUR_DEUTSCH.includes(pfad)) {
    // Kein hreflang — es gibt keine Gegenfassung. Aber ein Weg zurück.
    if (Object.keys(daten.alternativen).length > 0) {
      funde.push(`${pfad}: nennt eine Gegenfassung, die es nicht gibt`);
    }
    if (!daten.rueckweg) {
      funde.push(
        `${pfad}: kein Weg zurück nach /en. Wer aus der englischen Fassung ` +
          `hierher klickt, sitzt sonst in der deutschen fest.`,
      );
    }
    continue;
  }

  const de = daten.alternativen.de;
  const en = daten.alternativen.en;
  const standard = daten.alternativen["x-default"];

  if (!de || !en) {
    funde.push(`${pfad}: hreflang unvollständig (de=${de ?? "-"}, en=${en ?? "-"})`);
    continue;
  }
  if (standard !== de) {
    funde.push(`${pfad}: x-default zeigt auf ${standard ?? "-"}, die deutsche Fassung ist ${de}`);
  }

  /* Die eigene Seite muss unter ihrer Sprache stehen — sonst zeigt die
     Angabe an ihr vorbei. */
  const selbst = englisch ? en : de;
  if (alsPfad(selbst) !== pfad) {
    funde.push(`${pfad}: nennt sich selbst als ${alsPfad(selbst)}`);
  }

  /* Die Gegenfassung muss dieselben beiden Adressen nennen. Ein Paar, das
     nur in eine Richtung stimmt, wertet Google nicht aus. */
  const gegen = alsPfad(englisch ? de : en);
  const gegenstand = stand.get(gegen);
  if (!gegenstand) {
    funde.push(`${pfad}: Gegenfassung ${gegen} gibt es nicht`);
  } else if (gegenstand.alternativen.de !== de || gegenstand.alternativen.en !== en) {
    funde.push(
      `${pfad} und ${gegen} nennen verschiedene Paare: ` +
        `hier de=${alsPfad(de)}/en=${alsPfad(en)}, dort ` +
        `de=${alsPfad(gegenstand.alternativen.de ?? "-")}/en=${alsPfad(gegenstand.alternativen.en ?? "-")}`,
    );
  }

  /* Und der sichtbare Wechsel führt dorthin, wo hreflang hinzeigt. */
  if (daten.wechsel.length === 0) {
    funde.push(`${pfad}: kein sichtbarer Sprachwechsel`);
  } else if (!daten.wechsel.some((z) => alsPfad(z) === gegen)) {
    funde.push(
      `${pfad}: der Sprachwechsel führt nach ${daten.wechsel.join(", ")}, ` +
        `hreflang nennt ${gegen}`,
    );
  }

  if (englisch && daten.deutsch.length > 0) {
    funde.push(
      `${pfad}: deutscher Text ohne lang="de" — ` +
        daten.deutsch.map((t) => `„${t}"`).join(", "),
    );
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Stelle bindet die Sprachfassungen nicht sauber:\n`);
  for (const f of funde) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `Beide Sprachfassungen hängen zusammen: ${stand.size} Seiten geprüft, ` +
    `hreflang wechselseitig, Sprachwechsel deckungsgleich.`,
);
