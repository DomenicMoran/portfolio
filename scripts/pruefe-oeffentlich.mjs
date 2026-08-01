#!/usr/bin/env node
/**
 * Lässt den Bau scheitern, wenn etwas Privates im öffentlichen Ordner liegt.
 *
 * Dieses Repository liegt neben einem Ordner mit Arbeitsunterlagen, die nicht
 * ins Netz gehören. Alles in `public/` geht beim nächsten Bau dorthin, ohne
 * dass jemand zustimmt, und ist danach in Zwischenspeichern und Suchmaschinen.
 * Eine Datei, die einmal versehentlich hier landet, bekommt man nicht zurück.
 * Eine Regel, die nur im Kopf steht, hält genau bis zum nächsten Mal.
 *
 * Die Prüfung deckt drei Wege ab, die ein erster Entwurf offen ließ:
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
import { createHash } from "node:crypto";
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
 * Diese hier dürfen im Klartext stehen: Dass eine Gehaltsvorstellung nicht auf
 * die Webseite gehört, verrät nichts über den, der sie nicht dort haben will.
 */
const VERBOTENE_INHALTE = [/Gehaltsvorstellung/i, /Untergrenze/i];

/**
 * Und die, die nicht im Klartext stehen dürfen.
 *
 * Eine Prüfung, die bestimmte Begriffe aus dem öffentlichen Ordner
 * heraushalten soll, darf sie nicht selbst als Suchmuster veröffentlichen —
 * dieses Repository ist öffentlich. Wer sie läse, bekäme genau das, was sie
 * zurückhält.
 *
 * Deshalb nur Hashes. Geprüft wird nicht der Text gegen ein Muster, sondern
 * jedes Wort und jedes Wortpaar des Textes gegen diese Liste: bei einzelnen
 * Wörtern die ersten zwölf Zeichen, damit Beugungen mitgehen, bei Wortpaaren
 * das ganze Paar. Die Klartextfassung liegt außerhalb aller Repositories.
 *
 * Das ist keine Verschlüsselung und soll keine sein. Es verhindert, dass ein
 * Leser die Wörter beim Überfliegen mitnimmt — und genau darum geht es.
 */
const VERBOTENE_HASHES = new Set(["1ea8b03c92f6d22f", "c5088451e38012e0"]);

const PRAEFIX = 12;

function kurzHash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/** Findet ein verbotenes Wort oder Wortpaar, ohne es zu benennen. */
function verbotenerBegriff(inhalt) {
  const woerter = inhalt
    .toLowerCase()
    .replace(/[^a-zäöüß\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < woerter.length; i++) {
    if (VERBOTENE_HASHES.has(kurzHash(woerter[i].slice(0, PRAEFIX)))) return true;
    if (i + 1 < woerter.length) {
      if (VERBOTENE_HASHES.has(kurzHash(`${woerter[i]} ${woerter[i + 1]}`))) return true;
    }
  }
  return false;
}


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
    // Der Befund nennt das Wort nicht. Wer die Meldung sieht, weiss ohnehin,
    // was gemeint ist; wer sie in einem Protokoll findet, nicht.
    if (verbotenerBegriff(inhalt)) {
      befunde.push(`${relativ}: enthält einen Begriff, der nicht öffentlich werden darf`);
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
