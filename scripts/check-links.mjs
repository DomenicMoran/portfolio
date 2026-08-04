#!/usr/bin/env node
/**
 * Prüft, dass kein Verweis der Seite ins Leere zeigt.
 *
 * Zwei Sorten von totem Verweis, beide unsichtbar:
 *
 * 1. **Ein Anker ohne Ziel.** `href="#hire"` auf einer Seite ohne `id="hire"`
 *    springt nirgendwohin — der Browser meldet nichts, die Adresse ändert
 *    sich, und der Leser bleibt stehen. Das trifft die Kopfleiste, die
 *    Fußzeile, die 404-Seite und seit heute die sechs Belegverweise im
 *    Recruiter-Bereich.
 * 2. **Eine interne Adresse ohne Route.** `/artikel/falscher-slug` beantwortet
 *    Next mit der 404-Seite, und die sieht niemand, der den Verweis nur
 *    einbaut.
 *
 * Gemessen wird an der ausgelieferten Seite, nicht am Quelltext: Ein Verweis,
 * der aus einer Inhaltsdatei zusammengesetzt wird, existiert erst dort.
 *
 * Äußere Adressen bleiben draußen. Die prüft `check-figures.mjs` dort, wo sie
 * herkommen, und ein Lauf, der bei jedem Netzwackler rot wird, wird ignoriert.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:links
 */

import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Jede gebaute Seite, ohne die Bau-Interna. */
const pfade = gebauteSeiten();

