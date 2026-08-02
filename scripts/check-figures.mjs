#!/usr/bin/env node
/**
 * Zählt die Zahlen nach, die auf der Webseite über fremde Repos behauptet
 * werden, und vergleicht sie mit dem, was in `src/content/site.ts` steht.
 *
 * Warum das nötig ist: Auf der Seite stehen Zahlen über MenuCloud und über die
 * OSS-Pakete. Die Repos wachsen weiter, die Zahlen auf der Seite nicht. Bei
 * einer Prüfung fielen drei Abweichungen auf, alle in dieselbe Richtung:
 *
 *   n8n-Workflows      46 auf der Seite, 63 im Repository
 *   MenuCloud Unit     5.163 auf der Seite, 7.263 gemessen
 *   cron-last-due      21 auf der Seite, 23 gemessen
 *
 * Eine Zahl, die zu niedrig ist, schadet weniger als eine zu hohe, aber sie
 * ist genauso falsch, und bei einer Nachfrage im Gespräch merkt man es.
 *
 * Der Lauf ist bewusst **kein** Teil des Baus. Die gezählten Repos liegen
 * außerhalb dieses Projekts und sind auf einem Bauserver nicht vorhanden;
 * ein Prüfschritt, der dort immer scheitert, wird abgeschaltet und prüft dann
 * nie wieder etwas. Er gehört in den stündlichen Prüflauf.
 *
 *   node scripts/check-figures.mjs
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const MENUCLOUD = resolve("../../MenuCloud");
const OSS = resolve("../oss");
const INHALT = "src/content/site.ts";

/**
 * vitest direkt mit node starten, nicht ueber npx.
 *
 * Mit `shell: true` warnt Node zu Recht, dass Argumente nur verkettet und
 * nicht maskiert werden. Ohne shell laesst sich `npx.cmd` unter Windows gar
 * nicht starten (EINVAL). Der Einstiegspunkt des Pakets liegt ohnehin im
 * jeweiligen Repo, und ihn direkt aufzurufen umgeht beides.
 */
function vitestLauf(repo) {
  const einstieg = join(repo, "node_modules", "vitest", "vitest.mjs");
  if (!existsSync(einstieg)) return null;

  const optionen = {
    cwd: repo,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  };

  // vitest endet mit Rueckgabewert 1, sobald ein Test rot ist — und
  // execFileSync wirft dann. Genau der Fall ist aber der interessante: Der
  // Bericht unten hat einen Zweig fuer rote Tests, der ohne dieses catch nie
  // erreicht wurde. Statt einer Meldung ueber gescheiterte Tests brach der
  // Lauf mit einem Stapelabzug ab, in dem die Zahlen als 2 MB JSON steckten.
  //
  // Der Bericht liegt in beiden Faellen auf stdout, also wird er in beiden
  // Faellen gelesen.
  try {
    return JSON.parse(execFileSync(process.execPath, [einstieg, "run", "--reporter=json"], optionen));
  } catch (fehler) {
    if (typeof fehler?.stdout === "string" && fehler.stdout.trim().startsWith("{")) {
      return JSON.parse(fehler.stdout);
    }
    throw fehler;
  }
}

const quelle = readFileSync(INHALT, "utf8");
const zeilen = [];
let abweichungen = 0;

function vergleiche(was, gemessen, aufDerSeite) {
  const gleich = String(gemessen) === String(aufDerSeite);
  if (!gleich) abweichungen++;
  zeilen.push(
    `${gleich ? "  ok " : "  != "}${was.padEnd(28)} gemessen ${String(gemessen).padStart(6)}` +
      (gleich ? "" : `   auf der Seite ${aufDerSeite}`),
  );
}

/** Die Zahl aus einem Satz der Inhaltsdatei ziehen. */
function ausSeite(muster) {
  const m = quelle.match(muster);
  return m ? m[1].replace(/\./g, "") : "(nicht gefunden)";
}

// --- n8n-Workflows ---------------------------------------------------------
//
// Gezählt werden die von git verfolgten Workflow-Dateien in beiden Ordnern.
// Eine Datei zählt, wenn sie `nodes` und `connections` hat; ein Workflow, der
// zweimal exportiert wurde, zählt einmal. Genau ein solcher Fall liegt vor:
// system-update-watchdog.json und system-update-watchdog__kAP180C9Vnd5QEJX.json
// haben denselben Namen und dieselben sechs Knoten.

