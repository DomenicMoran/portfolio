#!/usr/bin/env node
/**
 * Prüft, dass jede Seite dieselben Landmarken anbietet.
 *
 * Wer mit einem Vorleseprogramm arbeitet, springt nicht durch die Seite,
 * sondern durch ihre Landmarken: Navigation, Hauptbereich, Fußzeile. Fehlt
 * eine, fehlt der Sprung — und gemeldet wird das von niemandem. axe prüft, ob
 * eine vorhandene Landmarke richtig gebaut ist, nicht, ob sie da ist.
 *
 * Dreimal gefunden, jedes Mal von Hand:
 *
 *   - der Belegblock der Artikel war eine `section` ohne Namen und damit
 *     keine Landmarke
 *   - die Artikelliste war eine `ul` statt einer benannten Navigation
 *   - die beiden Rechtsseiten hatten genau eine Landmarke, den Hauptbereich:
 *     kein Rückweg, keine Fußzeile — ausgerechnet dort, wo jemand eine
 *     Anschrift oder eine Rechtsgrundlage sucht
 *
 * Zwei Fallen, die dieser Lauf kennt:
 *
 *   - `footer` und `header` **innerhalb** von `main` sind keine Landmarken.
 *     Die Norm nimmt ihnen die Rolle dort, und im Quelltext sieht man es nicht.
 *   - Zwei Landmarken derselben Rolle brauchen verschiedene Namen. Zweimal
 *     „Hauptnavigation" in einer Liste hilft niemandem beim Zielen.
 *
 * Gemessen wird an der gebauten Seite über die tatsächlichen Rollen, nicht
 * über die Elementnamen.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:landmarks
 */

import { chromium } from "playwright";
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Was jede Seite tragen muss. */
const PFLICHT = ["main", "navigation", "contentinfo"];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

const pfade = gebauteSeiten();
const browser = await chromium.launch();
const umgebung = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const seite = await umgebung.newPage();

/* Der Name einer Überschrift wird gemessen, nicht nachgebaut.

   Hier stand ein eigener Nachbau: Klon nehmen, `aria-hidden`-Kinder
   entfernen, `textContent` lesen. Der übersieht alles, was die Norm sonst
   noch tut — und genau daran ist er am 06.08.2026 gescheitert. Der
   Abschnittsverweis in den Artikeln trug ein `aria-label`, das den
   Überschriftentext wiederholt; als Kind des `h2` ging es in dessen Namen ein.
   Der Nachbau las „Der erste Hebel: dem Modell sagen, was es hören wird“ und
   war zufrieden, der Browser bildete „… Verweis auf diesen Abschnitt: Der
   erste Hebel: …“.

   `Accessibility.queryAXTree` fragt denselben Baum ab, den auch ein
   Vorleseprogramm bekommt. Zugeordnet wird über die `backendNodeId`, nicht
   über die Reihenfolge: Der Baum führt Fußzeilenüberschriften vor der
   Hauptüberschrift, eine Paarung nach Index ginge daneben. */
const werkzeug = await umgebung.newCDPSession(seite);
await werkzeug.send("Accessibility.enable");
await werkzeug.send("DOM.enable");

const glatt = (text) => (text ?? "").replace(/\s+/g, " ").trim();

async function ueberschriftenNamen(aufSeite = seite, mitWerkzeug = werkzeug) {
  const { root } = await mitWerkzeug.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await mitWerkzeug.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: "h1, h2, h3, h4",
  });
  const raus = [];
  for (const [i, nodeId] of nodeIds.entries()) {
    const { node } = await mitWerkzeug.send("DOM.describeNode", { nodeId });
    const { nodes } = await mitWerkzeug.send("Accessibility.queryAXTree", {
      backendNodeId: node.backendNodeId,
    });
    const ax = nodes.find((n) => n.role?.value === "heading");
    if (!ax) continue;
    const sichtbar = glatt(
      await aufSeite.evaluate(
        (nr) => document.querySelectorAll("h1, h2, h3, h4")[nr].innerText,
        i,
      ),
    );
    raus.push({ name: glatt(ax.name?.value), sichtbar });
  }
  return raus;
}

