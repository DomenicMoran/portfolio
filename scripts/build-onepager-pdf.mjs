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
import verified from "../src/content/verified.json" with { type: "json" };
import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/**
 * Wie hoch eine A4-Seite in Punkten dieser Darstellung ist, abzüglich dessen,
 * was der Druck ohnehin abschneidet.
 *
 * Empirisch bestimmt: Bei 794 px Breite kippt das Blatt zwischen `zoom: 0.87`
 * und `0.88` auf zwei Seiten. Die gezoomte Höhe an der Kippstelle ist die
 * nutzbare Höhe — gemessen rund 1.030 px, nicht die vollen 1.123 px der
 * Seitenhöhe.
 */
const NUTZBAR = 1030;

/**
 * Ab welcher Ausnutzung das Blatt in Ordnung ist.
 *
 * 90 % lassen genug Luft für einen zusätzlichen Absatz, ohne dass die
 * Schrift unnötig klein steht. Bei 0,78 waren es 89 %, bei 0,85 sind es 97 %.
 */
const MINDESTNUTZUNG = 90;

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
    schlagwoerter: [
      "AI Product Engineer",
      "Fullstack",
      "TypeScript",
      "React Native",
      "Next.js",
      "Berlin",
    ],
  },
  {
    route: "/en/onepager",
    sprache: "en",
    ziel: "public/domenic-moran-one-pager.pdf",
    betreff:
      "One-page profile: four systems in production, path and contact on a single page",
    /* „Full-stack" mit Bindestrich, wie die englische Fassung es überall
       schreibt. Beide Blätter trugen dieselbe Liste, und die stammte vom
       deutschen: Ein Bewerbermanagement-System, das dieses Feld indiziert,
       fand auf dem englischen Blatt eine Schreibweise, die auf keiner
       englischen Seite steht. */
    schlagwoerter: [
      "AI Product Engineer",
      "Full-stack",
      "TypeScript",
      "React Native",
      "Next.js",
      "Berlin",
    ],
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
const { PDFDocument, PDFHexString, PDFName, PDFString } =
  await import("pdf-lib");
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

  /* `tagged` gibt dem PDF eine Struktur.
   *
   * Ohne das Flag druckt Chromium eine Fläche aus Textfragmenten: Überschrift,
   * Absatz und Listeneintrag sehen darin gleich aus, und die Reihenfolge, in
   * der ein Screenreader sie vorliest, ist die Zeichenreihenfolge im Strom,
   * nicht die des Dokuments. Gemessen an beiden ausgelieferten Dateien fehlte
   * `/MarkInfo` im Katalog, das Kennzeichen für genau diese Struktur.
   *
   * Es ist die Datei, die weitergereicht wird, und die einzige, die den
   * Empfänger ohne Browser erreicht. Eine Seite, die ihre eigene Zugänglichkeit
   * an 29 Prüfläufen misst, darf ihr wichtigstes Blatt nicht ungetaggt
   * verschicken. Die Sprache steht schon im Katalog, die Struktur fehlte.
   */
  /* Wie viel der Seite das Blatt wirklich nutzt.

     Die Regel „eine Seite" ist einseitig geprüft: Der Lauf meldet, wenn zwei
     daraus werden. Er meldete nie, wenn der Zoom mehr schrumpft als nötig —
     und genau das war der Fall. Gemessen am 08.08.2026 stand `zoom: 0.78`
     zu einem Kommentar, der 1.302 px Inhalt annahm; gemessen waren es 1.172.
     Der Inhalt war geschrumpft, die Zahl geblieben. Das Blatt füllte 915 von
     rund 1.030 nutzbaren Punkten, und die kleinste Schrift stand bei 5,9 pt
     auf einem Dokument, das ausgedruckt und gelesen wird.

     Ein Blatt, das die Seite nicht ausnutzt, ist kein Fehler, den man sieht:
     Es sieht nur nach kleiner Schrift aus. Deshalb steht die Ausnutzung
     jetzt in derselben Zeile wie die Seitenzahl, und zu wenig davon bricht
     den Lauf ab. */
  const nutzung = await seite.evaluate(() => {
    const blatt = document.querySelector(".onepager");
    if (!blatt) return null;
    const zoom = parseFloat(getComputedStyle(blatt).zoom || "1");
    const kleinste = Math.min(
      ...[...blatt.querySelectorAll("*")]
        .filter((el) => el.textContent.trim() && el.children.length === 0)
        .map((el) => parseFloat(getComputedStyle(el).fontSize) * zoom),
    );
    return {
      hoehe: Math.round(blatt.getBoundingClientRect().height),
      punkt: Math.round(kleinste * 0.75 * 100) / 100,
    };
  });

  await seite.pdf({
    path: blatt.ziel,
    format: "A4",
    printBackground: true,
    tagged: true,
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
  /*
    Schlagwörter mit Komma, nicht mit Leerzeichen.

    `setKeywords` nimmt eine Liste und fügt sie mit Leerzeichen zusammen. Im
    fertigen Dokument stand damit „AI Product Engineer Fullstack TypeScript
    React Native Next.js Berlin" — ein einziger Wortstrom. Ein
    Bewerbermanagement-System, das dieses Feld ausliest, macht daraus zehn
    falsche Schlagwörter statt sechs richtigen: „React Native" zerfällt in
    „React" und „Native", „AI Product Engineer" in drei Wörter, von denen
    keines der Titel ist.
  */
  doc.setKeywords([blatt.schlagwoerter.join(", ")]);
  doc.setCreator("domenicmoran.de");
  /*
    Auch der Erzeuger, nicht nur der Ersteller.

    `pdf-lib` trägt sich ungefragt als "pdf-lib (https://github.com/Hopding/
    pdf-lib)" ein. In den Dokumenteigenschaften eines Bewerbungsblattes steht
    damit ein fremder Werkzeugname mit fremdem Verweis — die einzige Stelle im
    ganzen Auftritt, an der etwas steht, das niemand ausgesucht hat. Wer die
    Eigenschaften öffnet, tut das nicht zufällig.
  */
  doc.setProducer("domenicmoran.de");

  /*
    Zwei Blätter mit demselben Inhalt sind auch dieselbe Datei.

    Chromium und pdf-lib schreiben die Uhrzeit des Drucks in die Datei.
    Gemessen an zwei Läufen ohne jede Inhaltsänderung: gleiche Größe,
    gleiche Seitenzahl, gleicher Quellstand — und trotzdem verschiedene
    Bytes, weil `/CreationDate` um fünfzig Minuten auseinanderlag. Jeder
    Nachdruck erzeugte damit eine Änderung im Repo, die keine war, und die
    Frage „ist das Blatt aktuell?“ ließ sich nicht am Vergleich beantworten.

    Das Datum kommt deshalb aus dem Prüfstempel, den das Blatt ohnehin
    zeigt. Es bewegt sich, wenn sich die Zahlen bewegen, und sonst nicht.
  */
  const stempel = new Date(`${verified.date}T00:00:00Z`);
  doc.setCreationDate(stempel);
  doc.setModificationDate(stempel);

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

  /*
    Die Dokumenteigenschaften aus dem fertigen Blatt zurücklesen.

    Sie werden oben gesetzt, und ob sie ankommen, hat bisher niemand geprüft —
    genau dort ist schon einmal etwas verlorengegangen. Gelesen wird über
    `pdf-lib`, weil die Eigenschaften beim Speichern in einem Objektstrom
    landen und als UTF-16 kodiert werden; im Rohtext steht dort nichts
    Lesbares.
  */
  const eigenschaft = (name) => {
    const wert = fertig.getInfoDict().get(PDFName.of(name));
    if (wert instanceof PDFHexString) return wert.decodeText();
    if (wert instanceof PDFString) return wert.asString();
    return "";
  };

  const fehlend = ["Title", "Author", "Subject", "Keywords"].filter(
    (name) => eigenschaft(name).trim() === "",
  );
  if (fehlend.length > 0) {
    console.error(
      `${blatt.route}: Dokumenteigenschaften fehlen: ${fehlend.join(", ")}. ` +
        `Eine PDF ohne Absender ist im Archiv eines Unternehmens eine Datei ` +
        `ohne Herkunft.`,
    );
    fehler++;
  }

  if (!eigenschaft("Keywords").includes(",")) {
    console.error(
      `${blatt.route}: Die Schlagwörter stehen ohne Komma im Dokument ` +
        `(„${eigenschaft("Keywords")}"). So gelesen zerfällt „React Native" ` +
        `in zwei Begriffe und „AI Product Engineer" in drei.`,
    );
    fehler++;
  }

  const kb = Math.round(statSync(blatt.ziel).size / 1024);
  const anteil = nutzung ? Math.round((nutzung.hoehe / NUTZBAR) * 100) : null;
  console.log(
    `${blatt.ziel}: ${kb} KB, ${seitenzahl} Seite(n), ${verweise.length} Verweis(e), ` +
      `Sprache ${spracheOk ? blatt.sprache : "FEHLT"}` +
      (anteil ? `, ${anteil} % der Seite, kleinste Schrift ${nutzung.punkt} pt` : ""),
  );

  if (anteil !== null && anteil < MINDESTNUTZUNG) {
    console.error(
      `${blatt.route}: Das Blatt füllt nur ${anteil} % der Seite. Der Zoom in ` +
        `globals.css schrumpft mehr als nötig, und die kleinste Schrift steht ` +
        `bei ${nutzung.punkt} pt. Zoom erhöhen, bis dieser Lauf zwei Seiten ` +
        `meldet, dann eine Stufe zurück.`,
    );
    fehler++;
  }

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
