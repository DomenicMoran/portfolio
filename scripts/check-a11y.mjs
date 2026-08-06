#!/usr/bin/env node
/**
 * Prüft jede gebaute Seite mit axe-core gegen WCAG 2.2 AA.
 *
 * Warum ein eigener Lauf, obwohl es schon Prüfungen für Druckbild, Unterlängen
 * und Zahlen gibt: Die messen je eine Sache, die einmal falsch war. axe prüft
 * gut hundert Regeln auf einmal und findet damit auch das, wonach hier noch
 * niemand gesucht hat — fehlende Beschriftungen, zu schwache Kontraste,
 * Überschriften-Sprünge, doppelte Kennungen, Landmarken ohne Namen.
 *
 * Gemessen wird die ausgelieferte Seite im Browser, nicht das Bauteil: Ein
 * `aria-label` im Quelltext sagt nichts darüber, was am Ende im
 * Barrierefreiheitsbaum steht.
 *
 * Zwei Breiten, weil sich das Layout unterscheidet und mit ihm die
 * Trefferflächen und die Kontraste über Verläufen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:a11y
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

const require = createRequire(import.meta.url);
const axeQuelle = readFileSync(require.resolve("axe-core"), "utf8");

/** Dieselben zwei Breiten wie beim Unterlängen-Lauf. */
const BREITEN = [1440, 390];

/**
 * Welche Regelwerke gelten.
 *
 * WCAG 2.2 AA ist der Maßstab, auf den sich europäische Vergaben und das BFSG
 * beziehen. `best-practice` bleibt draußen: Darin stecken Empfehlungen, die
 * keine Norm verlangt, und ein Lauf, der ständig etwas meldet, wird abgestellt.
 */
const REGELWERKE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Jede gebaute Seite, ohne die Bau-Interna. */
const pfade = gebauteSeiten();

/*
  Die 404-Seite über eine erfundene Adresse, nicht über ihre Datei.

  Sie liegt als `_not-found.html` im Bau und fällt damit durch das Filter, das
  Bau-Interna auslässt — der erste Lauf dieses Wächters prüfte sie deshalb
  nicht. Ausgerechnet die Seite, die jeder Vertipper zu sehen bekommt. Über eine
  erfundene Adresse kommt sie so heraus, wie Next sie ausliefert, samt eigenem
  Dokument und Sprachauszeichnung.
*/
const UNBEKANNTE_ADRESSE = "/diese-adresse-gibt-es-nicht";
/*
  Und einmal unterhalb von `/en`: Das ist eine andere Antwort. Die 404-Seite
  liest die Sprache aus einer Kopfzeile, die der Proxy setzt, und rendert
  englischen Text mit `lang="en"`. Ohne diesen Pfad pruefte der Waechter nur
  die Haelfte der Seite, die jeder Vertipper zu sehen bekommt.
*/
const UNBEKANNTE_ADRESSE_EN = "/en/this-address-does-not-exist";
pfade.push(UNBEKANNTE_ADRESSE, UNBEKANNTE_ADRESSE_EN);

const browser = await chromium.launch();
let verstoesse = 0;
let geprueft = 0;

/* ---------------------------------------------------------------------------
   Nichts, was dasteht, darf unsichtbar sein.

   axe prüft Kontrast, aber es gibt genau dort auf, wo dieses Layout arbeitet:
   Bei halbdurchsichtigen Flächen wie `bg-surface/50` kann es den Untergrund
   nicht bestimmen und meldet „unvollständig" statt „Verstoß". Der Lauf blieb
   dadurch grün, während in der Gebetszeiten-Kachel eine Zahl in der Farbe des
   Hintergrunds stand: `text-base` ist in diesem Farbsystem nicht nur eine
   Schriftgröße, sondern auch die Farbe `--color-base`, und in der Reihenfolge
   der Stilvorlage gewinnt sie gegen `text-acid`. Gemessen 1,04:1.

   Eine absichtlich stumpfe Grenze: Was unter 2:1 liegt, ist nicht schwer
   lesbar, sondern nicht vorhanden. Alles darüber bleibt axes Sache — diese
   Prüfung soll nicht zweimal dasselbe entscheiden.
   ------------------------------------------------------------------------ */
const UNSICHTBAR_AB = 2;
const unsichtbar = [];

/**
 * Misst eine Seite, die bereits geladen, durchgescrollt und ausanimiert ist.
 *
 * Läuft in der Hauptschleife mit, statt die zwanzig Seiten ein zweites Mal zu
 * laden. Der eigene Durchgang wiederholte Aufruf, Scrollen und Warten, was
 * oben ohnehin geschieht, und kostete davon rund siebzig der 213 Sekunden
 * Laufzeit.
 */
