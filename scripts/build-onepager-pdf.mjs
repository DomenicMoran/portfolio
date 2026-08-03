#!/usr/bin/env node
/**
 * Druckt die One-Pager-Route in eine echte PDF-Datei unter `public/`.
 *
 * Warum überhaupt: Die Schaltfläche „One-Pager als PDF" führte auf eine
 * HTML-Seite, auf der man selbst den Druckdialog öffnen musste. Ein Recruiter,
 * der ein Profil an die fachliche Führung weiterleiten will, braucht aber eine
 * Datei, keine Anleitung. Zwei zusätzliche Handgriffe an der Stelle kosten
 * genau die Weiterleitung, um die es geht.
 *
 * Die Datei entsteht aus derselben Route, die auch im Browser steht: Es gibt
 * keine zweite Fassung des Inhalts, die auseinanderlaufen könnte.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run onepager:pdf
 *
 * Das Skript startet seinen Server selbst und beendet ihn wieder. Vorher war
 * das ein Zweischritt von Hand — `next start -p 3131 &`, dann drucken —, und
 * genau daraus entstand der Fehler, gegen den weiter unten die BUILD_ID-Prüfung
 * steht: Ein Server aus einer früheren Sitzung blieb auf dem Port liegen und
 * lieferte einen alten Stand. Ein Ablauf, der einen manuellen Handgriff
 * voraussetzt, wird irgendwann ohne ihn ausgeführt.
 *
 * Wer gegen eine andere Adresse drucken will, gibt sie als Argument an; dann
 * startet das Skript nichts und erwartet, dass dort schon etwas läuft.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { quellstand } from "./lib/onepager-quellstand.mjs";
import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/**
 * Zwei Blätter, eines je Sprache.
 *
 * Die englische Fußzeile verlinkte lange auf das deutsche PDF: Wer
 * „One-pager as PDF" anklickte, bekam ein deutsches Dokument — ausgerechnet
 * das Blatt, das an eine fachliche Führung weitergereicht wird. Beide
 * entstehen aus derselben Route und demselben Bauteil, nur mit anderer
 * Inhaltsdatei.
 */
const BLAETTER = [
  {
    route: "/onepager",
    sprache: "de",
    ziel: "public/domenic-moran-kurzprofil.pdf",
    betreff:
      "Kurzprofil: vier Systeme in Produktion, Werdegang und Kontakt auf einer Seite",
  },
  {
    route: "/en/onepager",
    sprache: "en",
    ziel: "public/domenic-moran-one-pager.pdf",
    betreff:
      "One-page profile: four systems in production, path and contact on a single page",
  },
];
const vorgegebeneBasis = process.argv[2];

mkdirSync("public", { recursive: true });

let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

const browser = await chromium.launch();
const gebauteId = readFileSync(".next/BUILD_ID", "utf8").trim();
const { PDFDocument, PDFName, PDFString } = await import("pdf-lib");
let fehler = 0;