/*
  Dazu die 404, über zwei erfundene Adressen.

  Sie liegt als `_not-found` im Bau und fällt damit durch das Filter, das
  Bau-Interna auslässt — geprüft hat sie hier deshalb niemand. Dabei ist sie
  die Seite mit der höchsten Wahrscheinlichkeit für einen toten Verweis: Sie
  zeigt auf sieben Sprungmarken der Startseite, auf beide Rechtsseiten und auf
  die andere Sprachfassung, und sie wird bei keiner Inhaltsänderung
  mitgedacht. Ändert sich eine Abschnittskennung, springt sie ins Leere, und
  auffallen würde das erst jemandem, der sich vertippt hat.

  Zwei Adressen, weil es zwei Antworten sind: Unterhalb von `/en` rendert die
  Seite englischen Text und verweist auf die englischen Ziele.
*/
pfade.push("/diese-adresse-gibt-es-nicht", "/en/this-address-does-not-exist");

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];
let anker = 0;
/** Die im Kopf angemeldeten Nebendateien, je einmal geprüft. */
const nebendateien = [];
const kopfGesehen = new Set();
let nebenzeilen = 0;
let bilder = 0;
let adressen = 0;
const gesehen = new Map();

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, {
    waitUntil: "networkidle",
  });
  if (!antwort || antwort.status() >= 500) continue;

  /*
     Erst durchscrollen: Abschnitte, die auf das Hineinscrollen warten, hängen
     ihre Verweise sonst gar nicht ein, und der Lauf prüfte die halbe Seite.
  */
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });

  const ergebnis = await seite.evaluate(() => {
    const ziele = [...document.querySelectorAll("a[href]")].map((a) =>
      a.getAttribute("href"),
    );
    const ohneZiel = [
      ...new Set(
        ziele
          .filter((h) => h.startsWith("#") && h.length > 1)
          .map((h) => h.slice(1)),
      ),
    ].filter((id) => !document.getElementById(id));
    const intern = [
      ...new Set(ziele.filter((h) => h.startsWith("/") && !h.startsWith("//"))),
    ];
    return {
      ohneZiel,
      intern,
      gesamt: ziele.length,
      bilder: document.querySelectorAll("img").length,
    };
  });

  /*
     Bilder, die nichts zeigen.

     Ein `img` mit falschem Pfad rendert einen leeren Kasten: kein Fehler im
     Bau, keine Meldung, und der Verweis-Lauf sah es nicht, weil er nur `a`
     zählt. Aufgefallen ist die Lücke, als die elf Produktaufnahmen von PNG
     auf WebP wechselten — hätte ich einen Pfad falsch geschrieben, wäre die
     Fallstudie mit leeren Rahmen online gegangen und jeder Lauf grün
     geblieben.

     `naturalWidth === 0` heißt: geladen wurde nichts. Der Lauf wartet vorher
     auf `networkidle` und scrollt durch, verzögerte Bilder sind also da.
  */
  const leere = await seite.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((bild) => bild.naturalWidth === 0)
      .map((bild) => bild.getAttribute("src")?.slice(0, 70) ?? "(ohne src)"),
  );
  for (const quelle of leere)
    funde.push(`${pfad}: Bild ohne Inhalt — ${quelle}`);
  bilder += ergebnis.bilder ?? 0;

  /* Die Kopfzeilen dieser Seite, für die Prüfung weiter unten. Gesammelt
     statt sofort geprüft: Dieselbe Datei ist auf zwanzig Seiten angemeldet,
     und zwanzigmal dieselbe Antwort abzurufen kostet nur Zeit. */
  const kopf = await seite.evaluate(() =>
    [...document.querySelectorAll("link[rel=alternate], link[rel=author]")]
      .map((l) => ({
        rel: l.getAttribute("rel"),
        href: l.getAttribute("href"),
        type: l.getAttribute("type"),
        sprache: l.getAttribute("hreflang"),
      }))
      /* Nur eigene Adressen. Die Metadaten schreiben sie absolut mit der
         Produktionsdomain, das Dokumentgerüst relativ — beide gehören hierher,
         eine fremde Domain nicht. Geprüft wird gegen das Attribut und nicht
         gegen die Eigenschaft `href`: Die ist im Browser immer absolut und
         aufgelöst gegen den Testserver, womit der Vergleich nichts mehr
         aussagt. */
      .filter(
        (l) =>
          l.href?.startsWith("/") ||
          l.href?.startsWith("https://domenicmoran.de/"),
      )
      .map((l) => ({
        ...l,
        href: l.href.replace("https://domenicmoran.de", ""),
      })),
  );
  /* Zweimal dieselbe Anmeldung ist so schlecht wie keine: Der Leser zeigt den
     Feed dann doppelt an. Gemessen stand er eine Runde lang zweimal auf jeder
     Seite — einmal aus den Metadaten, einmal aus dem Dokumentgerüst —, weil
     die erste Anmeldung bei der Suche nach "rss" nicht auffiel.

     Verglichen wird die Adresse und nicht der Medientyp: humans.txt und
     llms.txt sind beide `text/plain` und stehen zu Recht nebeneinander, und
     die Sprachvarianten tragen überhaupt keinen. Die Sprache gehört in den
     Schlüssel: `hreflang="de"` und `hreflang="x-default"` zeigen richtigerweise
     auf dieselbe Adresse. */
  const jeAdresse = new Map();
  for (const eintrag of kopf) {
    const schluessel = `${eintrag.rel}|${eintrag.sprache ?? ""}|${eintrag.href}`;
    jeAdresse.set(schluessel, (jeAdresse.get(schluessel) ?? 0) + 1);
  }
  for (const [schluessel, anzahl] of jeAdresse) {
    if (anzahl > 1)
      funde.push(`${pfad}: ${anzahl} Anmeldungen für ${schluessel}`);
  }

  /* Je Adresse und Medientyp einmal abrufen, nicht je Seite: Dieselbe Datei
     ist auf zwanzig Seiten angemeldet. */
  for (const eintrag of kopf) {
    const schluessel = `${eintrag.href}|${eintrag.type}`;
    if (kopfGesehen.has(schluessel)) continue;
    kopfGesehen.add(schluessel);
    nebendateien.push([pfad, [eintrag]]);
  }

  /* Die Vorschaukarte ist ein Verweis wie jeder andere, nur sieht ihn niemand
     auf der Seite.

     Sie erscheint erst beim Teilen — in LinkedIn, Slack, WhatsApp —, und wenn
     sie fehlt, merkt das ausgerechnet der, dem man den Link geschickt hat.
     Gemessen an der ausgelieferten Seite trugen sechs Seiten kein `og:image`:
     Artikelübersicht, Kurzprofil und die beiden Rechtsseiten, dazu die
     englischen Entsprechungen. Alle sechs setzen ihr `openGraph` selbst, und
     Next ersetzt das geerbte Objekt, statt es zu mischen. */
  const vorschau = await seite.evaluate(() =>
    [...document.querySelectorAll("meta[property='og:image']")].map((m) =>
      m.getAttribute("content"),
    ),
  );
  if (!vorschau.length) {
    funde.push(`${pfad}: keine Vorschaukarte (og:image)`);
  }
  for (const adresse of vorschau) {
    const ohneDomain = (adresse ?? "").replace("https://domenicmoran.de", "");
    if (!ohneDomain.startsWith("/")) continue;
    if (gesehen.has(ohneDomain)) continue;
    const status = (await seite.request.get(`${basis}${ohneDomain}`)).status();
    gesehen.set(ohneDomain, status);
    adressen++;
    if (status >= 400) {
      funde.push(
        `${pfad}: Vorschaukarte ${ohneDomain} antwortet mit ${status}`,
      );
    }
  }

  /* Und er muss überall stehen: Auf den Seiten, die ihr `alternates` selbst
     setzen, fiel er ersatzlos weg, weil Next das geerbte Objekt ersetzt statt
     es zu mischen. Gemessen betraf das Kurzprofil, Impressum und
     Datenschutz — also drei der zwanzig Seiten. */
  const istNichtGefunden = /adresse|address/.test(pfad);
  if (
    !istNichtGefunden &&
    !kopf.some((e) => e.type === "application/atom+xml")
  ) {
    funde.push(`${pfad}: meldet keinen Artikel-Feed an`);
  }

  anker += ergebnis.gesamt;
  for (const id of ergebnis.ohneZiel)
    funde.push(`${pfad}: Anker #${id} hat kein Ziel`);

  for (const adresse of ergebnis.intern) {
    /* Dateien mit Endung (PDF, Feed, Bilder) beantwortet der Server direkt. */
    const ohneAnker = adresse.split("#")[0] || "/";
    if (gesehen.has(ohneAnker)) continue;
    const status = (await seite.request.get(`${basis}${ohneAnker}`)).status();
    gesehen.set(ohneAnker, status);
    adressen++;
    if (status >= 400)
      funde.push(`${pfad}: ${ohneAnker} antwortet mit ${status}`);
  }
}