async function unsichtbarPruefen(seite, pfad) {
  const funde = await seite.evaluate((grenze) => {
    // Farben über einen Canvas auflösen: Der kennt jeden Farbraum, den auch
    // die Stilvorlage benutzen darf, und liefert immer RGBA.
    const flaeche = document.createElement("canvas");
    flaeche.width = flaeche.height = 1;
    const stift = flaeche.getContext("2d", { willReadFrequently: true });
    const zuRgba = (farbe) => {
      stift.clearRect(0, 0, 1, 1);
      stift.fillStyle = farbe;
      stift.fillRect(0, 0, 1, 1);
      const d = stift.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const ueber = (vorne, hinten) =>
      [0, 1, 2].map((i) => vorne[i] * vorne[3] + hinten[i] * (1 - vorne[3]));
    const helligkeit = ([r, g, b]) => {
      const f = (x) => {
        x /= 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const untergrund = (el) => {
      const stapel = [];
      for (let n = el; n; n = n.parentElement) {
        stapel.push(zuRgba(getComputedStyle(n).backgroundColor));
      }
      let unten = [8, 8, 10];
      for (let i = stapel.length - 1; i >= 0; i--) unten = ueber(stapel[i], unten);
      return unten;
    };

    const raus = [];
    for (const el of document.querySelectorAll("body *")) {
      const eigen = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(" ")
        .trim();
      if (!eigen) continue;

      const stil = getComputedStyle(el);
      if (stil.display === "none" || stil.visibility === "hidden") continue;
      if (el.getBoundingClientRect().width === 0) continue;
      // Was durchsichtig ist, ist eine Gestaltung und kein Fehler; das greift
      // die Regel „nichts unsichtbar ohne JavaScript" weiter unten.
      let deckung = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        deckung *= parseFloat(getComputedStyle(n).opacity);
      }
      if (deckung < 0.95) continue;
      if (el.closest("[aria-hidden='true'], .sr-only")) continue;

      const vorne = zuRgba(stil.color);
      if (vorne[3] < 0.95) continue;
      const hinten = untergrund(el);
      const a = helligkeit(ueber(vorne, hinten));
      const b = helligkeit(hinten);
      const verhaeltnis = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (verhaeltnis < grenze) {
        raus.push({
          text: eigen.slice(0, 40),
          farbe: stil.color,
          grund: `rgb(${hinten.map(Math.round).join(", ")})`,
          wert: Math.round(verhaeltnis * 100) / 100,
          klasse: String(el.className).slice(0, 60),
        });
      }
    }
    return raus;
  }, UNSICHTBAR_AB);

  for (const f of funde) {
    unsichtbar.push(
      `${pfad}: „${f.text}" steht in ${f.farbe} auf ${f.grund} — ` +
        `${f.wert}:1 (class="${f.klasse}")`,
    );
  }
}

for (const breite of BREITEN) {
  const seite = await browser.newPage({
    viewport: { width: breite, height: 900 },
  });
  await seite.addInitScript({ content: axeQuelle });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, {
      waitUntil: "domcontentloaded",
    });
    if (!antwort || antwort.status() >= 500) continue;

    // Die erfundene Adresse muss mit 404 antworten. Ein 200 hiesse, dass eine
    // Route sie doch bedient, und dann prüft dieser Durchgang etwas anderes
    // als die 404-Seite.
    if (
      (pfad === UNBEKANNTE_ADRESSE || pfad === UNBEKANNTE_ADRESSE_EN) &&
      antwort.status() !== 404
    ) {
      console.error(`  ${pfad} antwortet mit ${antwort.status()} statt 404.`);
      verstoesse++;
      continue;
    }

    /*
      Erst durchscrollen, dann messen.

      Die Abschnitte unterhalb der Falz stehen bis zum Hineinscrollen auf
      `opacity: 0`, und axe überspringt, was nicht sichtbar ist. Ohne diesen
      Durchlauf prüfte der Lauf die halbe Seite und meldete trotzdem "sauber" —
      derselbe blinde Fleck, an dem der Druck-Wächter schon einmal hing.
    */
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    /*
      Auf gerechnete Kacheln warten, bevor gemessen wird.

      Die Gebetszeiten-Kachel lädt ihre Bibliothek erst beim Hineinscrollen und
      füllt ihre Felder danach. Wer vorher misst, misst leere Felder — und
      leerer Text hat keinen Kontrast. Genau so ging eine Zahl in der Farbe des
      Hintergrunds durch diesen Lauf: `text-base` ist in diesem Farbsystem
      nicht nur eine Schriftgröße, sondern auch eine Farbe (`--color-base`),
      und sie gewann gegen `text-acid`. Auf dem Bildschirm stand die Spanne
      damit unsichtbar da, und hier hieß es „keine Verstöße".

      `data-demo-fertig` setzt die Kachel selbst, sobald gerechnet ist. Fehlt
      sie auf einer Seite, wartet niemand.
    */
    if (await seite.locator("[data-demo-fertig], .lit input[type=range]").count()) {
      await seite
        .waitForSelector("[data-demo-fertig]", { timeout: 15_000 })
        .catch(() => {
          throw new Error(
            `${pfad}: Die Vorführung hat nach 15 s nicht gerechnet. ` +
              `Gemessen würde eine Kachel mit leeren Feldern.`,
          );
        });
    }

    // Endliche Animationen ans Ende setzen: Ein Element mitten im Auftritt hat
    // eine andere Deckkraft, und daran hängt die Kontrastmessung.
    await seite.evaluate(() => {
      for (const bewegung of document.getAnimations()) {
        try {
          bewegung.finish();
        } catch {
          /* Endlosschleifen haben kein Ende. */
        }
      }
    });
    await seite.waitForTimeout(500);

    /* Der Kontrastblock läuft hier mit, an derselben fertigen Seite. Nur auf
       einer Breite: Farbe und Untergrund hängen nicht am Layout, und ein
       zweiter Durchgang fände dieselben Stellen noch einmal. */
    if (breite === BREITEN[0]) await unsichtbarPruefen(seite, pfad);

    const ergebnis = await seite.evaluate(
      (regelwerke) =>
        window.axe.run(document, {
          runOnly: { type: "tag", values: regelwerke },
        }),
      REGELWERKE,
    );

    geprueft++;
    if (ergebnis.violations.length === 0) continue;

    verstoesse += ergebnis.violations.length;
    console.log(`  FEHLER ${pfad} bei ${breite} px`);
    for (const v of ergebnis.violations) {
      console.log(`        ${v.id} (${v.impact}): ${v.help}`);
      for (const knoten of v.nodes.slice(0, 3)) {
        console.log(`          ${knoten.target.join(" ")}`);
        const grund = knoten.failureSummary?.split("\n").filter(Boolean)[1];
        if (grund) console.log(`          ${grund.trim().slice(0, 110)}`);
      }
      if (v.nodes.length > 3)
        console.log(`          … und ${v.nodes.length - 3} weitere Stellen`);
    }
  }

  await seite.close();
}

