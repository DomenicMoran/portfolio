#!/usr/bin/env node
/**
 * Misst die drei Werte, an denen ein Besucher merkt, ob eine Seite gut gebaut
 * ist, und hält sie gegen ihre Budgets.
 *
 * Warum das ein eigener Lauf ist: Alle anderen prüfen Inhalt, Auszeichnung
 * oder Adressen — Dinge, die entweder stimmen oder nicht. Ladeverhalten ist
 * anders. Es verschlechtert sich in kleinen Schritten, jeder für sich
 * vertretbar: ein Bauteil mehr im ersten Bündel, eine Schrift mehr, ein Bild
 * ohne Maße. Keiner dieser Schritte fällt auf, und irgendwann ist die Seite
 * langsam, ohne dass jemand etwas Falsches getan hätte.
 *
 * Gemessen wird unter denselben Bedingungen wie bisher von Hand: ein Telefon
 * mit 390 px, vierfach gedrosselter Prozessor, 1,6 Mbit/s und 150 ms Latenz.
 * Das ist kein Laborwert, sondern ungefähr ein Mobilfunknetz in der Bahn.
 *
 * Drei Läufe je Seite, gewertet wird der Median: Der erste Aufruf nach dem
 * Start des Servers ist regelmäßig langsamer, und ein einzelner Ausreißer
 * soll den Lauf weder rot noch grün machen. Gemessen an der ausgelieferten
 * Seite lagen fünf Läufe zwischen 1.884 und 1.900 ms — die Streuung ist
 * gering, solange man den ersten nicht mitzählt.
 *
 * Die Budgets stehen unten und sind die üblichen Schwellen für „gut":
 * LCP unter 2,5 s, CLS unter 0,1. Sie sind bewusst nicht enger gesetzt als
 * die Norm, damit der Lauf eine Aussage über die Seite trifft und keine über
 * den Ehrgeiz dessen, der ihn geschrieben hat.
 *
 *   npm run check:vitals
 *   node scripts/check-vitals.mjs https://domenicmoran.de
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/** Die Schwellen, ab denen ein Wert nicht mehr „gut" heißt. */
const BUDGET = { lcp: 2500, cls: 0.1 };

/**
 * Was gemessen wird. Mehr Seiten kosten je einen Durchgang von acht Sekunden.
 *
 * Die Artikelseite steht dabei, obwohl sie nicht die Startseite ist: Sie ist
 * die Seite, die geteilt wird, und damit für viele Leser die erste. Sie trägt
 * als einzige lange Fließtexte, Codeblöcke und eine Tabelle — also genau die
 * Bauteile, an denen sich Ladeverhalten zuerst verschlechtert.
 */
const SEITEN = [
  "/",
  "/en",
  "/artikel",
  "/artikel/kassensichv-in-der-praxis",
  "/onepager",
];

const LAEUFE = 3;
/** So lange wartet jeder Lauf auf Nachzügler, bevor er die Werte abholt. */
const WARTEN = 7000;

const vorgegebeneBasis = process.argv[2]?.replace(/\/$/, "");
let basis = vorgegebeneBasis;
let beenden = () => {};
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const funde = [];
const zeilen = [];

for (const pfad of SEITEN) {
  const messungen = [];

  for (let lauf = 0; lauf < LAEUFE; lauf++) {
    /* Jeder Lauf mit eigenem Kontext: Ein zweiter Aufruf im selben Profil
       findet Schriften und Bündel im Zwischenspeicher und misst dann die
       Wiederkehr statt des ersten Eindrucks. Genau der zählt hier. */
    const kontext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const seite = await kontext.newPage();
    const cdp = await seite.context().newCDPSession(seite);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await seite.goto(`${basis}${pfad}`, { waitUntil: "load" });

    /* `buffered: true` ist der ganze Trick: Ohne das Flag bekommt ein
       Beobachter nur, was nach seiner Anmeldung passiert — und das Wichtigste
       ist längst vorbei, bevor dieser Code läuft.

       Die Verschiebungen werden mit ihrer Quelle mitgeschrieben. Eine Zahl
       allein sagt, dass etwas gerutscht ist; erst der Knoten sagt, was. */
    const werte = await seite.evaluate(
      (wartezeit) =>
        new Promise((fertig) => {
          const aus = { lcp: 0, cls: 0, quellen: [] };
          new PerformanceObserver((liste) => {
            for (const eintrag of liste.getEntries()) {
              if (eintrag.hadRecentInput) continue;
              aus.cls += eintrag.value;
              for (const quelle of eintrag.sources ?? []) {
                const knoten = quelle.node;
                if (!knoten) continue;
                aus.quellen.push(
                  `${knoten.tagName ?? "?"}.${String(knoten.className ?? "").slice(0, 40)}`,
                );
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((liste) => {
            for (const eintrag of liste.getEntries()) {
              aus.lcp = Math.round(eintrag.startTime);
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });
          setTimeout(() => fertig(aus), wartezeit);
        }),
      WARTEN,
    );

    messungen.push(werte);
    await kontext.close();
  }

  const median = (zahlen) =>
    [...zahlen].sort((a, b) => a - b)[Math.floor(zahlen.length / 2)];
  const lcp = median(messungen.map((m) => m.lcp));
  const cls = median(messungen.map((m) => m.cls));
  const quellen = [...new Set(messungen.flatMap((m) => m.quellen))];

  const marke = lcp > BUDGET.lcp || cls > BUDGET.cls ? "  <-- über Budget" : "";
  zeilen.push(
    `${pfad.padEnd(36)} LCP ${String(lcp).padStart(5)} ms   CLS ${cls.toFixed(4)}${marke}`,
  );

  if (lcp > BUDGET.lcp) {
    funde.push(`${pfad}: LCP ${lcp} ms, Budget ${BUDGET.lcp} ms`);
  }
  if (cls > BUDGET.cls) {
    funde.push(
      `${pfad}: CLS ${cls.toFixed(4)}, Budget ${BUDGET.cls}` +
        (quellen.length ? `\n      verschoben: ${quellen.join(", ")}` : ""),
    );
  }
}

await browser.close();
beenden();

console.log(zeilen.join("\n"));

if (funde.length > 0) {
  console.error(`\n${funde.length} Wert über Budget:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nGemessen auf 390 px, Prozessor vierfach gedrosselt, 1,6 Mbit/s, ` +
      `150 ms Latenz, Median aus ${LAEUFE} kalten Läufen.`,
  );
  process.exit(1);
}

console.log(
  `\nAlle Kernwerte im Budget: ${SEITEN.length} Seiten × ${LAEUFE} kalte Läufe ` +
    `auf einem gedrosselten Telefon, LCP unter ${BUDGET.lcp} ms, CLS unter ${BUDGET.cls}.`,
);
