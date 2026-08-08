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
import { FEHLERSEITEN } from "./lib/built-pages.mjs";
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
pfade.push(...FEHLERSEITEN);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];

/* Was die Seite selbst in die Konsole schreibt.

   Kein Prüflauf sah bisher hin, und genau dort stand am 09.08.2026 auf beiden
   Startseiten ein React-Fehler 418: Die Gebetszeiten-Demo rechnete den
   heutigen Tag im Render, der Server am Bautag und der Browser beim Laden. Ab
   dem ersten Tag nach dem Bau lief beides auseinander, und jeder, der die
   Entwicklerkonsole öffnete — also genau der Leser, um den es hier geht —,
   sah einen Fehler auf einer Seite, die mit Nachweisbarkeit wirbt.

   Hier und nicht in einem eigenen Lauf: Dieser wartet ohnehin je Seite auf
   `networkidle` und scrollt durch, die Hydration ist also gelaufen. Gesammelt
   wird über alle Seiten, gemeldet am Ende zusammen mit den übrigen Befunden.

   Der Fehler dieser Sorte zeigt sich nur an einem Tag nach dem Bau: Wer heute
   baut und heute misst, sieht ihn nicht. Deshalb steht der Wächter hier und
   nicht nur die Behebung im Bauteil. */
const seitenfehler = [];
seite.on("pageerror", (fehler) => {
  seitenfehler.push(
    `${new URL(seite.url()).pathname}: ${String(fehler).slice(0, 110)}`,
  );
});

