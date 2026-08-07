#!/usr/bin/env node
/**
 * Prüft, dass die ausgelieferte Seite die Schutz-Kopfzeilen wirklich trägt.
 *
 * `vercel.json` schreibt acht davon vor, darunter eine Content-Security-Policy,
 * die alles außer dem eigenen Ursprung verbietet, und HSTS mit zwei Jahren und
 * `preload`. Nur: Diese Datei wird vom Bau nicht gelesen und vom örtlichen
 * Server nicht angewandt. `npm run build` ist grün, wenn sie fehlt, wenn ein
 * Tippfehler in einem Schlüssel steht und wenn jemand die Werte über die
 * Weboberfläche von Vercel überschreibt. Gemessen wird die Wirkung erst an der
 * Antwort, die ein Besucher bekommt.
 *
 * Der Lauf liest die Vorgabe aus `vercel.json` und stellt sie gegen die
 * Antwort der Live-Adresse — Wert für Wert, nicht nur „vorhanden".
 *
 * Er misst damit den Stand, der gerade ausgeliefert wird, nicht den des
 * Arbeitsbaums. Läuft er unmittelbar nach einem Push, gehört die Antwort noch
 * zur vorherigen Auslieferung; die Kopfzeilen ändern sich aber nur mit
 * `vercel.json`, und dann fällt genau das auf.
 *
 * Aufruf:
 *
 *   npm run check:headers
 *   node scripts/check-headers.mjs https://eine-vorschau.vercel.app
 */

import { readFileSync } from "node:fs";
import { FEHLERSEITEN } from "./lib/built-pages.mjs";

const basis = (process.argv[2] ?? "https://domenicmoran.de").replace(/\/$/, "");

const vorgabe = JSON.parse(readFileSync("vercel.json", "utf8"));
const fuerAlles = vorgabe.headers?.find((e) => e.source === "/(.*)")?.headers;

if (!fuerAlles?.length) {
  console.error("vercel.json enthält keinen Kopfzeilen-Block für /(.*).");
  process.exit(1);
}

/*
   Drei Adressen, weil sie auf verschiedenen Wegen entstehen: eine vorgerenderte
   Seite, eine dynamisch gerenderte (die 404 liest die Sprache aus einer
   Kopfzeile) und eine statische Datei. Eine Regel, die nur für den ersten Weg
   greift, sähe sonst vollständig aus.
*/
const adressen = ["/", "/en", FEHLERSEITEN[0], "/robots.txt"];

/* Der Statuscode gehört zur Antwort wie die Kopfzeilen.

   Geprüft war an der Fehlerseite bisher, was auf ihr steht: dass sie
   zugänglich ist, dass sie druckt, dass sie in der Sprache antwortet, unter
   der jemand gekommen ist. Womit sie antwortet, prüfte niemand.

   Eine Fehlerseite, die mit 200 ausgeliefert wird, ist der Fehler, den man
   nicht sieht: Im Browser steht dieselbe Seite, und ein Mensch merkt nichts.
   Eine Suchmaschine merkt es sofort und nimmt jede erfundene Adresse als
   gültige Seite in den Index — mit dem Titel „Diese Seite gibt es nicht“.
   Die 404 ist hier ausserdem die einzige Route, die bei der Anfrage entsteht,
   also die einzige, deren Status überhaupt von Code abhängt. */
const ERWARTETER_STATUS = {
  "/": 200,
  "/en": 200,
  [FEHLERSEITEN[0]]: 404,
  "/robots.txt": 200,
};

const funde = [];
let geprueft = 0;

