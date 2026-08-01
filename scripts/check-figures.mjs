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

console.log(zeilen.join("\n"));

if (abweichungen) {
  console.error(
    `\n${abweichungen} Abweichung${abweichungen === 1 ? "" : "en"} zwischen Seite und Wirklichkeit.`,
  );
  process.exit(1);
}
console.log("\nAlle Zahlen auf der Seite stimmen mit den Repos überein.");