let sitemapzeilen = 0;
let anker = 0;
/** Die im Kopf angemeldeten Nebendateien, je einmal geprüft. */
const nebendateien = [];
const kopfGesehen = new Set();
let nebenzeilen = 0;
let bilder = 0;
let mailverweis = 0;
let elternpfade = 0;
let belegteSaetze = 0;
let sprachwechsel = 0;
let pdfverweise = 0;
let belegteFaehigkeiten = 0;
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

  /* Und die Karte muss sagen, wohin sie gehört.

     Dieselbe Ursache eine Ebene tiefer: Gemessen an den ausgelieferten Seiten
     trugen genau zwei von achtzehn ein `og:url` — die beiden Startseiten, die
     als einzige kein eigenes `openGraph` setzen. Wer einen Artikel auf
     LinkedIn stellt, teilt eine Adresse mit `?trk=…` daran; ohne `og:url` ist
     das für jeden Sammler die Kennung des Inhalts, und dieselbe Seite zerfällt
     in so viele Einträge, wie es Kanäle gibt.

     Verglichen wird gegen `canonical`, weil beide dasselbe sagen sollen und
     eine Seite mit zwei verschiedenen Selbstauskünften schlechter dran ist
     als eine ohne. */
  const kartenAdresse = await seite.evaluate(
    () =>
      document
        .querySelector("meta[property='og:url']")
        ?.getAttribute("content") ?? null,
  );
  const kanonisch = await seite.evaluate(
    () =>
      document.querySelector("link[rel='canonical']")?.getAttribute("href") ??
      null,
  );
  /* Ohne kanonische Adresse keine Kartenadresse.

     Die beiden Fehlerseiten tragen keine — ihre Adresse ist die, die jemand
     falsch getippt hat, und `noindex` steht ohnehin darüber. Eine Karte mit
     `og:url` auf eine Adresse, die es nicht gibt, wäre schlechter als keine.
     Die Bedingung ist deshalb an `canonical` gebunden und nicht an eine
     Ausnahmeliste, die beim nächsten Pfad veraltet. */
  if (!kartenAdresse && kanonisch) {
    funde.push(`${pfad}: Vorschaukarte ohne og:url`);
  } else if (kartenAdresse && kanonisch && kartenAdresse !== kanonisch) {
    funde.push(
      `${pfad}: og:url ${kartenAdresse} steht gegen canonical ${kanonisch}`,
    );
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
  "/artikel/gruen-lokal-rot-in-der-ci",
  "/artikel/kassensichv-in-der-praxis",
  "/artikel/published-ist-kein-beleg",
  "/artikel/gestrichelter-kreis-kam-nicht-aus-der-schrift",
  "/artikel/kleineres-whisper-modell",
  "/artikel/widget-leer-trotz-gruener-tests",
  "/en/articles/green-locally-red-in-ci",
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
   Die Feeds führen, was sie führen sollen

   Bisher stand nur ihre Adresse in der Liste oben, und die prüft ein HTTP 200.
   Das ist bei einem Feed die schwächste aller Aussagen: Ein leeres, ein
   veraltetes und ein vollständiges Atom-Dokument antworten alle mit 200.

   Abonnenten sind dabei der stillste Kanal dieser Seite. Wer über den Feed
   liest, kommt nie wieder vorbei, um nachzusehen, ob etwas fehlt — er hört
   einfach nichts mehr, und niemand meldet das zurück. Ein sechster Artikel,
   der es nicht in den Feed schafft, bleibt für diese Leser unsichtbar.

   Geprüft wird gegen die Artikel, die weiter oben ohnehin schon als
   veröffentlicht geführt werden: dieselbe Quelle, keine zweite Liste.
   ------------------------------------------------------------------------ */
{
  const FEEDS = [
    { pfad: "/artikel/feed.xml", praefix: "/artikel/", fremd: "/en/articles/" },
    {
      pfad: "/en/articles/feed.xml",
      praefix: "/en/articles/",
      fremd: "/artikel/",
    },
  ];

  for (const feed of FEEDS) {
    const antwort = await fetch(`${basis}${feed.pfad}`).catch(() => null);
    if (!antwort || antwort.status !== 200) continue; // oben schon gemeldet
    const xml = await antwort.text();

    const eintraege = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(
      (t) => t[1],
    );
    /* Die Artikel dieser Sprache aus der Liste oben, ohne die Übersicht. */
    const erwartet = VEROEFFENTLICHT.filter(
      (a) => a.startsWith(feed.praefix) && !a.endsWith("feed.xml"),
    );

    if (eintraege.length !== erwartet.length) {
      /* Die Meldung sagt, was zu tun ist.

         Sie nannte bis hierher nur die beiden Zahlen. Beim sechsten Artikel
         wurde die CI genau daran rot, und aus der Meldung ging nicht hervor,
         dass `VEROEFFENTLICHT` in dieser Datei die Liste ist, die nachzieht:
         Sie ist bewusst von Hand geführt, damit eine einmal veröffentlichte
         Adresse nicht stillschweigend verschwinden kann. Wer das nicht weiß,
         sucht im Feed-Erzeuger, und der ist in Ordnung. */
      const mehrImFeed = eintraege.length > erwartet.length;
      funde.push(
        `${feed.pfad}: ${eintraege.length} Einträge, aber ${erwartet.length} ` +
          `veröffentlichte Artikel. ` +
          (mehrImFeed
            ? `Ein neuer Artikel gehört in VEROEFFENTLICHT in dieser Datei — ` +
              `die Liste ist von Hand geführt, damit keine Adresse still ` +
              `verschwindet.`
            : `Wer den Feed abonniert hat, sieht die Differenz nie.`),
      );
    }

    for (const artikel of erwartet) {
      if (!xml.includes(artikel)) {
        funde.push(`${feed.pfad}: ${artikel} fehlt im Feed.`);
      }
    }

    /* Kein Eintrag der anderen Sprachfassung: Sonst bekommt ein englischer
       Leser deutsche Artikel ins Lesegerät, und zwar ohne es zu merken. */
    if (xml.includes(`${basis}${feed.fremd}`) || xml.includes(feed.fremd)) {
      funde.push(
        `${feed.pfad} führt Einträge aus ${feed.fremd} — die Sprachfassungen ` +
          `mischen sich im Lesegerät.`,
      );
    }

    /* Jeder Eintrag braucht Titel, Adresse und Datum. Ohne Datum sortiert
       ein Lesegerät nach Zufall, ohne Titel steht dort die Adresse. */
    for (const [i, eintrag] of eintraege.entries()) {
      for (const [feld, muster] of [
        ["Titel", /<title[^>]*>[\s\S]*?<\/title>/],
        ["Adresse", /<link[^>]*href="[^"]+"/],
        ["Datum", /<updated>[^<]+<\/updated>/],
      ]) {
        if (!muster.test(eintrag)) {
          funde.push(`${feed.pfad}: Eintrag ${i + 1} ohne ${feld}.`);
        }
      }
    }
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
/* Keine Weiterleitung zeigt auf eine andere Weiterleitung.

   Die Liste wächst mit jeder Runde, in der jemand eine Adresse ausprobiert
   und im Leeren landet — inzwischen 77 Regeln. Sobald ein Ziel selbst wieder
   eine Quelle ist, kostet jeder Aufruf zwei Umläufe statt einem, und
   Suchmaschinen werten eine Kette schlechter als einen Sprung. Im Quelltext
   sieht man es nicht: Die beiden Zeilen stehen dann zwanzig Einträge
   auseinander.

   Gemessen am 08.08.2026: keine Kette. Live nachgesehen springt jede Regel
   genau einmal — nur eine getippte Adresse mit Schrägstrich am Ende braucht
   zwei, und der erste Sprung ist Vercels eigene Normalisierung, keine
   Regel von hier. */
{
  const ziele = new Map(
    (JSON.parse(readFileSync("vercel.json", "utf8")).redirects ?? []).map(
      (w) => [w.source, w.destination],
    ),
  );
  for (const [quelle, ziel] of ziele) {
    const ohneAnker = ziel.split("#")[0];
    if (ziele.has(ohneAnker)) {
      funde.push(
        `vercel.json: ${quelle} zeigt auf ${ziel}, und das ist selbst eine ` +
          `Weiterleitung auf ${ziele.get(ohneAnker)} — zwei Sprünge statt einem`,
      );
    }
  }
}

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
  /* Ziele mit Platzhalter werden mit einem echten Wert geprüft.

     `/en/article/:slug` auf `/en/articles/:slug` fängt die Verwechslung von
     Einzahl und Mehrzahl für jeden Artikel auf einmal — der deutsche Pfad
     heißt `/artikel`, der englische `/en/articles`, und wer den einen kennt,
     schreibt den anderen falsch. Wörtlich abgerufen antwortet ein solches
     Ziel mit 404, weil `:slug` kein Pfad ist; der Lauf meldete es beim
     Einbau prompt.

     Eingesetzt wird der erste gebaute Artikel der jeweiligen Sprache. Damit
     prüft der Lauf, was die Regel wirklich erzeugt, statt sie zu übergehen. */
  const beispiel = (pfad) => {
    if (!pfad.includes(":")) return pfad;
    const englisch = pfad.startsWith("/en/");
    const muster = englisch ? /^\/en\/articles\/[^/]+$/ : /^\/artikel\/[^/]+$/;
    const echter = pfade.find((p) => muster.test(p));
    if (!echter) return null;
    return pfad.replace(/:[a-zA-Z]+/, echter.split("/").pop());
  };

  const gepruefteAdresse = beispiel(ziel);
  if (gepruefteAdresse === null) {
    funde.push(
      `vercel.json: ${w.source} zeigt auf ${w.destination}, und dafür gibt es ` +
        `keine gebaute Seite, an der sich der Platzhalter prüfen ließe`,
    );
  } else {
    const antwort = await fetch(`${basis}${gepruefteAdresse}`).catch(
      () => null,
    );
    if (!antwort || antwort.status !== 200) {
      funde.push(
        `vercel.json: ${w.source} zeigt auf ${w.destination}` +
          (gepruefteAdresse === ziel
            ? ""
            : ` (geprüft als ${gepruefteAdresse})`) +
          `, und das antwortet mit ${antwort ? antwort.status : "gar nicht"}`,
      );
    }
  }
}

/* ------------------------------------------------------------------
   Sitemap und `robots` müssen dasselbe sagen.

   Zwei Fehler gehören zusammen und fallen beide nicht auf:

   - Eine Seite, die indexiert werden soll, steht nicht in der Sitemap. Sie
     wird trotzdem gefunden, nur später und schlechter — und wer die Sitemap
     pflegt, merkt nichts, denn eine Auslassung sieht aus wie Absicht.
   - Eine Seite mit `noindex` steht in der Sitemap. Dann bittet die eine
     Datei um Aufnahme, was die andere verbietet. Suchmaschinen behandeln das
     als Widerspruch und melden es in ihren Werkzeugen.

   Gemessen zum Zeitpunkt des Einbaus: 18 gebaute Seiten, 14 in der Sitemap,
   und genau die vier fehlenden tragen `noindex` — Impressum, Datenschutz und
   die beiden One-Pager. Der Stand ist richtig, er stand nur nirgends fest.
------------------------------------------------------------------ */

{
  const sitemapAntwort = await fetch(`${basis}/sitemap.xml`);
  const sitemapText = await sitemapAntwort.text();
  const inSitemap = new Set(
    [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname.replace(/\/$/, ""),
    ),
  );

  const sitemapfunde = [];

  for (const pfad of pfade) {
    await seite.goto(`${basis}${pfad}`, { waitUntil: "domcontentloaded" });
    const robots = await seite.evaluate(
      () =>
        document
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content") ?? "",
    );
    const indexierbar = !/noindex/i.test(robots);
    const gelistet = inSitemap.has(pfad === "/" ? "" : pfad);

    if (indexierbar && !gelistet) {
      sitemapfunde.push(
        `${pfad}: indexierbar (robots „${robots || "ohne Angabe"}“), fehlt aber in der Sitemap`,
      );
    }
    if (!indexierbar && gelistet) {
      sitemapfunde.push(
        `${pfad}: steht in der Sitemap, trägt aber „${robots}“`,
      );
    }
  }

  /* Und der umgekehrte Weg: eine Adresse in der Sitemap, die es nicht gibt. */
  for (const eintrag of inSitemap) {
    const pfad = eintrag === "" ? "/" : eintrag;
    if (!pfade.includes(pfad)) {
      sitemapfunde.push(
        `${pfad}: steht in der Sitemap, wird aber nicht gebaut`,
      );
    }
  }

  for (const f of sitemapfunde) funde.push(f);
  sitemapzeilen = inSitemap.size;
}

/* Ein Verweis, der die Sprache wechselt, sagt es auch.

   Die Fußzeile der englischen Fassung führt auf die deutschen Rechtsseiten
   und trägt dafür `hreflang="de"`. Derselbe Wechsel findet in der
   Gegenrichtung statt: Auf beiden Rechtsseiten steht „Back to the English
   version". Gemessen an den 22 gebauten Seiten war das der einzige
   Sprachwechsel ohne Angabe.

   Es ist keine Kosmetik. Ein Vorleseprogramm entscheidet an `hreflang`, in
   welcher Aussprache es das Ziel ankündigt, und ein englischer Verweistext
   auf einer deutschen Seite ist genau der Fall, für den das Attribut da ist.

   Die Zuordnung ist streng am Pfad: Alles unter `/en` ist englisch, alles
   andere deutsch. Ein Anker wie `/en#work` bleibt damit innerhalb seiner
   Sprache — ein erster Anlauf ohne diese Unterscheidung meldete 108
   angebliche Wechsel, von denen 106 keine waren. */
{
  const seite = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  let wechsel = 0;

  for (const route of pfade) {
    const antwort = await seite.goto(`${basis}${route}`, {
      waitUntil: "domcontentloaded",
    });
    if (!antwort || antwort.status() >= 500) continue;

    const offen = await seite.evaluate(() => {
      const englisch = (pfad) => pfad === "/en" || pfad.startsWith("/en/");
      const hier = englisch(location.pathname);
      return (
        [...document.querySelectorAll('a[href^="/"]')]
          .map((a) => {
            const ziel = a.getAttribute("href").split("#")[0];
            return {
              ziel,
              wechselt: ziel !== "" && englisch(ziel) !== hier,
              sprache: a.getAttribute("hreflang"),
              text: a.textContent.trim().slice(0, 34),
            };
          })
          /* Dateien ohne Sprachpräfix sind sprachneutral: Das PDF heißt in
           beiden Fassungen anders und trägt seine Sprache im Namen. */
          .filter((x) => x.wechselt && !/\.[a-z0-9]+$/i.test(x.ziel))
      );
    });

    /* Und dieselbe Runde für das Kurzprofil.

       Es ist die Datei, die weitergereicht wird, und sie hängt an zwei
       Eigenschaften: `download`, damit sie sich sichern lässt statt sich in
       einem Betrachter zu öffnen, und der richtigen Sprachfassung. Beide
       waren schon einmal auseinander — der Kommentar in `CopyEmail.tsx` hält
       fest, dass zwei von drei Verweisen es anders hielten als der dritte.

       Geprüft war seither nur `/onepager` und `/en/onepager`, also zwei von
       zwanzig Verweisen. Die übrigen achtzehn stehen in der Fußzeile jeder
       Seite. */
    const blaetter = await seite.evaluate(() => {
      const englisch = (pfad) => pfad === "/en" || pfad.startsWith("/en/");
      const hier = englisch(location.pathname);
      return [...document.querySelectorAll('a[href$=".pdf"]')].map((a) => ({
        ziel: a.getAttribute("href"),
        laedt: a.hasAttribute("download"),
        text: a.textContent.trim().slice(0, 30),
        erwartetEnglisch: hier,
      }));
    });

    for (const b of blaetter) {
      pdfverweise++;
      if (!b.laedt) {
        funde.push(
          `${route}: „${b.text}" zeigt auf ${b.ziel} ohne download — die Datei ` +
            `öffnet sich im Betrachter statt sich zu sichern`,
        );
      }
      const istEnglisch = b.ziel.includes("one-pager");
      if (istEnglisch !== b.erwartetEnglisch) {
        funde.push(
          `${route}: „${b.text}" zeigt auf ${b.ziel}, also auf die andere ` +
            `Sprachfassung des Kurzprofils`,
        );
      }
    }

    for (const x of offen) {
      wechsel++;
      if (!x.sprache) {
        funde.push(
          `${route}: „${x.text}" führt nach ${x.ziel} und wechselt damit die ` +
            `Sprache, ohne hreflang`,
        );
      }
    }
  }

  sprachwechsel = wechsel;
  await seite.close();
}

/* Jede Behauptung im Recruiter-Bereich trägt ihren Beleg.

   Die Sektion heißt „Das Wichtigste in zwei Minuten" und besteht aus sechs
   Sätzen in der ersten Person: „Ich liefere fertig", „Ich weise nach, statt zu
   behaupten". Jeder davon endet an einem Verweis — auf eine Fallstudie, einen
   Artikel oder ein Repo. Das ist der ganze Unterschied zwischen dieser Seite
   und einem Anschreiben.

   Im Inhaltsmodell ist `proof` optional. Eine siebte Behauptung ohne Beleg
   ließe sich also in einer Minute hinzufügen, sähe im Quelltext unauffällig
   aus und stünde auf der Seite genau dort, wo der Leser Belege erwartet.
   Gemessen am 08.08.2026 tragen alle sechs je Sprachfassung einen.

   Geprüft wird an der ausgelieferten Seite und in beiden Sprachfassungen,
   samt gleicher Anzahl: Eine Behauptung, die nur eine Fassung kennt, ist
   dieselbe Lücke von der anderen Seite her. */
{
  const seite = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const jeSprache = [];

  for (const route of ["/", "/en"]) {
    const antwort = await seite.goto(`${basis}${route}`, {
      waitUntil: "networkidle",
    });
    if (antwort?.status() !== 200) continue;
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });

    const behauptungen = await seite.evaluate(() => {
      const s = document.getElementById("hire");
      if (!s) return null;
      return [...s.querySelectorAll("h3")].map((h) => {
        const karte = h.closest("li, div, article");
        return {
          satz: h.textContent.trim(),
          beleg: karte?.querySelector("a[href]")?.getAttribute("href") ?? null,
        };
      });
    });

    if (!behauptungen) {
      funde.push(`${route}: kein Recruiter-Bereich gefunden`);
      continue;
    }
    jeSprache.push(behauptungen.length);
    for (const b of behauptungen) {
      if (!b.beleg) {
        funde.push(
          `${route}: „${b.satz.slice(0, 50)}" steht ohne Beleg im ` +
            `Recruiter-Bereich`,
        );
      }
    }
    /* Und dieselbe Zusage eine Sektion weiter oben.

       Der Vorspann der Fähigkeiten sagt es ausdrücklich: „Hier stehen keine
       Prozentzahlen. Niemand kann prüfen, ob jemand TypeScript zu 93 Prozent
       beherrscht." Statt einer Zahl steht neben jeder Fähigkeit ein Beleg —
       „Expo SDK 57, RN 0.86, vier Geräteklassen" neben React Native. Auch
       dieses Feld ist im Inhaltsmodell optional; gemessen tragen heute alle
       24 je Sprachfassung einen. */
    const faehigkeiten = await seite.evaluate(() => {
      const s = document.getElementById("skills");
      if (!s) return [];
      return [...s.querySelectorAll("dt")].map((dt) => ({
        name: dt.textContent.trim(),
        beleg: (dt.nextElementSibling?.textContent ?? "").trim(),
      }));
    });
    for (const f of faehigkeiten) {
      belegteFaehigkeiten++;
      if (!f.beleg) {
        funde.push(`${route}: Die Fähigkeit „${f.name}" steht ohne Beleg`);
      }
    }
  }

  if (jeSprache.length === 2 && jeSprache[0] !== jeSprache[1]) {
    funde.push(
      `Der Recruiter-Bereich zeigt ${jeSprache[0]} Behauptungen auf Deutsch ` +
        `und ${jeSprache[1]} auf Englisch`,
    );
  }
  belegteSaetze = jeSprache.reduce((a, b) => a + b, 0);
  await seite.close();
}