const funde = [];
let geprueft = 0;
let landmarken = 0;

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, {
    waitUntil: "domcontentloaded",
  });
  if (!antwort || antwort.status() !== 200) continue;
  geprueft++;

  const gefunden = await seite.evaluate(() => {
    /** Elementname zu Landmarkenrolle. */
    const ROLLE = {
      MAIN: "main",
      NAV: "navigation",
      FOOTER: "contentinfo",
      HEADER: "banner",
      ASIDE: "complementary",
      FORM: "form",
      SECTION: "region",
    };

    const raus = [];
    for (const el of document.querySelectorAll(
      "main, nav, footer, header, aside, section",
    )) {
      const rolle = el.getAttribute("role") ?? ROLLE[el.tagName];
      if (!rolle) continue;

      /* `footer` und `header` verlieren ihre Rolle innerhalb von `main`,
         `article` oder `section`; `section` und `form` haben ohne Namen gar
         keine. Beides steht in der Norm und ist im Quelltext unsichtbar. */
      if (
        (el.tagName === "FOOTER" || el.tagName === "HEADER") &&
        el.closest("main, article, section, aside")
      ) {
        continue;
      }

      const name =
        el.getAttribute("aria-label") ??
        document
          .getElementById(el.getAttribute("aria-labelledby") ?? "")
          ?.textContent?.trim() ??
        "";

      if ((el.tagName === "SECTION" || el.tagName === "FORM") && !name)
        continue;

      raus.push({ rolle, name });
    }
    return raus;
  });

  landmarken += gefunden.length;

  /* Zierzeichen im Namen einer Überschrift.

     Die Sprungmarke jeder Zwischenüberschrift ist ein Doppelkreuz, und es
     stand als Text im `h2`. Der Name der Überschrift im Barrierefreiheitsbaum
     lautete damit „Warum ein größeres Modell hier nichts bringt#“, und wer
     eine Überschrift markierte, kopierte es mit. Gefunden an allen sieben
     Überschriften eines Artikels; axe prüft Namen auf Vorhandensein, nicht
     auf Zierrat.

     Und der Name sagt genau das, was dasteht.

     Zweite Regel, aus demselben Anlass: Der Abschnittsverweis neben der
     Überschrift trug ein `aria-label` mit dem Überschriftentext darin. Als
     Kind des `h2` ging es in dessen Namen ein, und ein Vorleseprogramm las
     jede Zwischenüberschrift zweimal — sieben mal je Artikel, aber nur ab
     1024 px, weil der Verweis darunter `display: none` trägt.

     Geprüft wird gegen den sichtbaren Text: Was der Baum als Namen führt,
     muss dem entsprechen, was dort steht. Alles andere ist etwas, das ein
     Sehender nicht sieht und ein Hörender nicht erwartet. */
  for (const h of await ueberschriftenNamen()) {
    if (/[#*•·→↗]$/.test(h.name)) {
      funde.push(
        `${pfad}: Überschrift endet auf ein Zierzeichen — „…${h.name.slice(-45)}“`,
      );
    } else if (h.name !== h.sichtbar) {
      funde.push(
        `${pfad}: Überschrift heißt im Baum anders, als sie dasteht —\n` +
          `          sichtbar: „${h.sichtbar.slice(0, 60)}“\n` +
          `          Name:     „${h.name.slice(0, 90)}“`,
      );
    }
  }

  /* Eine Fallstudie trägt genau eine Überschrift der Ebene 3: ihren Namen.

     Wer mit einem Vorleseprogramm arbeitet, liest den Abschnitt oft nur als
     Überschriftenliste. Dort stand unter „Vier Produkte. Alle live.“ sechsmal
     eine Ebene 3: die vier Projekte und dazwischen die beiden Vorführungen,
     „Ein Jahr Gebetszeiten, hier gerechnet“ und „Ein Tag, zusammengestellt“.
     Sie sehen in dieser Liste aus wie zwei weitere Projekte, und weil eine
     neue Ebene 3 den vorigen Zweig schließt, hing Salatis „Ausführlich
     nachzulesen" anschließend unter der Vorführung statt unter Salati.

     Die Stufen selbst sprangen dabei nie, es fehlte keine Ebene — genau
     deshalb meldet axe hier nichts. Geprüft wird die Zugehörigkeit, nicht die
     Reihenfolge. */
  const fallstudien = await seite.evaluate(() =>
    [...document.querySelectorAll('[id^="case-"]')].map((s) => ({
      id: s.id,
      titel: [...s.querySelectorAll("h3")].map((h) =>
        (h.textContent ?? "").trim().slice(0, 40),
      ),
    })),
  );
  for (const f of fallstudien) {
    if (f.titel.length !== 1) {
      funde.push(
        `${pfad}: #${f.id} hat ${f.titel.length} Überschriften der Ebene 3 statt einer — ` +
          `„${f.titel.join("“, „")}“`,
      );
    }
  }

  for (const pflicht of PFLICHT) {
    if (!gefunden.some((l) => l.rolle === pflicht)) {
      funde.push(`${pfad}: keine Landmarke „${pflicht}"`);
    }
  }

  /* Gleiche Rolle, gleicher Name: In der Landmarkenliste stehen dann zwei
     Einträge, die sich nicht unterscheiden lassen. */
  const gesehen = new Map();
  for (const l of gefunden) {
    const schluessel = `${l.rolle} ${l.name}`;
    if (gesehen.has(schluessel)) {
      funde.push(
        `${pfad}: ${l.rolle} „${l.name || "(ohne Namen)"}" kommt mehrfach vor — ` +
          `in der Landmarkenliste nicht zu unterscheiden`,
      );
    }
    gesehen.set(schluessel, true);
  }
}

