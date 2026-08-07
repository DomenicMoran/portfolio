#!/usr/bin/env node
/**
 * Prüft jede Seite in der Druckdarstellung auf drei Fehler, die im Browser
 * unsichtbar sind.
 *
 * **Abgeschnittener Inhalt.** Ein Codeblock steht als `white-space: pre` in
 * einem Kasten mit `overflow-x: auto`. Am Bildschirm schiebt man die lange
 * Zeile nach rechts; auf Papier gibt es diese Bewegung nicht, und was über die
 * Spaltenkante ragt, fehlt im Ausdruck — ohne Lücke, ohne Hinweis, nur eine
 * Zeile, die früher endet. Gefunden am 02.08.2026 im Artikel „Warum ein
 * kleineres Whisper-Modell mein größeres schlug".
 *
 * **Zu schwacher Kontrast.** Für den Druck werden die Farbtoken umdefiniert.
 * Wer eine Farbe an den Token vorbei setzt, merkt davon nichts: Am Bildschirm
 * stimmt sie weiter. Genau so standen vier Projektnamen einmal weiß auf weiß
 * im Ausdruck.
 *
 * **Festgeheftete Bedienelemente.** Was am Bildschirm mitfährt, klebt gedruckt
 * an der ersten Seite: Die Navigationsleiste lag quer über dem Anfang des
 * ersten Abschnitts, der Cursor-Ring als leerer Kreis in der Ecke.
 *
 * Keiner der drei Fehler entsteht beim Schreiben der Druckregeln, sondern
 * später beim Ändern des Inhalts. Deshalb gehören sie in eine Prüfung und
 * nicht in eine Notiz.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:print
 *
 * Startet den Server selbst und beendet ihn wieder. Eine Adresse als Argument
 * überspringt das und misst gegen die laufende Seite.
 */