/* ---------------------------------------------------------------------------
   Die angemeldeten Nebendateien

   Feed, humans.txt, llms.txt: Jede meldet sich im Kopf mit `rel` und einem
   Medientyp an, und beides ist eine Behauptung. Der Medientyp ist die
   gefährlichere von beiden — ein falsches Ziel merkt der Leser sofort, einen
   falschen Typ glaubt ihm der Reader.

   Gemessen: Der Artikel-Feed wurde als `application/rss+xml` angemeldet und
   antwortet als `application/atom+xml`. Beide Fassungen, jede Seite.

   Verglichen wird deshalb gegen die Antwort des Servers und nicht gegen eine
   Liste erlaubter Typen: Die Liste wäre die nächste Stelle, an der etwas
   veraltet. */
for (const [pfad, angemeldet] of nebendateien) {
  for (const eintrag of angemeldet) {
    nebenzeilen++;
    const antwort = await fetch(`${basis}${eintrag.href}`).catch(() => null);
    if (!antwort || antwort.status !== 200) {
      funde.push(
        `${pfad}: angemeldet als ${eintrag.rel} zeigt auf ${eintrag.href}, ` +
          `und das antwortet mit ${antwort ? antwort.status : "gar nicht"}`,
      );
      continue;
    }
    const geliefert = (antwort.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim();
    if (eintrag.type && geliefert && eintrag.type !== geliefert) {
      funde.push(
        `${pfad}: ${eintrag.href} ist angemeldet als ${eintrag.type}, ` +
          `geliefert wird ${geliefert}`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Veröffentlichte Adressen bleiben erreichbar

   Ein Artikel wird geteilt: in einer Nachricht, in einem Beitrag, in einer
   Bewerbung. Diese Adresse gehört danach nicht mehr dem Repository — sie
   liegt in fremden Postfächern und Lesezeichen. Ändert jemand den Slug, weil
   die Überschrift besser klingt, stirbt der geteilte Verweis lautlos: keine
   Warnung, kein roter Lauf, nur eine 404 bei jemandem, der etwas lesen
   wollte.

   Die Liste ist deshalb keine Ableitung aus dem Inhalt, sondern eine
   Festlegung: Was hier steht, war einmal veröffentlicht. Fällt eine Adresse
   weg, verlangt der Lauf eine Weiterleitung in `vercel.json` — dieselbe
   Antwort, die auch `/cv` und `/blog` bekommen. */
const VEROEFFENTLICHT = [
  "/artikel/kassensichv-in-der-praxis",
  "/artikel/published-ist-kein-beleg",
  "/artikel/gestrichelter-kreis-kam-nicht-aus-der-schrift",
  "/artikel/kleineres-whisper-modell",
  "/artikel/widget-leer-trotz-gruener-tests",
  "/en/articles/german-till-law-in-practice",
  "/en/articles/published-is-not-proof",
  "/en/articles/the-dotted-circle-was-not-the-font",
  "/en/articles/a-smaller-whisper-model",
  "/en/articles/green-tests-empty-widget",
  "/artikel",
  "/en/articles",
  "/onepager",
  "/en/onepager",
  "/impressum",
  "/datenschutz",
  "/artikel/feed.xml",
  "/en/articles/feed.xml",
  "/domenic-moran-kurzprofil.pdf",
  "/domenic-moran-one-pager.pdf",
];

let veroeffentlicht = 0;
for (const adresse of VEROEFFENTLICHT) {
  veroeffentlicht++;
  const antwort = await fetch(`${basis}${adresse}`).catch(() => null);
  if (!antwort || antwort.status !== 200) {
    funde.push(
      `${adresse} war veröffentlicht und antwortet jetzt mit ` +
        `${antwort ? antwort.status : "gar nicht"}. Wer sie geteilt hat, ` +
        `landet auf der Fehlerseite — eine Weiterleitung in vercel.json hält ` +
        `den Verweis am Leben.`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Die Abkürzungen aus vercel.json

   `/cv`, `/blog`, `/en/resume` — Adressen, die niemand verlinkt und die
   trotzdem jemand tippt. Sie stehen als Weiterleitung in `vercel.json`, und
   genau deshalb sieht sie kein Lauf an: Der Bau liest die Datei nicht, und
   die gebauten Seiten verweisen nicht darauf.

   Verschiebt jemand `/onepager`, zeigen sie ins Leere, und gemerkt wird das
   erst, wenn ein Recruiter auf der 404 landet. Geprüft wird deshalb das
   Ziel: Es muss eine Seite sein, die es wirklich gibt. Die Weiterleitung
   selbst kann hier nicht getestet werden — sie entsteht erst bei Vercel. */
const weiterleitungen =
  JSON.parse(readFileSync("vercel.json", "utf8")).redirects ?? [];
let ziele = 0;

/* Die Anker der Ziele, aus dem, was oben ohnehin gelesen wurde. */
const ankerJeSeite = new Map();

for (const w of weiterleitungen) {
  const [ziel, anker] = w.destination.split("#");
  ziele++;

  /* Ein Ziel mit Anker ist zwei Zusagen, und die zweite prüfte niemand.
     `/kontakt` zeigt auf `/#contact`; verschwindet die `id`, landet der
     Besucher stumm am Seitenanfang und sucht selbst. */
  if (anker) {
    const seite = ziel || "/";
    if (!ankerJeSeite.has(seite)) {
      const html = await (await fetch(`${basis}${seite}`)).text();
      ankerJeSeite.set(
        seite,
        new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
      );
    }
    if (!ankerJeSeite.get(seite).has(anker)) {
      funde.push(
        `vercel.json: ${w.source} zeigt auf ${w.destination}, ` +
          `und ${seite} hat kein Element mit id="${anker}"`,
      );
    }
  }

  /* Dauerhaft heisst 308, nicht 307.
     Ohne `permanent` antwortet Vercel mit 307 — gemessen an allen sieben
     Weiterleitungen, die es gab. 307 sagt "vorübergehend": Suchmaschinen
     lassen die alte Adresse stehen, Browser fragen jedes Mal neu. Bei /cv und
     /lebenslauf ist daran nichts vorübergehend. */
  if (w.permanent !== true) {
    funde.push(
      `vercel.json: ${w.source} ist nicht als dauerhaft gekennzeichnet, ` +
        `Vercel antwortet dann mit 307 statt 308`,
    );
  }
  const antwort = await fetch(`${basis}${ziel}`).catch(() => null);
  if (!antwort || antwort.status !== 200) {
    funde.push(
      `vercel.json: ${w.source} zeigt auf ${w.destination}, ` +
        `und das antwortet mit ${antwort ? antwort.status : "gar nicht"}`,
    );
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  /* "2 toter Verweise" stand hier, und ab jetzt wäre selbst die richtige
     Beugung falsch: Der Lauf findet auch Medientypen, die nicht zur
     Antwort passen, und das ist kein toter Verweis. */
  console.error(`${funde.length} Befund${funde.length === 1 ? "" : "e"}:\n`);
  for (const f of funde) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `Kein toter Verweis: ${anker} Verweise auf ${pfade.length} Seiten, ` +
    `${adressen} interne Adressen abgerufen, ${bilder} Bilder mit Inhalt, ` +
    `${ziele} Weiterleitungen aus vercel.json mit erreichbarem Ziel, ` +
    `${nebenzeilen} angemeldete Nebendateien mit passendem Medientyp, ` +
    `${veroeffentlicht} veröffentlichte Adressen weiterhin erreichbar.`,
);
