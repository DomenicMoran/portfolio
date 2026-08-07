#!/usr/bin/env node
/**
 * Misst den Kontrast dort, wo axe keine Antwort gibt.
 *
 * `check:a11y` zählt Verstöße. axe kennt aber ein drittes Ergebnis neben
 * bestanden und verletzt: „incomplete" — geprüft, aber nicht entscheidbar. Bei
 * der Kontrastregel passiert das, sobald die Fläche hinter dem Text nicht aus
 * den Stilangaben folgt: halbdurchsichtige Karten, Verläufe, die geblurrten
 * Glüh-Kreise, das Grain-SVG, ein Element, das ein anderes überlappt. Genau
 * die Bauweise dieser Seite.
 *
 * Gemessen an der ausgelieferten Startseite am 07.08.2026: 0 Verstöße, und
 * 63 Textknoten, über die axe nichts gesagt hat. Der Lauf blieb grün, weil
 * niemand widersprochen hatte — nicht, weil jemand nachgesehen hätte. In
 * `check-a11y.mjs` stand dazu „Alles darüber bleibt axes Sache"; für diese
 * 63 Stellen war das eine Annahme ohne Deckung.
 *
 * Dieser Lauf entscheidet sie am Bild statt an den Stilangaben:
 *
 * 1. axe nennt die unentschiedenen Knoten. Über alle achtzehn Seiten und
 *    beide Breiten sind das rund 1.400.
 * 2. Von jedem wird der Ausschnitt zweimal aufgenommen — einmal wie er ist,
 *    einmal mit durchsichtiger Schrift. Die zweite Aufnahme ist der
 *    Untergrund, Punkt für Punkt, mit allem was darüber und darunter liegt.
 * 3. Gerechnet wird nur innerhalb der Zeilenkästen des Textes und nur an den
 *    Punkten, an denen der Buchstabe am dichtesten deckt. Die weichen Ränder
 *    eines Glyphen sind heller als die Schrift und würden jeden Wert nach
 *    unten ziehen.
 * 4. Gefordert sind die Werte der WCAG: 4,5:1, und 3:1 für großen Text.
 *
 * Was der Lauf beim ersten Durchgang fand: die Kilokalorien der
 * NOURI-Vorführung auf 3,13:1, die Achsenbeschriftungen beider Diagramme auf
 * 3,96:1, die Überschrift „Die harte Stelle" jeder Fallstudie auf 4,28:1.
 * Alles unter der Forderung, alles seit Monaten ausgeliefert, und keine
 * einzige Stelle davon hatte je ein Prüflauf beurteilt.
 *
 * Nach `npm run build`:
 *
 *   npm run check:contrast
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
import { FEHLERSEITEN, gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

const require = createRequire(import.meta.url);
const axeQuelle = readFileSync(require.resolve("axe-core"), "utf8");
const REGELWERKE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Dieselben zwei Breiten wie beim Barrierefreiheitslauf. */
const BREITEN = [1440, 390];

/** Ab welcher Deckung ein Punkt als Schrift zählt und nicht als Rand. */
const DECKUNG = 0.9;

/** Unter dieser Farbdifferenz ist der Punkt für die Rechnung zu unsicher. */
const MINDESTABSTAND = 8;