import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { FEHLERSEITEN, gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** A4 bei 96 dpi. Chromium legt die Druckdarstellung auf diese Breite aus. */
const PAPIERBREITE = 794;
const PAPIERHOEHE = 1123;

/** Ab hier gilt Text als groß und darf nach WCAG 1.4.3 auf 3:1 herunter. */
const GROSSER_TEXT_PX = 24;
const GROSSER_FETTER_TEXT_PX = 18.66;

const vorgegebeneBasis = process.argv[2];

let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/**
 * Die Seitenliste kommt aus dem Bau, nicht aus der Sitemap.
 *
 * Zuerst stand hier die Sitemap. Das war falsch, und zwar auf eine Art, die
 * still ist: Als /onepager, /impressum und /datenschutz aus der Sitemap flogen
 * — sie tragen `noindex`, gehören dort also nicht hin —, verschwanden sie
 * damit auch aus dieser Prüfung. Ausgerechnet der One-Pager, dessen einziger
 * Zweck der Ausdruck ist, wurde nicht mehr auf den Ausdruck geprüft, und die
 * Meldung sagte weiter „alle Seiten sauber", nur eben über weniger Seiten.
 *
 * Der Bauordner kennt jede ausgelieferte Seite. Eine Sitemap ist eine Aussage
 * über Suchmaschinen, keine über Vollständigkeit.
 */
const pfade = gebauteSeiten();

/**
 * `_global-error` und `_not-found` liegen als HTML im Bau, sind aber keine
 * Adressen: Die erste antwortet mit 500, die zweite mit 404, weil sie beide nur
 * dann erscheinen, wenn etwas anderes schiefging.
 */
const [UNBEKANNTE_ADRESSE, UNBEKANNTE_ADRESSE_EN] = FEHLERSEITEN;
/* `gebauteSeiten` lässt die Bau-Interna bereits aus. */
const gepruefteSeiten = [...pfade];

/*
  Die 404-Seite wird über eine erfundene Adresse geprüft und nicht über ihre
  Datei im Bau. Nur so entsteht, was ein Besucher wirklich bekommt: `Next`
  liefert dafür `global-not-found.tsx` aus, das sein eigenes Dokument mitbringt
  — eigene Schriften, eigenes Stylesheet, kein gemeinsames Layout. Genau dort
  ist eine vergessene Druckregel am wahrscheinlichsten.
*/
gepruefteSeiten.push(UNBEKANNTE_ADRESSE, UNBEKANNTE_ADRESSE_EN);

if (gepruefteSeiten.length === 0) throw new Error("Der Bau enthält keine Seiten.");

const browser = await chromium.launch();
const seite = await browser.newPage({
  viewport: { width: PAPIERBREITE, height: PAPIERHOEHE },
});

// Wie beim One-Pager-Druck: belegen, dass hier der eben gebaute Stand läuft.
// HTTP 200 sagt nur, dass jemand antwortet, nicht dass der Richtige antwortet.
if (!vorgegebeneBasis) {
  const gebauteId = readFileSync(".next/BUILD_ID", "utf8").trim();
  await seite.goto(`${basis}/`, { waitUntil: "domcontentloaded" });
  if (!(await seite.content()).includes(gebauteId)) {
    await browser.close();
    throw new Error(`Auf ${basis} läuft ein anderer Build als ${gebauteId}.`);
  }
}

/**
 * Misst eine Seite in der Druckdarstellung.
 *
 * Läuft vollständig im Browser, weil beides Layout- und Farbfragen sind, die
 * sich nur aus dem gerenderten Baum beantworten lassen: Der Quelltext einer
 * Klasse verrät nicht, wie breit sie auf Papier wird.
 */
async function messen() {
  return seite.evaluate(
    ({ grossPx, grossFettPx }) => {
      // Farben über einen Canvas auflösen statt sie selbst zu parsen.
      //
      // Der erste Anlauf las die Zahlen aus `oklab(0.999994 ...)` als
      // RGB-Werte und hielt Weiß dadurch für Fast-Schwarz: 15 gemeldete
      // Stellen, alle falsch. Der Canvas kennt jeden Farbraum, den auch das
      // Stylesheet benutzen darf, und liefert immer RGBA.
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
        [0, 1, 2].map((i) => vorne[i] * vorne[3] + hinten[i] * (1 - vorne[3])).concat(1);
      const helligkeit = ([r, g, b]) => {
        const f = (x) => {
          x /= 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      // Halbdurchsichtige Flächen stapeln sich. Nur die oberste zu nehmen
      // ergäbe für `bg-surface/40` über Weiß einen Wert, den niemand sieht.
      const untergrund = (el) => {
        const stapel = [];
        for (let n = el; n; n = n.parentElement) {
          stapel.push(zuRgba(getComputedStyle(n).backgroundColor));
        }
        let ergebnis = [255, 255, 255, 1]; // Papier
        for (let i = stapel.length - 1; i >= 0; i--) ergebnis = ueber(stapel[i], ergebnis);
        return ergebnis;
      };
      const kontrast = (a, b) =>
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

      // `opacity` steht nicht in `color` und nicht in `backgroundColor`.
      //
      // Ein Vorfahr mit `opacity: 0.64` lässt beide Werte unberührt und macht
      // trotzdem alles darunter blasser. Ohne diesen Faktor meldete die
      // Prüfung 28 Stellen auf der Startseite, die es nicht gibt: Sie maß
      // mitten in der Einblend-Animation. Der wandernde Grauton von Lauf zu
      // Lauf — 175, dann 170 — war der Beleg dafür, dass hier die Zeit
      // mitgemessen wurde und nicht die Seite.
      const geerbteDeckkraft = (el) => {
        let wert = 1;
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          wert *= parseFloat(getComputedStyle(n).opacity);
        }
        return wert;
      };

      const schwach = [];
      const abgeschnitten = [];
      const festgeheftet = [];
      /*
        Bilder, die nie geladen wurden, drucken als leerer Rahmen.

        `next/image` setzt ohne `priority` ein `loading="lazy"`. Am Bildschirm
        ist das richtig; beim Drucken gibt es kein Scrollen, und was nie
        geladen wurde, fehlt auf dem Papier. Gemessen am 02.08.2026: sechs von
        elf Produktaufnahmen fehlten im PDF der Startseite.
      */
      const ungeladen = [...document.querySelectorAll("img")]
        .filter((b) => getComputedStyle(b).display !== "none" && b.naturalWidth === 0)
        .map((b) => ({
          alt: (b.getAttribute("alt") || "(ohne Alternativtext)").slice(0, 45),
          laden: b.loading,
        }));

      for (const el of document.querySelectorAll("body *")) {
        const stil = getComputedStyle(el);
        if (stil.display === "none" || stil.visibility === "hidden") continue;

        // Unsichtbares kann nicht schlecht aussehen. Das betrifft die
        // ausgeblendete Kopfleiste am Seitenanfang ebenso wie den
        // Sprunglink, der nur bei Tastaturfokus aus seinem 1-Pixel-Kasten
        // heraustritt — dessen Inhalt ragte sonst als „abgeschnitten“ in den
        // Bericht.
        const deckkraft = geerbteDeckkraft(el);
        if (deckkraft === 0) continue;

        // Größe über das Rechteck, nicht über `clientWidth`.
        //
        // `clientWidth` ist bei jedem nicht ersetzten Inline-Element 0 — bei
        // jedem `span`, `a`, `time`, `code`. Die erste Fassung dieser Zeile
        // hat damit genau die Elemente übersprungen, die den Fließtext
        // tragen, und meldete eine saubere Seite. Eine Prüfung, die das
        // Wichtigste nicht ansieht, ist schlimmer als keine.
        const rechteck = el.getBoundingClientRect();
        if (rechteck.width <= 1 || rechteck.height <= 1) continue;

        // Festgeheftetes klebt nicht am Papier, es klebt an der ersten Seite.
        //
        // `position: fixed` heißt gedruckt: einmal ganz oben, über dem, was
        // dort steht. Die Navigationsleiste lag so quer über dem Anfang des
        // ersten Abschnitts, der Cursor-Ring als leerer Kreis in der Ecke.
        // Das sind Bedienelemente des Bildschirms; auf Papier bedienen sie
        // niemanden.
        if (stil.position === "fixed" || stil.position === "sticky") {
          festgeheftet.push({
            marke: el.tagName.toLowerCase(),
            klasse: (el.className?.toString?.() || "").slice(0, 60),
            groesse: `${Math.round(rechteck.width)}x${Math.round(rechteck.height)}`,
            text: (el.textContent || "").trim().slice(0, 30),
          });
        }

        // Waagerecht abgeschnitten: Der Kasten hält mehr, als er zeigt, und
        // auf Papier gibt es keine Bewegung, die den Rest holen könnte.
        // Zwei Pixel Toleranz gegen Rundung bei gebrochenen Breiten.
        if (stil.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 2) {
          abgeschnitten.push({
            marke: el.tagName.toLowerCase(),
            klasse: (el.className?.toString?.() || "").slice(0, 60),
            fehlt: el.scrollWidth - el.clientWidth,
            text: (el.textContent || "").trim().slice(0, 40),
          });
        }

        const eigenerText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .join("");
        if (eigenerText.length < 3) continue;

        const vorne = zuRgba(stil.color);
        if (vorne[3] === 0) continue;
        vorne[3] *= deckkraft;
        const hinten = untergrund(el);
        const wert = kontrast(helligkeit(ueber(vorne, hinten)), helligkeit(hinten));

        const px = parseFloat(stil.fontSize);
        const fett = parseInt(stil.fontWeight, 10) >= 700;
        const schwelle = px >= grossPx || (px >= grossFettPx && fett) ? 3 : 4.5;
        if (wert < schwelle) {
          schwach.push({
            text: eigenerText.slice(0, 40),
            farbe: stil.color,
            // Die Fläche gehört in die Meldung: „zu blass“ ist ohne sie nicht
            // nachvollziehbar, weil derselbe Farbwert auf Weiß trägt und auf
            // Grau nicht.
            flaeche: `rgb(${hinten.slice(0, 3).map(Math.round).join(", ")})`,
            px,
            ist: Math.round(wert * 100) / 100,
            soll: schwelle,
          });
        }
      }

      /*
        Bedienelemente, die auf Papier nichts tun.

        Ein Knopf im Ausdruck ist eine Zusage, die das Blatt nicht halten kann.
        Gemessen an der gedruckten Artikelseite standen drei „Kopieren" neben
        Codekästen, dazu auf der Startseite ein Knopf „Ablauf erneut abspielen".

        Zwei Ausnahmen, beide begründet und nicht geraten:
        - `role="tab"`: Die Reiter beschriften, was darunter steht. Ohne sie
          stünde auf dem Papier ein Textblock ohne Aufschrift.
        - `[data-druckbar]`: Der Kontaktknopf trägt die E-Mail-Adresse als
          Beschriftung. Versteckt man ihn, verliert der Ausdruck die Adresse.

        Alles andere gehört mit `no-print` ausgeblendet. Wer ein neues
        Bedienelement einbaut, entscheidet hier bewusst, statt es zu vergessen.
      */
      const toteKnoepfe = [...document.querySelectorAll('button, [role="button"]')]
        .filter((el) => {
          const stil = getComputedStyle(el);
          if (stil.display === "none" || stil.visibility === "hidden") return false;
          if (el.getBoundingClientRect().width === 0) return false;
          if (el.getAttribute("role") === "tab") return false;
          return !el.closest("[data-druckbar]");
        })
        .map((el) => ({
          name: (el.textContent || el.getAttribute("aria-label") || "?")
            .trim()
            .slice(0, 40),
          klasse: String(el.className).slice(0, 50),
        }));

      return { schwach, abgeschnitten, festgeheftet, ungeladen, toteKnoepfe };
    },
    { grossPx: GROSSER_TEXT_PX, grossFettPx: GROSSER_FETTER_TEXT_PX },
  );
}

/**
 * Sammelt den sichtbaren Text einer Seite, ohne das, was bewusst nicht
 * gedruckt wird.
 *
 * Damit lässt sich die stärkste Zusage dieser Prüfung belegen: Drucken darf
 * Text weder verlieren noch verändern. Ein Zähler, der auf Papier "0" zeigt,
 * ein Karussell, von dem nur die erste Karte kommt, ein Abschnitt, der
 * unsichtbar bleibt — alle drei fallen hier auf, ohne dass die Prüfung sie
 * einzeln kennen muss.
 */
function textEinsammeln() {
  return seite.evaluate(() => {
    // An der lebenden Seite messen, nicht an einem Klon.
    //
    // Der erste Anlauf klonte den Körper und las `textContent`. Das war
    // wertlos, und der Gegentest hat es bewiesen: Mit entfernter
    // Sichtbarkeitsregel im Druck — also bei einer Seite, die als fast leeres
    // Papier herauskommt — meldete die Prüfung weiter „alles vollständig“.
    // `textContent` kennt kein CSS. Für den Baum ist unsichtbarer Text
    // vorhanden; für den Drucker ist er weg.
    //
    // Knotenweise, weil `textContent` benachbarte Elemente ohne Trennung
    // aneinanderklebt: Gemeldet wurde einmal „automatisiertAI-Act-Disclosure"
    // als fehlendes Wort, ein Gebilde aus drei Abschnitten, das es nirgends
    // gibt.
    const unsichtbar = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        if (n.classList?.contains("no-print")) return true;
        const s = getComputedStyle(n);
        if (s.display === "none" || s.visibility === "hidden") return true;
        if (parseFloat(s.opacity) === 0) return true;
      }
      return false;
    };

    const laeufer = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const stuecke = [];
    for (let n = laeufer.nextNode(); n; n = laeufer.nextNode()) {
      const t = n.textContent.trim();
      if (!t) continue;
      if (unsichtbar(n.parentElement)) continue;
      stuecke.push(t);
    }
    return stuecke.join(" ").replace(/\s+/g, " ").trim();
  });
}

