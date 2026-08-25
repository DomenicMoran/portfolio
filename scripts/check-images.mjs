#!/usr/bin/env node
/**
 * Kein Bild wird größer gezeigt, als es geladen wurde.
 *
 * `next/image` schneidet jede Aufnahme in mehrere Auflösungen und überlässt
 * dem Browser die Wahl. Der wählt anhand von `sizes`, einer Angabe, die der
 * Entwickler von Hand hinschreibt und die niemand nachrechnet. Steht dort ein
 * zu kleiner Wert, lädt der Browser eine zu kleine Datei und zieht sie auf.
 * Nichts bricht, nichts meldet sich, das Bild ist nur weich.
 *
 * Gemessen an der ausgelieferten Startseite am 07.08.2026 bei 1.280, 1.440
 * und 1.920 px:
 *
 *     nouri-desktop      Kasten 1.150 px, geladen 700 px   (+64 %)
 *     menucloud-desktop  Kasten   886 px, geladen 700 px   (+27 %)
 *
 * Beide Quelldateien liegen mit 1.440 px vor. Es fehlte allein die Angabe:
 * und betroffen waren die zwei größten Bilder der Seite, die Belege, für die
 * die Fallstudien geschrieben sind.
 *
 * Geprüft wird an sieben Breiten, weil `sizes` genau dort falsch wird, wo das
 * Layout umbricht. Der Fehler oben zeigte sich erst ab 1.280 px: darunter
 * griff ein `100vw`-Zweig, der zufällig groß genug war.
 *
 * Die andere Richtung zählt mit, aber nur als Hinweis: Wer 1.200 px lädt und
 * 500 zeigt, verschenkt Bytes. Ein Grenzwert dafür wäre Geschmackssache; ein
 * Bild, das zu klein geladen wird, ist dagegen sichtbar kaputt.
 *
 * Nach `npm run build`:
 *
 *   npm run check:images
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Dort, wo dieses Layout seine Sprünge hat. */
const BREITEN = [1920, 1440, 1280, 1024, 768, 640, 390];

/**
 * Wie viel Aufschlag ohne Beanstandung durchgeht.
 *
 * Ein Bild um wenige Punkte breiter zu zeigen, als es geladen wurde, sieht
 * niemand: Der Kasten ist ein Bruchteil breit, die Auflösungsstufen sind grob.
 * Ab fünf Prozent wird daraus eine sichtbar weiche Kante.
 */
const AUFSCHLAG = 1.05;

/**
 * Wie viele Bild-Bytes eine Seite auf dem Telefon kosten darf, bevor
 * jemand scrollt.
 *
 * Gemessen am 08.08.2026 an der Startseite bei 390 px: zwölf Bilder,
 * 258 kB, alle vor der ersten Bewegung. `loading="lazy"` steht an jedem
 * davon und hält sie nicht auf, auch nicht mit auf 4G gedrosselter
 * Leitung, gegengeprüft mit beiden Einstellungen.
 *
 * Das ist heute im Rahmen: Die Kernwerte bleiben im Budget, und die
 * Aufnahmen sind der Beleg, für den die Fallstudien geschrieben sind.
 * Die Grenze steht deshalb nicht als Vorwurf hier, sondern als Deckel:
 * Drei weitere Aufnahmen würden unbemerkt hundert Kilobyte draufsetzen,
 * und niemand misst so etwas von sich aus nach.
 */
const BILDBUDGET_KB = 320;

/** Ab hier lohnt der Hinweis, dass Bytes verschenkt werden. */
const VERSCHWENDUNG = 2.5;

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const funde = [];
const grosszuegig = new Map();
let gemessen = 0;

/* Seiten ohne Bilder werden einmal besucht, nicht siebenmal.

   Von zwanzig gebauten Seiten tragen vier überhaupt Bilder. Sie alle an
   jeder Breite zu laden kostete 4 Minuten 20 für eine Antwort, die nach der
   ersten Breite feststeht. Die erste Breite entscheidet mit, welche Seiten
   danach noch drankommen, und sie ist die breiteste, weil ein Bild dort am
   ehesten vorhanden und am größten ist. */
const mitBildern = new Set();