for (const pfad of adressen) {
  let antwort;
  try {
    antwort = await fetch(`${basis}${pfad}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
  } catch (fehler) {
    console.error(`${basis}${pfad} ist nicht erreichbar: ${fehler.message}`);
    process.exit(1);
  }

  const sollStatus = ERWARTETER_STATUS[pfad];
  if (sollStatus !== undefined && antwort.status !== sollStatus) {
    funde.push(
      `${pfad}: HTTP ${antwort.status} statt ${sollStatus}` +
        (sollStatus === 404
          ? `\n        Eine Fehlerseite mit ${antwort.status} sieht im Browser richtig aus` +
            `\n        und wird von Suchmaschinen als gültige Seite indexiert.`
          : ""),
    );
  }

  for (const { key, value } of fuerAlles) {
    const ist = antwort.headers.get(key);
    if (ist === null) funde.push(`${pfad}: ${key} fehlt`);
    else if (ist.trim() !== value.trim()) {
      funde.push(
        `${pfad}: ${key}\n        vorgegeben: ${value}\n        geliefert:  ${ist}`,
      );
    }
    geprueft++;
  }
}

/*
   Die Zwischenspeicher-Regeln, an je einer Datei ihrer Art.

   Sie stehen in `vercel.json` als eigene Blöcke mit einem regulären Ausdruck
   als Quelle, und ein Ausdruck, der auf nichts passt, fällt genauso wenig auf
   wie ein fehlender Block: Die Antwort trägt dann still die Voreinstellung
   `max-age=0, must-revalidate`. Genau die stand bis zum 03.08.2026 auf jeder
   Datei unter `public/`, auch auf dem Porträt und den Bildschirmfotos.

   Geprüft wird je Block eine Beispieldatei. Mehr wäre Aufwand ohne Erkenntnis:
   Passt der Ausdruck für eine `.jpg`, passt er für alle.
*/
let zwischenspeicher = 0;
const KANDIDATEN = ["/portrait-dark.jpg", "/domenic-moran-kurzprofil.pdf"];

for (const block of vorgabe.headers ?? []) {
  if (block.source === "/(.*)" || block.source.startsWith("/api/")) continue;

  /* Der Ausdruck aus der Datei entscheidet, welche Beispieldatei gemeint ist —
     eine zweite Liste mit denselben Mustern waere die Stelle, an der beide
     auseinanderlaufen. */
  const muster = new RegExp("^" + block.source + "$");
  const beispiel = KANDIDATEN.find((k) => muster.test(k));
  if (!beispiel) {
    funde.push(
      `Kein Beispiel fuer ${block.source} — Kandidaten: ${KANDIDATEN.join(", ")}`,
    );
    continue;
  }

  zwischenspeicher++;
  const antwort = await fetch(`${basis}${beispiel}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  for (const { key, value } of block.headers) {
    const ist = antwort.headers.get(key);
    geprueft++;
    if (ist === null) funde.push(`${beispiel}: ${key} fehlt`);
    else if (ist.trim() !== value.trim()) {
      funde.push(
        `${beispiel}: ${key}` +
          `
        vorgegeben: ${value}` +
          `
        geliefert:  ${ist}`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Weiterleitungen, gemessen statt behauptet

   `check:links` prüft ihre Ziele und ihre Kennzeichnung in der Datei, mehr
   kann es nicht: Weiterleitungen entstehen bei Vercel und nicht beim Bau. Was
   dabei herauskommt, sieht nur, wer die Live-Adresse fragt — und genau das
   tut dieser Lauf ohnehin.

   Gemessen wurden alle sieben mit 307 statt 308, weil `permanent` fehlte.
   Aufgefallen ist das keinem Lauf, sondern erst beim Hinsehen. */
let umleitungen = 0;
for (const w of vorgabe.redirects ?? []) {
  const antwort = await fetch(`${basis}${w.source}`, {
    redirect: "manual",
  }).catch(() => null);
  umleitungen++;
  const erwartet = w.permanent === true ? 308 : 307;
  if (!antwort) {
    funde.push(`${w.source}: keine Antwort`);
    continue;
  }
  if (antwort.status !== erwartet) {
    funde.push(
      `${w.source}: antwortet mit ${antwort.status}, erwartet ${erwartet}`,
    );
    continue;
  }
  /* Vercel antwortet mit einer relativen Adresse, HTTP erlaubt beides.
     Verglichen wird deshalb aufgelöst und nicht als Zeichenkette. */
  const ziel = new URL(antwort.headers.get("location") ?? "", basis).href;
  const soll = new URL(w.destination, basis).href;
  if (ziel !== soll) {
    funde.push(`${w.source}: zeigt auf ${ziel}, vorgegeben ist ${soll}`);
  }
}

/* ---------------------------------------------------------------------------
   Nichts nimmt Eingaben entgegen — auch nicht dem Statuscode nach.

   Die Datenschutzerklärung sagt: „Es gibt keinen Endpunkt, der Eingaben
   entgegennimmt." Gemessen am 08.08.2026 stimmte das für den Inhalt und
   nicht für die Antwort: `POST /` und `POST /impressum` gaben richtig 405,
   aber `POST /api/kontakt` und jede andere unbekannte Adresse gaben **200** —
   dieselbe Fehlerseite wie bei `GET`, nur mit dem Statuscode für Erfolg.

   Verarbeitet wurde nichts. Gelesen wird es trotzdem falsch: Wer eine Seite
   abklopft, sieht auf `POST /api/kontakt` eine 200 und schließt daraus, dass
   dort etwas zuhört.

   Geprüft werden drei Adressen mit drei sendenden Methoden: die Startseite,
   eine Rechtsseite und eine erfundene Adresse unter `/api`, die es nie gab
   und die ein Prüfwerkzeug als Erstes probiert.
   ------------------------------------------------------------------------ */
const SENDENDE_METHODEN = ["POST", "PUT", "PATCH", "DELETE"];
const ABGEKLOPFT = ["/", "/impressum", "/api/kontakt"];
let methodenGeprueft = 0;

for (const pfad of ABGEKLOPFT) {
  for (const methode of SENDENDE_METHODEN) {
    methodenGeprueft++;
    const antwort = await fetch(`${basis}${pfad}`, {
      method: methode,
      redirect: "manual",
    });
    if (antwort.status !== 405) {
      funde.push(
        `${methode} ${pfad}: HTTP ${antwort.status} statt 405. Die ` +
          `Datenschutzerklärung sagt zu, dass kein Endpunkt Eingaben ` +
          `entgegennimmt; eine 200 liest sich als das Gegenteil.`,
      );
    }
  }
}

/* Die Sprache der Fehlerseite folgt dem Pfad, nicht der Anfrage.

   `proxy.ts` setzt `x-sprache` unter `/en` und loescht sie sonst. Bis zum
   08.08.2026 loeschte es nicht: Gemessen an der ausgelieferten Seite kam
   `GET /gibt-es-nicht` mit `x-sprache: en` als englische Fehlerseite samt
   `lang="en"` auf einer deutschen Adresse heraus.

   Einschleusen laesst sich darueber nichts, und wer die Kopfzeile schickt,
   taeuscht nur sich selbst. Die Fehlerseite behandelt den Wert aber als
   Tatsache ueber die Anfrage — und eine Tatsache ueber die Anfrage darf nicht
   aus der Anfrage stammen.

   Geprueft wird in beide Richtungen: Die deutsche Adresse bleibt deutsch,
   auch wenn `en` mitkommt, und die englische bleibt englisch, auch wenn `de`
   mitkommt. */
let sprachGeprueft = 0;
for (const [pfad, mitgeschickt, erwartet] of [
  [FEHLERSEITEN[0], "en", "de"],
  [FEHLERSEITEN[1], "de", "en"],
]) {
  let antwort;
  try {
    antwort = await fetch(`${basis}${pfad}`, {
      headers: { "x-sprache": mitgeschickt },
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
  } catch (fehler) {
    funde.push(`${pfad} mit x-sprache: ${fehler.message}`);
    continue;
  }
  sprachGeprueft++;
  const html = await antwort.text();
  const ist = /<html[^>]+lang="([^"]+)"/.exec(html)?.[1] ?? "keine Angabe";
  if (ist !== erwartet) {
    funde.push(
      `${pfad} mit x-sprache: ${mitgeschickt} antwortet in ${ist}, ` +
        `erwartet ${erwartet} — der Pfad entscheidet, nicht die Anfrage.`,
    );
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Abweichung(en) bei den Schutz-Kopfzeilen:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nvercel.json schreibt sie vor. Entweder ist die Auslieferung nicht auf ` +
      `dem Stand der Datei, oder jemand hat sie an Vercel vorbei geändert.`,
  );
  process.exit(1);
}

const statusGeprueft = Object.keys(ERWARTETER_STATUS).length;

console.log(
  `Alle ${fuerAlles.length} Schutz-Kopfzeilen, ${zwischenspeicher} ` +
    `Zwischenspeicher-Regeln und ${umleitungen} Weiterleitungen stimmen: ` +
    `${geprueft + umleitungen + statusGeprueft + methodenGeprueft + sprachGeprueft} Prüfungen auf ${basis}. ` +
    `Die unbekannte Adresse antwortet mit 404, nicht mit 200, keine ` +
    `sendende Methode kommt über 405 hinaus, und ihre Sprache folgt dem Pfad ` +
    `auch dann, wenn die Anfrage etwas anderes behauptet.`,
);