let fehler = 0;

for (const pfad of gepruefteSeiten) {
  // Die erfundene Adresse muss mit 404 antworten: Ein 200 hiesse, dass Next
  // irgendetwas ausliefert, wo nichts sein sollte.
  const erwartet =
    pfad === UNBEKANNTE_ADRESSE || pfad === UNBEKANNTE_ADRESSE_EN ? 404 : 200;
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "domcontentloaded" });
  if (!antwort || antwort.status() !== erwartet) {
    console.log(`  FEHLER ${pfad}: HTTP ${antwort?.status()} statt ${erwartet}`);
    fehler++;
    continue;
  }

  // Erster Durchgang: der Maßstab.
  //
  // Einmal ganz durchscrollen, damit jede Einblendung gefeuert und jeder
  // Zähler am Endwert ist. Das ist der Text, den ein Leser zu sehen bekommt.
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
  const textAmBildschirm = await textEinsammeln();

  // Zweiter Durchgang: der schlimmste Fall.
  //
  // Frisch laden und sofort drucken, ohne eine Zeile gelesen zu haben — genau
  // das tut jemand, der die Seite weiterreichen will. Ohne das Neuladen wären
  // die Zähler vom ersten Durchgang längst am Endwert und die Prüfung bliebe
  // grün, während der Ausdruck „0“ zeigt.
  await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  await seite.emulateMedia({ media: "print" });

  /* Auf die Hydration warten, nicht auf eine Wartezeit.
   *
   * Der Terminalkasten der Startseite füllt sich erst, wenn sein Effekt
   * läuft: Am Bildschirm Zeile für Zeile, im Druck sofort vollständig. Bis
   * dahin steht dort die Serverfassung mit null Zeilen. Der Lauf lud mit
   * `domcontentloaded` und maß 50 ms später — auf dieser Maschine reichte
   * das, auf der langsameren in der CI nicht: Dort fehlten im Ausdruck von
   * `/` dreizehn und von `/en` vierzehn Wörter, alle aus diesem Kasten,
   * während derselbe Lauf hier zweimal grün blieb.
   *
   * Gewartet wird deshalb auf den Zustand selbst und nicht auf eine Zahl von
   * Millisekunden: Sobald der Kasten Zeilen trägt, ist der Effekt gelaufen.
   * Seiten ohne Kasten warten nicht. */
  await seite
    .waitForFunction(
      () => {
        const kasten = document.querySelector("[data-agent-session]");
        return !kasten || kasten.children.length > 0;
      },
      undefined,
      { timeout: 10000 },
    )
    .catch(() => {
      /* Läuft der Kasten nicht an, meldet die Textprüfung darunter das
         Fehlende — mit den Wörtern, die fehlen. Das ist die bessere
         Fehlermeldung als ein Zeitüberlauf hier. */
    });

  // Die Seite in ihren Ruhezustand zwingen, statt auf ihn zu warten.
  //
  // Ein fester Wartewert entscheidet nur, wie oft die Prüfung danebenliegt:
  // Zu kurz misst sie die Einblendung, zu lang kostet sie bei 17 Seiten
  // Minuten. `finish()` setzt jede endliche Animation auf ihren Endwert;
  // Endlosschleifen wie der Laufschriftbalken lehnen das mit einem Fehler ab
  // und laufen weiter, was richtig ist — dort gibt es keinen Endzustand.
  await seite.evaluate(() => {
    for (const bewegung of document.getAnimations()) {
      try {
        bewegung.finish();
      } catch {
        // Endlos, also ohne Endwert. Bleibt, wie sie ist.
      }
    }
  });
  await seite.waitForTimeout(50);
  const { schwach, abgeschnitten, festgeheftet, ungeladen, toteKnoepfe } =
    await messen();
  const textImDruck = await textEinsammeln();
  await seite.emulateMedia({ media: "screen" });

  // Wörter zählen, nicht nur nachschlagen.
  //
  // Eine Menge beantwortet „kommt dieses Wort irgendwo vor", und das war zu
  // wenig: Vom leeren Terminalrahmen im Ausdruck fiel genau ein Wort auf,
  // weil alle anderen zufällig auch an anderer Stelle der Seite stehen. Die
  // Häufigkeit verrät auch das Fehlen eines ganzen Abschnitts, dessen
  // Vokabular sich woanders wiederholt.
  const zaehlen = (text) => {
    const karte = new Map();
    for (const wort of text.split(" ")) {
      if (wort.length > 1) karte.set(wort, (karte.get(wort) ?? 0) + 1);
    }
    return karte;
  };
  const amBildschirm = zaehlen(textAmBildschirm);
  const imDruck = zaehlen(textImDruck);
  const fehlend = [];
  for (const [wort, anzahl] of amBildschirm) {
    const da = imDruck.get(wort) ?? 0;
    if (da < anzahl) fehlend.push(anzahl - da > 1 ? `${wort} (${anzahl - da}×)` : wort);
  }

  if (
    schwach.length === 0 &&
    abgeschnitten.length === 0 &&
    festgeheftet.length === 0 &&
    fehlend.length === 0 &&
    ungeladen.length === 0 &&
    toteKnoepfe.length === 0
  ) {
    console.log(`  ok ${pfad}`);
    continue;
  }

  fehler++;
  console.log(`  FEHLER ${pfad}`);
  if (fehlend.length > 0) {
    console.log(
      `        Text fehlt im Ausdruck (${fehlend.length} Wörter): ${fehlend.slice(0, 12).join(" · ")}`,
    );
  }
  for (const s of abgeschnitten) {
    console.log(
      `        abgeschnitten: <${s.marke} class="${s.klasse}"> — ${s.fehlt} px fehlen im Ausdruck: „${s.text}“`,
    );
  }
  for (const s of ungeladen) {
    console.log(
      `        Bild nicht geladen (loading="${s.laden}"), druckt als leerer Rahmen: „${s.alt}“`,
    );
  }
  for (const s of toteKnoepfe) {
    console.log(
      `        Bedienelement im Ausdruck, tut auf Papier nichts: „${s.name}“ (class="${s.klasse}") — `
        + `entweder no-print ergänzen oder, wenn die Beschriftung selbst die Angabe ist, data-druckbar setzen`,
    );
  }
  for (const s of festgeheftet) {
    console.log(
      `        festgeheftet: <${s.marke} class="${s.klasse}"> ${s.groesse} px — landet gedruckt über der ersten Seite: „${s.text}“`,
    );
  }
  for (const s of schwach) {
    console.log(
      `        Kontrast ${s.ist}:1 statt ${s.soll}:1 bei ${s.px} px — ${s.farbe} auf ${s.flaeche}: „${s.text}“`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Was hinter den Reitern liegt, druckt auch

   Der Lauf oben misst jede Seite in ihrem Auslieferungszustand. Bei den
   Fallstudien heißt das: Von drei bis vier Tafeln je Projekt sieht er genau
   eine, nämlich „Was drinsteckt“. Die übrigen entstehen erst, wenn jemand den
   Reiter anfasst — und wer das getan hat, druckt genau die.

   Gefunden am 06.08.2026 hinter „Architektur“: Das Diagramm ist 1.150 px
   breit, die Papierspalte 736. Über ein Drittel fehlte im Ausdruck, ohne
   Lücke und ohne Hinweis, also derselbe Fehler wie beim Codeblock im Artikel
   — nur an einer Stelle, an die der Lauf nie kam.

   Gemessen wird nur auf den beiden Startseiten: Nur dort stehen Reiter. Für
   jede Tafel dieselbe Messung wie oben, mit dem Reiternamen in der Meldung.
   --------------------------------------------------------------------- */
const reiterfunde = [];
for (const pfad of ["/", "/en"]) {
  await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });

  const gruppen = await seite.evaluate(() =>
    [...document.querySelectorAll('[role="tablist"]')].map((tl) => ({
      name: tl.getAttribute("aria-label"),
      reiter: [...tl.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()),
    })),
  );

  for (const gruppe of gruppen) {
    // Der erste Reiter ist der Auslieferungszustand und oben schon gemessen.
    for (const reiter of gruppe.reiter.slice(1)) {
      await seite.emulateMedia({ media: "screen" });
      await seite
        .locator(`[role="tablist"][aria-label="${gruppe.name}"]`)
        .getByRole("tab", { name: reiter, exact: true })
        .click();
      /* Kurz warten, bevor gedruckt wird: Die Tafel blendet um, und in der
         Gegenprobe stand deshalb der Name des nächsten Reiters an einem Fund
         der vorigen Tafel. Der Fund war richtig, die Zuordnung nicht. */
      await seite.waitForTimeout(400);
      await seite.emulateMedia({ media: "print" });
      await seite.evaluate(() => {
        for (const bewegung of document.getAnimations()) {
          try {
            bewegung.finish();
          } catch {
            // Endlos, also ohne Endwert.
          }
        }
      });
      await seite.waitForTimeout(50);
      const { schwach, abgeschnitten } = await messen();
      for (const s of abgeschnitten) {
        reiterfunde.push(
          `${pfad} · ${gruppe.name} · ${reiter}: <${s.marke}> — ${s.fehlt} px fehlen im Ausdruck: „${s.text}“`,
        );
      }
      for (const s of schwach) {
        reiterfunde.push(
          `${pfad} · ${gruppe.name} · ${reiter}: Kontrast ${s.ist}:1 statt ${s.soll}:1 bei ${s.px} px — „${s.text}“`,
        );
      }
    }
  }
  await seite.emulateMedia({ media: "screen" });
}

