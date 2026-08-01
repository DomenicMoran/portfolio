#!/usr/bin/env node
/**
 * Holt die Commit-Zahlen direkt von GitHub und schreibt den Prüfstempel.
 *
 * Warum nicht im Browser des Besuchers: Der größte Teil der Zahl kommt aus
 * privaten Repos — MenuCloud, Salati und NOURI tragen Kundendaten und
 * lizenzierte Inhalte. Sie öffentlich lesbar zu machen, nur damit eine Zahl
 * live ist, wäre der falsche Tausch, und ein Zugriffstoken im ausgelieferten
 * JavaScript wäre schlicht ein veröffentlichtes Token.
 *
 * Also andersherum: Ein Automat bei GitHub liest die Zahlen mit einem Token,
 * das dort in den Repository-Geheimnissen liegt, schreibt sie in diese Datei
 * und stößt eine Auslieferung an. Der Besucher bekommt eine Zahl, die von
 * selbst aktuell bleibt, ohne dass jemand ein Recht abgeben muss.
 *
 * Gezählt wird über die Commit-Liste: GitHub liefert bei `per_page=1` im
 * Link-Kopf die Nummer der letzten Seite, und die ist die Anzahl. Das ist ein
 * Aufruf je Repository statt einer vollständigen Historie.
 *
 *   GITHUB_TOKEN=… node scripts/zahlen-von-github.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const ZIEL = "src/content/geprueft.json";

/**
 * Die Repositories, über die gezählt wird.
 *
 * Dieselbe Liste wie in `zaehle-belege.mjs`, dort über das Dateisystem. Hier
 * über die API, damit es auch läuft, wenn niemand am Rechner sitzt.
 */
const REPOS = [
  // Die Produktivsysteme liegen unter der Organisation, nicht unter dem
  // persoenlichen Konto — und heissen dort anders als die Ordner auf der
  // Platte. Der erste Anlauf zaehlte "DomenicMoran/SalatiTech" und bekam 404;
  // aufgefallen nur, weil das Skript gegen die echte API lief und nicht gegen
  // eine Annahme.
  "MenuCloud-Berlin/MenuCloud-app",
  "MenuCloud-Berlin/salatibox",
  "MenuCloud-Berlin/NOURI",
  "DomenicMoran/portfolio",
  // Der Pruefstand ist bewusst nicht dabei: Er ist eine private Lernanwendung
  // fuer Domenic selbst, kein geliefertes System. Die Zahl auf der Seite soll
  // das abdecken, wovon die Seite handelt. Nebenbei wird sie dadurch
  // vollstaendig ueber GitHub nachvollziehbar, statt lokale Commits
  // mitzuzaehlen, die noch niemand gesehen hat.
  "DomenicMoran/verified-done",
  "DomenicMoran/cron-last-due",
  "DomenicMoran/whisper-ggml-header",
  "DomenicMoran/arabic-normalize",
];

if (!TOKEN) {
  console.error(
    "Kein GITHUB_TOKEN gesetzt. Ohne Token sind die privaten Repositories nicht\n" +
      "lesbar, und eine Teilsumme wäre schlimmer als keine: Sie sähe aus wie die\n" +
      "ganze Zahl. Abbruch ohne Änderung.",
  );
  process.exit(1);
}

async function commitsIn(repo) {
  const antwort = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "domenicmoran.de-zahlen",
    },
  });

  // Nicht sofort werfen: Sonst nennt die Meldung nur das erste unerreichbare
  // Repository, und wer das Token einrichtet, gibt ein Recht frei, laeuft
  // wieder auf, gibt das naechste frei. Gesammelt wird, dann einmal gemeldet.
  if (antwort.status === 404) return { repo, fehler: "nicht lesbar (404)" };
  if (antwort.status === 403) return { repo, fehler: "abgelehnt (403)" };
  if (!antwort.ok) return { repo, fehler: `HTTP ${antwort.status}` };

  // "…&page=1234>; rel=\"last\"" — die letzte Seite bei einem Eintrag je Seite
  // ist die Anzahl der Commits.
  const link = antwort.headers.get("link");
  if (link) {
    const letzte = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
    if (letzte) return { repo, anzahl: Number(letzte[1]) };
  }
  // Kein Link-Kopf heißt: höchstens eine Seite, also 0 oder 1 Commit.
  return { repo, anzahl: (await antwort.json()).length };
}

const je = await Promise.all(REPOS.map(commitsIn));
const fehlend = je.filter((e) => e.fehler);

for (const e of je) {
  console.log(
    e.fehler
      ? `      ?  ${e.repo}  ${e.fehler}`
      : `  ${String(e.anzahl).padStart(5)}  ${e.repo}`,
  );
}

if (fehlend.length) {
  const zeilen = [
    "",
    `${fehlend.length} von ${REPOS.length} Repositories sind mit diesem Token nicht lesbar.`,
    "Eine Teilsumme wäre schlimmer als eine alte Zahl: Sie sähe aus wie die ganze.",
    "Nichts geschrieben.",
    "",
    "Freizugeben:",
    ...fehlend.map((e) => `  ${e.repo}  (${e.fehler})`),
  ];
  console.error(zeilen.join("\n"));
  process.exit(1);
}

const summe = je.reduce((n, e) => n + e.anzahl, 0);
const heute = new Date().toISOString().slice(0, 10);
console.log(`  ${String(summe).padStart(5)}  zusammen über ${REPOS.length} Repositories`);

const vorher = existsSync(ZIEL) ? JSON.parse(readFileSync(ZIEL, "utf8")) : {};
const neu = {
  ...vorher,
  datum: heute,
  commitsHead: summe.toLocaleString("de-DE"),
  repos: REPOS.length,
  quelle: "GitHub-API",
};

const alt = existsSync(ZIEL) ? readFileSync(ZIEL, "utf8") : "";
const text = JSON.stringify(neu, null, 2) + "\n";

if (text === alt) {
  console.log("\nUnveraendert, nichts geschrieben.");
  process.exit(0);
}

writeFileSync(ZIEL, text, "utf8");
console.log(`\n${ZIEL} aufgefrischt: ${neu.commitsHead} Commits, Stand ${heute}.`);
