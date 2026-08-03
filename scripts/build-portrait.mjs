#!/usr/bin/env node
/**
 * Erzeugt alle Fassungen des Porträts aus einem Original.
 *
 * Dasselbe Gesicht liegt an vier Stellen: gross auf der Seite, klein auf dem
 * One-Pager, winzig und eingebettet in der Vorschaukarte, und im Briefkopf des
 * Lebenslaufs. Bis hierher waren das von Hand erzeugte Dateien ohne
 * gemeinsame Quelle — genau die Lage, die `build-favicon.mjs` fuer das Zeichen schon einmal aufgeloest
 * hat. Eine Binaerdatei liest nicht mit: Wer das Foto tauscht und eine
 * davon vergisst, sieht den Fehler erst, wenn jemand die Seite teilt.
 *
 * Deshalb ein Lauf, der alle vier schreibt. Wer das Original tauscht, ruft ihn
 * auf, und danach gibt es kein altes Bild mehr, das noch irgendwo lebt.
 *
 * Die Originale liegen ausserhalb des Repos, unter `../assets/pb/`, wie die
 * LinkedIn-Bilder auch: 3,1 MB verlustfreies PNG gehoeren nicht in ein
 * oeffentliches Repo, in dem sie niemand ausliefert. Fehlen sie, bricht der
 * Lauf mit dem Pfad ab, statt eine halbe Ausgabe zu hinterlassen.
 *
 *   npm run build:portrait
 */

import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ORIGINALE = "../assets/pb";

/**
 * Warum diese Kantenlaengen.
 *
 * `next/image` erzeugt nie mehr Pixel als das Original hat, und der Browser
 * waehlt aus dem srcset. Fuer das Bild auf der Seite steht
 * `sizes="(max-width: 640px) 60vw, 220px"`: 220 CSS-Pixel bei dreifacher
 * Pixeldichte sind 660, auf dem Telefon 60 vw von 390 px mal drei sind 702 —
 * der Browser greift damit zur 750er-Fassung, in keinem realistischen Fall
 * ueber 828. 1200 laesst Luft nach oben und ist trotzdem nicht das
 * Vierfache dessen, was je ausgeliefert wird. Die Datei davor hatte 1967
 * Pixel Kantenlaenge; auf 660 und 750 Pixel heruntergerechnet — also so, wie
 * der Browser sie zeigt — betraegt der Unterschied zur 1200er Fassung im
 * Mittel 0,6 von 255 Helligkeitsstufen, im Spitzenwert 13.
 *
 * Der One-Pager zeigt 110 px und wird gedruckt; bei 300 dpi sind das rund 460
 * Pixel. 1024 ist hier die Kantenlaenge des Originals, also bleibt sie stehen.
 *
 * Die Vorschaukarte bettet ihr Bild als Datenadresse in jede erzeugte Karte
 * ein. Dort zaehlt jedes Kilobyte doppelt, und der Kreis ist 150 px gross.
 */
const FASSUNGEN = [
  {
    quelle: "portrait-dark-master.png",
    ziel: "public/portrait-dark.jpg",
    kante: 1200,
    guete: 86,
    zweck: "Bild auf der Seite, dunkler Grund",
  },
  {
    quelle: "portrait-master.png",
    ziel: "public/portrait.jpg",
    kante: 1024,
    guete: 86,
    zweck: "One-Pager und Druck, heller Grund",
  },
  {
    quelle: "portrait-dark-master.png",
    ziel: "src/lib/og-portrait.jpg",
    kante: 320,
    guete: 82,
    zweck: "Vorschaukarte, eingebettet als Datenadresse",
  },
  /*
     Die vierte Stelle, und die einzige außerhalb dieses Repos.

     Der Lebenslauf setzt sein Bild als Datenadresse in den Briefkopf und lag
     dafür als eigene Datei in `../docs`. Genau die Lage, die dieser Lauf für
     die anderen drei aufgelöst hat: Wer das Foto tauscht und diese vergisst,
     verschickt einen Lebenslauf mit dem alten Gesicht — und merkt es nie,
     weil der Lebenslauf nicht öffentlich ist und niemand die beiden
     nebeneinander sieht.

     420 px, weil der Briefkopf 66 pt zeigt und bei 300 dpi rund 275 Pixel
     braucht.
  */
  {
    quelle: "portrait-master.png",
    ziel: "../docs/lebenslauf-portrait.jpg",
    kante: 420,
    guete: 86,
    zweck: "Briefkopf des Lebenslaufs",
  },
];

const fehlend = [...new Set(FASSUNGEN.map((f) => f.quelle))].filter(
  (name) => !existsSync(join(ORIGINALE, name)),
);

if (fehlend.length) {
  console.error(
    `Original fehlt: ${fehlend.join(", ")}\n` +
      `Erwartet in ${ORIGINALE}/ — dieser Ordner liegt bewusst neben dem Repo, ` +
      `nicht darin.`,
  );
  process.exit(1);
}

for (const { quelle, ziel, kante, guete, zweck } of FASSUNGEN) {
  await sharp(join(ORIGINALE, quelle))
    .resize(kante, kante, { fit: "cover" })
    // mozjpeg holt bei gleichem Augenschein rund ein Viertel der Dateigroesse
    // heraus; 4:4:4 laesst die Hautkanten in Ruhe, die 4:2:0 bei einem
    // Gesicht vor dunklem Grund sichtbar ausfranst.
    .jpeg({ quality: guete, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(ziel);

  const kb = Math.round(statSync(ziel).size / 1024);
  console.log(
    `${ziel.padEnd(24)} ${kante}px  ${String(kb).padStart(3)} kB  ${zweck}`,
  );
}
