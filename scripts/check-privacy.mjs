#!/usr/bin/env node
/**
 * Prüft, dass keine Seite eine Verbindung nach außen aufbaut.
 *
 * Die Datenschutzerklärung sagt es als Tatsache: „Diese Website lädt keine
 * Skripte, Schriften, Karten, Videos oder Analysedienste von fremden Servern
 * nach, weder beim Aufruf noch bei einer Interaktion." Und: „Alle Schriftarten
 * werden vom eigenen Server ausgeliefert. Beim Besuch dieser Seite wird keine
 * Verbindung zu Google Fonts oder einem anderen Schriftanbieter aufgebaut."
 *
 * Das ist keine Absichtserklärung, sondern eine Aussage über den Ist-Zustand,
 * und sie steht auf einer Seite, die rechtlich zählt. Sie bricht leise: Ein
 * eingebundenes Video, eine Schrift von einem CDN, ein Zählpixel in einem
 * neuen Bauteil — nichts davon fällt beim Ansehen auf, und die Erklärung wäre
 * ab diesem Commit falsch.
 *
 * Gemessen wird deshalb der Netzverkehr der gebauten Seite, nicht der
 * Quelltext. Jede Anfrage an einen anderen Host als den eigenen ist ein
 * Befund, `data:` und `blob:` ausgenommen — die verlassen den Rechner nicht.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:privacy
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import {
  FEHLERSEITEN,
  gebauteSeiten,
  veroeffentlichteSeiten,
} from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

const eigenerHost = new URL(basis).host;

/**
 * Welche Seiten geprüft werden.
 *
 * Am eigenen Server jede gebaute, gegen eine vorgegebene Adresse die
 * veröffentlichten aus der Sitemap: Dort gibt es keinen Bau, aus dem sich die
 * Liste lesen ließe, und die Sitemap nennt genau das, was ausgeliefert wird.
 */
const pfade = vorgegebeneBasis
  ? await veroeffentlichteSeiten(basis)
  : gebauteSeiten();

/*
  Dazu die Fehlerseite, unter beiden Sprachen.

  Die Erklärung nennt sie namentlich: „Alle Seiten mit Inhalt werden vorab
  erzeugt und als fertige Dateien ausgeliefert. Einzige Ausnahme ist die
  Fehlerseite: Sie wird bei der Anfrage zusammengesetzt.“ Genau diese eine
  Seite fehlte in der Liste — sie liegt als `_not-found.html` im Bau und
  fällt damit durch das Filter, das Bau-Interna auslässt.

  Die Seite, die als Ausnahme dasteht, war also die einzige, deren
  Netzverkehr niemand gemessen hat. Und sie ist die einzige, die pro
  Anfrage entsteht: Was dort dazukäme, käme durch keinen Bau, sondern zur
  Laufzeit.

  Über erfundene Adressen, nicht über die Datei: Nur so kommt sie so
  heraus, wie Next sie ausliefert, samt der Kopfzeile, aus der sie ihre
  Sprache liest.
*/
pfade.push(...FEHLERSEITEN);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const seite = await ctx.newPage();

const funde = new Map();
/* Was die Seite auf dem Gerät ablegt — Cookies, localStorage, sessionStorage. */
const speicher = new Set();
seite.on("request", (anfrage) => {
  const adresse = anfrage.url();
  if (adresse.startsWith("data:") || adresse.startsWith("blob:")) return;
  const host = new URL(adresse).host;
  if (!host || host === eigenerHost) return;
  const schluessel = `${anfrage.resourceType()} ${host}`;
  funde.set(schluessel, (funde.get(schluessel) ?? 0) + 1);
});