for (const route of gebauteSeiten()) {
  for (const breite of BREITEN) {
    if (breite !== BREITEN[0] && !mitBildern.has(route)) continue;
    const seite = await browser.newPage({
      viewport: { width: breite, height: 900 },
      deviceScaleFactor: 1,
    });
    await seite.goto(basis + route, { waitUntil: "networkidle" });

    /* Einmal durchscrollen: Was noch nicht im Bild war, hat weder eine Quelle
       noch eine Größe, und ein Lauf ohne diesen Schritt misst leere Kästen. */
    await seite.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await seite.waitForTimeout(500);

    const bilder = await seite.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((b) => b.currentSrc && b.naturalWidth > 0)
        .map((b) => {
          const kasten = b.getBoundingClientRect();
          /* Der Dateiname aus der Adresse des Bilddienstes, nicht aus `src`:
             Dort steht die Quelle als Parameter. */
          const adresse = decodeURIComponent(b.currentSrc);
          const quelle = adresse.includes("url=")
            ? adresse.split("url=")[1].split("&")[0]
            : adresse;
          return {
            datei: quelle.split("/").pop(),
            geladen: b.naturalWidth,
            gezeigt: Math.round(kasten.width),
            sizes: b.sizes || "(ohne)",
          };
        })
        .filter((b) => b.gezeigt > 0),
    );

    if (bilder.length > 0) mitBildern.add(route);

    for (const b of bilder) {
      gemessen++;
      if (b.geladen * AUFSCHLAG < b.gezeigt) {
        funde.push(
          `${route} @ ${breite}: ${b.datei} wird ${b.gezeigt} px breit gezeigt, ` +
            `geladen sind ${b.geladen} px (+${Math.round((b.gezeigt / b.geladen - 1) * 100)} %), sizes="${b.sizes}"`,
        );
      } else if (b.geladen > b.gezeigt * VERSCHWENDUNG) {
        const schluessel = `${b.datei} @ ${breite}`;
        grosszuegig.set(
          schluessel,
          `${b.datei}: ${b.geladen} px geladen für ${b.gezeigt} px bei ${breite} px Fenster`,
        );
      }
    }

    await seite.close();
  }
}

/* Das Gewicht der Bilder, wie ein Telefon es bezahlt: 390 px, kein
   Scrollen, gezählt am Übertragungsvolumen. */
const schwer = [];
for (const route of [...mitBildern]) {
  const seite = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await seite.goto(basis + route, { waitUntil: "networkidle" });
  const kb = await seite.evaluate(() =>
    Math.round(
      performance
        .getEntriesByType("resource")
        .filter((e) => e.initiatorType === "img")
        .reduce((n, e) => n + (e.transferSize || e.encodedBodySize || 0), 0) /
        1024,
    ),
  );
  if (kb > BILDBUDGET_KB)
    schwer.push(`${route}: ${kb} kB Bilder vor der ersten Bewegung, erlaubt ${BILDBUDGET_KB}`);
  await seite.close();
}