/* ---------------------------------------------------------------------------
   Lesbar ohne JavaScript

   Die Einblendungen unterhalb der Falz starten mit `opacity: 0` und werden von
   Framer Motion sichtbar gemacht, sobald der Abschnitt ins Bild kommt. Läuft
   kein JavaScript, passiert das nie: Gemessen an der gebauten Startseite
   blieben nach vollständigem Durchscrollen 160 von 181 Überschriften und
   Faktenzeilen unsichtbar. Der Text steht im HTML, er wird nur nicht gezeigt.

   Betroffen sind Firmennetze, die Skripte filtern, und alles, was eine Seite
   liest, ohne sie auszuführen. Für einen Recruiter, der die Seite im
   Unternehmensnetz öffnet, ist das der Unterschied zwischen einem Portfolio
   und einer fast leeren Seite.

   Geprüft wird die Startseite, weil dort jedes Bewegungsmuster der Seite
   mindestens einmal vorkommt. */
const ohneSkript = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const seite = await kontext.newPage();
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });

  const versteckt = await seite.evaluate(() => {
    const wichtig = [
      ...document.querySelectorAll("h1, h2, h3, dt, dd, p, li, a"),
    ];
    const raus = [];
    for (const element of wichtig) {
      let knoten = element;
      let deckung = 1;
      while (knoten && knoten !== document.body) {
        deckung *= parseFloat(getComputedStyle(knoten).opacity || "1");
        knoten = knoten.parentElement;
      }
      if (deckung < 0.5) {
        raus.push((element.textContent ?? "").trim().slice(0, 40));
      }
    }
    return raus;
  });

  if (versteckt.length) {
    ohneSkript.push(
      `${versteckt.length} Textelemente bleiben ohne JavaScript unsichtbar`,
      ...versteckt.slice(0, 5).map((t) => `    „${t}“`),
    );
  }

  await kontext.close();
}

/* ---------------------------------------------------------------------------
   Wartezeit, die nur aus einer Animation kommt

   `prefers-reduced-motion` nimmt die Bewegung heraus — die Zeit nimmt es nicht
   mit. Bei den Reitern der Fallstudien blendet `AnimatePresence mode="wait"`
   die alte Tafel aus, bevor die neue kommt; gemessen dauerte der Wechsel mit
   der Einstellung 452 ms und ohne sie 439. Wer Bewegung abstellt, wartete also
   genauso lang auf eine Animation, die er gar nicht sieht.

   Geprueft wird das Ergebnis und nicht die Umsetzung: Nach dem Klick auf einen
   Reiter muss die zugehoerige Tafel da sein, und zwar schnell. Die Grenze ist
   grosszuegig — sie soll eine halbe Sekunde Animation finden, nicht ein paar
   Millisekunden Renderzeit. */