for (const blatt of BLAETTER) {
  const seite = await browser.newPage();

  const antwort = await seite.goto(`${basis}${blatt.route}`, {
    waitUntil: "networkidle",
  });
  if (!antwort || antwort.status() !== 200) {
    throw new Error(`${blatt.route} antwortete mit ${antwort?.status()}`);
  }

  // Prüfen, dass dort auch der eben gebaute Stand läuft.
  //
  // Ohne diese Prüfung ist der Fehler stumm und teuer: Auf dem Standard-Port
  // lag noch ein Server aus einer früheren Sitzung. Das Skript hat brav
  // gedruckt, gemeldet und die Seitenzahl geprüft, nur eben von einem Build von
  // vorgestern. Zwei Änderungsrunden gingen dabei ins Leere, weil die Datei nach
  // jeder Korrektur weiter dasselbe zeigte. HTTP 200 belegt, dass jemand
  // antwortet, nicht dass der Richtige antwortet.
  const html = await seite.content();
  if (!html.includes(gebauteId)) {
    throw new Error(
      `Auf ${basis} läuft ein anderer Build als der zuletzt gebaute ` +
        `(${gebauteId}). Server dort beenden und mit dem aktuellen Stand neu ` +
        `starten, sonst druckt dieses Skript einen alten Stand.`,
    );
  }

  // Die Route bringt ihr eigenes Druck-Stylesheet mit, inklusive der
  // zoom-Regel, die den Inhalt auf eine Seite bringt. Deshalb wird hier die
  // Druckdarstellung erzwungen statt eine eigene zu erfinden.
  await seite.emulateMedia({ media: "print" });
  await seite.waitForTimeout(400);

  await seite.pdf({
    path: blatt.ziel,
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  });
  await seite.close();

  const doc = await PDFDocument.load(readFileSync(blatt.ziel));
  const seitenzahl = doc.getPageCount();

  // Dokumenteigenschaften nachtragen.
  //
  // Chromium setzt nur den Titel aus <title> und sich selbst als Producer.
  // Autor, Betreff und Schlagwörter bleiben leer — und genau die liest ein
  // Bewerbermanagement-System aus, wenn die Datei dort abgelegt wird. Eine PDF
  // ohne Autor ist im Archiv eines Unternehmens eine Datei ohne Absender.
  doc.setAuthor("Domenic Moran");
  doc.setSubject(blatt.betreff);
  doc.setKeywords([
    "AI Product Engineer",
    "Fullstack",
    "TypeScript",
    "React Native",
    "Next.js",
    "Berlin",
  ]);
  doc.setCreator("domenicmoran.de");

  /*
    Der Stand der Quellen, aus denen das Blatt entstanden ist.

    Die Datei wird von Hand erzeugt und nicht vom Bau: Auf Vercel gibt es
    kein Chromium, also kann `next build` nicht drucken. Damit ist sie die
    einzige ausgelieferte Datei dieser Seite, die veralten kann, ohne dass
    es jemand merkt — und sie ist ausgerechnet die, die ein Recruiter
    weiterreicht.

    Die Kennung ist die Prüfsumme über die Dateien, aus denen das Blatt
    entsteht. `check-onepager-pdf.mjs` rechnet sie neu und vergleicht. Ändert
    sich eine der Quellen, ohne dass jemand `npm run onepager:pdf` aufruft,
    schlägt der Lauf fehl statt still ein altes Blatt auszuliefern.
  */
  doc.getInfoDict().set(PDFName.of("Quellstand"), PDFString.of(quellstand()));

  /*
    Die Sprache des Dokuments, im Katalog.

    Ein Vorleseprogramm entscheidet daran, mit welcher Aussprache es liest.
    Ohne Angabe nimmt es die Systemsprache: Das deutsche Blatt wird dann in
    einem englischen Windows englisch vorgelesen, mit „Domenic Moran" als
    „Domenick Moron" und „Fiskalisierung" als Buchstabensalat. Chromium
    schreibt den Eintrag beim Drucken nicht mit, obwohl `<html lang>` gesetzt
    ist.
  */
  /* `PDFString` und nicht `context.obj`: Letzteres macht aus einer
     Zeichenkette einen Namen, und im Katalog stand dann `/Lang /de` statt
     `/Lang (de)`. Der Eintrag war vorhanden und trotzdem wirkungslos — die
     Norm verlangt an dieser Stelle eine Textzeichenkette. */
  doc.catalog.set(PDFName.of("Lang"), PDFString.of(blatt.sprache));

  writeFileSync(blatt.ziel, await doc.save());

  /*
    Die Verweise müssen im fertigen Blatt anklickbar sein.

    Die Begründung für den Druckweg nennt „funktionierende Links" als einen
    seiner beiden Vorteile. Bis zum 02.08.2026 stimmte das nicht: Im Blatt
    standen E-Mail-Adresse, GitHub und LinkedIn als Text ohne `a`-Element, und
    beide PDFs enthielten null Anmerkungen. Wer das Blatt weitergereicht
    bekam, musste abtippen.

    Geprüft wird die Struktur und nicht der Bytestrom: `pdf-lib` legt die
    Anmerkungen beim Speichern in Objektströme, und eine Suche nach
    "/Subtype /Link" im Rohtext findet dort nichts. Genau daran wäre diese
    Prüfung fast gescheitert, mit dem falschen Ergebnis „null Verweise".
  */
  const verweise = [];
  for (const pdfSeite of doc.getPages()) {
    const annots = pdfSeite.node.get(PDFName.of("Annots"));
    for (const ref of annots?.asArray?.() ?? []) {
      const eintrag = doc.context.lookup(ref);
      if (eintrag?.get?.(PDFName.of("Subtype"))?.toString?.() !== "/Link")
        continue;
      const aktion = doc.context.lookup(eintrag.get(PDFName.of("A")));
      const ziel = aktion?.get?.(PDFName.of("URI"));
      if (ziel) verweise.push(String(ziel).replace(/^\(|\)$/g, ""));
    }
  }

  /* Die Sprache aus dem fertigen Dokument zurücklesen, nicht aus der Absicht.
     Sie steht im Katalog und der landet beim Speichern in einem Objektstrom —
     eine Suche im Rohtext findet sie dort nicht, genau wie bei den Verweisen. */
  const fertig = await PDFDocument.load(readFileSync(blatt.ziel));
  const sprache = fertig.catalog.get(PDFName.of("Lang"));
  const spracheOk =
    sprache instanceof PDFString && sprache.asString() === blatt.sprache;

  const kb = Math.round(statSync(blatt.ziel).size / 1024);
  console.log(
    `${blatt.ziel}: ${kb} KB, ${seitenzahl} Seite(n), ${verweise.length} Verweis(e), ` +
      `Sprache ${spracheOk ? blatt.sprache : "FEHLT"}`,
  );

  if (!spracheOk) {
    console.error(
      `${blatt.route}: Das Dokument nennt seine Sprache nicht. Ein ` +
        `Vorleseprogramm nimmt dann die Systemsprache.`,
    );
    process.exitCode = 1;
  }

  if (verweise.length < 4) {
    console.error(
      `${blatt.route}: nur ${verweise.length} anklickbare Verweise. Erwartet sind ` +
        `mindestens vier — E-Mail, GitHub, LinkedIn und die Seite selbst.`,
    );
    fehler++;
  }

  // Eine Seite ist die Vorgabe des One-Pagers. Mehr wäre ein Fehler im
  // Inhalt, nicht im Druck, und soll den Build scheitern lassen.
  if (seitenzahl !== 1) {
    console.error(
      `${blatt.route} ist ${seitenzahl} Seiten lang. Inhalt kürzen oder die ` +
        `zoom-Regel in globals.css nachziehen.`,
    );
    fehler++;
  }
}

await browser.close();
beenden();

if (fehler > 0) process.exit(1);
