#!/usr/bin/env node
/**
 * Erzeugt das LinkedIn-Titelbild aus den Zahlen der Webseite.
 *
 * Warum als Skript und nicht als Bilddatei, die man einmal baut: Die erste
 * Fassung lag als PNG im Repo und trug 3.946 Commits. Die Zahl auf der
 * Webseite ist inzwischen 3.971, das Bild wusste davon nichts. Zwei Quellen
 * für dieselbe Zahl laufen immer auseinander, und beim Titelbild fällt es
 * niemandem auf, weil es niemand noch einmal liest.
 *
 * Deshalb liest dieses Skript die Kennzahlen aus src/content/site.ts und
 * scheitert, wenn es sie dort nicht findet. Ein Bild mit einer falschen Zahl
 * ist schlimmer als kein Bild.
 *
 *   node scripts/build-linkedin-banner.mjs
 */

import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const ZIEL = "../assets/linkedin-banner.png";

// Aus der Inhaltsquelle lesen statt hier zu wiederholen.
const quelle = readFileSync("src/content/site.ts", "utf8");

/**
 * Eine Kennzahl aus site.ts holen, gesucht über den Anfang ihrer Beschriftung.
 *
 * Vorher stand hier der ganze Text "Commits in 4 Monaten". Als die Beschriftung
 * auf "Commits seit März 2026" wechselte — weil ein wanderndes Vier-Monats-
 * Fenster eine Zahl ergibt, die von selbst sinkt — brach dieses Skript. Das war
 * richtig so: lieber gar kein Titelbild als eines mit einer Zahl, die niemand
 * mehr nachrechnen kann.
 *
 * Gesucht wird jetzt über den Anfang. Die Kennzahl steht absichtlich mehrfach
 * in site.ts — einmal im Kopfbereich, einmal im Projektblock —, deshalb ist
 * "genau ein Treffer" die falsche Bedingung. Verlangt wird, dass alle Treffer
 * **dieselbe** Zahl tragen: Das ist die Eigenschaft, die das Titelbild braucht.
 * Fehlt die Kennzahl ganz oder stehen dort zwei verschiedene Zahlen, bricht es.
 */
function kennzahl(anfangDerBeschriftung) {
  // Die Kennzahlen stehen als { value: "4.053", label: "Commits seit März 2026" }.
  const werte = [
    ...quelle.matchAll(
      new RegExp(
        `\\{\\s*value:\\s*"([^"]+)",\\s*label:\\s*"${anfangDerBeschriftung}[^"]*"`,
        "g",
      ),
    ),
  ].map((t) => t[1]);

  const verschieden = [...new Set(werte)];
  if (verschieden.length !== 1) {
    throw new Error(
      werte.length === 0
        ? `Keine Kennzahl mit Beschriftung "${anfangDerBeschriftung}…" in ` +
          `site.ts. Das Titelbild wird nicht gebaut, bevor klar ist, welche ` +
          `Zahl stimmt.`
        : `Die Kennzahl "${anfangDerBeschriftung}…" steht mit verschiedenen ` +
          `Werten in site.ts: ${verschieden.join(", ")}. Erst klären, welcher ` +
          `stimmt, dann das Titelbild bauen.`,
    );
  }
  return verschieden[0];
}

/**
 * Auf den nächsten runden Tausender abrunden.
 *
 * Auf dem Titelbild steht bewusst "4.000+" und nicht "4.053". Das Bild liegt
 * bei LinkedIn und lässt sich nur von Hand austauschen: Jede exakte Zahl dort
 * ist ab dem nächsten Commit falsch, und niemand merkt es, weil ein Titelbild
 * niemand ein zweites Mal liest. Eine Untergrenze bleibt wahr, solange die
 * Zahl wächst.
 *
 * Auf der Webseite steht weiterhin die exakte Zahl. Der Unterschied ist nicht
 * Genauigkeit, sondern Erreichbarkeit: Was der stündliche Prüflauf nachzählen
 * und neu ausliefern kann, darf exakt sein. Was einmal hochgeladen wird und
 * dann dort liegt, bekommt eine Grenze, die hält.
 */
function untergrenze(zahl) {
  const roh = Number(String(zahl).replace(/\./g, ""));
  if (!Number.isFinite(roh) || roh < 1000) {
    throw new Error(`"${zahl}" laesst sich nicht abrunden.`);
  }
  return `${Math.floor(roh / 1000)}.000+`;
}

const commits = untergrenze(kennzahl("Commits seit"));

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<style>
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1584px; height: 396px; overflow: hidden;
    background: #08080a; color: #f2f2f4;
    font-family: Outfit, system-ui, sans-serif;
    position: relative;
  }
  .glow { position: absolute; border-radius: 50%; filter: blur(90px); }
  .g1 { width: 620px; height: 620px; left: -120px; top: -260px; background: rgba(124,92,255,0.30); }
  .g2 { width: 720px; height: 720px; left: 640px; top: 40px;   background: rgba(63,208,255,0.13); }
  .g3 { width: 560px; height: 560px; left: 1180px; top: -180px; background: rgba(212,255,69,0.10); }
  .raster {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
    background-size: 26px 26px;
    -webkit-mask-image: radial-gradient(ellipse at 30% 40%, black, transparent 72%);
  }
  .inhalt {
    position: relative; height: 100%;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 96px 0 336px;
  }
  h1 { font-size: 62px; font-weight: 700; letter-spacing: -0.025em; line-height: 1; }
  .rolle { margin-top: 18px; font-size: 27px; font-weight: 600; color: #d4ff45; letter-spacing: -0.01em; }
  .zeile { margin-top: 16px; font-size: 17px; color: #a5a5b0; }
  .zahlen { display: flex; gap: 52px; align-items: flex-end; }
  .zahl { text-align: right; }
  .wert { font-size: 34px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .bez { margin-top: 7px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #84848f; }
  .rechts { display: flex; flex-direction: column; align-items: flex-end; gap: 18px; }
  .domain {
    font-size: 16px; color: #d4ff45; letter-spacing: 0.01em;
    border-top: 1px solid rgba(212,255,69,0.28); padding-top: 12px; width: 100%; text-align: right;
  }
</style></head>
<body>
  <div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>
  <div class="raster"></div>
  <div class="inhalt">
    <div>
      <h1>Domenic Moran</h1>
      <div class="rolle">AI Product Engineer &middot; Fullstack</div>
      <div class="zeile">Ich baue Produkte end-to-end und bringe sie live.</div>
    </div>
    <div class="rechts">
      <div class="zahlen">
        <div class="zahl"><div class="wert">4</div><div class="bez">Systeme live</div></div>
        <div class="zahl"><div class="wert">2</div><div class="bez">App Stores</div></div>
        <div class="zahl"><div class="wert">${commits}</div><div class="bez">Commits seit 03/2026</div></div>
      </div>
      <div class="domain">domenicmoran.de</div>
    </div>
  </div>
</body></html>`;

mkdirSync("../assets", { recursive: true });

const browser = await chromium.launch();
const seite = await browser.newPage({
  viewport: { width: 1584, height: 396 },
  deviceScaleFactor: 2,
});
await seite.setContent(html, { waitUntil: "networkidle" });
await seite.waitForTimeout(700);
await seite.screenshot({ path: ZIEL });
await browser.close();

console.log(`${ZIEL} gebaut, Commits: ${commits}`);