const GRENZE_MS = 200;
const wartefunde = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const seite = await kontext.newPage();
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });

  for (const liste of await seite.locator("[role=tablist]").all()) {
    const name = (await liste.getAttribute("aria-label")) ?? "?";
    const reiter = await liste.locator("[role=tab]").all();
    if (reiter.length < 2) continue;

    await liste.scrollIntoViewIfNeeded();
    const zweiter = reiter[1];
    const kennung = await zweiter.getAttribute("id");
    const beginn = Date.now();
    await zweiter.click();

    let dauer = null;
    for (let versuch = 0; versuch < 40; versuch++) {
      const jetzt = await seite.evaluate(
        (id) =>
          document
            .querySelector(`[role="tabpanel"][aria-labelledby="${id}"]`)
            ?.getAttribute("aria-labelledby") ?? null,
        kennung,
      );
      if (jetzt === kennung) {
        dauer = Date.now() - beginn;
        break;
      }
      await seite.waitForTimeout(25);
    }

    if (dauer === null || dauer > GRENZE_MS) {
      wartefunde.push(
        `${name}: die Tafel steht erst nach ${dauer ?? "über 1.000"} ms, ` +
          `Grenze ${GRENZE_MS} ms bei reduzierter Bewegung`,
      );
    }
  }

  await kontext.close();
}

if (ohneSkript.length > 0) {
  console.error(`
${ohneSkript[0]}:
`);
  for (const f of ohneSkript.slice(1)) console.error(`  ${f}`);
}

if (wartefunde.length > 0) {
  console.error(
    `\n${wartefunde.length} ${wartefunde.length === 1 ? "Stelle" : "Stellen"} ` +
      `mit Wartezeit, die nur aus einer Animation kommt:\n`,
  );
  for (const f of wartefunde) console.error(`  ${f}`);
}

/* ------------------------------------------------------------------
   Zielgröße auf dem Telefon, WCAG 2.2 Erfolgskriterium 2.5.8 (AA).

   Warum das hier von Hand steht, obwohl axe oben läuft: axe prüft die Regel
   nicht. Sie verlangt Geometrie über den ganzen Baum hinweg — Größe eines
   Ziels und Abstand zum nächsten —, und genau das kann ein Regelwerk, das
   Knoten einzeln ansieht, nicht entscheiden.

   Gemessen wird bei 390 px, weil die Regel für Zeigegeräte gilt und der
   Finger das gröbste davon ist. Beide Ausnahmen der Norm sind abgebildet:

   - **Inline.** Ein Verweis mitten in einem Satz darf klein sein; der Satz
     bestimmt seine Größe, nicht der Gestalter.
   - **Abstand.** Ein kleines Ziel ist zulässig, solange ein Kreis von 24 px
     Durchmesser um seinen Mittelpunkt kein anderes Ziel schneidet. Ein
     einzelner kleiner Knopf mit Luft ringsum ist also in Ordnung, zwei
     kleine nebeneinander sind es nicht.

   Zum Zeitpunkt des Einbaus gemessen: sechs Seiten, kein Verstoß. Die
   kleinsten Ziele im Recruiter-Bereich sind 37 px hoch und liegen damit über
   der Grenze — die Prüfung steht hier, damit das so bleibt.
------------------------------------------------------------------ */

const ZIELGROESSE = 24;
const zielfunde = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const seite = await kontext.newPage();

  for (const pfad of pfade) {
    await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });

    /* Durchscrollen, bevor gemessen wird: Was `whileInView` einblendet, hat
       vorher die Höhe null und käme als Verstoß heraus. */
    const hoehe = await seite.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < hoehe; y += 600) {
      await seite.evaluate((y) => scrollTo(0, y), y);
      await seite.waitForTimeout(40);
    }
    await seite.waitForTimeout(300);

    const funde = await seite.evaluate((grenze) => {
      const ziele = [
        ...document.querySelectorAll(
          "a[href], button, input, select, textarea, [role=button], [role=tab], [role=option], [tabindex='0']",
        ),
      ].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      const raus = [];
      for (const e of ziele) {
        const r = e.getBoundingClientRect();
        if (r.width >= grenze && r.height >= grenze) continue;

        const eltern = e.parentElement;
        const imSatz =
          eltern &&
          /^(P|LI|SPAN|TD|H1|H2|H3|H4|H5|H6)$/.test(eltern.tagName) &&
          eltern.innerText.trim().length >
            (e.innerText?.trim().length ?? 0) + 8;
        if (imSatz) continue;

        const mitte = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        const eng = ziele.some((a) => {
          if (a === e) return false;
          const b = a.getBoundingClientRect();
          const dx = Math.max(b.left - mitte.x, 0, mitte.x - b.right);
          const dy = Math.max(b.top - mitte.y, 0, mitte.y - b.bottom);
          return Math.hypot(dx, dy) < grenze / 2;
        });
        if (!eng) continue;

        const name = (
          e.innerText ||
          e.getAttribute("aria-label") ||
          e.getAttribute("title") ||
          e.tagName
        )
          .trim()
          .slice(0, 30);
        raus.push(`„${name}" ${Math.round(r.width)}×${Math.round(r.height)} px`);
      }
      return [...new Set(raus)];
    }, ZIELGROESSE);

    for (const f of funde) zielfunde.push(`${pfad}: ${f}`);
  }

  await kontext.close();
}