if (existsSync(MENUCLOUD)) {
  const namen = new Set();
  let dateien = 0;
  for (const ordner of ["deploy/n8n/workflows", "marketing/n8n"]) {
    const pfad = join(MENUCLOUD, ordner);
    if (!existsSync(pfad)) continue;
    for (const datei of readdirSync(pfad)) {
      if (!datei.endsWith(".json")) continue;
      let inhalt;
      try {
        inhalt = JSON.parse(readFileSync(join(pfad, datei), "utf8"));
      } catch {
        continue;
      }
      if (!inhalt.nodes || !inhalt.connections) continue;
      dateien++;
      namen.add(inhalt.name ?? datei);
    }
  }
  vergleiche(
    "n8n-Workflows",
    namen.size,
    ausSeite(/title: "([\d.]+) Workflows, die den Betrieb tragen"/),
  );
  if (dateien !== namen.size) {
    zeilen.push(`       (${dateien} Dateien, ${dateien - namen.size} doppelt exportiert)`);
  }

  // --- Testfälle -----------------------------------------------------------
  const vitest = vitestLauf(MENUCLOUD);

  // Playwright zählt jeden Test einmal je Browser-Projekt und meldet deshalb
  // ein Vielfaches. Gezählt wird der einzelne Testfall, wie im Quelltext.
  const specs = execFileSync("git", ["ls-files", "tests/e2e/*.spec.ts"], {
    cwd: MENUCLOUD,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const e2e = specs.reduce(
    (n, s) => n + (readFileSync(join(MENUCLOUD, s), "utf8").match(/^\s*test\(/gm) ?? []).length,
    0,
  );

  const aufSeite = quelle.match(/"([\d.]+) Testfälle \(([\d.]+) Unit, ([\d.]+) End-to-End\)/);
  vergleiche("MenuCloud Unit-Tests", vitest.numTotalTests, aufSeite?.[2].replace(/\./g, ""));
  vergleiche("MenuCloud End-to-End", e2e, aufSeite?.[3].replace(/\./g, ""));
  vergleiche(
    "MenuCloud gesamt",
    vitest.numTotalTests + e2e,
    aufSeite?.[1].replace(/\./g, ""),
  );
  if (vitest.numFailedTests > 0) {
    zeilen.push(`  !!  ${vitest.numFailedTests} Unit-Tests scheitern`);
    abweichungen++;
  }
} else {
  zeilen.push(`  --  MenuCloud nicht unter ${MENUCLOUD}, übersprungen`);
}

// --- OSS-Pakete ------------------------------------------------------------

const PAKETE = [
  ["cron-last-due", /name: "cron-last-due",[\s\S]{0,400}?· (\d+) Tests/],
  ["whisper-ggml-header", /name: "whisper-ggml-header",[\s\S]{0,400}?· (\d+) Tests/],
  ["arabic-normalize", /name: "arabic-normalize",[\s\S]{0,400}?· (\d+) Tests/],
];

for (const [paket, muster] of PAKETE) {
  const pfad = join(OSS, paket);
  if (!existsSync(pfad)) {
    zeilen.push(`  --  ${paket} nicht vorhanden, übersprungen`);
    continue;
  }
  const j = vitestLauf(pfad);
  if (!j) {
    zeilen.push(`  --  ${paket}: vitest nicht installiert, uebersprungen`);
    continue;
  }
  vergleiche(paket, j.numTotalTests, ausSeite(muster));
}

/* ---------------------------------------------------------------------------
   Untergrenzen in dem, was verschickt wird
   ---------------------------------------------------------------------------

   Lebenslauf, Kurzprofil, Bewerbungstexte und das LinkedIn-Titelbild nennen
   keine exakten Zahlen, sondern Untergrenzen: "über 4.000 Commits". Der Grund
   ist Erreichbarkeit — ein verschicktes PDF liegt danach in einem Postfach,
   das niemand mehr aktualisiert, und eine exakte Zahl darin ist ab dem
   nächsten Commit überholt.

   Geprüft wird beides: Die Grenze muss halten, sonst ist die Aussage falsch.
   Und sie darf nicht zu weit darunter liegen — wer "über 4.000" schreibt,
   wenn es längst 6.000 sind, wirkt nicht bescheiden, sondern als kenne er
   seine eigenen Zahlen nicht. */

function zahlAusSeite(muster) {
  const m = quelle.match(muster);
  return m ? Number(m[1].replace(/\./g, "")) : null;
}

/**
 * Jede Untergrenze mit ihrem Zusammenhang.
 *
 * Ohne den Zusammenhang wird die Prüfung falsch: Im Lebenslauf steht "über
 * 1.000 Commits" im Salati-Block und meint Salati, nicht die Summe über alle
 * Repos. Ein Muster, das nur nach "über N Commits" sucht, vergleicht das mit
 * 4.053 und meldet einen Fehler, der keiner ist. Genau so ein Fehlalarm sorgt
 * dafür, dass die Prüfung nach zwei Tagen ignoriert wird.
 */
const UNTERGRENZEN = [
  {
    was: "Commits gesamt",
    imText: /über ([\d.]+) Commits\*\* über drei Monorepos/g,
    gemessen: () => zahlAusSeite(/value:\s*"([\d.]+)",\s*label:\s*"Commits seit/),
  },
  {
    was: "Commits in Salati",
    imText: /Android in Vorbereitung · über ([\d.]+) Commits/g,
    gemessen: () => zahlAusSeite(/\{ value: "([\d.]+)", label: "Commits" \}/),
  },
  {
    was: "Commits seit März",
    imText: /[Üü]ber ([\d.]+) Commits seit März 2026/g,
    gemessen: () => zahlAusSeite(/value:\s*"([\d.]+)",\s*label:\s*"Commits seit/),
  },
  {
    was: "Testfälle",
    imText: /über ([\d.]+) Testfäll/g,
    gemessen: () => zahlAusSeite(/"([\d.]+) Testfälle \(/),
  },
];

for (const datei of ["../docs/LEBENSLAUF.md", "../docs/CAREER-LAUNCHPAD.md"]) {
  if (!existsSync(datei)) {
    zeilen.push(`  --  ${datei} nicht vorhanden, übersprungen`);
    continue;
  }
  const inhalt = readFileSync(datei, "utf8");
  const kurz = datei.split("/").pop();

  for (const { was, imText, gemessen } of UNTERGRENZEN) {
    const wirklich = gemessen();
    if (wirklich === null) continue;

    for (const treffer of inhalt.matchAll(imText)) {
      const grenze = Number(treffer[1].replace(/\./g, ""));
      const name = `${kurz}: über ${treffer[1]} ${was}`;
      if (grenze > wirklich) {
        zeilen.push(`  !!  ${name} — gemessen nur ${wirklich}. Die Aussage stimmt nicht.`);
        abweichungen++;
      } else if (wirklich > grenze * 1.25) {
        zeilen.push(`  ~   ${name} — gemessen ${wirklich}, über 25 % mehr. Grenze anheben.`);
        abweichungen++;
      } else {
        zeilen.push(`  ok  ${name.padEnd(42)} gemessen ${wirklich}`);
      }
    }
  }
}

/* ---------------------------------------------------------------------------
   Commits über alle Repos, und der Prüfstempel
   ---------------------------------------------------------------------------

   Auf der Seite stand: "gemessen mit git rev-list HEAD --count über die drei
   Monorepos hinter Salati, MenuCloud und NOURI". Über diese drei sind es aber
   3.975; die 4.053 daneben enthalten zusätzlich Portfolio, Prüfstand und die
   vier OSS-Pakete. Der Hinweis, der die Zahl prüfbar machen sollte, widerlegte
   sie also. Genau das findet jemand, der nachrechnet — und nachzurechnen ist
   ausdrücklich die Einladung.

   Deshalb schreibt dieser Lauf den Hinweis jetzt selbst. Was auf der Seite
   steht, ist damit das Ergebnis einer Messung und keine Erinnerung daran. */

const REPOS = [
  ["MenuCloud", resolve("../../MenuCloud")],
  ["Salati", resolve("../../SalatiTech")],
  ["NOURI", resolve("../../NOURI")],
  ["Portfolio", resolve(".")],
  ["verified-done", join(OSS, "verified-done")],
  ["cron-last-due", join(OSS, "cron-last-due")],
  ["whisper-ggml-header", join(OSS, "whisper-ggml-header")],
  ["arabic-normalize", join(OSS, "arabic-normalize")],
];

function commits(repo) {
  try {
    return Number(
      execFileSync("git", ["rev-list", "--count", "HEAD"], {
        cwd: repo,
        encoding: "utf8",
      }).trim(),
    );
  } catch {
    return 0;
  }
}

let head = 0;
const fehlendeRepos = [];
for (const [name, pfad] of REPOS) {
  if (!existsSync(join(pfad, ".git"))) {
    fehlendeRepos.push(name);
    continue;
  }
  head += commits(pfad);
}

const deutsch = (n) => n.toLocaleString("de-DE");

if (fehlendeRepos.length) {
  zeilen.push(`  --  Nicht gefunden: ${fehlendeRepos.join(", ")}. Prüfstempel übersprungen.`);
} else {
  /**
   * Die Commit-Zahl wird mit Nachsicht verglichen, alle anderen nicht.
   *
   * Sie steht auf der Seite mit ihrem Messdatum: "4.065, gemessen am 1. August
   * 2026". Ein datierter Wert wird nicht falsch, wenn danach weitergearbeitet
   * wird — er wird nur älter. Und weitergearbeitet wird laufend, unter anderem
   * von diesem Prüflauf selbst: Sein eigener Commit hebt die Zahl um eins.
   *
   * Ohne Nachsicht meldet dieser Schritt deshalb in jedem einzelnen Lauf eine
   * Abweichung. Eine Prüfung, die immer rot ist, liest nach zwei Tagen niemand
   * mehr, und dann fällt auch die echte Abweichung nicht mehr auf.
   *
   * Gemeldet wird nur, was wirklich schiefliegt: eine Zahl auf der Seite, die
   * höher ist als die gemessene (dann behauptet sie mehr, als da ist), oder ein
   * Rückstand von mehr als zwei Prozent (dann ist das Datum daneben wertlos).
   */
  // Die Zahl steht nicht mehr als Text in site.ts, sondern kommt von dort aus
  // dem Pruefstempel. Gelesen wird deshalb der Stempel selbst.
  const stempelJetzt = existsSync("src/content/verified.json")
    ? JSON.parse(readFileSync("src/content/verified.json", "utf8"))
    : {};
  const aufDerSeite = Number(String(stempelJetzt.commitsHead ?? "").replace(/\./g, ""));
  const rueckstand = head - aufDerSeite;

  if (!Number.isFinite(aufDerSeite)) {
    zeilen.push("  !!  Commits über alle Repos: keine Zahl in site.ts gefunden.");
    abweichungen++;
  } else if (rueckstand < 0) {
    zeilen.push(
      `  !!  Commits über alle Repos: auf der Seite ${deutsch(aufDerSeite)}, ` +
        `gemessen nur ${deutsch(head)}. Die Seite behauptet mehr, als da ist.`,
    );
    abweichungen++;
  } else if (rueckstand > head * 0.02) {
    zeilen.push(
      `  ~   Commits über alle Repos: ${deutsch(rueckstand)} hinterher ` +
        `(Seite ${deutsch(aufDerSeite)}, gemessen ${deutsch(head)}). Auffrischen.`,
    );
    abweichungen++;
  } else {
    zeilen.push(
      `  ok  Commits über alle Repos      gemessen ${String(head).padStart(6)}` +
        (rueckstand ? `   Seite ${deutsch(aufDerSeite)}, ${rueckstand} hinterher` : ""),
    );
  }

  /**
   * Dieser Lauf schreibt den Prüfstempel nicht.
   *
   * `src/content/verified.json` hat genau einen Schreiber: den Automaten unter
   * .github/workflows, der über die GitHub-API zählt. Das ist kein Formalismus,
   * sondern der Unterschied zwischen zwei Zahlen. Hier wird lokal gezählt, also
   * einschliesslich Commits, die auf keinem Server liegen; die Seite lädt
   * ausdrücklich zum Nachrechnen ein, und nachrechnen kann ein Aussenstehender
   * nur, was bei GitHub liegt.
   *
   * Schriebe dieser Lauf mit, stünde im Stempel eine Zahl, die niemand
   * nachvollziehen kann — und zwei Schreiber für dieselbe Datei sind genau der
   * Widerspruch, gegen den sie eingeführt wurde.
   *
   * Aufgabe hier ist deshalb nur der Vergleich: Weicht die Seite ab, steht das
   * oben im Bericht und der Lauf endet mit einem Fehler.
   */
}

/* ---------------------------------------------------------------------------
   Die Zahlen der Lernplattform in USER-TODO.md
   ---------------------------------------------------------------------------

   USER-TODO.md beschreibt, was der Prüfstand enthält: Folgen, Minuten,
   Kapitel, Fachwörter, Fragen. Diese Datei wird gelesen, wenn jemand wissen
   will, was ihn erwartet — und sie wuchs, während der Prüfstand wuchs. Bei
   einer Stichprobe standen dort 240 Fragen, gezählt waren es 280, und 125
   Minuten gegen gemessene 127.

   Kein Beinbruch, aber dieselbe Sorte Fehler, gegen die dieses Skript für die
   Webseite gebaut wurde: eine Zahl, die einmal richtig war. Also zählt es sie
   mit. Der Prüfstand liegt ausserhalb dieses Projekts; fehlt er, wird der
   Block übersprungen statt zu scheitern. */

const PRUEFSTAND = resolve("../pruefstand");
const TODO = "../USER-TODO.md";

if (existsSync(PRUEFSTAND) && existsSync(TODO)) {
  const todo = readFileSync(TODO, "utf8");
  const lies = (p) => {
    try {
      return JSON.parse(readFileSync(join(PRUEFSTAND, p), "utf8"));
    } catch {
      return null;
    }
  };

  const folgen = lies("podcast/index.json");
  const karten = lies("inhalte/karten.json");
  const woerter = lies("inhalte/woerterbuch.json");
  const lektionen = lies("inhalte/lektionen.json");

  const ausTodo = (muster) => {
    const m = todo.match(muster);
    return m ? Number(m[1].replace(/\./g, "")) : null;
  };

  const pruefe = (was, gemessen, muster) => {
    if (gemessen == null) return;
    const behauptet = ausTodo(muster);
    if (behauptet === null) {
      zeilen.push(`  --  USER-TODO: "${was}" nicht gefunden, übersprungen`);
      return;
    }
    const gleich = behauptet === gemessen;
    if (!gleich) abweichungen++;
    zeilen.push(
      `${gleich ? "  ok " : "  != "} USER-TODO: ${was.padEnd(22)} gemessen ${String(gemessen).padStart(5)}` +
        (gleich ? "" : `   dort ${behauptet}`),
    );
  };

  pruefe("Podcast-Folgen", folgen?.length, /(\d+) Podcast-Folgen/);
  // Aus `sekunden` rechnen, nicht aus `minuten`.
  //
  // `minuten` ist die geschätzte Länge aus der Zeichenzahl des Skripts und je
  // Folge gerundet; `sekunden` ist die Länge der fertigen Tonspur. Über
  // sechzehn Folgen summierten sich die Rundungen auf 127 Minuten, während die
  // Anwendung selbst 125 anzeigt — aus 7.518 Sekunden. Zwei Rechenwege für
  // dieselbe Zahl, und der falsche stand im Dokument für den Leser.
  pruefe(
    "Podcast-Minuten",
    folgen ? Math.round(folgen.reduce((n, f) => n + (f.sekunden ?? 0), 0) / 60) : null,
    /Podcast-Folgen mit ([\d.]+) Minuten/,
  );
  pruefe("Buchkapitel", lektionen?.length, /([\d.]+) Buchkapitel/);
  pruefe("Fachwörter", woerter?.length, /([\d.]+) Fachwörter/);
  // Nicht alle Karten sind Quizfragen.
  //
  // `karten.json` hält 280 Einträge, im Quiz stehen 240: Merksätze und die
  // Karten mit langen Rückseiten bleiben draußen, weil man die richtige Antwort
  // sonst an der Länge erkennt statt am Inhalt; dafür kommen die dreißig
  // Interviewfragen dazu. Die Prüfung zählte vorher schlicht die Datei und
  // deckte damit die Behauptung „280 Fragen mit Antwortauswahl", die um 40 zu
  // hoch war. Gerechnet wird jetzt wie in lib/quiz.ts.
  const INTERVIEWFRAGEN_ANZAHL = 30;
  const quizfaehig = karten
    ? karten.filter(
        (k) => (k.art === "wort" || k.art === "begriff") && (k.hinten ?? "").length <= 400,
      ).length + INTERVIEWFRAGEN_ANZAHL
    : null;
  pruefe("Fragen mit Auswahl", quizfaehig, /([\d.]+) Fragen mit Antwortauswahl/);
} else {
  zeilen.push("  --  Prüfstand oder USER-TODO.md nicht gefunden, übersprungen");
}

/* ---------------------------------------------------------------------------
   NOURI: Tabellen und Migrationen
   ---------------------------------------------------------------------------

   Zwei Zahlen, die bisher niemand nachgezählt hat. Sie ändern sich nur mit dem
   Code — aber genau das galt auch für die 63 ausgelieferten Versionen, die
   trotzdem überholt waren, als jemand hinsah. Was auf der Seite steht, wird
   hier gezählt oder es steht nicht da. */

const NOURI = resolve("../../NOURI");

if (existsSync(join(NOURI, "supabase", "migrations"))) {
  const migrationen = readdirSync(join(NOURI, "supabase", "migrations")).filter((d) =>
    d.endsWith(".sql"),
  );

  // `create table` zählt auch die Varianten mit `if not exists` und mit
  // Schema-Präfix. Gezählt wird die Anweisung, nicht die Zeile: In einer
  // Migration können mehrere Tabellen entstehen.
  let tabellen = 0;
  for (const datei of migrationen) {
    const inhalt = readFileSync(join(NOURI, "supabase", "migrations", datei), "utf8");
    tabellen += (inhalt.match(/create\s+table(\s+if\s+not\s+exists)?\s+["a-z_.]+/gi) ?? []).length;
  }

  vergleiche("NOURI-Migrationen", migrationen.length, ausSeite(/value: "(\d+)", label: "Migrationen"/));
  vergleiche("NOURI-Tabellen", tabellen, ausSeite(/value: "(\d+)", label: "Tabellen"/));
} else {
  zeilen.push(`  --  NOURI nicht unter ${NOURI}, übersprungen`);
}

/* ---------------------------------------------------------------------------
   Salati: Sprachen der App
   ---------------------------------------------------------------------------

   Die Seite nennt vierzehn Sprachen, an zwei Stellen je Sprachfassung.
   Gezählt werden die Sprachordner im Repository, gelesen über dieselbe
   gh-Verbindung wie der Changelog. */

{
  let sprachen = null;
  try {
    const roh = execFileSync(
      "gh",
      ["api", "repos/MenuCloud-Berlin/salatibox/git/trees/main?recursive=1", "-q", ".tree[].path"],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
    const codes = new Set();
    for (const pfad of roh.split("\n")) {
      const treffer = pfad.match(/(?:locales?|i18n|translations)\/([a-z]{2}(?:-[A-Z]{2})?)[/.]/);
      if (treffer) codes.add(treffer[1]);
    }
    sprachen = codes.size || null;
  } catch {
    zeilen.push("  --  Salati-Sprachen nicht lesbar (gh fehlt oder Konto ohne Zugriff)");
  }

  if (sprachen) {
    vergleiche("Salati-Sprachen", sprachen, ausSeite(/(\d+) Sprachen gepflegt/));
  }
}

/* ---------------------------------------------------------------------------
   Ausgelieferte Versionen von Salati
   ---------------------------------------------------------------------------

   Die Seite nennt die Zahl der ausgelieferten Versionen und die Spanne
   ("1.0.0 bis 1.46.0"). Beides stand von Hand da und war bei einer Stichprobe
   überholt: Der App Store führte 1.46.0, die Seite 1.45.0 und 63 statt 64.

   Salati liegt nicht neben diesem Projekt, sondern nur bei GitHub, und das
   Repository ist privat. Gezählt wird deshalb über `gh api` mit dem gerade
   angemeldeten Konto. Fehlt gh oder darf das Konto nicht lesen, wird der Block
   übersprungen statt zu scheitern: Eine Prüfung, die auf einem fremden Rechner
   immer rot ist, wird abgeschaltet und prüft dann nie wieder etwas. */

{
  const pfad = "apps/mobile/src/features/changelog/changelog.ts";
  let inhalt = null;
  try {
    const roh = execFileSync(
      "gh",
      ["api", `repos/MenuCloud-Berlin/salatibox/contents/${pfad}`, "-q", ".content"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    inhalt = Buffer.from(roh.trim(), "base64").toString("utf8");
  } catch {
    zeilen.push("  --  Salati-Changelog nicht lesbar (gh fehlt oder Konto ohne Zugriff)");
  }

  if (inhalt) {
    const reihenfolge = (s) => s.split(".").map(Number);
    const versionen = [...new Set(inhalt.match(/\b\d+\.\d+\.\d+\b/g) ?? [])].sort((a, b) => {
      const [a1, a2, a3] = reihenfolge(a);
      const [b1, b2, b3] = reihenfolge(b);
      return a1 - b1 || a2 - b2 || a3 - b3;
    });
    const hoechste = versionen.at(-1);

    // Die Zahl steht als Konstante in de.ts und nicht als Literal im Inhalt:
    // Sie wird dort auch für die Stunden je Version gebraucht.
    const inDe = readFileSync("src/content/de.ts", "utf8").match(
      /const SALATI_VERSIONEN = (\d+);/,
    );
    vergleiche("Salati-Versionen", versionen.length, inDe?.[1] ?? "(nicht gefunden)");

    // Die Spanne steht als Fließtext in beiden Sprachfassungen.
    for (const [datei, muster] of [
      ["src/content/de.ts", /1\.0\.0 bis (\d+\.\d+\.\d+)/],
      ["src/content/en.ts", /1\.0\.0 to (\d+\.\d+\.\d+)/],
    ]) {
      const treffer = readFileSync(datei, "utf8").match(muster);
      const gleich = treffer?.[1] === hoechste;
      if (!gleich) abweichungen++;
      zeilen.push(
        `${gleich ? "  ok " : "  != "} ${datei.split("/").pop().padEnd(12)} höchste Version  gemessen ${hoechste}` +
          (gleich ? "" : `   dort ${treffer?.[1] ?? "(nicht gefunden)"}`),
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Steuerzeichen in Quelldateien
   ---------------------------------------------------------------------------

   Anlass ist ein Fehler, der zwei Stunden gekostet hat: In einer Regex stand
   statt der Wortgrenze `\b` ein echtes Backspace (0x08). Ein Einfüge-Skript
   hatte es hineingeschrieben, weil ein Escape eine Ebene zu früh aufgelöst
   wurde. Im Editor und in `git diff` sieht das Muster richtig aus, es trifft
   nur nie — und der Test, der die Schreibweise prüfte, blieb grün.

   Gesucht wird deshalb nach dem Ergebnis: jedes Steuerzeichen ausser
   Zeilenumbruch, Wagenrücklauf und Tabulator. Über alle erreichbaren Repos,
   weil dieselbe Sorte Bearbeitung überall stattfindet.

   Eine Ausnahme ist eingetragen und begründet: Ein MenuCloud-Test füttert
   absichtlich eine URL mit NUL-Zeichen, um zu prüfen, dass die Funktion leer
   zurückkommt statt zu stolpern. Das ist der Zweck der Zeile, kein Unfall. */

const ERLAUBTE_STEUERZEICHEN = new Set([0x09, 0x0a, 0x0d]);

const STEUERZEICHEN_AUSNAHMEN = new Map([
  [
    "MenuCloud:src/lib/email-discovery-jsrender.test.ts",
    "prüft absichtlich eine URL mit NUL-Zeichen",
  ],
]);

const ZU_PRUEFEN = [
  [".", "portfolio"],
  ["../pruefstand", "pruefstand"],
  ["../oss/verified-done", "verified-done"],
  ["../oss/cron-last-due", "cron-last-due"],
  ["../oss/whisper-ggml-header", "whisper-ggml-header"],
  ["../oss/arabic-normalize", "arabic-normalize"],
  [MENUCLOUD, "MenuCloud"],
];

const QUELLENDUNGEN = new Set([
  ".ts", ".tsx", ".mjs", ".js", ".json", ".md", ".yml", ".yaml", ".css", ".sql",
]);

{
  let geprueft = 0;
  const funde = [];

  for (const [pfad, name] of ZU_PRUEFEN) {
    const wurzel = resolve(pfad);
    if (!existsSync(join(wurzel, ".git"))) continue;

    let dateien = [];
    try {
      dateien = execFileSync("git", ["-C", wurzel, "ls-files"], {
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      })
        .split("\n")
        .filter(Boolean);
    } catch {
      continue;
    }

    for (const rel of dateien) {
      const endung = rel.slice(rel.lastIndexOf("."));
      if (!QUELLENDUNGEN.has(endung)) continue;
      if (STEUERZEICHEN_AUSNAHMEN.has(`${name}:${rel}`)) continue;

      let inhalt;
      try {
        inhalt = readFileSync(join(wurzel, rel), "utf8");
      } catch {
        continue;
      }
      geprueft++;

      for (let i = 0; i < inhalt.length; i++) {
        const code = inhalt.charCodeAt(i);
        if (code < 32 && !ERLAUBTE_STEUERZEICHEN.has(code)) {
          const zeile = inhalt.slice(0, i).split("\n").length;
          funde.push(`${name}/${rel}:${zeile} enthält 0x${code.toString(16).padStart(2, "0")}`);
          break;
        }
      }
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Datei(en) mit Steuerzeichen:`);
    for (const f of funde.slice(0, 8)) zeilen.push(`        ${f}`);
  } else {
    zeilen.push(`  ok  Steuerzeichen              ${String(geprueft).padStart(6)} Dateien sauber`);
  }
}

/* ---------------------------------------------------------------------------
   ARIA-Beziehungen im gebauten HTML
   ---------------------------------------------------------------------------

   Anlass: Die Fallstudien-Reiter trugen `role="tab"` und `aria-selected`, aber
   es gab keine `tabpanel`, und nach dem ersten Fix zeigten neun von dreizehn
   `aria-controls` auf eine Kennung, die es im Dokument nicht gibt. Beides sah
   im Bauteil vollständig aus und war es erst im gerenderten Dokument nicht.

   Geprüft wird deshalb das Ergebnis: jeder Verweis muss auflösen, jede Rolle
   ihren Partner haben, jede Kennung einmal vorkommen. Gegen die gebauten
   Dateien und nicht gegen die Live-Seite — so greift es vor dem Ausliefern und
   braucht kein Netz.

   Fehlt der Bau, wird der Block übersprungen: Der Prüflauf soll auch laufen,
   wenn gerade nicht gebaut wurde. */

const ARIA_VERWEISE = [
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-owns",
  "aria-activedescendant",
];

const BRAUCHT_ELTERN = { tab: ["tablist"], option: ["listbox"] };
const BRAUCHT_KIND = { tablist: ["tab"], listbox: ["option"], radiogroup: ["radio"] };

{
  const bauOrdner = join(".next", "server", "app");

  if (!existsSync(bauOrdner)) {
    zeilen.push("  --  ARIA: kein Bau vorhanden, übersprungen (npm run build)");
  } else {
    /** Alle .html unterhalb des Bauordners einsammeln. */
    const seiten = [];
    const suchen = (ordner) => {
      for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
        const pfad = join(ordner, eintrag.name);
        if (eintrag.isDirectory()) suchen(pfad);
        else if (eintrag.name.endsWith(".html")) seiten.push(pfad);
      }
    };
    suchen(bauOrdner);

    const funde = [];
    for (const seite of seiten) {
      const html = readFileSync(seite, "utf8");
      const name = seite.replace(bauOrdner, "").replace(/\\/g, "/");

      const alleIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      const kennungen = new Set(alleIds);

      for (const eigenschaft of ARIA_VERWEISE) {
        for (const m of html.matchAll(new RegExp(`${eigenschaft}="([^"]+)"`, "g"))) {
          for (const ziel of m[1].split(/\s+/).filter(Boolean)) {
            if (!kennungen.has(ziel)) {
              funde.push(`${name}: ${eigenschaft}="${ziel}" zeigt auf keine Kennung`);
            }
          }
        }
      }

      const rollen = {};
      for (const m of html.matchAll(/\srole="([^"]+)"/g)) {
        rollen[m[1]] = (rollen[m[1]] ?? 0) + 1;
      }
      for (const [rolle, eltern] of Object.entries(BRAUCHT_ELTERN)) {
        if (rollen[rolle] && !eltern.some((e) => rollen[e])) {
          funde.push(`${name}: role="${rolle}" ohne ${eltern.join(" oder ")}`);
        }
      }
      for (const [rolle, kinder] of Object.entries(BRAUCHT_KIND)) {
        if (rollen[rolle] && !kinder.some((k) => rollen[k])) {
          funde.push(`${name}: role="${rolle}" ohne ${kinder.join(" oder ")}`);
        }
      }

      for (const d of new Set(alleIds.filter((v, i) => alleIds.indexOf(v) !== i))) {
        funde.push(`${name}: Kennung "${d}" mehrfach vergeben`);
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} ARIA-Befund(e):`);
      for (const f of [...new Set(funde)].slice(0, 8)) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(`  ok  ARIA-Beziehungen        ${String(seiten.length).padStart(6)} Seiten sauber`);
    }
  }
}

/* ---------------------------------------------------------------------------
   Sitemap gegen die robots-Angaben der Seiten
   ---------------------------------------------------------------------------

   Anlass: In der Sitemap standen /onepager, /impressum und /datenschutz, und
   alle drei trugen `robots: noindex`. Eine Sitemap ist die Bitte, eine Seite
   aufzunehmen; `noindex` ist die Anweisung, sie nicht aufzunehmen. Die Google
   Search Console führt genau das als eigenen Fehler, und für einen Leser des
   Repos sieht es aus, als hätte niemand beide Stellen zusammen gelesen.

   Geprüft wird gegen die gebauten Dateien: Die Sitemap-Route erzeugt beim
   Bauen eine sitemap.xml, die Seiten liegen als HTML daneben. Ohne Bau
   übersprungen. */
{
  const bauOrdner = join(".next", "server", "app");
  const sitemapDatei = join(bauOrdner, "sitemap.xml.body");

  if (!existsSync(sitemapDatei)) {
    zeilen.push("  --  Sitemap: nicht gebaut, übersprungen (npm run build)");
  } else {
    const xml = readFileSync(sitemapDatei, "utf8");
    const adressen = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    const zuDatei = (adresse) => {
      const pfad = new URL(adresse).pathname.replace(/\/$/, "");
      return join(bauOrdner, pfad === "" ? "index.html" : `${pfad}.html`);
    };

    const funde = [];
    for (const adresse of adressen) {
      const datei = zuDatei(adresse);
      if (!existsSync(datei)) {
        funde.push(`${adresse} steht in der Sitemap, hat aber keine gebaute Seite`);
        continue;
      }
      const html = readFileSync(datei, "utf8");
      const treffer = html.match(/<meta name="robots" content="([^"]+)"/);
      if (treffer && /noindex/.test(treffer[1])) {
        funde.push(`${adresse} steht in der Sitemap und trägt zugleich "${treffer[1]}"`);
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} Widerspruch/Widersprüche in der Sitemap:`);
      for (const f of funde.slice(0, 8)) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(`  ok  Sitemap                 ${String(adressen.length).padStart(6)} Adressen indexierbar`);
    }
  }
}

/* ---------------------------------------------------------------------------
   Alter des Prüfstempels
   ---------------------------------------------------------------------------

   Die Seite sagt: „Ein Automat frischt die Zahl täglich auf." Das ist eine
   Aussage über einen Zeitplan, und Zeitpläne fallen leise aus. Am 02.08.2026
   stand der Automat auf täglich 04:12 UTC und hatte um 05:53 UTC noch keinen
   einzigen planmäßigen Lauf hinter sich — aufgefallen ist das nur, weil
   jemand in die Actions-Ansicht gesehen hat.

   Drei Tage Spielraum: Ein ausgefallener Lauf ist bei GitHubs Zeitplan normal
   (die Warteschlange verschiebt Termine um Stunden), drei ausgefallene sind
   ein Defekt. Bis dahin bleibt die Zahl richtig, sie wird nur älter — danach
   ist die Zusage auf der Seite nicht mehr gedeckt. */
{
  const TAGE_SPIELRAUM = 3;
  const alterText = (n) =>
    n === 0 ? "von heute" : n === 1 ? "1 Tag alt" : `${n} Tage alt`;
  const stempel = existsSync("src/content/verified.json")
    ? JSON.parse(readFileSync("src/content/verified.json", "utf8"))
    : null;
  const alter = stempel
    ? Math.floor((Date.now() - Date.parse(stempel.date)) / 86_400_000)
    : null;
  if (alter === null) {
    zeilen.push("  --  Prüfstempel: verified.json fehlt, übersprungen");
  } else if (alter > TAGE_SPIELRAUM) {
    abweichungen++;
    zeilen.push(
      `  !!  Prüfstempel ${alterText(alter)} (${stempel.date}). Der Automat ` +
        `„Zahlen auffrischen" läuft nicht mehr täglich — Actions-Ansicht prüfen.`,
    );
  } else {
    zeilen.push(
      `  ok  Prüfstempel              ${alterText(alter).padStart(10)} (${stempel.date})`,
    );
  }
}


console.log(zeilen.join("\n"));

if (abweichungen) {
  console.error(
    `\n${abweichungen} Abweichung${abweichungen === 1 ? "" : "en"} zwischen Seite und Wirklichkeit.`,
  );
  process.exit(1);
}
console.log("\nAlle Zahlen auf der Seite stimmen mit den Repos überein.");