/* Kein Elternpfad einer Seite führt ins Leere.

   Wer auf `/artikel/kassensichv-in-der-praxis` steht und die Adresse bis
   `/artikel` kürzt, tut das Naheliegende. Kein Verweis wäre tot, wenn dort
   nichts läge — diese Adressen entstehen nicht durch Klicken, sondern durch
   Tippen und Kürzen, und dieser Lauf sieht nur, worauf jemand zeigt.

   Hier ist gerade alles in Ordnung: 18 Seiten, drei Elternpfade, alle drei
   beantwortet. Im Prüfstand nebenan waren es vier verwaiste — /aufsagen,
   /aufsagen/folge, /quiz/folge und /quiz/kapitel —, gefunden mit derselben
   Rechnung. Was hier stimmt, stimmt nicht von selbst weiter: Ein neuer
   Abschnitt unter einer neuen Ebene bringt den Fall mit. */
{
  const seitenmenge = new Set(pfade);
  const umgeleitet = new Set(
    (JSON.parse(readFileSync("vercel.json", "utf8")).redirects ?? []).map(
      (w) => w.source,
    ),
  );
  const eltern = new Set();
  for (const seite of seitenmenge) {
    const teile = seite.split("/").filter(Boolean);
    for (let i = 1; i < teile.length; i++)
      eltern.add("/" + teile.slice(0, i).join("/"));
  }
  for (const pfad of [...eltern].sort()) {
    if (seitenmenge.has(pfad) || umgeleitet.has(pfad)) continue;
    funde.push(
      `${pfad} ist der Elternpfad einer Seite, antwortet aber selbst nicht — ` +
        `weder gebaut noch in vercel.json weitergeleitet`,
    );
  }
  elternpfade = eltern.size;
}