if (zielfunde.length > 0) {
  console.error(
    `\n${zielfunde.length} ${zielfunde.length === 1 ? "Ziel" : "Ziele"} unter ` +
      `${ZIELGROESSE}×${ZIELGROESSE} px ohne genügend Abstand (WCAG 2.5.8), gemessen auf 390 px:\n`,
  );
  for (const f of zielfunde) console.error(`  ${f}`);
}

/* ------------------------------------------------------------------
   Bei reduzierter Bewegung darf kein Inhalt auf eine Uhr warten.

   `prefers-reduced-motion` heißt nicht „langsamer", sondern „zeig mir das
   Ergebnis, nicht den Weg dorthin". Wer die Einstellung setzt, tut das oft
   nicht aus Geschmack: Bewegung kann Schwindel und Übelkeit auslösen.

   Die Regel oben prüft die Reiterleisten, also eine Wartezeit nach einem
   Klick. Hier geht es um die stillere Hälfte: Text, der von allein nachrückt.
   Der Terminalkasten im Abschnitt „Arbeitsweise" füllte sich Zeile für Zeile,
   alle 620 ms eine — gemessen 6,7 Sekunden bis zum Endstand, und bei
   abgeschalteter Bewegung genauso lange. Nach dem Eingriff: 218 ms.

   Gemessen wird die Textmenge zweimal, mit acht Sekunden Abstand, nachdem die
   Seite einmal durchgescrollt wurde. Bleibt sie gleich, wartet nichts.
------------------------------------------------------------------ */

const WACHSTUM = 40;
const uhrfunde = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const seite = await kontext.newPage();

  for (const pfad of pfade) {
    await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });

    /* Einmal durch, damit alles eingehängt ist, was auf das Hineinscrollen
       wartet — sonst misst der Lauf eine Seite, die noch gar nicht angefangen
       hat. */
    await seite.evaluate(async () => {
      const hoehe = document.documentElement.scrollHeight;
      for (let y = 0; y < hoehe; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
      window.scrollTo(0, 0);
    });

    const laenge = () =>
      seite.evaluate(() => document.body.innerText.replace(/\s+/g, " ").length);

    /* In Schritten statt einmal acht Sekunden warten.
       Eine zeitgesteuerte Folge rückt regelmäßig nach, die erste Änderung
       kommt lange vor dem Ende — beim Terminalkasten nach 620 ms. Wer bis
       zum Schluss wartet, misst dasselbe und kostet auf zwanzig Seiten
       160 Sekunden. Der Lauf hört auf, sobald er etwas gefunden hat, und
       nach spätestens drei. Gegengeprüft mit dem Terminalkasten vor seinem
       Eingriff: Er rückte alle 620 ms nach und wurde in der ersten Sekunde
       gefunden. */
    await seite.waitForTimeout(400);
    const vorher = await laenge();
    let nachher = vorher;
    for (let schritt = 0; schritt < 3; schritt++) {
      await seite.waitForTimeout(1000);
      nachher = await laenge();
      if (nachher - vorher > WACHSTUM) break;
    }

    if (nachher - vorher > WACHSTUM) {
      uhrfunde.push(
        `${pfad}: ${nachher - vorher} Zeichen kamen von allein dazu ` +
          `(${vorher} → ${nachher})`,
      );
    }
  }

  await kontext.close();
}

if (uhrfunde.length > 0) {
  console.error(
    `\n${uhrfunde.length} ${uhrfunde.length === 1 ? "Seite" : "Seiten"} ` +
      `füllen sich bei reduzierter Bewegung weiterhin zeitgesteuert:\n`,
  );
  for (const f of uhrfunde) console.error(`  ${f}`);
}