for (const pfad of pfade) {
  const antwort = await seite.goto(`${basis}${pfad}`, {
    waitUntil: "networkidle",
  });
  /* 404 ist hier kein Grund zum Ueberspringen, sondern der Fall selbst. */
  if (!antwort || antwort.status() >= 500) continue;

  /*
     Nicht nur laden, sondern bedienen.

     Die Erklärung sagt ausdrücklich „weder beim Aufruf noch bei einer
     Interaktion". Ein Nachladen bei Klick — eine Karte, ein Video, eine
     Schrift für ein Symbol — bliebe beim bloßen Aufruf unsichtbar.
  */
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);

    // Jede Registerkarte einmal wählen, jeden Knopf einmal drücken, der
    // nichts verlässt oder verschickt.
    for (const reiter of document.querySelectorAll('[role="tab"]'))
      reiter.click();
    for (const knopf of document.querySelectorAll("button")) {
      const name = (
        knopf.getAttribute("aria-label") ||
        knopf.innerText ||
        ""
      ).toLowerCase();
      if (/druck|print|schließ|close/.test(name)) continue;
      knopf.click();
    }
  });
  await seite.waitForTimeout(900);

  /*
     Und nichts auf dem Gerät ablegen.

     Die Erklärung sagt: „Diese Website legt nichts auf deinem Gerät ab und
     liest nichts davon aus: keine Cookies, weder eigene noch fremde, und auch
     nichts im lokalen Speicher deines Browsers." Das ist der Zuschnitt des
     § 25 TDDDG, der nicht Cookies regelt, sondern jedes Speichern von
     Informationen auf dem Endgerät — also auch `localStorage` und
     `sessionStorage`. Ein gemerkter Reiter oder eine gemerkte Sprachwahl wäre
     technisch eine Kleinigkeit und würde die Erklärung still falsch machen.

     Gemessen nach dem Bedienen, nicht davor: Beim bloßen Aufruf legt kaum
     etwas ab, beim Klicken schon.
  */
  const abgelegt = await seite.evaluate(() => ({
    lokal: Object.keys(localStorage),
    sitzung: Object.keys(sessionStorage),
    kekse: document.cookie,
  }));
  for (const schluessel of abgelegt.lokal) {
    speicher.add(`${pfad}: localStorage["${schluessel}"]`);
  }
  for (const schluessel of abgelegt.sitzung) {
    speicher.add(`${pfad}: sessionStorage["${schluessel}"]`);
  }
  if (abgelegt.kekse)
    speicher.add(`${pfad}: Cookie ${abgelegt.kekse.slice(0, 60)}`);
}

/* Auch die Cookies, die der Server setzt: Die stehen nicht in
   `document.cookie`, wenn sie `HttpOnly` tragen. */
for (const keks of await seite.context().cookies()) {
  speicher.add(`Cookie vom Server: ${keks.name}`);
}

await browser.close();
beenden();

if (speicher.size > 0) {
  console.error("Auf dem Gerät abgelegt:\n");
  for (const eintrag of speicher) console.error(`  ${eintrag}`);
  console.error(
    `\nDie Datenschutzerklärung sagt, dass diese Seite nichts ablegt, und ` +
      `§ 25 TDDDG meint damit nicht nur Cookies. Entweder das Ablegen ` +
      `entfernen oder die Erklärung ändern.`,
  );
  process.exit(1);
}

if (funde.size > 0) {
  console.error("Verbindungen zu fremden Hosts:\n");
  for (const [was, anzahl] of funde) console.error(`  ${was}  (${anzahl}×)`);
  console.error(
    `\nDie Datenschutzerklärung sagt, dass es diese nicht gibt. Entweder die ` +
      `Einbindung entfernen oder die Erklärung ändern.`,
  );
  process.exit(1);
}

/* ---------------------------------------------------------------------------
   Die drei übrigen Tatsachen aus derselben Erklärung

   Der Netzverkehr oben deckt zwei ihrer Aussagen ab. Drei weitere stehen dort
   ebenso als Tatsache und wurden von nichts geprüft:

     „Alle Seiten mit Inhalt werden vorab erzeugt und als fertige Dateien
      ausgeliefert. Einzige Ausnahme ist die Fehlerseite."
     „Diese Website hat kein Kontaktformular."
     „Es gibt keinen Endpunkt, der Eingaben entgegennimmt."

   Alle drei brechen durch eine gewöhnliche Änderung: ein `export const dynamic`
   in einer Seite, ein Formular in einem neuen Bauteil, ein Route Handler für
   irgendeine Kleinigkeit. Nichts davon sieht beim Ansehen verdächtig aus, und
   ab diesem Commit stünde in einem Rechtsdokument eine falsche Aussage.

   Geprüft wird gegen den Bau, nicht gegen den Quelltext — was ausgeliefert
   wird, entscheidet. Nur bei einer vorgegebenen Adresse fällt der Teil aus:
   Dort gibt es keinen Bau zu lesen. */
