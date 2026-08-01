#!/usr/bin/env node
/**
 * Lässt den Bau scheitern, wenn etwas Privates im öffentlichen Ordner liegt.
 *
 * Anlass ist ein Beinahe-Unfall: Beim Aufräumen wurde
 * `docs/MASTER_CAREER_GUIDE.pdf` nach `public/` kopiert, um zu sehen, ob dort
 * eine Fassung liegt. Die Datei enthält Gehaltsformulierungen, die
 * Bewerbungsstrategie und den Beruf, der bewusst aus allem Öffentlichen
 * herausgehalten wird. Sie lag vierzig Sekunden dort und wurde weder
 * eingecheckt noch ausgeliefert.
 *
 * Vierzig Sekunden sind kein Argument. Alles in `public/` geht beim nächsten
 * Bau ins Netz, ohne dass jemand zustimmt, und ist danach in Zwischenspeichern
 * und Suchmaschinen. Eine Regel, die nur im Kopf steht, hält genau bis zum
 * nächsten Mal.
 *
 * Geprüft wird auf drei Arten, weil eine Dateinamenliste zu leicht zu umgehen
 * ist: verbotene Namen, verbotene Inhalte in Textdateien, und eine Warnung bei
 * jeder neuen PDF, die nicht ausdrücklich freigegeben ist.
 *
 *   node scripts/pruefe-oeffentlich.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const OEFFENTLICH = "public";

/** Dateien, die dort liegen dürfen. Alles andere fällt auf. */
const FREIGEGEBEN = new Set(["domenic-moran-kurzprofil.pdf"]);

/** Namensteile, die nie im öffentlichen Ordner auftauchen dürfen. */
const VERBOTENE_NAMEN = [
  /master[_-]?career/i,
  /lebenslauf/i,
  /career[_-]?guide/i,
  /pruefstand|prüfstand/i,
  /audit[_-]?report/i,
  /user[_-]?todo/i,
  /zugang/i,
  /\.env/i,
];

/**
 * Wörter, die in einer ausgelieferten Textdatei nichts zu suchen haben.
 *
 * Der Beruf steht hier ausdrücklich: Er ist der eine Punkt, der aus allem
 * Öffentlichen herausbleibt, und ein Suchlauf findet ihn zuverlässiger als
 * jede Erinnerung.
 */
const VERBOTENE_INHALTE = [
  /[entfernt]/i,
  /[entfernt]/i,
  /Gehaltsvorstellung/i,
  /Untergrenze/i,
];

const TEXTARTIG = new Set([".txt", ".md", ".json", ".xml", ".svg", ".html", ".csv"]);

const befunde = [];

function durchgehen(ordner) {
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) {
      durchgehen(pfad);
      continue;
    }

    const relativ = pfad.replace(/\\/g, "/").replace(`${OEFFENTLICH}/`, "");

    for (const muster of VERBOTENE_NAMEN) {
      if (muster.test(eintrag)) {
        befunde.push(`${relativ}: Dateiname passt auf ${muster}`);
      }
    }

    if (extname(eintrag).toLowerCase() === ".pdf" && !FREIGEGEBEN.has(relativ)) {
      befunde.push(
        `${relativ}: PDF ohne Freigabe. Wenn sie öffentlich sein soll, in ` +
          `FREIGEGEBEN eintragen — das ist die Stelle, an der jemand hinsieht.`,
      );
    }

    if (TEXTARTIG.has(extname(eintrag).toLowerCase())) {
      const inhalt = readFileSync(pfad, "utf8");
      for (const muster of VERBOTENE_INHALTE) {
        if (muster.test(inhalt)) {
          befunde.push(`${relativ}: Inhalt passt auf ${muster}`);
        }
      }
    }
  }
}

durchgehen(OEFFENTLICH);

if (befunde.length) {
  console.error(`Nichts Privates gehört nach ${OEFFENTLICH}/. ${befunde.length} Befunde:\n`);
  for (const b of befunde) console.error(`  ${b}`);
  process.exit(1);
}

console.log(`${OEFFENTLICH}/ ist sauber: keine private Datei, kein verbotener Inhalt.`);