const helligkeit = ([r, g, b]) => {
  const f = (x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const kontrast = (a, b) => {
  const [hell, dunkel] = [helligkeit(a), helligkeit(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
};

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const funde = [];
let gemessen = 0;
let unentschieden = 0;
let huellen = 0;
let schwaechster = { wert: Infinity, wo: "" };

/* Dazu die Fehlerseite unter beiden Sprachen.

   Sie steht in keiner Liste gebauter Seiten und fiel damit aus jedem Lauf,
   der seine Liste aus dem Bau nimmt — ausgerechnet die Seite, die jeder
   Vertipper zu sehen bekommt. Ihr Text steht auf demselben Untergrund wie
   der Rest, also gilt hier dieselbe Frage. */
for (const route of [...gebauteSeiten(), ...FEHLERSEITEN]) {
  for (const breite of BREITEN) {
    const seite = await browser.newPage({
      viewport: { width: breite, height: 900 },
      deviceScaleFactor: 1,
    });
    await seite.goto(basis + route, { waitUntil: "networkidle" });

    /* Erst die Seite fertig einblenden lassen, dann anhalten.

       Die Karten unter `data-reveal` starten auf `opacity: 0` und werden
       sichtbar, sobald sie ins Bild kommen. Wer die Animationen gleich nach
       dem Laden anhält, friert sie auf halbem Weg ein: Gemessen blieben 78
       Stellen ohne einen voll deckenden Punkt, fast alle auf den beiden
       Artikelübersichten. Der Text stand da, nur halb durchsichtig.

       Einmal durchscrollen macht dasselbe wie ein Leser und ist derselbe
       Ablauf, mit dem `check-a11y` seine Seiten vorbereitet. */
    await seite.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await seite.waitForTimeout(600);

    /* Zwei Dinge werden stillgelegt.

       Die Animationen, weil sich eine Laufschrift nicht aufnehmen lässt:
       Playwright wartet darauf, dass das Element zur Ruhe kommt, und das tut
       es nie. Zehn ihrer Begriffe blieben dadurch ungemessen.

       Und die Weichzeichner-Masken. Die Laufschrift blendet an beiden Rändern
       aus; ein Begriff, der dort gerade steht, misst 1,03:1 — richtig
       gerechnet und trotzdem keine Aussage über die Schriftfarbe, denn eine
       Sekunde später steht er in der Mitte und misst 5,28:1. Ohne Maske
       gemessen kommt der Wert heraus, den der Leser sieht, solange der Text
       zu lesen ist. */
    await seite.addStyleTag({
      content:
        "*,*::before,*::after{animation-play-state:paused !important}" +
        "*{mask-image:none !important;-webkit-mask-image:none !important}",
    });
    await seite.addScriptTag({ content: axeQuelle });

    const ergebnis = await seite.evaluate(
      (regelwerke) =>
        window.axe.run(document, {
          runOnly: { type: "tag", values: regelwerke },
          resultTypes: ["incomplete"],
        }),
      REGELWERKE,
    );
    const offen =
      ergebnis.incomplete.find((r) => r.id === "color-contrast")?.nodes ?? [];
    unentschieden += offen.length;

    for (const knoten of offen) {
      const wahl = knoten.target.join(" ");
      const ort = seite.locator(wahl).first();

      let stelle;
      try {
        await ort.scrollIntoViewIfNeeded({ timeout: 10_000 });
        stelle = await ort.evaluate((el) => {
          const stil = getComputedStyle(el);
          const kasten = el.getBoundingClientRect();

          /* Die Schriftfarbe über einen Canvas auflösen, nicht über einen
             Zahlenfilter.

             Tailwind 4 schreibt jede Farbe mit Deckkraft als `oklab(0.616
             0.0045 -0.0157 / 0.8)`. Wer daraus die Zahlen zieht, bekommt vier
             Werte in der richtigen Anzahl und der falschen Bedeutung — und
             rechnet damit weiter, ohne dass etwas auffällt. Gemessen kamen so
             159 Fundstellen heraus, darunter jede Achsenbeschriftung beider
             Diagramme mit angeblich 1,05:1. Der Canvas kennt jeden Farbraum,
             den auch die Stilvorlage benutzen darf, und liefert immer RGBA.
             `check-a11y` löst es an seiner Stelle genauso. */
          const flaeche = document.createElement("canvas");
          flaeche.width = flaeche.height = 1;
          const stift = flaeche.getContext("2d", { willReadFrequently: true });
          stift.clearRect(0, 0, 1, 1);
          stift.fillStyle = stil.color;
          stift.fillRect(0, 0, 1, 1);
          const punkt = stift.getImageData(0, 0, 1, 1).data;

          /* Nur die Kästen der eigenen Textknoten, nicht der ganze Rahmen.

             Die Legende des Gebetszeiten-Diagramms trägt neben ihrem Text ein
             Linienmuster, das in `currentColor` gezeichnet ist. Wer die
             Schriftfarbe durchsichtig schaltet, löscht auch dieses Muster —
             seine Punkte sehen dann aus wie Buchstaben und wurden gegen die
             Linie darunter gerechnet: gemessen 1,63:1 für „die beiden
             anderen", während die Schrift selbst auf 5,25:1 steht.

             `Range.getClientRects()` liefert die Zeilenkästen des Textes
             selbst. Alles außerhalb bleibt draußen. */
          const zeilen = [];
          for (const knoten of el.childNodes) {
            if (knoten.nodeType !== 3 || !knoten.textContent.trim()) continue;
            const bereich = document.createRange();
            bereich.selectNodeContents(knoten);
            for (const r of bereich.getClientRects())
              if (r.width >= 1 && r.height >= 1)
                zeilen.push({ x: r.x, y: r.y, breite: r.width, hoehe: r.height });
          }

          return {
            zeilen,
            rgba: [punkt[0], punkt[1], punkt[2], punkt[3] / 255],
            eigenerText: [...el.childNodes].some(
              (n) => n.nodeType === 3 && n.textContent.trim() !== "",
            ),
            versteckt: el.closest("[aria-hidden='true']") !== null,
            nurZeichen: /^[·•|/–—,.:;›»→←↑↓+*-]+$/.test((el.textContent || "").trim()),
            groesse: parseFloat(stil.fontSize),
            gewicht: parseInt(stil.fontWeight, 10) || 400,
            text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
            kasten: {
              x: kasten.x,
              y: kasten.y,
              breite: kasten.width,
              hoehe: kasten.height,
            },
          };
        });
      } catch {
        funde.push(`${route} @ ${breite}: ${wahl.slice(0, 70)} — nicht messbar`);
        continue;
      }

      /* Zweierlei Schmuck bleibt draußen.

         Das Trennzeichen: Auf beiden One-Pagern steht der Mittelpunkt
         zwischen „Impressum" und „Datenschutz" auf 2,75:1. Er ist
         `aria-hidden`, besteht nur aus Satzzeichen und trägt nichts, was
         jemand lesen müsste — die Verweise daneben stehen für sich,
         unterstrichen und mit Abstand.

         Und der Namenszug am Fuß jeder Artikelseite: „Domenic Moran" in
         Riesenschrift, `aria-hidden`, `select-none`, gemalt aus einem
         Verlauf von 14 % Deckung über `bg-clip-text`. Seine Schriftfarbe ist
         `rgba(0,0,0,0)` — die Farbe kommt nicht aus `color`, und damit lässt
         sich dieser Text nicht durchsichtig schalten. Messbar wäre er nur
         über den Umweg, ihn ganz zu entfernen; die Aussage wäre dieselbe wie
         beim Punkt.

         Die WCAG nimmt reine Dekoration von der Kontrastforderung aus. Eng
         gefasst: `aria-hidden` allein reicht nicht. Die Laufschrift ist es
         auch, trägt aber lesbare Wörter, und die werden gemessen. */
      const unsichtbareSchriftfarbe = stelle.rgba[3] === 0;
      if (stelle.versteckt && (stelle.nurZeichen || unsichtbareSchriftfarbe))
        continue;
      if (unsichtbareSchriftfarbe) {
        funde.push(
          `${route} @ ${breite}: ${wahl.slice(0, 60)} — Schriftfarbe ist ` +
            `durchsichtig, der Text kommt aus dem Hintergrund; von Hand nachsehen`,
        );
        continue;
      }

      /* Hüllen ohne eigenen Text zählen nicht als offene Stelle.

         axe nennt für eine Karte sowohl den Rahmen als auch die Zeile darin.
         Der Rahmen hat keinen eigenen Textknoten; seine Schrift steht in den
         Kindern, und dort wird sie gemessen. Ihn mitzuzählen hieße, dieselbe
         Stelle zweimal zu prüfen und beim ersten Mal nichts zu finden. */
      if (!stelle.eigenerText) {
        huellen++;
        continue;
      }

      /* Aufgenommen wird die Schnittmenge aus Element und Sichtfeld.

         Beide Ränder müssen beschnitten werden, nicht nur der rechte. Die
         Laufschrift ist 5.880 px breit und beginnt bei x = −56; wer dort nur
         auf 0 hochsetzt und die Breite stehen lässt, nimmt ein um 56 px
         verschobenes Fenster auf. Gemessen kam für „TypeScript" 1,03:1 heraus,
         während dasselbe Wort in der Mitte der Leiste 5,28:1 hat — der Wert
         war nicht knapp, er war von der falschen Stelle.

         Die Aufnahme am Element (`ort.screenshot()`) hilft nicht: Sie liefert
         das volle Rechteck, auch den Teil links außerhalb des Sichtfelds, und
         damit dieselbe Verschiebung. Der Ausschnitt ist auf das Sichtfeld
         bezogen; ein Rechteck außerhalb lehnt Playwright ab. */
      const links = Math.max(0, Math.floor(stelle.kasten.x));
      const oben = Math.max(0, Math.floor(stelle.kasten.y));
      const rechts = Math.min(breite, Math.ceil(stelle.kasten.x + stelle.kasten.breite));
      const unten = Math.min(900, Math.ceil(stelle.kasten.y + stelle.kasten.hoehe));
      const ausschnitt = {
        x: links,
        y: oben,
        width: rechts - links,
        height: unten - oben,
      };
      if (ausschnitt.width < 1 || ausschnitt.height < 1) continue;

      let mitSchrift;
      try {
        mitSchrift = await seite.screenshot({ clip: ausschnitt });
      } catch {
        funde.push(`${route} @ ${breite}: ${wahl.slice(0, 70)} — nicht aufnehmbar`);
        continue;
      }
      await ort.evaluate((el) => {
        el.style.setProperty("color", "transparent", "important");
        el.style.setProperty("text-shadow", "none", "important");
        el.style.setProperty(
          "-webkit-text-fill-color",
          "transparent",
          "important",
        );
      });
      const ohneSchrift = await seite.screenshot({ clip: ausschnitt });
      await ort.evaluate((el) => {
        el.style.removeProperty("color");
        el.style.removeProperty("text-shadow");
        el.style.removeProperty("-webkit-text-fill-color");
      });

      const roh = async (bild) =>
        await sharp(bild).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { data: mit, info } = await roh(mitSchrift);
      const { data: ohne } = await roh(ohneSchrift);

      /* Die Schriftfarbe darf durchsichtig sein. Dann ist die gemalte Farbe
         nicht die angegebene, sondern deren Mischung mit dem Untergrund — und
         der ist an jedem Punkt ein anderer. */
      const kanaele = stelle.rgba;
      const deckkraft = kanaele[3];

      /* Die Zeilenkästen, umgerechnet auf den aufgenommenen Ausschnitt. */
      const zeilen = stelle.zeilen.map((z) => ({
        x0: z.x - ausschnitt.x,
        y0: z.y - ausschnitt.y,
        x1: z.x + z.breite - ausschnitt.x,
        y1: z.y + z.hoehe - ausschnitt.y,
      }));

      /* Zwei Durchgänge, weil neun Pixel große Schrift keine vollen Punkte
         hat.

         Die Achsenbeschriftungen beider Diagramme stehen in 9 px Mono. Bei
         dieser Größe ist jeder Strich schmaler als ein Bildpunkt, und die
         Kantenglättung verteilt die Farbe: Gemessen erreichte dort kein
         einziger Punkt 90 % Deckung, und 46 Beschriftungen blieben
         unentschieden — wieder eine stille Lücke, diesmal in der eigenen
         Prüfung.

         Der erste Durchgang sucht deshalb die höchste vorkommende Deckung.
         Der zweite nimmt, was nah daran liegt: bei normaler Schrift sind das
         die vollen Punkte, bei feiner die Mitte der Striche. Unter 40 %
         höchster Deckung ist der Text so dünn, dass die Rechnung nichts mehr
         hergibt; dann meldet der Lauf das, statt einen Wert zu erfinden. */
      const deckungen = new Float32Array(mit.length / info.channels);
      let hoechsteDeckung = 0;
      for (let i = 0; i < mit.length; i += info.channels) {
        const punktNr = i / info.channels;
        const px = punktNr % info.width;
        const py = Math.floor(punktNr / info.width);
        if (!zeilen.some((z) => px >= z.x0 && px < z.x1 && py >= z.y0 && py < z.y1))
          continue;
        const hinten = [ohne[i], ohne[i + 1], ohne[i + 2]];
        const erwartet = [0, 1, 2].map(
          (k) => deckkraft * kanaele[k] + (1 - deckkraft) * hinten[k],
        );
        let abstand = 0;
        let tatsaechlich = 0;
        for (const k of [0, 1, 2]) {
          const d = Math.abs(erwartet[k] - hinten[k]);
          if (d > abstand) {
            abstand = d;
            tatsaechlich = Math.abs(mit[i + k] - hinten[k]);
          }
        }
        if (abstand < MINDESTABSTAND) continue;
        const deckung = tatsaechlich / abstand;
        deckungen[punktNr] = deckung;
        if (deckung > hoechsteDeckung) hoechsteDeckung = deckung;
      }

      const schwelle = Math.min(DECKUNG, hoechsteDeckung * 0.95);

      let schlechtester = Infinity;
      let kernpunkte = 0;
      if (hoechsteDeckung >= 0.4)
        for (let i = 0; i < mit.length; i += info.channels) {
          const punktNr = i / info.channels;
          if (deckungen[punktNr] < schwelle || deckungen[punktNr] === 0) continue;
          const hinten = [ohne[i], ohne[i + 1], ohne[i + 2]];
          const erwartet = [0, 1, 2].map(
            (k) => deckkraft * kanaele[k] + (1 - deckkraft) * hinten[k],
          );
          kernpunkte++;
          const wert = kontrast(erwartet, hinten);
          if (wert < schlechtester) schlechtester = wert;
        }

      if (!kernpunkte) {
        funde.push(
          `${route} @ ${breite}: ${wahl.slice(0, 60)} — Text vorhanden, aber ` +
            `kein Punkt deckt voll; von Hand nachsehen`,
        );
        continue;
      }

      gemessen++;
      const gross =
        stelle.groesse >= 24 || (stelle.groesse >= 18.66 && stelle.gewicht >= 700);
      const soll = gross ? 3 : 4.5;
      if (schlechtester < schwaechster.wert)
        schwaechster = {
          wert: schlechtester,
          wo: `${route} @ ${breite}: „${stelle.text}“`,
        };
      if (schlechtester < soll)
        funde.push(
          `${route} @ ${breite}: ${schlechtester.toFixed(2)}:1 statt ${soll}:1 — ` +
            `${stelle.groesse}px/${stelle.gewicht} „${stelle.text}“`,
        );
    }

    await seite.close();
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.log(`\n${funde.length} Stelle(n) unter dem geforderten Kontrast:\n`);
  for (const f of funde) console.log(`  ${f}`);
  process.exit(1);
}

console.log(
  `Kontrast gemessen, wo axe nichts sagt: ${gemessen} Textstellen entschieden, ` +
    `schwächste ${schwaechster.wert.toFixed(2)}:1 (${schwaechster.wo}). ` +
    `Dazu ${huellen} Hüllen, deren Text in Kindelementen steht und dort ` +
    `gemessen wurde; ${unentschieden} offene Stellen hatte axe gemeldet.`,
);