/* Eine begründete Leerstelle darf kein Bild daneben haben.

   Die Fallstudie zu WohnungsJäger sagt: „Von diesem Projekt gibt es hier
   bewusst kein Bild. Das Dashboard zeigt echte Inserate, echte Adressen und
   meine vollständigen Bewerbungsunterlagen. Einen Screenshot mit ausgedachten
   Daten nachzustellen wäre die naheliegende Lösung. Aber dann stünde auf einer
   Seite, die mit Nachprüfbarkeit argumentiert, ein erfundenes Bild."

   Der Inhalt kennt dafür ein eigenes Feld, `keinScreenshot`. Nur schließt es
   `shots` nicht aus: Das Bauteil rendert beides nacheinander, wer also eine
   Aufnahme nachträgt, bekommt ein Bild und darunter den Satz, es gebe keins.
   Auf einer Seite, deren Argument Nachprüfbarkeit ist, wäre das der teuerste
   Widerspruch von allen, und im Quelltext sieht man ihn nicht, weil die
   beiden Felder vierzig Zeilen auseinanderliegen.

   Gemessen wird an der ausgelieferten Seite und in beiden Sprachfassungen:
   Der Kasten, der den Satz trägt, darf kein `img` enthalten.

   Seit „drei Fallstudien ausführlich, der Rest eingeklappt" (24.08.2026)
   steht WohnungsJäger nicht mehr unter den ersten drei und damit hinter dem
   Umschalter „Alle Projekte ansehen": Die Liste trägt bis zum Klick die
   Tailwind-Klasse `hidden`, und `innerText` liefert für einen
   `display: none`-Teilbaum nichts, egal was im Quelltext steht. Ohne den
   Klick hier wäre der Lauf blind für genau die Fallstudie, für die die Regel
   geschrieben wurde. */
{
  const HINWEIS = /bewusst kein Bild|deliberately no image/i;
  let leerstellen = 0;

  for (const route of ["/", "/en"]) {
    const seite = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const antwort = await seite.goto(`${basis}${route}`, { waitUntil: "networkidle" });
    if (antwort?.status() !== 200) {
      await seite.close();
      continue;
    }
    const umschalter = seite.locator('[aria-controls="weitere-projekte-liste"]');
    if (await umschalter.count()) await umschalter.click();
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });

    const treffer = await seite.evaluate((muster) => {
      const regel = new RegExp(muster, "i");
      return [...document.querySelectorAll("[id^='case-']")]
        .filter((k) => regel.test(k.innerText || ""))
        .map((k) => ({ id: k.id, bilder: k.querySelectorAll("img").length }));
    }, HINWEIS.source);

    for (const k of treffer) {
      leerstellen++;
      if (k.bilder > 0) {
        funde.push(
          `${route}: ${k.id} sagt, es gebe hier bewusst kein Bild, zeigt aber ` +
            `${k.bilder}. Entweder das Bild heraus oder den Satz.`,
        );
      }
    }
    await seite.close();
  }

  /* Zwei erwartet, eine je Sprachfassung. Ein erster Anlauf hatte die
     englische Formulierung geraten, "deliberately no picture", und traf
     nicht: Dort steht "There is deliberately no image of this project." Mit
     nur einem Treffer wäre der Lauf grün geblieben und die englische
     Fallstudie ungeprüft. */
  if (leerstellen !== 2) {
    funde.push(
      `${leerstellen} statt 2 Fallstudien tragen den Satz über die begründete ` +
        `Leerstelle. Erwartet ist je eine Sprachfassung, fehlt eine, ist der ` +
        `Satz verschwunden oder sein Wortlaut hat sich geändert.`,
    );
  }
}

await browser.close();
beenden();

if (schwer.length > 0) {
  console.log(`\n${schwer.length} Seite(n) über dem Bildbudget:\n`);
  for (const z of schwer) console.log(`  ${z}`);
  process.exit(1);
}

if (funde.length > 0) {
  console.log(`\n${funde.length} Bild(er) werden hochgerechnet gezeigt:\n`);
  for (const f of funde) console.log(`  ${f}`);
  process.exit(1);
}

console.log(
  `Kein Bild wird größer gezeigt als geladen: ${gemessen} Messungen über ` +
    `${BREITEN.length} Breiten, und keine Seite über ${BILDBUDGET_KB} kB Bildern ` +
    `vor der ersten Bewegung.`,
);
/* Diese Liste ist ein Hinweis und keine Aufgabe.

   Sie stand ohne ein Wort dazu da, und ihr einziger wiederkehrender Eintrag
   sieht nach Verschwendung aus: `portrait.jpg`, 384 px geladen für 110 px
   angezeigt, bei jeder der sieben Breiten. Er ist aber Absicht. Das Blatt
   wird gedruckt, das Porträt steht dort auf 22,7 mm, und beide
   ausgelieferten PDF betten es mit genau 384 x 384 ein, nachgemessen an den
   Bildobjekten, nicht angenommen. Wer `sizes` enger stellt, verkleinert das
   Bild im PDF mit und sieht am Bildschirm keinen Unterschied.

   Gegen genau diesen Griff steht `DRUCKKANTE` in `check-onepager-pdf.mjs`:
   Unter 256 px scheitert der Lauf. Der Satz hier nennt den Grund, damit
   niemand ihn ein zweites Mal herleiten muss. */
if (grosszuegig.size > 0) {
  console.log(
    `\n  Reichlich geladen, ohne Beanstandung ` +
      `(portrait.jpg trägt die Druckauflösung des One-Pagers, ` +
      `gesichert über DRUCKKANTE in check:onepager):`,
  );
  for (const z of [...new Set(grosszuegig.values())].slice(0, 8))
    console.log(`    ${z}`);
}