if (reiterfunde.length > 0) {
  fehler += reiterfunde.length;
  console.log(`  FEHLER hinter den Reitern (${reiterfunde.length}):`);
  for (const f of reiterfunde) console.log(`        ${f}`);
} else {
  console.log("  ok  jede Tafel hinter einem Reiter druckt vollständig");
}

/* ---------------------------------------------------------------------------
   Das Kurzprofil passt noch auf ein Blatt

   `check:onepager` merkt eine zweite Seite erst am fertigen PDF, und das
   entsteht von Hand. Wer eine Zeile ergänzt, sieht bis dahin nichts: Am
   Bildschirm scrollt die Seite einfach weiter.

   Gemessen wird die Höhe von `.onepager` im Druckmodus bei 794 px Papier-
   breite. Die Grenze liegt bei 1040 px — A4 sind 1123 px bei 96 dpi, davon
   gehen die Druckränder ab. Aktuell stehen dort 915 px auf Deutsch und
   883 auf Englisch; die Warnschwelle greift also, bevor etwas umbricht.

   Gemessen bei der Grundschrift des Browsers, und das ist eine Annahme mit
   Grenze: Wer sie auf 20 px stellt, druckt 1.197 px, bei 24 px sind es
   1.277 — zwei Seiten. (Gemessen am 08.08.2026; hier standen 1.090 und
   1.161, gemessen an einem kürzeren Blatt. Die beiden Zahlen wandern mit dem
   Inhalt, die Zeile darüber nicht — sie wird bei jedem Lauf neu bestimmt.) Der naheliegende Griff wäre `html { font-size: 16px }`
   in den Druckregeln. Er bleibt bewusst aus: Damit stünde das Blatt für
   jeden gleich groß auf dem Papier, auch für den, der seine Schrift bewusst
   vergrößert hat, und die Seite hält es sonst überall andersherum. Wer sein
   Blatt weiterreicht, reicht ohnehin das PDF weiter, und das entsteht mit
   der Standardgröße.

   Die Zahlen stehen hier, damit die nächste Messung nicht als Fund gelesen
   wird, der sie nicht ist. */
