#!/usr/bin/env node
/**
 * Prüft, dass keine Überschrift ihre Unterlängen abschneidet.
 *
 * Die Überschriften kommen wortweise aus einer Maske hervor: Jedes Wort sitzt
 * in einem `inline-block` mit `overflow: hidden`, und dessen untere Kante
 * schneidet mit. Wie viel Platz darunter bleibt, hängt an drei Werten, die
 * nichts voneinander wissen. Schriftgröße, `line-height` und das Polster der
 * Maske. Ändert jemand einen davon, verschwinden Buchstaben, und zwar nur die
 * mit Unterlänge und nur in manchen Wörtern.
 *
 * Gefunden hat das am 02.08.2026 ein Leser, kein Prüflauf: Das „g" in
 * „fertige" und das „y" in „Prototypen" endeten flach. Gemessen bei 1440 px
 * lagen unter der Grundlinie 16,8 px Platz bei 28 px Tinte der kursiven
 * Auszeichnungsschrift.
 *
 * Gemessen wird die tatsächliche Tinte über `actualBoundingBoxDescent` der
 * jeweils gerenderten Schrift, nicht ein Tabellenwert, denn Grundschrift und
 * kursive Auszeichnung unterscheiden sich hier um ein Drittel.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:headings
 */

import { chromium } from "playwright";
import { FEHLERSEITEN, gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Zwei Breiten: die Schrift skaliert über `clamp`, das Polster über `em`. */
const BREITEN = [1440, 390];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Jede gebaute Seite, ohne die Bau-Interna. */
/* Dazu die Fehlerseite unter beiden Sprachen: Sie steht in keiner Liste
   gebauter Seiten, im Bau liegt sie als `_not-found.html`, und fiel damit
   aus jedem Lauf heraus, der seine Liste aus dem Bau nimmt. Sie ist die
   Seite, die jeder Vertipper zu sehen bekommt. */
const pfade = [...gebauteSeiten(), ...FEHLERSEITEN];

const browser = await chromium.launch();
let fehler = 0;
/** Wörter, die beim Messen noch in Bewegung waren: ein Befund am Lauf. */
let nichtMessbar = 0;

for (const breite of BREITEN) {
  const seite = await browser.newPage({
    viewport: { width: breite, height: 900 },
  });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, {
      waitUntil: "domcontentloaded",
    });
    /* Die Fehlerseite antwortet mit 404, und das ist ihre richtige
     Antwort. Wer hier auf 200 besteht, nimmt sie auf und misst sie nie:
     die Zeile darunter zählte weiter 18 Seiten, obwohl 20 in der Liste
     standen. */
  const erwartet = FEHLERSEITEN.includes(pfad) ? 404 : 200;
  if (!antwort || antwort.status() !== erwartet) continue;

    // Einmal durchscrollen: Die Überschriften unterhalb der Falz erscheinen
    // erst dabei, und vorher haben sie keine gemessene Größe.
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    /*
      Und dann warten, bis die Wörter stehen.

      Der erste Anlauf maß sofort und meldete drei Überschriften auf /en als
      abgeschnitten, mit „nur 0 px Platz", was es gar nicht geben kann. Die
      Wörter waren mitten im Auftritt: Sie kommen von unten aus der Maske
      hervor, und solange sie unterwegs sind, liegt ihre Unterkante unter der
      des Kastens. Gemessen wurde die Bewegung, nicht das Ergebnis.

      Endliche Animationen springen ans Ende, Endlosschleifen bleiben; der
      Rest ist Wartezeit für das, was die Animationsbibliothek über
      requestAnimationFrame fährt und was `getAnimations` deshalb nicht kennt.

      Eine feste Wartezeit reichte dafür nicht.

      Sie stand hier auf 1.400 ms, und lokal ging das immer gut. Auf dem
      Bauserver scheiterte derselbe Lauf am 02.08.2026 an „gebaut." mit
      „12 px Tinte, nur -55,8 px Platz", eine negative Zahl, die es als
      Befund nicht geben kann: Sie heißt, dass das Wort zum Messzeitpunkt
      noch 56 px unter seiner Maske stand, also mitten im Auftritt war.

      Die Wörter im Hero starten gestaffelt, das letzte mit gut einer halben
      Sekunde Verzögerung. Auf einer langsamen Maschine liegt die Hydration
      hinter dem `finish()`-Aufruf: Die Animation entsteht danach neu, läuft
      erneut an, und 1.400 ms treffen genau ihr Ende. Ein Wächter, der je nach
      Maschine etwas anderes meldet, ist kein Wächter.

      Deshalb eine Bedingung statt einer Frist: In Runden wird beendet, was
      endlich ist, und erst weitergemacht, wenn nichts mehr läuft.
    */
    await seite
      .waitForFunction(
        () => {
          for (const bewegung of document.getAnimations()) {
            try {
              bewegung.finish();
            } catch {
              // Endlos, also ohne Endwert.
            }
          }
          return document.getAnimations().every((bewegung) => {
            if (bewegung.playState !== "running") return true;
            // Endlosschleifen (Marquee, Puls) laufen absichtlich weiter.
            return bewegung.effect?.getComputedTiming().iterations === Infinity;
          });
        },
        null,
        { timeout: 20000, polling: 200 },
      )
      .catch(() => {
        // Auch dann noch messen: Der Verschiebungstest unten fängt ab, was
        // sich nicht beruhigt hat, und meldet es als nicht messbar.
      });
    // Rest für das, was die Animationsbibliothek über requestAnimationFrame
    // fährt und was `getAnimations` deshalb nicht kennt.
    await seite.waitForTimeout(1400);

    const { raus: funde, unruhig, geklebt } = await seite.evaluate(() => {
      const messer = document.createElement("canvas").getContext("2d");
      const raus = [];
      const unruhig = [];
      const geklebt = [];

      for (const ueberschrift of document.querySelectorAll("h1, h2, h3")) {
        const masken = [...ueberschrift.querySelectorAll("span")].filter(
          (s) => getComputedStyle(s).overflow === "hidden",
        );

        /* Stehen die Woerter noch auseinander?

           Ein Leerzeichen am Ende eines `inline-block` mit
           `overflow: hidden` wird zusammengefaltet, die Woerter kleben
           dann aneinander. AGENTS.md nennt das als Falle, die hier schon
           zugeschnappt ist, und verlangt deshalb `margin` statt eines
           Leerzeichens. Geprueft hat das bisher niemand.

           Gemessen am 07.08.2026 an der Kopfzeile der Startseite: 24,8 px
           bei 129,6 px Schrift und 8,4 px bei 44 px, beide Male 19 Prozent
           der Schriftgroesse. Verlangt werden 8 Prozent: deutlich unter dem
           gemessenen Wert und weit ueber dem, was ein zusammengefaltetes
           Leerzeichen uebrig laesst, naemlich nichts. Verglichen wird nur
           innerhalb einer Zeile; ein Umbruch ist kein fehlender Abstand. */
        const inZeile = masken
          .map((m) => ({ m, r: m.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0);
        for (let i = 1; i < inZeile.length; i++) {
          const a = inZeile[i - 1];
          const b = inZeile[i];
          if (Math.abs(a.r.top - b.r.top) > 4) continue;
          const groesse = parseFloat(getComputedStyle(b.m).fontSize);
          const abstand = b.r.left - a.r.right;
          if (abstand < groesse * 0.08) {
            geklebt.push({
              woerter: `${(a.m.textContent ?? "").trim()} ${(b.m.textContent ?? "").trim()}`.slice(0, 30),
              abstand: Math.round(abstand * 10) / 10,
              groesse: Math.round(groesse),
            });
          }
        }
        for (const maske of masken) {
          const wort = maske.textContent ?? "";
          if (!/[gyqpjß,;]/.test(wort)) continue;

          const kind = maske.firstElementChild ?? maske;
          const stil = getComputedStyle(kind);

          /* Die Verschiebung wird herausgerechnet, nicht abgewartet.

             `getBoundingClientRect` zählt Transformationen mit. Steht das Wort
             noch unter seiner Maske, kommt eine negative Platzangabe heraus:
             ein Befund, den es so nicht gibt. Auf dem Bauserver meldete der
             Lauf deshalb „gebaut." mit -55,8 px Platz, und auch mit einer
             Wartebedingung blieb dieses eine Wort bei matrix(…, 75,2): Es
             steht dort dauerhaft verschoben, warten hilft nicht.

             Für die Frage, ob die Maske eine Unterlänge abschneidet, ist die
             Verschiebung ohnehin gleichgültig: Geschnitten wird am ruhenden
             Kasten. Aus der Matrix kommt der senkrechte Anteil als sechster
             Wert; er wird abgezogen. Skaliert oder gedreht wird nichts, käme
             so etwas vor, wäre die Rechnung falsch, und der Fall wird als
             nicht messbar gemeldet statt stillschweigend übergangen. */
          let versatzY = 0;
          if (stil.transform !== "none") {
            const werte = /^matrix\(([^)]+)\)$/.exec(stil.transform);
            const zahlen = werte ? werte[1].split(",").map(Number) : null;
            if (
              !zahlen ||
              Math.abs(zahlen[0] - 1) > 0.001 ||
              Math.abs(zahlen[3] - 1) > 0.001
            ) {
              unruhig.push(`${wort.trim().slice(0, 20)} (${stil.transform})`);
              continue;
            }
            versatzY = zahlen[5];
          }
          messer.font = `${stil.fontStyle} ${stil.fontWeight} ${stil.fontSize} ${stil.fontFamily}`;
          const tinte = messer.measureText(wort).actualBoundingBoxDescent;

          // Platz unter der Zeilenbox des Wortes plus der Teil der Unterlänge,
          // der noch in der Zeilenbox selbst liegt. Letzteren liefert die
          // Differenz zwischen Zeilenbox und Inhaltsbox nicht direkt, deshalb
          // wird er über die Schriftmetrik der Zeile geschätzt: `line-height`
          // gegen `font-size`.
          const unterKante =
            maske.getBoundingClientRect().bottom -
            (kind.getBoundingClientRect().bottom - versatzY);
          const groesse = parseFloat(stil.fontSize);
          const zeile = parseFloat(stil.lineHeight) || groesse;
          const inDerZeile =
            Math.max(0, (zeile - groesse) / 2) + groesse * 0.07;

          if (unterKante + inDerZeile < tinte) {
            raus.push({
              wort: wort.trim().slice(0, 20),
              groesse: Math.round(groesse),
              tinte: Math.round(tinte * 10) / 10,
              platz: Math.round((unterKante + inDerZeile) * 10) / 10,
            });
          }
        }
      }
      return { raus, unruhig, geklebt };
    });

    if (geklebt.length > 0) {
      fehler += geklebt.length;
      console.log(`  FEHLER ${pfad} bei ${breite} px: Woerter ohne Abstand`);
      for (const g of geklebt)
        console.log(
          `        „${g.woerter}" bei ${g.groesse} px: ${g.abstand} px Abstand`,
        );
    }

    if (unruhig.length > 0) {
      nichtMessbar += unruhig.length;
      console.log(`  NICHT MESSBAR ${pfad} bei ${breite} px`);
      for (const u of unruhig)
        console.log(`        ${u} stand noch verschoben`);
    }

    if (funde.length > 0) {
      fehler += funde.length;
      console.log(`  FEHLER ${pfad} bei ${breite} px`);
      for (const f of funde) {
        console.log(
          `        „${f.wort}" bei ${f.groesse} px: ${f.tinte} px Tinte, nur ${f.platz} px Platz`,
        );
      }
    }
  }

  await seite.close();
}