/* Der Mailverweis der Fehlerseite muss auch bei einer absurden Adresse gehen.

   Sie nennt den angefragten Pfad in der Vorlage, damit der Empfänger nicht
   raten muss, welcher Verweis ins Leere führte. Der Pfad kommt aber von außen,
   und ein `mailto` ist eine Adresse wie jede andere: Windows reicht sie nur
   bis etwa 2.083 Zeichen an das Mailprogramm weiter, Outlook schneidet früher
   ab. Ein Verweis, den niemand mehr öffnen kann, ist so tot wie einer ins
   Leere — nur sieht man es ihm nicht an.

   Gemessen am 08.08.2026 vor der Begrenzung: ein Pfad aus 4.000 Zeichen ergab
   einen Verweis aus 4.170. Der Proxy kürzt jetzt bei 200 Zeichen, und ein
   erster Anlauf mit einem Auslassungszeichen als Marke lieferte Status 500,
   weil Kopfzeilenwerte nur Latin-1 tragen dürfen. Beides steht hier. */
{
  const lang = `/${"a".repeat(4000)}`;
  const antwort = await fetch(`${basis}${lang}`);
  const html = await antwort.text();
  const verweis = html.match(/href="(mailto:[^"]*)"/)?.[1];

  if (antwort.status !== 404) {
    funde.push(
      `Eine Adresse aus 4.000 Zeichen beantwortet die Seite mit ` +
        `${antwort.status} statt 404`,
    );
  } else if (!verweis) {
    funde.push(
      "Die Fehlerseite einer sehr langen Adresse trägt keinen Mailverweis",
    );
  } else if (verweis.length > 2000) {
    funde.push(
      `Der Mailverweis der Fehlerseite misst ${verweis.length} Zeichen. ` +
        `Über etwa 2.000 reicht Windows ihn nicht mehr an das Mailprogramm weiter.`,
    );
  } else if (!/%E2%80%A6/.test(verweis)) {
    funde.push(
      "Die gekürzte Adresse endet nicht mit einem Auslassungszeichen — " +
        "der Empfänger läse eine Adresse, die es so nie gab.",
    );
  } else {
    mailverweis = verweis.length;
  }
}

await browser.close();
beenden();

for (const f of seitenfehler) funde.push(`Fehler in der Konsole — ${f}`);

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
    `${veroeffentlicht} veröffentlichte Adressen weiterhin erreichbar, ` +
    `${sitemapzeilen} Einträge in der Sitemap decken sich mit den robots-Angaben, ` +
    `der Mailverweis der Fehlerseite bleibt bei ${mailverweis} Zeichen, ` +
    `${elternpfade} Elternpfade antworten, ` +
    `${belegteSaetze} Behauptungen im Recruiter-Bereich mit Beleg, ` +
    `${sprachwechsel} Sprachwechsel alle mit hreflang, ` +
    `${pdfverweise} Verweise auf das Kurzprofil in der richtigen Fassung, ` +
    `${belegteFaehigkeiten} Fähigkeiten mit Beleg.`,
);