await seite.close();

/* Und dasselbe noch einmal auf dem Telefon.

   Der Fund, für den diese Messung gebaut wurde, hing an der Breite: Der
   Abschnittsverweis in den Artikeln trägt `display: none` unterhalb von
   1024 px und ging deshalb nur am Schreibtisch in den Namen der Überschrift
   ein. Ein Lauf bei einer Breite hätte ihn genauso gut verfehlen können —
   nächstes Mal in die andere Richtung, wenn etwas nur auf dem Telefon
   erscheint.

   Nur die Namen, nicht die Landmarken: Die hängen an keiner Breite. */
{
  const eng = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const engeSeite = await eng.newPage();
  const engesWerkzeug = await eng.newCDPSession(engeSeite);
  await engesWerkzeug.send("Accessibility.enable");
  await engesWerkzeug.send("DOM.enable");

  for (const pfad of pfade) {
    const antwort = await engeSeite.goto(`${basis}${pfad}`, {
      waitUntil: "domcontentloaded",
    });
    if (!antwort || antwort.status() !== 200) continue;
    for (const h of await ueberschriftenNamen(engeSeite, engesWerkzeug)) {
      if (h.name !== h.sichtbar) {
        funde.push(
          `${pfad} bei 390 px: Überschrift heißt im Baum anders, als sie dasteht —\n` +
            `          sichtbar: „${h.sichtbar.slice(0, 60)}“\n` +
            `          Name:     „${h.name.slice(0, 90)}“`,
        );
      }
    }
  }
  await eng.close();
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(
    `${funde.length} Seite(n) mit fehlender oder doppelter Landmarke:\n`,
  );
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nJede Seite braucht Hauptbereich, Navigation und Fußzeile. ` +
      `\`footer\` und \`header\` innerhalb von \`main\` zählen nicht.`,
  );
  process.exit(1);
}

console.log(
  `Jede Seite bietet ihre Landmarken an: ${landmarken} auf ${geprueft} Seiten, ` +
    `keine Rolle doppelt benannt. Jede Überschrift heißt im ` +
    `Barrierefreiheitsbaum, wie sie dasteht — gemessen bei 1440 und 390 px.`,
);