/* ---------------------------------------------------------------------------
   Waagerecht abgeschnittener Text

   Die Unterlänge oben ist die senkrechte Hälfte des Problems. Die waagerechte
   trifft dieselbe Sorte Element: Ein einzelnes langes Wort ohne Umbruchpunkt
   passt nicht in seine Spalte, und der Browser schneidet ab, statt umzubrechen.

   Gemessen an der gebauten Seite bei 320 px: „SONNENAUFGANG“,
   „KOHLENHYDRATE“ und „BALLASTSTOFFE“, gesperrte Versalien in einer 94 px
   breiten Spalte, die 96 bräuchten. Bei 768 px blieb eines davon übrig. Kein
   Lauf sah hin, weil beide Breiten zwischen den geprüften 390 und 1440 liegen.

   Elemente mit eigenem Bildlauf bleiben draußen: Ein Codeblock oder eine
   Tabelle darf breiter sein als ihr Rahmen, dafür scrollt sie. */
const SCHMALE_BREITEN = [320, 768];
const beschnitten = [];

for (const breite of SCHMALE_BREITEN) {
  const seite = await browser.newPage({
    viewport: { width: breite, height: 900 },
  });
  for (const pfad of pfade) {
    await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
    await seite.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
    });
    await seite.waitForTimeout(300);
    const funde = await seite.evaluate(() =>
      [...document.querySelectorAll("h1, h2, h3, h4, dt, dd, li, p")]
        .filter((e) => {
          if (e.scrollWidth <= e.clientWidth + 1) return false;
          const s = getComputedStyle(e);
          if (s.overflowX !== "visible" || s.overflow !== "visible")
            return false;
          /* `scrollWidth > clientWidth` allein genügt nicht: Auch ein Absatz,
             der sauber umbricht, meldet das, weil sein längstes unteilbares
             Wort breiter ist als die Spalte. Gemessen am Kurzprofil bei
             320 px waren vier von fünf Meldungen genau das, der Text stand
             lesbar da, nur eben umgebrochen.

             Weg ist er erst, wenn er über den rechten Fensterrand hinausragt:
             Dort schneidet das `overflow-x: clip` an html und body ab, und
             waagerecht scrollen kann niemand. */
          const rand = e.getBoundingClientRect().left + e.scrollWidth;
          return rand > document.documentElement.clientWidth + 1;
        })
        .map(
          (e) =>
            `${e.tagName} „${(e.textContent ?? "").trim().slice(0, 26)}“: ` +
            `${e.clientWidth} px sichtbar, ${e.scrollWidth} nötig`,
        ),
    );
    for (const f of new Set(funde))
      beschnitten.push(`${pfad} bei ${breite} px: ${f}`);
  }
  await seite.close();
}