/* ------------------------------------------------------------------
   Die Beschriftungen der Architekturbilder müssen lesbar bleiben.

   Sie stehen in einem SVG mit `viewBox`, rechnen also in eigenen Einheiten:
   Was dort „10" heißt, wird auf dem Bildschirm zu 10 mal dem Faktor, mit dem
   das Bild skaliert. Der Faktor hängt an der Breite des Kastens, und der
   ändert sich mit dem Fenster — eine Schriftgröße, die am Desktop stimmt,
   kann auf einem Telefon unter jede Lesbarkeit fallen, ohne dass im Quelltext
   irgendetwas anders aussieht.

   Genau das war der Fall: bei 720 px Mindestbreite standen auf einem Telefon
   16 der 29 Beschriftungen unter 9 px, die kleinste bei 7,8. Am Desktop waren
   es 12,5 px und keine darunter. Kein Regelwerk schlägt hier an — WCAG kennt
   keine Mindestschriftgröße —, und gesehen hätte es nur jemand, der das Bild
   auf einem Telefon aufklappt.

   Geprüft wird bei 390 px an allen vier Bildern der Startseite. Sie stehen
   hinter einem Reiter und sind im ausgelieferten HTML nicht enthalten; der
   Lauf klappt sie auf.
------------------------------------------------------------------ */

const SCHRIFTGRENZE = 9;
const diagrammfunde = [];

{
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const seite = await kontext.newPage();
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });

  const hoehe = await seite.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < hoehe; y += 600) {
    await seite.evaluate((y) => scrollTo(0, y), y);
    await seite.waitForTimeout(40);
  }
  await seite.waitForTimeout(300);

  for (const reiter of await seite.locator('[id$="-tab-architecture"]').all()) {
    const kennung = (await reiter.getAttribute("id")) ?? "?";
    const fall = kennung.replace("-tab-architecture", "");
    await reiter.click();
    await seite.waitForTimeout(350);

    const messung = await seite.evaluate((fall) => {
      const svg = document.getElementById(`${fall}-panel`)?.querySelector("svg");
      if (!svg) return null;
      const breite = svg.getBoundingClientRect().width;
      const einheiten = Number(svg.getAttribute("viewBox")?.split(" ")[2] ?? 0);
      if (!breite || !einheiten) return null;
      const faktor = breite / einheiten;
      const groessen = [...svg.querySelectorAll("text")].map(
        (t) => parseFloat(getComputedStyle(t).fontSize) * faktor,
      );
      return {
        kleinste: Math.min(...groessen),
        anzahl: groessen.length,
      };
    }, fall);

    if (!messung) continue;
    if (messung.kleinste < SCHRIFTGRENZE) {
      const klein = await seite.evaluate(
        ([fall, grenze]) => {
          const svg = document
            .getElementById(`${fall}-panel`)
            .querySelector("svg");
          const faktor =
            svg.getBoundingClientRect().width /
            Number(svg.getAttribute("viewBox").split(" ")[2]);
          return [...svg.querySelectorAll("text")].filter(
            (t) => parseFloat(getComputedStyle(t).fontSize) * faktor < grenze,
          ).length;
        },
        [fall, SCHRIFTGRENZE],
      );
      diagrammfunde.push(
        `${fall}: kleinste Beschriftung ${messung.kleinste.toFixed(1)} px, ` +
          `${klein} von ${messung.anzahl} unter ${SCHRIFTGRENZE} px`,
      );
    }
  }

  await kontext.close();
}

if (diagrammfunde.length > 0) {
  console.error(
    `\n${diagrammfunde.length} Architekturbild(er) mit Beschriftungen unter ` +
      `${SCHRIFTGRENZE} px auf 390 px:\n`,
  );
  for (const f of diagrammfunde) console.error(`  ${f}`);
}

if (unsichtbar.length > 0) {
  console.error(
    `\n${unsichtbar.length} Stelle(n) mit Text unter ${UNSICHTBAR_AB}:1, ` +
      `also praktisch unsichtbar:\n`,
  );
  for (const f of unsichtbar) console.error(`  ${f}`);
}

/* ---------------------------------------------------------------------------
   Was sich beim Bedienen ändert, wird angesagt.

   Drei Stellen auf dieser Seite tauschen beim Tippen oder Klicken ihre Werte,
   ohne dass sich das Layout ändert: die Befehlspalette filtert von 23
   Einträgen herunter, die Tagesbilanz rechnet ihre Summe neu, und die
   Gebetszeiten wechseln Ort und Regel. Wer sieht, merkt es sofort; wer sich
   vorlesen lässt, hört ohne Live-Region gar nichts — bei der Palette nicht
   einmal, dass nichts mehr übrig ist.

   Alle drei sind versorgt. Dieser Block hält es fest: Eine Region, die jemand
   beim Umbauen verliert, fällt sonst erst auf, wenn sich jemand beschwert.
   ------------------------------------------------------------------------ */