if (!vorgegebeneBasis) {
  const zusagen = [];

  /* Welche Route kommt nicht fertig aus dem Bau? Die Fehlerseite darf das,
     sie setzt sich bei der Anfrage zusammen, um in der Sprache zu antworten,
     unter der jemand gekommen ist. */
  const vorab = new Set(
    Object.keys(
      JSON.parse(readFileSync(join(".next", "prerender-manifest.json"), "utf8")).routes ?? {},
    ),
  );
  const routen = Object.values(
    JSON.parse(readFileSync(join(".next", "app-path-routes-manifest.json"), "utf8")),
  );
  /* Muster mit `[slug]` stehen im Routen-Verzeichnis, ihre fertigen Seiten im
     Vorab-Verzeichnis. Gemeint sind hier die Ausgaben, also zählt, ob es zu
     einem Muster überhaupt vorab erzeugte Seiten gibt. */
  const AUSNAHMEN = ["/_not-found"];
  for (const route of routen) {
    if (AUSNAHMEN.includes(route)) continue;
    if (route.includes("[__metadata_id__]")) continue;
    const sauber = route.replace(/\/$/, "") || "/";
    if (vorab.has(sauber) || vorab.has(route)) continue;
    if (sauber.includes("[")) {
      const vorne = sauber.slice(0, sauber.indexOf("["));
      if ([...vorab].some((r) => r.startsWith(vorne))) continue;
    }
    zusagen.push(
      `${route} kommt nicht fertig aus dem Bau. Die Erklärung nennt als ` +
        `einzige Ausnahme die Fehlerseite.`,
    );
  }

  /* Ein Formular in einer ausgelieferten Seite. */
  for (const datei of gebauteSeiten()) {
    const html = readFileSync(
      join(".next", "server", "app", datei === "/" ? "index.html" : `${datei.slice(1)}.html`),
      "utf8",
    );
    if (/<form[\s>]/i.test(html)) {
      zusagen.push(`${datei} enthält ein Formular. Die Erklärung sagt, es gebe keines.`);
    }
  }

  /* Keine ausgelieferte Seite nennt eine Adresse vom Entwicklungsrechner.
   *
   * Der Bau warnt bei jedem Durchgang zweimal: `metadataBase property in
   * metadata export is not set … using "http://localhost:3000"`. Next löst
   * relative Bildadressen der Vorschaukarten dagegen auf, wenn keine Basis
   * dasteht — und `ogBildFuer()` liefert genau solche relativen Adressen.
   *
   * Gemessen am 07.08.2026 an allen gebauten Seiten: keine einzige trägt
   * `localhost`. Beide Sprachlayouts setzen `metadataBase` über
   * `buildMetadata()`, die Seiten darunter erben es, und die ausgelieferten
   * Karten zeigen auf domenicmoran.de. Testweise `metadataBase` aus
   * `global-not-found.tsx` genommen: Die Warnung blieb bei zwei, dort kommt
   * sie also nicht her. Sie stammt aus Routen, die Next selbst erzeugt, und
   * hat auf die Auslieferung keine Wirkung.
   *
   * Geprüft wird deshalb nicht die Warnung, sondern ihre Folge. Bricht die
   * Vererbung eines Tages, meldet X und LinkedIn jede geteilte Seite ein Bild
   * auf einem Rechner, den es im Netz nicht gibt — und im Bauprotokoll stünde
   * dieselbe Warnung wie an jedem anderen Tag. */
  for (const datei of gebauteSeiten()) {
    const html = readFileSync(
      join(".next", "server", "app", datei === "/" ? "index.html" : `${datei.slice(1)}.html`),
      "utf8",
    );
    for (const treffer of html.matchAll(/content="([^"]*localhost[^"]*)"/g)) {
      zusagen.push(
        `${datei} nennt in einer Metaangabe ${treffer[1]} — eine Adresse, ` +
          `die es außerhalb dieses Rechners nicht gibt.`,
      );
    }
  }

  /* Ein Endpunkt, der etwas entgegennimmt. */
  const VERBEN = ["POST", "PUT", "PATCH", "DELETE"];
  const suchen = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) suchen(pfad);
      else if (/^route\.(ts|tsx|js|mjs)$/.test(eintrag.name)) {
        const quelle = readFileSync(pfad, "utf8");
        for (const verb of VERBEN) {
          if (new RegExp(`export\\s+(async\\s+)?(function|const)\\s+${verb}\\b`).test(quelle)) {
            zusagen.push(
              `${pfad} nimmt ${verb} entgegen. Die Erklärung sagt, es gebe ` +
                `keinen Endpunkt, der Eingaben annimmt.`,
            );
          }
        }
      }
    }
  };
  suchen(join("src", "app"));

  if (zusagen.length > 0) {
    console.error("Die Datenschutzerklärung sagt etwas anderes als der Bau:\n");
    for (const z of zusagen) console.error(`  ${z}`);
    console.error(
      `\nEntweder die Änderung zurücknehmen oder den Text anpassen. Ein ` +
        `Rechtsdokument, das eine überholte Tatsache behauptet, ist schlechter ` +
        `als eines, das nichts behauptet.`,
    );
    process.exit(1);
  }
}

console.log(
  `Keine Verbindung nach außen und nichts auf dem Gerät: ${pfade.length} Seiten ` +
    `geladen und bedient, alle Anfragen gingen an ${eigenerHost}.` +
    (vorgegebeneBasis
      ? ""
      : `\nUnd was die Erklärung sonst behauptet, stimmt: alles vorab erzeugt ` +
        `außer der Fehlerseite, kein Formular, kein Endpunkt für Eingaben.`),
);
