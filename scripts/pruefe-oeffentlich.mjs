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
 * Der erste Entwurf dieses Wächters hatte selbst drei Lücken, gefunden von der
 * Durchsicht nach dem Einchecken:
 *
 * 1. Er verbot Namen und ließ alles andere durch. Die private Datei
 *    `notizen.pdf` zu nennen hätte gereicht. Jetzt eine Erlaubnisliste:
 *    unbedenkliche Endungen und ausdrücklich freigegebene Dateien, sonst nichts.
 * 2. Er las nur Dateien mit bekannter Textendung. Eine Notiz als `daten.bin`
 *    rutschte durch. Jetzt wird jede Datei gelesen.
 * 3. Er benutzte `stat`, das einer Verknüpfung folgt. `public/bilder` als
 *    Verknüpfung auf `../docs` sah damit aus wie ein gewöhnlicher Ordner mit
 *    harmlosen Namen, ausgeliefert würde aber der Inhalt des Ziels. Jetzt
 *    `lstat`, und jede Verknüpfung ist ein Befund.
 *
 * Alle drei mit Gegenprobe nachgestellt und behoben.
 *
 *   node scripts/pruefe-oeffentlich.mjs
 */

import { readdirSync, readFileSync, lstatSync, realpathSync } from "node:fs";
import { join, extname, resolve, sep } from "node:path";

const OEFFENTLICH = "public";
const WURZEL = resolve(OEFFENTLICH);

/**
 * Was dort liegen darf. Der Rest fällt auf.
 *
 * Bewusst eine Erlaubnisliste und keine Verbotsliste. Der erste Entwurf
 * verbot bestimmte Namen und ließ alles andere durch — dann genügt es, die
 * private Datei `notizen.pdf` zu nennen, und der Wächter schweigt. Eine
 * Verbotsliste schützt nur vor dem Fehler, den man schon einmal gemacht hat.
 */
const FREIGEGEBEN = new Set(["domenic-moran-kurzprofil.pdf"]);

/**
 * Endungen, die von sich aus unbedenklich sind: Bilder, Schriften, Symbole und
 * die Dateien, die eine Seite zum Betrieb braucht. Alles andere muss
 * ausdrücklich in FREIGEGEBEN stehen.
 */
const UNBEDENKLICH = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".otf",
  ".webmanifest", ".xml", ".txt",
]);

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


const befunde = [];

function durchgehen(ordner) {
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    const relativ = pfad.replace(/\\/g, "/").replace(`${OEFFENTLICH}/`, "");

    // lstat statt stat: stat folgt einer Verknüpfung und meldet, was am Ziel
    // liegt. Eine Verknüpfung `public/bilder` auf `../docs` sähe damit aus wie
    // ein gewöhnlicher Ordner, und die Prüfung liefe über harmlose Namen.
    // Ausgeliefert würde trotzdem der Inhalt des Ziels.
    const angabe = lstatSync(pfad);

    if (angabe.isSymbolicLink()) {
      let ziel = "unauflösbar";
      try {
        ziel = realpathSync(pfad);
      } catch {
        // Zeigt ins Leere. Trotzdem ein Befund: Verknüpfungen haben hier
        // nichts zu suchen.
      }
      const drinnen = ziel !== "unauflösbar" && (ziel + sep).startsWith(WURZEL + sep);
      befunde.push(
        `${relativ}: Verknüpfung auf ${ziel}${drinnen ? "" : ", also aus dem öffentlichen Ordner hinaus"}`,
      );
      continue;
    }

    if (angabe.isDirectory()) {
      durchgehen(pfad);
      continue;
    }

    for (const muster of VERBOTENE_NAMEN) {
      if (muster.test(eintrag)) {
        befunde.push(`${relativ}: Dateiname passt auf ${muster}`);
      }
    }

    const endung = extname(eintrag).toLowerCase();
    if (!UNBEDENKLICH.has(endung) && !FREIGEGEBEN.has(relativ)) {
      befunde.push(
        `${relativ}: keine Freigabe. Wenn die Datei öffentlich sein soll, in ` +
          `FREIGEGEBEN eintragen — das ist die Stelle, an der jemand hinsieht.`,
      );
    }

    // Der Inhalt wird bei jeder Datei geprüft, nicht nur bei bekannten
    // Textendungen. Eine private Notiz heißt sonst `daten.bin` und rutscht
    // durch. Binärdateien ergeben dabei Unsinn, aber der trifft die Muster
    // nicht, und die Kosten sind ein Lesevorgang.
    let inhalt = "";
    try {
      inhalt = readFileSync(pfad, "utf8");
    } catch {
      continue;
    }
    for (const muster of VERBOTENE_INHALTE) {
      if (muster.test(inhalt)) {
        befunde.push(`${relativ}: Inhalt passt auf ${muster}`);
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