const ANSAGEFUNDE = [];
{
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const seite = await kontext.newPage();
  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await seite.waitForTimeout(600);

  /* Die Tagesbilanz: eine Ansage mit Zahl, sobald ein Gericht abgewählt ist. */
  const bilanz = await seite.evaluate(() => {
    const kachel = [...document.querySelectorAll("div.lit")].find((k) =>
      k.querySelector('[aria-pressed]'),
    );
    if (!kachel) return "Kachel nicht gefunden";
    const st = kachel.querySelector('[role="status"]');
    return st ? st.textContent.trim() : "keine Region";
  });
  if (!/\d/.test(bilanz)) {
    ANSAGEFUNDE.push(`Tagesbilanz: ${bilanz}`);
  }

  /* Die Befehlspalette: eine Ansage, auch wenn nichts übrig bleibt. */
  await seite.keyboard.press("Control+k");
  await seite.waitForTimeout(400);
  await seite.keyboard.type("xyzq");
  await seite.waitForTimeout(400);
  const palette = await seite.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return "Palette öffnet nicht";
    const st = dlg.querySelector('[role="status"]');
    return st ? st.textContent.trim() : "keine Region";
  });
  if (!/\d/.test(palette)) {
    ANSAGEFUNDE.push(`Befehlspalette: ${palette}`);
  }

  await kontext.close();
}

if (ANSAGEFUNDE.length > 0) {
  console.error(
    `
${ANSAGEFUNDE.length} Bereich(e) ändern beim Bedienen ihre Werte, ohne ` +
      `es anzusagen:
`,
  );
  for (const f of ANSAGEFUNDE) console.error(`  ${f}`);
}

/* ---------------------------------------------------------------------------
   Ein Bereich mit eigenem Bildlauf braucht Tastatur und Namen

   Die Artikel zeigen Code, und Code ist breiter als ein Telefon: Gemessen bei
   390 px sind von den Blöcken zwischen 53 und 100 Prozent zu sehen, der Rest
   liegt hinter einem eigenen Bildlauf. Wer keine Maus benutzt, kommt nur
   heran, wenn der Bereich den Fokus annehmen kann — sonst fehlt ihm die
   Hälfte des Belegs, um den es im Artikel geht.

   Und er braucht einen Namen. Ein Vorleseprogramm sagt sonst „Region" und
   lässt offen, was darin steht; mit Namen sagt es „food-orders/route.ts: Kein
   Abschluss ohne Signatur". axe prüft die Fokussierbarkeit solcher Bereiche
   (`scrollable-region-focusable`), den Namen nicht.

   Zum Zeitpunkt des Einbaus gemessen: 14 Bereiche über beide Sprachfassungen,
   alle mit `tabindex` und Namen. Die Prüfung steht hier, damit das so
   bleibt — ein neuer Codeblock ohne Beschriftung fiele sonst niemandem auf. */
const BILDLAUFFUNDE = [];

{
  const seite = await browser.newPage({ viewport: { width: 390, height: 844 } });

  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
    if (!antwort || antwort.status() !== 200) continue;

    await seite.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
    });
    await seite.waitForTimeout(300);

    const funde = await seite.evaluate(() => {
      const raus = [];
      for (const el of document.querySelectorAll("body *")) {
        const stil = getComputedStyle(el);
        const waagerecht =
          (stil.overflowX === "auto" || stil.overflowX === "scroll") &&
          el.scrollWidth > el.clientWidth + 4;
        const senkrecht =
          (stil.overflowY === "auto" || stil.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight + 4;
        if (!waagerecht && !senkrecht) continue;

        const name =
          el.getAttribute("aria-label") ??
          (el.getAttribute("aria-labelledby")
            ? (document.getElementById(el.getAttribute("aria-labelledby"))?.textContent ?? "")
            : "");
        const kennung =
          `${el.tagName.toLowerCase()}` +
          `${el.className ? "." + el.className.toString().split(" ")[0] : ""}`;

        if (el.tabIndex < 0) {
          raus.push(`${kennung} nimmt den Fokus nicht an`);
        } else if (!name.trim()) {
          raus.push(`${kennung} hat keinen Namen`);
        }
      }
      return [...new Set(raus)];
    });

    for (const f of funde) BILDLAUFFUNDE.push(`${pfad}: ${f}`);
  }

  await seite.close();
}

if (BILDLAUFFUNDE.length > 0) {
  console.error(
    `\n${BILDLAUFFUNDE.length} Bereich(e) mit eigenem Bildlauf sind ohne Maus ` +
      `nicht zu erreichen oder ohne Namen:\n`,
  );
  for (const f of BILDLAUFFUNDE) console.error(`  ${f}`);
}