await browser.close();
beenden();

if (fehler > 0) {
  console.error(
    `\n${fehler} abgeschnittene Unterlänge${fehler === 1 ? "" : "n"}. Das Polster der ` +
      `Maske steht in Hero.tsx und Reveal.tsx als \`pb-[…em]\`, ausgeglichen durch ` +
      `ein gleich großes negatives \`-mb-[…em]\`.`,
  );
}

if (nichtMessbar > 0) {
  console.error(
    `\n${nichtMessbar} ${nichtMessbar === 1 ? "Wort war" : "Wörter waren"} nicht ` +
      `messbar: gedreht oder skaliert, sodass sich die Verschiebung nicht ` +
      `herausrechnen lässt. Das ist ein Befund am Lauf, nicht an der Schrift.`,
  );
}

if (beschnitten.length > 0) {
  console.error(
    `
${beschnitten.length} waagerecht abgeschnittene Stelle(n):
`,
  );
  for (const f of beschnitten) console.error(`  ${f}`);
  console.error(
    `
Ein langes Wort ohne Umbruchpunkt braucht \`break-words\`. Wer den Text ` +
      `abschneiden will, sagt das mit einem eigenen Bildlauf.`,
  );
}

if (fehler > 0 || nichtMessbar > 0 || beschnitten.length > 0) process.exit(1);

console.log(
  `Keine abgeschnittene Unterlänge: ${pfade.length} Seiten × ${BREITEN.length} Breiten geprüft, ` +
    `nichts waagerecht beschnitten bei ${SCHMALE_BREITEN.join(" und ")} px, ` +
    `keine zwei Wörter ohne Abstand.`,
);