const BLATTGRENZE = 1040;
const blattfunde = [];

for (const pfad of ["/onepager", "/en/onepager"]) {
  const seite = await browser.newPage({
    viewport: { width: PAPIERBREITE, height: PAPIERHOEHE },
  });
  await seite.emulateMedia({ media: "print" });
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  if (antwort?.status() === 200) {
    await seite.waitForTimeout(600);
    const hoehe = await seite.evaluate(() => {
      const el = document.querySelector(".onepager");
      return el ? Math.round(el.getBoundingClientRect().height) : null;
    });
    if (hoehe === null) blattfunde.push(`${pfad}: kein Element mit .onepager`);
    else if (hoehe > BLATTGRENZE) {
      blattfunde.push(
        `${pfad}: ${hoehe} px hoch, ${BLATTGRENZE} sind das Blatt. ` +
          `Gedruckt wären das zwei Seiten.`,
      );
    } else {
      console.log(`  ok ${pfad} auf einem Blatt (${hoehe} von ${BLATTGRENZE} px)`);
    }
  }
  await seite.close();
}

await browser.close();
beenden();

if (blattfunde.length > 0) {
  console.error(`\nDas Kurzprofil passt nicht mehr auf ein Blatt:`);
  for (const f of blattfunde) console.error(`  ${f}`);
  process.exit(1);
}

if (fehler > 0) {
  console.error(
    `\n${fehler} von ${gepruefteSeiten.length} Seiten drucken nicht sauber. ` +
      `Die Druckregeln stehen in src/app/globals.css unter @media print.`,
  );
  process.exit(1);
}

console.log(`\nAlle ${gepruefteSeiten.length} Seiten drucken lesbar und vollständig.`);