/* ---------------------------------------------------------------------------
   Reflow bei 320 px, WCAG 2.2 Erfolgskriterium 1.4.10 (AA)

   Das Kriterium nennt eine Zahl, und die ist nicht 390: Inhalt muss sich bei
   320 CSS-Pixeln Breite darstellen lassen, ohne dass in zwei Richtungen
   gescrollt werden muss. 320 px ist keine willkürliche Grenze, sondern ein
   Telefon bei 400 % Zoom — also das, was jemand mit schwacher Sehkraft
   tatsächlich vor sich hat.

   Dieser Lauf misst 1440 und 390. Vier andere Läufe messen 320 (`check:nbsp`,
   `check:separators`, `check:font-size`, `check:headings`), aber alle vier
   prüfen dort Typografie, keiner das Scrollen. Ausgerechnet der Lauf, der
   WCAG im Namen führt, sah die Breite nie an.

   Geprüft wird genau das, was das Kriterium verlangt: dass das Dokument nicht
   waagerecht scrollt. Nicht, ob einzelne Elemente über den Rand ragen — das
   tun der Glühkreis und die Laufschrift mit Absicht, beide sind geclippt, und
   eine Liste von Ausnahmen wäre eine Liste, die veraltet. Gemessen beim
   Einbau: alle Seiten bei 310 px Inhaltsbreite auf 320 px Sichtfeld.
   ------------------------------------------------------------------------ */
const REFLOW_BREITE = 320;
const reflowfunde = [];
{
  const seite = await browser.newPage({
    viewport: { width: REFLOW_BREITE, height: 800 },
  });
  for (const pfad of pfade) {
    const antwort = await seite.goto(`${basis}${pfad}`, {
      waitUntil: "networkidle",
    });
    if (!antwort) continue;
    /* Einmal durchscrollen: Was erst beim Hineinscrollen erscheint, kann
       auch erst dann in die Breite gehen. */
    await seite.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, 0);
    });
    await seite.waitForTimeout(300);
    const masse = await seite.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      sicht: document.documentElement.clientWidth,
    }));
    if (masse.scroll > masse.sicht + 1) {
      reflowfunde.push(
        `${pfad}: ${masse.scroll} px Inhalt auf ${masse.sicht} px Sichtfeld — ` +
          `waagerechtes Scrollen bei ${REFLOW_BREITE} px`,
      );
    }
  }
  await seite.close();
}

if (reflowfunde.length > 0) {
  console.error(
    `\n${reflowfunde.length} Seite(n) verlangen bei ${REFLOW_BREITE} px ` +
      `Scrollen in zwei Richtungen (WCAG 1.4.10):\n`,
  );
  for (const f of reflowfunde) console.error(`  ${f}`);
}

await browser.close();
beenden();

/* Getrennt gezählt und getrennt benannt: WCAG 2.2 AA kennt keine Regel gegen
   Wartezeit, und ein Befund unter falscher Flagge ist schwerer zu beurteilen
   als einer unter eigener. Rot wird der Lauf trotzdem. */
if (verstoesse > 0) {
  console.error(
    `\n${verstoesse} ${verstoesse === 1 ? "Verstoß" : "Verstöße"} gegen ` +
      `WCAG 2.2 AA. Gemessen an der gebauten Seite im Browser, nicht am ` +
      `Quelltext.`,
  );
}

if (
  verstoesse > 0 ||
  wartefunde.length > 0 ||
  reflowfunde.length > 0 ||
  ohneSkript.length > 0 ||
  zielfunde.length > 0 ||
  uhrfunde.length > 0 ||
  diagrammfunde.length > 0 ||
  unsichtbar.length > 0 ||
  ANSAGEFUNDE.length > 0 ||
  BILDLAUFFUNDE.length > 0
)
  process.exit(1);

console.log(
  `Keine Verstöße gegen WCAG 2.2 AA: ${geprueft} Seitenaufrufe ` +
    `(${pfade.length} Seiten × ${BREITEN.length} Breiten) mit axe-core geprüft, ` +
    `dazu ${pfade.length} Seiten bei ${REFLOW_BREITE} px ohne Scrollen in zwei Richtungen. ` +
    `Keine Wartezeit aus einer Animation bei reduzierter Bewegung, ` +
    `nichts unsichtbar ohne JavaScript, kein Ziel unter ${ZIELGROESSE} px ohne Abstand, ` +
    `nichts füllt sich bei reduzierter Bewegung von allein nach, ` +
    `keine Diagrammbeschriftung unter ${SCHRIFTGRENZE} px auf dem Telefon, ` +
    `nichts unter ${UNSICHTBAR_AB}:1 gegen seinen Untergrund, ` +
    `was sich beim Bedienen ändert, wird angesagt, ` +
    `und jeder Bereich mit eigenem Bildlauf ist ohne Maus erreichbar und benannt.`,
);
