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
 * vitest direkt mit node starten, nicht über npx.
 *
 * Mit `shell: true` warnt Node zu Recht, dass Argumente nur verkettet und
 * nicht maskiert werden. Ohne shell lässt sich `npx.cmd` unter Windows gar
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

  // vitest endet mit Rückgabewert 1, sobald ein Test rot ist — und
  // execFileSync wirft dann. Genau der Fall ist aber der interessante: Der
  // Bericht unten hat einen Zweig für rote Tests, der ohne dieses catch nie
  // erreicht wurde. Statt einer Meldung über gescheiterte Tests brach der
  // Lauf mit einem Stapelabzug ab, in dem die Zahlen als 2 MB JSON steckten.
  //
  // Der Bericht liegt in beiden Fällen auf stdout, also wird er in beiden
  // Fällen gelesen.
  try {
    return JSON.parse(
      execFileSync(
        process.execPath,
        [einstieg, "run", "--reporter=json"],
        optionen,
      ),
    );
  } catch (fehler) {
    if (
      typeof fehler?.stdout === "string" &&
      fehler.stdout.trim().startsWith("{")
    ) {
      return JSON.parse(fehler.stdout);
    }
    throw fehler;
  }
}

const quelle = readFileSync(INHALT, "utf8");
const zeilen = [];
let abweichungen = 0;
/**
 * Hinweise auf Pflegebedarf, getrennt von Falschaussagen.
 *
 * „Die Zahl auf der Seite ist 89 Commits hinterher" ist kein Fehler: Sie trägt
 * ihr Messdatum, und ein Automat frischt sie jede Nacht auf. Als Abweichung
 * gezählt war der Lauf an jedem Morgen rot, bevor der Automat lief — und ein
 * Rot, das man erwartet, liest niemand mehr. Gemeldet wird der Hinweis
 * trotzdem, nur eben als das, was er ist.
 */
let hinweise = 0;

function vergleiche(was, gemessen, aufDerSeite) {
  const gleich = String(gemessen) === String(aufDerSeite);
  if (!gleich) abweichungen++;
  zeilen.push(
    `${gleich ? "  ok " : "  != "}${was.padEnd(28)} gemessen ${String(gemessen).padStart(6)}` +
      (gleich ? "" : `   auf der Seite ${aufDerSeite}`),
  );
}

/**
 * Eine Untergrenze prüfen statt einer exakten Zahl.
 *
 * Für Werte, die zwischen zwei Prüfläufen wachsen. Die Testzahl von MenuCloud
 * stand dreimal an einem Nachmittag falsch auf der Seite — 7.437, 7.444,
 * 7.464, 7.302 — nicht weil sie jemand falsch abgeschrieben hätte, sondern
 * weil das Produktivrepo weiterläuft. Eine Zahl, die stundenweise veraltet,
 * ist keine belegte Zahl, sondern eine Momentaufnahme mit Ablaufdatum.
 *
 * Eine Untergrenze bleibt wahr, solange der Wert wächst. Dieselbe Regel, die
 * das gedruckte Kurzprofil für die Commits anwendet.
 *
 * Zwei Richtungen werden gemeldet: unterschritten ist ein Fehler, und mehr als
 * `spielraum` darüber ist ein Hinweis, dass die Angabe zu bescheiden geworden
 * ist.
 */
function mindestens(was, gemessen, aufDerSeite, spielraum = 1000) {
  const grenze = Number(String(aufDerSeite).replace(/[.,]/g, ""));
  if (!Number.isFinite(grenze)) {
    abweichungen++;
    zeilen.push(`  !=  ${was.padEnd(26)} keine Untergrenze gefunden`);
    return;
  }
  if (gemessen < grenze) {
    abweichungen++;
    zeilen.push(
      `  !=  ${was.padEnd(26)} gemessen ${String(gemessen).padStart(6)}` +
        `   unter der genannten Grenze ${grenze}`,
    );
    return;
  }
  const weit = gemessen - grenze > spielraum;
  zeilen.push(
    `  ${weit ? "--" : "ok"}  ${was.padEnd(26)} gemessen ${String(gemessen).padStart(6)}` +
      `   über der Grenze ${grenze}` +
      (weit ? " — die Angabe darf wachsen" : ""),
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
    zeilen.push(
      `       (${dateien} Dateien, ${dateien - namen.size} doppelt exportiert)`,
    );
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
    (n, s) =>
      n +
      (readFileSync(join(MENUCLOUD, s), "utf8").match(/^\s*test\(/gm) ?? [])
        .length,
    0,
  );

  /* Untergrenzen statt exakter Zahlen — siehe `mindestens()`. Die End-to-End-
     Zahl bleibt exakt: Sie ändert sich nur mit einem neuen Testlauf, nicht
     nebenbei. */
  const aufSeite = quelle.match(
    /"über ([\d.]+) Testfälle \(über ([\d.]+) Unit, ([\d.]+) End-to-End\)/,
  );
  mindestens("MenuCloud Unit-Tests", vitest.numTotalTests, aufSeite?.[2] ?? "");
  vergleiche("MenuCloud End-to-End", e2e, aufSeite?.[3]?.replace(/\./g, ""));
  mindestens(
    "MenuCloud gesamt",
    vitest.numTotalTests + e2e,
    aufSeite?.[1] ?? "",
  );
  if (vitest.numFailedTests > 0) {
    /* Mit Namen. „2 Unit-Tests scheitern" ist eine Zahl, mit der man nichts
       anfangen kann: Der Lauf steht im Portfolio, die Tests liegen in einem
       anderen Repo, und wer den Bericht liest, weiß nicht einmal, in welcher
       Datei er suchen soll. Der Bericht liegt als JSON bereits vor. */
    zeilen.push(`  !!  ${vitest.numFailedTests} Unit-Tests scheitern`);
    for (const datei of vitest.testResults ?? []) {
      for (const fall of datei.assertionResults ?? []) {
        if (fall.status !== "failed") continue;
        const kurz = String(datei.name ?? "")
          .replace(MENUCLOUD, "")
          .replace(/\\/g, "/")
          .replace(/^\//, "");
        zeilen.push(`        ${kurz}: ${fall.fullName ?? fall.title}`);
      }
    }
    abweichungen++;
  }
} else {
  zeilen.push(`  --  MenuCloud nicht unter ${MENUCLOUD}, übersprungen`);
}

// --- OSS-Pakete ------------------------------------------------------------

const PAKETE = [
  ["cron-last-due", /name: "cron-last-due",[\s\S]{0,400}?· (\d+) Tests/],
  [
    "whisper-ggml-header",
    /name: "whisper-ggml-header",[\s\S]{0,400}?· (\d+) Tests/,
  ],
  ["arabic-normalize", /name: "arabic-normalize",[\s\S]{0,400}?· (\d+) Tests/],
  /* `verified-done` kam zuletzt dazu. Es legt seine Tests unter `test/`
     statt `src/` und erzeugt einen Teil über `it.each`; gezählt wird deshalb
     mit dem Testläufer wie bei den anderen drei, nicht mit einem Muster. */
  ["verified-done", /name: "verified-done",[\s\S]{0,400}?· (\d+) Tests/],
];

for (const [paket, muster] of PAKETE) {
  const pfad = join(OSS, paket);
  if (!existsSync(pfad)) {
    zeilen.push(`  --  ${paket} nicht vorhanden, übersprungen`);
    continue;
  }
  const j = vitestLauf(pfad);
  if (!j) {
    zeilen.push(`  --  ${paket}: vitest nicht installiert, übersprungen`);
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
 * Die Gesamtzahl der Commits, aus dem Prüfstempel.
 *
 * Sie stand einmal als Zahl in `site.ts` und kommt seit der Umstellung auf den
 * Automaten aus `verified.json`. Das Muster, das sie im Quelltext suchte, fand
 * seitdem nichts — und weil ein `null` die Prüfung überspringt statt sie
 * scheitern zu lassen, blieben fünf Aussagen in den privaten Unterlagen
 * ungeprüft, ohne dass eine Zeile davon berichtete. Gemessen am 03.08.2026.
 */
function commitsGesamt() {
  try {
    const stempel = JSON.parse(
      readFileSync("src/content/verified.json", "utf8"),
    );
    return Number(String(stempel.commitsHead).replace(/\./g, "")) || null;
  } catch {
    return null;
  }
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
    gemessen: commitsGesamt,
  },
  {
    was: "Commits in Salati",
    imText: /Android in Vorbereitung · über ([\d.]+) Commits/g,
    gemessen: () => zahlAusSeite(/\{ value: "([\d.]+)", label: "Commits" \}/),
  },
  {
    was: "Commits seit März",
    imText: /[Üü]ber ([\d.]+) Commits seit März 2026/g,
    gemessen: commitsGesamt,
  },
  {
    was: "Testfälle",
    imText: /über ([\d.]+) Testfäll/g,
    // Die Seite nennt die Zahl seit heute als Untergrenze („über 7.400"),
    // weil sie stündlich wächst. Die Dokumente nennen dieselbe Grenze, also
    // liest der Lauf sie von dort statt einer exakten Zahl, die es auf der
    // Seite nicht mehr gibt.
    gemessen: () => zahlAusSeite(/"über ([\d.]+) Testfälle \(/),
  },
  /*
     Das Vorbereitungsbuch nennt die Gesamtzahl in drei Sätzen und in drei
     Formulierungen. Alle drei meinen dieselbe Zahl, also prüft ein Muster
     alle drei — sonst prüft der Lauf einen Satz und lässt zwei stehen.
  */
  {
    was: "Commits in vier Monaten",
    imText:
      /[Üü]ber ([\d.]+) Commits (?:über vier Monate|in vier Monaten|entstanden)/g,
    gemessen: commitsGesamt,
  },
];

/*
   Das Vorbereitungsbuch kommt dazu.

   Es war als einziges der drei privaten Dokumente ungeprüft, und es ist das
   folgenreichste: Die Lernplattform zieht 280 Karten daraus, und was dort
   steht, wird auswendig gelernt. Gemessen am 03.08.2026 nannte es dreimal
   „4.053 Commits“ — gemessen waren es 4.224. Die Zahl ist jetzt eine
   Untergrenze, damit sie stimmt, solange sie wächst.
*/
for (const datei of [
  "../docs/LEBENSLAUF.md",
  "../docs/BEWERBUNG.md",
  "../docs/MASTER_CAREER_GUIDE.md",
]) {
  if (!existsSync(datei)) {
    zeilen.push(`  --  ${datei} nicht vorhanden, übersprungen`);
    continue;
  }
  const inhalt = readFileSync(datei, "utf8");
  const kurz = datei.split("/").pop();

  for (const { was, imText, gemessen } of UNTERGRENZEN) {
    const wirklich = gemessen();
    /*
       Eine Messung ohne Ergebnis wird gesagt, nicht übersprungen.

       Hier stand `continue`. Als die Gesamtzahl der Commits aus `site.ts` in
       den Prüfstempel wanderte, fand das zugehörige Muster nichts mehr — und
       fünf Aussagen in den privaten Unterlagen blieben ungeprüft, ohne dass
       eine Zeile davon berichtete. Ein Wächter, der beim Ausfall schweigt,
       meldet Erfolg.
    */
    if (wirklich === null) {
      imText.lastIndex = 0;
      if (imText.test(inhalt)) {
        zeilen.push(
          `  !!  ${kurz}: „${was}“ steht drin, ist aber nicht messbar.`,
        );
        abweichungen++;
      }
      continue;
    }

    /* Der Ausdruck wird über alle Dateien hinweg wiederverwendet, und
       `matchAll` uebernimmt seinen `lastIndex`. Ohne das Zuruecksetzen fing
       die zweite Datei dort an zu suchen, wo die erste aufgehoert hatte —
       aufgefallen ist es erst mit der dritten, deren Treffer alle hinter
       dem Stand lagen und deshalb keiner war. */
    imText.lastIndex = 0;

    for (const treffer of inhalt.matchAll(imText)) {
      const grenze = Number(treffer[1].replace(/\./g, ""));
      const name = `${kurz}: über ${treffer[1]} ${was}`;
      if (grenze > wirklich) {
        zeilen.push(
          `  !!  ${name} — gemessen nur ${wirklich}. Die Aussage stimmt nicht.`,
        );
        abweichungen++;
      } else if (wirklich > grenze * 1.25) {
        zeilen.push(
          `  ~   ${name} — gemessen ${wirklich}, über 25 % mehr. Grenze anheben.`,
        );
        hinweise++;
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
  zeilen.push(
    `  --  Nicht gefunden: ${fehlendeRepos.join(", ")}. Prüfstempel übersprungen.`,
  );
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
  // dem Prüfstempel. Gelesen wird deshalb der Stempel selbst.
  const stempelJetzt = existsSync("src/content/verified.json")
    ? JSON.parse(readFileSync("src/content/verified.json", "utf8"))
    : {};
  const aufDerSeite = Number(
    String(stempelJetzt.commitsHead ?? "").replace(/\./g, ""),
  );
  const rueckstand = head - aufDerSeite;

  if (!Number.isFinite(aufDerSeite)) {
    zeilen.push(
      "  !!  Commits über alle Repos: keine Zahl in site.ts gefunden.",
    );
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
    hinweise++;
  } else {
    zeilen.push(
      `  ok  Commits über alle Repos      gemessen ${String(head).padStart(6)}` +
        (rueckstand
          ? `   Seite ${deutsch(aufDerSeite)}, ${rueckstand} hinterher`
          : ""),
    );
  }

  /**
   * Dieser Lauf schreibt den Prüfstempel nicht.
   *
   * `src/content/verified.json` hat genau einen Schreiber: den Automaten unter
   * .github/workflows, der über die GitHub-API zählt. Das ist kein Formalismus,
   * sondern der Unterschied zwischen zwei Zahlen. Hier wird lokal gezählt, also
   * einschließlich Commits, die auf keinem Server liegen; die Seite lädt
   * ausdrücklich zum Nachrechnen ein, und nachrechnen kann ein Außenstehender
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
   Die Zahlen der Lernplattform in ihrer eigenen README
   ---------------------------------------------------------------------------

Die README des Prüfstands beschreibt, was er enthält: Folgen, Minuten,
   Kapitel, Fachwörter, Karten. Diese Datei wird gelesen, wenn jemand wissen
   will, was ihn erwartet — und sie wuchs, während der Prüfstand wuchs. Bei
   einer Stichprobe standen dort 240 Fragen, gezählt waren es 280, und 125
   Minuten gegen gemessene 127.

   Die Angaben standen früher in USER-TODO.md. Die Datei ist auf das
   zusammengestrichen, was nur der Inhaber tun kann; die Zahlen gehören
   ohnehin dorthin, wo die Sache beschrieben wird.

   Kein Beinbruch, aber dieselbe Sorte Fehler, gegen die dieses Skript für die
   Webseite gebaut wurde: eine Zahl, die einmal richtig war. Also zählt es sie
   mit. Der Prüfstand liegt außerhalb dieses Projekts; fehlt er, wird der
   Block übersprungen statt zu scheitern. */

const PRUEFSTAND = resolve("../pruefstand");
const TODO = "../pruefstand/README.md";

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
      zeilen.push(
        `  --  Prüfstand-README: "${was}" nicht gefunden, übersprungen`,
      );
      return;
    }
    const gleich = behauptet === gemessen;
    if (!gleich) abweichungen++;
    zeilen.push(
      `${gleich ? "  ok " : "  != "} Prüfstand: ${was.padEnd(22)} gemessen ${String(gemessen).padStart(5)}` +
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
    folgen
      ? Math.round(folgen.reduce((n, f) => n + (f.sekunden ?? 0), 0) / 60)
      : null,
    /* Der Satz im README nennt die Folgen, dann die Vertonung, dann die
       Spielzeit. Das Muster hing vorher an „Podcast-Folgen mit N Minuten"
       und zwang den Satz in die Form „21 Podcast-Folgen, davon 21 vertonte
       Podcast-Folgen mit 160 Minuten" — Prosa, die einem regulären Ausdruck
       zuliebe zweimal dasselbe sagt, im README eines Projekts, das von
       Belegbarkeit handelt. Jetzt hängt es an der Spielzeit selbst. */
    /zusammen\s+([\d.]+)\s+Minuten/,
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
        (k) =>
          (k.art === "wort" || k.art === "begriff") &&
          (k.hinten ?? "").length <= 400,
      ).length + INTERVIEWFRAGEN_ANZAHL
    : null;
  pruefe(
    "Fragen mit Auswahl",
    quizfaehig,
    /([\d.]+) Fragen\s+mit Antwortauswahl/,
  );
  /* Der Rest sind die Karten zum Aufsagen: alles, was keine Auswahlfrage sein
     kann. Ungeprüft stand dort "40", während es 66 waren — die Zahl war aus
     der Zeit vor den Sprechvorlagen und hatte sich um zwei Drittel bewegt,
     ohne dass jemand sie ansah. */
  pruefe(
    "Karten zum Aufsagen",
    karten && quizfaehig !== null ? karten.length - quizfaehig : null,
    /([\d.]+) Karten zum Aufsagen/,
  );
} else {
  zeilen.push("  --  Prüfstand nicht gefunden, übersprungen");
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
  const migrationen = readdirSync(join(NOURI, "supabase", "migrations")).filter(
    (d) => d.endsWith(".sql"),
  );

  // `create table` zählt auch die Varianten mit `if not exists` und mit
  // Schema-Präfix. Gezählt wird die Anweisung, nicht die Zeile: In einer
  // Migration können mehrere Tabellen entstehen.
  let tabellen = 0;
  for (const datei of migrationen) {
    const inhalt = readFileSync(
      join(NOURI, "supabase", "migrations", datei),
      "utf8",
    );
    tabellen += (
      inhalt.match(/create\s+table(\s+if\s+not\s+exists)?\s+["a-z_.]+/gi) ?? []
    ).length;
  }

  vergleiche(
    "NOURI-Migrationen",
    migrationen.length,
    ausSeite(/value: "(\d+)", label: "Migrationen"/),
  );
  vergleiche(
    "NOURI-Tabellen",
    tabellen,
    ausSeite(/value: "(\d+)", label: "Tabellen"/),
  );
} else {
  zeilen.push(`  --  NOURI nicht unter ${NOURI}, übersprungen`);
}

/**
 * Eine GitHub-Abfrage, notfalls mit einem zweiten angemeldeten Konto.
 *
 * Salati liegt unter `MenuCloud-Berlin` und ist privat. Auf diesem Rechner
 * sind zwei Konten angemeldet, aktiv ist `DomenicMoran` — und das darf dort
 * nicht lesen. Die beiden Salati-Prüfungen wurden deshalb seit Tagen
 * stillschweigend übersprungen, während die Seite weiter „64 ausgelieferte
 * Versionen" und „14 Sprachen" behauptete: zwei Zahlen ohne Prüfung, und die
 * Meldung „nicht lesbar" las niemand als Mangel.
 *
 * Das aktive Konto wird nicht umgestellt: `gh auth switch` verändert den
 * Rechner des Lesers, und ein Prüflauf hat dort nichts zu ändern. Stattdessen
 * wird der Token des anderen Kontos für genau diesen Aufruf gereicht.
 */
function ghApi(argumente) {
  const versuche = [null, ...ghKonten()];
  let letzterFehler = null;
  for (const konto of versuche) {
    try {
      const umgebung = { ...process.env };
      if (konto) {
        umgebung.GH_TOKEN = execFileSync("gh", ["auth", "token", "-u", konto], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
      }
      return execFileSync("gh", argumente, {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
        env: umgebung,
      });
    } catch (fehler) {
      letzterFehler = fehler;
    }
  }
  throw letzterFehler ?? new Error("gh nicht erreichbar");
}

/**
 * Eine GitHub-Adresse abrufen — angemeldet, über dieselbe Stelle wie alles
 * andere.
 *
 * Drei Prüfungen holten ihre Daten mit einem blanken `fetch` von
 * api.github.com: das Profil-README, die Repo-Beschreibung und die Themen der
 * OSS-Pakete. Unangemeldet erlaubt GitHub 60 Abrufe je Stunde und Adresse.
 *
 * Gemessen am 07.08.2026: `remaining: 0`. Die drei Prüfungen fielen aus, der
 * Bericht sagte „übersprungen“, und der Lauf endete grün. Das ist die
 * schlechteste Art zu scheitern, die es hier gibt — eine Prüfung, die
 * schweigt, sieht aus wie eine, die zustimmt. Der Schlussatz nennt die Zahl
 * der Ausfälle inzwischen, aber verhindert hat sie das nicht.
 *
 * `ghApi` gibt es seit Längerem und nimmt den angemeldeten Zugang: 5.000
 * Abrufe je Stunde statt 60. Der Zugang bleibt dabei in der Umgebung des
 * Kindprozesses und taucht in keiner Ausgabe auf.
 */
function ghHolen(pfad, roh = false) {
  const argumente = ["api", pfad];
  if (roh) argumente.push("-H", "accept: application/vnd.github.raw");
  return ghApi(argumente);
}

/** Die Namen aller angemeldeten Konten, das aktive zuerst weggelassen. */
function ghKonten() {
  try {
    const roh = execFileSync("gh", ["auth", "status"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return [...roh.matchAll(/account (\S+)/g)].map((m) => m[1]);
  } catch {
    return [];
  }
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
    const roh = ghApi([
      "api",
      "repos/MenuCloud-Berlin/salatibox/git/trees/main?recursive=1",
      "-q",
      ".tree[].path",
    ]);
    const codes = new Set();
    for (const pfad of roh.split("\n")) {
      const treffer = pfad.match(
        /(?:locales?|i18n|translations)\/([a-z]{2}(?:-[A-Z]{2})?)[/.]/,
      );
      if (treffer) codes.add(treffer[1]);
    }
    sprachen = codes.size || null;
  } catch {
    zeilen.push(
      "  --  Salati-Sprachen nicht lesbar (gh fehlt oder Konto ohne Zugriff)",
    );
  }

  if (sprachen) {
    vergleiche(
      "Salati-Sprachen",
      sprachen,
      ausSeite(/(\d+) Sprachen gepflegt/),
    );
  }
}

/* ---------------------------------------------------------------------------
   Salati: Folgen des Podcasts
   ---------------------------------------------------------------------------

   Die Seite nannte einen "15-teiligen" Podcast. Ausgeliefert werden 68 Folgen
   mit 627 Minuten — die Zahl stand seit der ersten Fassung da und ist mit der
   Produktion mitgewachsen, ohne dass sie jemand nachgezogen hätte. Auf einer
   Seite, die mit belegten Zahlen argumentiert, ist eine zu kleine Zahl kein
   harmloser Fehler: Sie verschenkt genau das, was sie belegen soll.

   Gezählt wird der Index auf R2, den die App selbst lädt, und nicht das
   Manifest im Repository. Beide sagten hier dasselbe, aber nur der Index ist
   das, was ein Nutzer bekommt: Eine Folge, die im Repository liegt und nicht
   im Index steht, gibt es für die App nicht.

   Ohne Netz wird übersprungen. Die Schlusszeile sagt dann, dass eine Prüfung
   ausgefallen ist. */

{
  const INDEX =
    "https://pub-d0489c0572704285af79896edb72cbed.r2.dev/podcast/index.json";
  let folgen = null;
  let minuten = null;
  try {
    const antwort = await fetch(INDEX, { signal: AbortSignal.timeout(20_000) });
    if (!antwort.ok) throw new Error(String(antwort.status));
    const index = await antwort.json();
    const liste = index.episodes ?? [];
    folgen = liste.length || null;
    minuten =
      Math.round(liste.reduce((n, f) => n + (f.duration_sec ?? 0), 0) / 60) ||
      null;
  } catch {
    zeilen.push("  --  Salati-Podcast-Index nicht erreichbar, übersprungen");
  }

  if (folgen) {
    vergleiche(
      "Salati-Podcastfolgen",
      folgen,
      ausSeite(/Podcast, (\d+) Folgen/),
    );
    const enTreffer = readFileSync("src/content/en.ts", "utf8").match(
      /Quran: (\d+) episodes/,
    );
    const gleich = Number(enTreffer?.[1]) === folgen;
    if (!gleich) abweichungen++;
    zeilen.push(
      `${gleich ? "  ok " : "  != "} en.ts       Podcastfolgen    gemessen ${String(folgen).padStart(5)}` +
        (gleich ? "" : `   dort ${enTreffer?.[1] ?? "(nicht gefunden)"}`),
    );

    // Die Seite sagt "gut zehn Stunden" beziehungsweise "over ten hours".
    const stunden = minuten / 60;
    const passt = stunden >= 10 && stunden < 11;
    if (!passt) abweichungen++;
    zeilen.push(
      `${passt ? "  ok " : "  != "} Podcastdauer                ${String(minuten).padStart(6)} Minuten ` +
        `(${stunden.toFixed(1)} h, Seite sagt „gut zehn Stunden“)`,
    );
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
    const roh = ghApi([
      "api",
      `repos/MenuCloud-Berlin/salatibox/contents/${pfad}`,
      "-q",
      ".content",
    ]);
    inhalt = Buffer.from(roh.trim(), "base64").toString("utf8");
  } catch {
    zeilen.push(
      "  --  Salati-Changelog nicht lesbar (gh fehlt oder Konto ohne Zugriff)",
    );
  }

  if (inhalt) {
    const reihenfolge = (s) => s.split(".").map(Number);
    const versionen = [
      ...new Set(inhalt.match(/\b\d+\.\d+\.\d+\b/g) ?? []),
    ].sort((a, b) => {
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
    vergleiche(
      "Salati-Versionen",
      versionen.length,
      inDe?.[1] ?? "(nicht gefunden)",
    );

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

   Gesucht wird deshalb nach dem Ergebnis: jedes Steuerzeichen außer
   Zeilenumbruch, Wagenrücklauf und Tabulator. Über alle erreichbaren Repos,
   weil dieselbe Sorte Bearbeitung überall stattfindet.

   Eine Ausnahme ist eingetragen und begründet: Ein MenuCloud-Test füttert
   absichtlich eine URL mit NUL-Zeichen, um zu prüfen, dass die Funktion leer
   zurückkommt statt zu stolpern. Das ist der Zweck der Zeile, kein Unfall.

   Für das Portfolio allein stellt `check:chars` dieselbe Frage. Das ist keine
   Doppelung, sondern der Aufrufweg: Dieser Lauf braucht die Nachbarordner und
   läuft deshalb nicht in der CI. Beide bleiben gleich streng. */

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
  ".ts",
  ".tsx",
  ".mjs",
  ".js",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".sql",
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
          funde.push(
            `${name}/${rel}:${zeile} enthält 0x${code.toString(16).padStart(2, "0")}`,
          );
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
    zeilen.push(
      `  ok  Steuerzeichen              ${String(geprueft).padStart(6)} Dateien sauber`,
    );
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
const BRAUCHT_KIND = {
  tablist: ["tab"],
  listbox: ["option"],
  radiogroup: ["radio"],
};

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
        for (const m of html.matchAll(
          new RegExp(`${eigenschaft}="([^"]+)"`, "g"),
        )) {
          for (const ziel of m[1].split(/\s+/).filter(Boolean)) {
            if (!kennungen.has(ziel)) {
              funde.push(
                `${name}: ${eigenschaft}="${ziel}" zeigt auf keine Kennung`,
              );
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

      for (const d of new Set(
        alleIds.filter((v, i) => alleIds.indexOf(v) !== i),
      )) {
        funde.push(`${name}: Kennung "${d}" mehrfach vergeben`);
      }

      /* Jeder Abschnitt, den die Kopfleiste anspringt, muss einen Namen
         tragen.

         Ein `<section>` ohne Namen ist im Barrierefreiheitsbaum keine
         Landmarke, sondern nichts. Gemessen am 03.08.2026 an der gebauten
         Startseite: drei Landmarken (Kopf, Inhalt, Fuss) und keine einzige
         fuer die sieben Abschnitte, die in der Leiste als Ziele stehen. Wer
         sieht, springt ueber die Leiste; wer die Landmarkenliste benutzt,
         bekam die ganze Startseite als einen Block. axe-core meldet das
         nicht — eine namenlose Sektion verletzt keine Regel, sie verschwindet
         nur. */
      const angesprungen = new Set(
        [...html.matchAll(/href="[^"#]*#([a-z-]+)"/g)].map((m) => m[1]),
      );
      for (const m of html.matchAll(/<section\s([^>]*)id="([^"]+)"([^>]*)>/g)) {
        const kennung = m[2];
        if (!angesprungen.has(kennung)) continue;
        const attribute = m[1] + m[3];
        if (!/aria-labelledby=|aria-label=/.test(attribute)) {
          funde.push(
            `${name}: Abschnitt "${kennung}" wird angesprungen, traegt aber keinen Namen`,
          );
        }
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} ARIA-Befund(e):`);
      for (const f of [...new Set(funde)].slice(0, 8))
        zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  ARIA-Beziehungen        ${String(seiten.length).padStart(6)} Seiten sauber`,
      );
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
        funde.push(
          `${adresse} steht in der Sitemap, hat aber keine gebaute Seite`,
        );
        continue;
      }
      const html = readFileSync(datei, "utf8");
      const treffer = html.match(/<meta name="robots" content="([^"]+)"/);
      if (treffer && /noindex/.test(treffer[1])) {
        funde.push(
          `${adresse} steht in der Sitemap und trägt zugleich "${treffer[1]}"`,
        );
      }

      /* Und das `canonical` der Seite ist genau die Adresse, unter der sie in
         der Sitemap steht.

         Zwei Schreibweisen derselben Adresse sind für eine Suchmaschine zwei
         Adressen. Gefunden am 06.08.2026 in der anderen Richtung: Die
         Sitemap nannte die deutsche Startseite als `<loc>` ohne
         Schrägstrich und im hreflang-Verweis auf sich selbst mit. */
      const kanonisch = html.match(
        /<link rel="canonical" href="([^"]+)"/,
      )?.[1];
      if (kanonisch && kanonisch !== adresse) {
        funde.push(
          `${adresse} steht in der Sitemap, die Seite nennt als canonical ${kanonisch}`,
        );
      }
    }

    /* Jede Sprachvariante der Sitemap kommt selbst als Adresse darin vor.

       Ein hreflang-Verweis, der auf eine Schreibweise zeigt, die nirgends
       sonst steht, lässt eine Suchmaschine die ganze Gruppe verwerfen. Für
       die deutsche Startseite war genau das der Fall: `<loc>` ohne
       Schrägstrich, `hreflang="de"` mit. */
    const bekannt = new Set(adressen);
    for (const stelle of xml.matchAll(
      /<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g,
    )) {
      const [, sprache, ziel] = stelle;
      if (!bekannt.has(ziel)) {
        funde.push(
          `hreflang="${sprache}" zeigt auf ${ziel}, das so in keinem <loc> steht`,
        );
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(
        `  !!  ${funde.length} Widerspruch/Widersprüche in der Sitemap:`,
      );
      for (const f of funde.slice(0, 8)) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Sitemap                 ${String(adressen.length).padStart(6)} Adressen indexierbar`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Commits, die die Artikel als Beleg nennen
   ---------------------------------------------------------------------------

   Jeder Artikel nennt den Commit, an dem sich der Fix nachlesen lässt:
   „Salati-Repo, Commit 427cd6c6 vom 31.07.2026“. Das ist die konkreteste
   Angabe der ganzen Seite. Sie steht in einem privaten Repo, also kann sie
   niemand von außen prüfen — hier liegt es daneben, und damit lässt sie sich
   prüfen.

   Geprüft wird beides: dass es die Kennung gibt und dass das Datum daneben
   stimmt. Eine Kennung, die nach einem Umschreiben ins Leere zeigt, oder ein
   Datum, das um einen Tag danebenliegt, macht aus einem Beleg eine Behauptung
   — und das fiele sonst erst auf, wenn jemand danach fragt.

   Fehlt ein Repo, wird übersprungen statt zu scheitern. */
{
  const REPOS = {
    kassensichv: "../../MenuCloud",
    ota: "../../SalatiTech",
    shaper: "../../SalatiTech",
    whisper: "../../SalatiTech",
    widget: "../../SalatiTech",
  };

  const funde = [];
  let geprueft = 0;
  let uebersprungen = 0;

  for (const datei of readdirSync("src/content/articles")) {
    const treffer = datei.match(/^de-(.+)\.ts$/);
    if (!treffer) continue;
    const repo = REPOS[treffer[1]];
    if (!repo || !existsSync(repo)) {
      if (repo) uebersprungen++;
      continue;
    }

    const inhalt = readFileSync(join("src/content/articles", datei), "utf8");
    /* Die Kennung, und wenn ein Datum dabeisteht, auch das. */
    for (const stelle of inhalt.matchAll(
      /\bCommit\s+([0-9a-f]{7,40})\b(?:[^\n]{0,20}?vom\s+(\d{2})\.(\d{2})\.(\d{4}))?/g,
    )) {
      const [, kennung, tag, monat, jahr] = stelle;
      geprueft++;
      let zeile;
      try {
        zeile = execFileSync(
          "git",
          ["-C", repo, "log", "-1", "--format=%h %ad", "--date=short", kennung],
          {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          },
        ).trim();
      } catch {
        funde.push(
          `${datei}: Commit ${kennung} gibt es in ${repo.split("/").pop()} nicht`,
        );
        continue;
      }
      const datum = zeile.split(" ")[1];
      if (tag && datum !== `${jahr}-${monat}-${tag}`) {
        funde.push(
          `${datei}: Commit ${kennung} ist vom ${datum}, im Artikel steht ${tag}.${monat}.${jahr}`,
        );
      }
    }
  }

  /*
    Und die englische Fassung nennt dieselben Belege.

    Geprüft wird oben nur `de-*.ts` gegen die Repos — die englische Fassung
    sieht der Lauf nicht an. Ihre Belegliste ist aber keine Übersetzung,
    sondern dieselbe Aussage: dieselben Commits, dieselben Dateipfade. Wer
    einen davon in einer Sprache ändert, ändert ihn leicht nur dort, und die
    englische Seite belegt danach etwas anderes als die deutsche.

    Verglichen werden Kennungen und Pfade und nicht der Text: Das Datum steht
    englisch als „31 July 2026“ und deutsch als „31.07.2026“, und die
    Beschreibung dahinter soll sich unterscheiden.
  */
  for (const datei of readdirSync("src/content/articles")) {
    if (!/^de-.+\.ts$/.test(datei)) continue;
    const gegenstueck = `en-${datei.slice(3)}`;
    if (!existsSync(join("src/content/articles", gegenstueck))) {
      funde.push(`${datei}: keine englische Fassung ${gegenstueck}`);
      continue;
    }
    const sammeln = (name) => {
      const text = readFileSync(join("src/content/articles", name), "utf8");
      const holen = (muster) =>
        [...new Set([...text.matchAll(muster)].map((m) => m[0]))].sort();
      return {
        commits: holen(/\b[0-9a-f]{8,40}\b/g),
        pfade: holen(
          /[a-zA-Z0-9_./-]+\.(?:ts|tsx|mjs|sql|json|kt|swift|py|md)\b/g,
        ),
      };
    };
    const deutsch = sammeln(datei);
    const englisch = sammeln(gegenstueck);
    geprueft++;
    for (const [was, hier, dort] of [
      ["Commit", deutsch.commits, englisch.commits],
      ["Dateipfad", deutsch.pfade, englisch.pfade],
    ]) {
      const nurDeutsch = hier.filter((x) => !dort.includes(x));
      const nurEnglisch = dort.filter((x) => !hier.includes(x));
      if (nurDeutsch.length || nurEnglisch.length) {
        funde.push(
          `${datei}: ${was}-Belege gehen auseinander — ` +
            `nur deutsch: ${nurDeutsch.join(", ") || "–"}; ` +
            `nur englisch: ${nurEnglisch.join(", ") || "–"}`,
        );
      }
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Commit-Beleg(e) stimmen nicht:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (geprueft > 0) {
    zeilen.push(
      `  ok  Belegte Commits         ${String(geprueft).padStart(6)} aus Artikeln vorhanden` +
        (uebersprungen ? `, ${uebersprungen} Repo(s) nicht da` : ""),
    );
  } else {
    zeilen.push("  --  Produktivrepos nicht gefunden, Commits übersprungen");
  }
}

/* ---------------------------------------------------------------------------
   Dateipfade, die die Artikel nennen
   ---------------------------------------------------------------------------

   Die Fachartikel belegen ihre Aussagen mit konkreten Dateien: "src/lib/
   tse-chain.ts und supabase/migrations/20260413_tse_chain_atomic_append.sql".
   Das ist die tiefste Behauptung der ganzen Seite — und die einzige, die
   niemand prüfen konnte, weil die Produktivrepos privat sind.

   Hier lassen sie sich prüfen: Sie liegen auf diesem Rechner neben dem
   Projekt. Ein Pfad, der nach einem Umbau nicht mehr stimmt, macht aus einem
   Beleg eine Behauptung, und das fiele sonst erst auf, wenn jemand nachfragt.

   Geprüft werden nur Pfade mit erkennbarer Wurzel (src/, apps/, supabase/,
   scripts/, packages/). Bloße Dateinamen wie "index.js" sind nicht eindeutig
   und bleiben draußen. Fehlt ein Repo, wird übersprungen. */
{
  const REPOS = {
    kassensichv: "../../MenuCloud",
    ota: "../../SalatiTech",
    shaper: "../../SalatiTech",
    whisper: "../../SalatiTech",
    widget: "../../SalatiTech",
  };
  /* `docs` kam später dazu und fehlte.
     Der Whisper-Artikel belegt seine Messwerte mit
     `docs/audit-2026-07-27/WHISPER-EIGENE-KONVERTIERUNG.md` — der einzige
     Beleg, den ein Leser mit Zugang wirklich lesen kann statt nur zu
     finden, und der einzige, der außerhalb dieser Liste stand. */
  const WURZELN = /^(src|apps|supabase|scripts|packages|docs)\//;

  const funde = [];
  let geprueft = 0;
  let uebersprungen = 0;

  for (const datei of readdirSync("src/content/articles")) {
    const treffer = datei.match(/^de-(.+)\.ts$/);
    if (!treffer) continue;
    const repo = REPOS[treffer[1]];
    if (!repo) continue;
    if (!existsSync(repo)) {
      uebersprungen++;
      continue;
    }

    const inhalt = readFileSync(join("src/content/articles", datei), "utf8");
    const pfade = new Set(
      [
        ...inhalt.matchAll(
          /[a-zA-Z0-9_./-]+\.(?:ts|tsx|mjs|sql|json|kt|swift|py|md)\b/g,
        ),
      ]
        .map((m) => m[0])
        .filter((pfad) => WURZELN.test(pfad)),
    );

    for (const pfad of pfade) {
      geprueft++;
      if (!existsSync(join(repo, pfad))) {
        funde.push(
          `${datei}: ${pfad} gibt es in ${repo.split("/").pop()} nicht`,
        );
      }
    }

    /*
      Zitierte Zeilennummern.

      Zwei Belege nennen nicht nur eine Datei, sondern eine Stelle darin:
      „whisperCheck.ts, Zeile 617" und „route.ts, Zeile 472 ff.". Eine
      Zeilennummer ist die genaueste Behauptung dieser Artikel und die
      flüchtigste — der Pfad bleibt, der Commit bleibt, und die Zeile wandert
      bei der nächsten Einfügung darüber.

      Geprüft wird, dass es die Zeile gibt und dass etwas darauf steht. Den
      Inhalt zu vergleichen wäre schöner und wäre brüchig: Jede Umbenennung
      im fremden Repo ergäbe einen Befund, der keiner ist.
    */
    for (const stelle of inhalt.matchAll(
      /([a-zA-Z0-9_./-]+\.(?:ts|tsx|mjs|sql))[,\s]+Zeile\s+(\d+)/g,
    )) {
      const [, pfad, nummer] = stelle;
      if (!WURZELN.test(pfad) || !existsSync(join(repo, pfad))) continue;
      geprueft++;
      const zeilen_ = readFileSync(join(repo, pfad), "utf8").split(/\r?\n/);
      const zeile = zeilen_[Number(nummer) - 1];
      if (zeile === undefined) {
        funde.push(
          `${datei}: ${pfad} hat nur ${zeilen_.length} Zeilen, zitiert ist ${nummer}`,
        );
      } else if (zeile.trim() === "") {
        funde.push(`${datei}: ${pfad} Zeile ${nummer} ist leer`);
      }
    }

    /*
      Die Codeblöcke selbst.

      Die Zeilennummer oben zu prüfen reicht nicht. Gefunden am 06.08.2026 im
      Whisper-Artikel: Die zitierte Zeile stimmte auf den Punkt, der gezeigte
      Block darüber nicht mehr. Dort stand `const { promise } =
      ctx.transcribeData(pcm, …)`, im Repo längst `const handle =
      whisperContext.transcribe(path, …)`. Wer die Stelle aufschlägt, findet
      andere Bezeichner als im Artikel — auf einer Seite, deren Argument die
      Nachprüfbarkeit ist.

      Geprüft wird ein Anker und nicht der ganze Block: Mindestens eine Zeile
      von achtzehn Zeichen oder mehr muss in einer der Dateien stehen, die
      derselbe Artikel als Beleg nennt. Kommentare zählen nicht, sie sind im
      Artikel übersetzt. Verglichen wird über normalisierten Leerraum, denn
      ein Block wird für die schmale Spalte umbrochen.

      Ein Block ohne jede gemeinsame Zeile ist entweder veraltet oder zeigt
      Code, den kein genannter Beleg enthält. Beides gehört gemeldet.
    */
    const normal = (s) => s.replace(/\s+/g, " ").trim();
    const belegte = [];
    for (const pfad of pfade) {
      const voll = join(repo, pfad);
      if (existsSync(voll)) {
        belegte.push([pfad, normal(readFileSync(voll, "utf8"))]);
      }
    }
    if (belegte.length > 0) {
      for (const block of inhalt.matchAll(/code:\s*`([\s\S]*?)`/g)) {
        const kandidaten = block[1]
          .split("\n")
          .map((z) => z.trim())
          .filter((z) => z.length >= 18 && !/^(\/\/|--|#|\*)/.test(z));
        if (kandidaten.length === 0) continue;
        geprueft++;
        const verankert = kandidaten.some((z) =>
          belegte.some(([, text]) => text.includes(normal(z))),
        );
        if (!verankert) {
          funde.push(
            `${datei}: Codeblock ohne Entsprechung in den genannten Belegen — ` +
              `„${kandidaten[0].slice(0, 50)}“`,
          );
        }
      }
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(
      `  !!  ${funde.length} Dateipfad(e) aus Artikeln ohne Entsprechung:`,
    );
    for (const f of funde.slice(0, 8)) zeilen.push(`        ${f}`);
  } else if (geprueft > 0) {
    zeilen.push(
      `  ok  Belegte Dateipfade      ${String(geprueft).padStart(6)} aus Artikeln vorhanden` +
        (uebersprungen ? `, ${uebersprungen} Repo(s) nicht da` : ""),
    );
  } else {
    zeilen.push("  --  Produktivrepos nicht gefunden, Dateipfade übersprungen");
  }
}

/* ---------------------------------------------------------------------------
   Die Rezeptzahl von NOURI, gegen die Anwendung selbst
   ---------------------------------------------------------------------------

   Diese eine Zahl stand als einzige ohne Nachzählung auf der Seite: Sie liegt
   in der Datenbank, und die Anwendung hat keinen Endpunkt, der sie herausgibt.
   Sie hat aber eine Startseite, und dort steht sie — als „11892+“ in der
   Kennzahlenreihe. Damit ist sie prüfbar, ohne dass jemand eine Abfrage
   ausführt.

   Verglichen wird nach oben offen: Die Anwendung schreibt „11892+“, der
   Katalog wächst. Die Seite darf deshalb nicht mehr behaupten, als dort
   steht; weniger schon.

   Ohne Netz wird übersprungen und das gesagt. */
{
  const behauptet = quelle.match(
    /value: "([\d.,]+)", label: "Rezepte im Katalog"/,
  )?.[1];
  if (!behauptet) {
    zeilen.push("  --  Rezeptzahl: Angabe nicht gefunden, übersprungen");
  } else {
    const meine = Number(behauptet.replace(/[.,]/g, ""));
    try {
      const antwort = await fetch("https://nouri-fitness.vercel.app/", {
        signal: AbortSignal.timeout(20000),
      });
      const seite = await antwort.text();
      const dort = seite.match(/(\d{4,6})\+/)?.[1];
      if (!dort) {
        zeilen.push(
          "  --  Rezeptzahl: auf nouri-fitness.vercel.app nicht gefunden",
        );
      } else if (meine > Number(dort)) {
        abweichungen++;
        zeilen.push(
          `  !!  Rezeptzahl: die Seite sagt ${behauptet}, die Anwendung ${dort}+`,
        );
      } else {
        zeilen.push(
          `  ok  Rezepte              ${String(meine).padStart(6)} und die Anwendung sagt ${dort}+`,
        );
      }
    } catch {
      zeilen.push("  --  Rezeptzahl: NOURI nicht erreichbar, übersprungen");
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Pflichtangaben im Impressum
   ---------------------------------------------------------------------------

   § 5 DDG zählt auf, was dort stehen muss. Vier davon lassen sich prüfen,
   ohne den Text zu lesen: Anschrift, Kontakt, inhaltlich Verantwortlicher und
   die Umsatzsteuer-Identifikationsnummer.

   Die letzte stand lange nicht da. Im Quelltext hing ein Vorbehalt („falls
   eine existiert"), und die Antwort stand die ganze Zeit öffentlich im
   Impressum von menucloud-berlin.de. § 5 Abs. 1 Nr. 6 DDG verlangt sie,
   sobald es eine gibt.

   Geprüft wird die gebaute Seite: Was im Quelltext hinter einer Bedingung
   steht, kann fehlen, ohne dass es jemandem auffällt. */
{
  const seite = join(".next", "server", "app", "impressum.html");
  if (!existsSync(seite)) {
    zeilen.push("  --  Impressum: kein Bau vorhanden, übersprungen");
  } else {
    const text = readFileSync(seite, "utf8")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    const PFLICHT = [
      ["Anschrift", /Heidelberger Stra(ß|ss)e 36/],
      ["Postleitzahl und Ort", /12059 Berlin/],
      ["Kontakt", /domenicmoran@gmail\.com/],
      ["inhaltlich Verantwortlicher", /§ ?18 Abs\. ?2 MStV/],
      ["Umsatzsteuer-Identifikationsnummer", /DE\d{9}/],
    ];

    const fehlend = PFLICHT.filter(([, muster]) => !muster.test(text)).map(
      ([was]) => was,
    );
    if (fehlend.length) {
      abweichungen += fehlend.length;
      zeilen.push(`  !!  Impressum: ${fehlend.join(", ")} fehlt/fehlen`);
    } else {
      zeilen.push(
        `  ok  Impressum          ${String(PFLICHT.length).padStart(6)} Pflichtangaben nach § 5 DDG`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Abzeichen im README nennen die Fassungen, die installiert sind
   ---------------------------------------------------------------------------

   Oben im README stehen vier Abzeichen: Next.js 16.2, React 19.2, TypeScript
   strict, Tailwind v4. Sie sind von Hand gesetzte Bilder, keine Abfrage — und
   damit die einzige Stelle im Repo, an der eine Fassungsangabe stehen bleibt,
   wenn die Abhängigkeit weiterzieht. Wer ein Repo aufmacht und im ersten Bild
   eine Fassung liest, die `package.json` widerspricht, hat den ersten Zweifel
   in der ersten Zeile.

   Verglichen wird auf zwei Stellen genau: Ein Abzeichen, das "16.2" sagt,
   passt zu 16.2.12; eines, das "16.1" sagt, nicht mehr.

   Das Abzeichen des Prüflaufs bleibt außen vor: Es kommt live von GitHub und
   kann gar nicht veralten. */
{
  const readme = readFileSync("README.md", "utf8");
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const alle = { ...manifest.dependencies, ...manifest.devDependencies };

  const ABZEICHEN = [
    ["Next.js", "next"],
    ["React", "react"],
    ["Tailwind", "tailwindcss"],
  ];

  const funde = [];
  let geprueft = 0;

  for (const [beschriftung, paket] of ABZEICHEN) {
    /* `String.raw`, weil eine Vorlage `\d` zu `d` auflöst, bevor `RegExp` es
       sieht. Der erste Anlauf suchte damit nach `[d.]+` und fand nie eine
       Fassung — und ein Lauf, der nichts findet, meldet nichts. */
    const muster = new RegExp(
      String.raw`badge/${beschriftung.replace(".", String.raw`\.`)}-v?([\d.]+)`,
    );
    const imAbzeichen = readme.match(muster)?.[1];
    if (!imAbzeichen) continue;

    const installiert = (alle[paket] ?? "").replace(/^[\^~]/, "");
    if (!installiert) {
      funde.push(`${beschriftung}: ${paket} steht in keiner package.json`);
      continue;
    }
    geprueft++;

    /* Auf so viele Stellen vergleichen, wie das Abzeichen nennt. */
    const stellen = imAbzeichen.split(".").length;
    const kurz = installiert.split(".").slice(0, stellen).join(".");
    if (kurz !== imAbzeichen) {
      funde.push(
        `${beschriftung}: Abzeichen sagt ${imAbzeichen}, installiert ist ${installiert}`,
      );
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Abzeichen mit falscher Fassung:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (geprueft > 0) {
    zeilen.push(
      `  ok  Abzeichen im README ${String(geprueft).padStart(6)} Fassungen stimmen mit package.json`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Jede Seite mit eigener Vorschaukarte
   ---------------------------------------------------------------------------

   `openGraph` wird vom Wurzel-Layout geerbt, wenn eine Seite nichts setzt.
   Gemessen am 03.08.2026 an der gebauten Seite trugen deshalb alle Seiten
   ausser den zehn Artikelseiten denselben Kartentitel: „Domenic Moran – AI
   Product Engineer". Wer die Artikeluebersicht teilte, zeigte damit die
   Startseite — und der Titel dafuer stand seit Langem in der Inhaltsdatei,
   er wurde nur nicht weitergereicht.

   Die beiden Startseiten duerfen ihn tragen, sie sind gemeint. */
{
  const bauOrdner = join(".next", "server", "app");
  const startseiten = new Set(["/index.html", "/en.html"]);
  const funde = [];
  let geprueft = 0;
  let seitentitel = null;

  const sammeln = (ordner) => {
    let eintraege;
    try {
      eintraege = readdirSync(ordner, { withFileTypes: true });
    } catch {
      return;
    }
    for (const eintrag of eintraege) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) {
        sammeln(pfad);
        continue;
      }
      if (!eintrag.name.endsWith(".html") || eintrag.name.startsWith("_"))
        continue;

      const route = pfad.slice(bauOrdner.length).replace(/\\/g, "/");
      const titel = readFileSync(pfad, "utf8").match(
        /<meta property="og:title" content="([^"]*)"/,
      )?.[1];
      if (!titel) {
        funde.push(`${route}: keine Vorschaukarte`);
        continue;
      }
      if (startseiten.has(route)) {
        seitentitel ??= titel;
        continue;
      }
      geprueft++;
      if (seitentitel !== null && titel === seitentitel) {
        funde.push(`${route}: traegt den Kartentitel der Startseite`);
      }

      /* Und die Karte heißt wie der Browsertitel.

         Next hängt den Namen über `title.template` an, aber nur an
         `<title>`. Wer für eine Seite ein eigenes `openGraph` setzt — und
         das tun alle acht, die kein Bild erben —, bekommt dort den nackten
         Seitentitel. Gemessen an der ausgelieferten Seite hieß die Karte des
         Kurzprofils „Kurzprofil“ und die des Impressums „Impressum“: ohne
         Namen, ohne Rolle, ohne Zusammenhang. Ausgerechnet das Kurzprofil
         ist die Seite, die weitergereicht wird.

         Verglichen wird gegen `<title>` und nicht gegen eine eigene Regel:
         Die Artikel setzen ihren Titel absichtlich absolut, also ohne
         Namenszusatz, und eine zweite Regel hier würde ihnen widersprechen.
         Was im Browserreiter steht, steht auf der Karte. */
      const browsertitel = readFileSync(pfad, "utf8").match(
        /<title>([^<]*)<\/title>/,
      )?.[1];
      if (browsertitel && titel !== browsertitel) {
        funde.push(
          `${route}: Karte heißt „${titel}“, der Browsertitel „${browsertitel}“`,
        );
      }

      /* Und X bekommt dieselbe Karte wie alle anderen.

         Next mischt Seitenmetadaten nicht in die des Layouts, es ersetzt sie
         je Feld. Wer ein eigenes `openGraph` setzt und `twitter` nicht
         anfasst, behält dort den Wert des Layouts — und der beschreibt die
         Startseite. Gemessen an den gebauten Seiten am 08.08.2026: 16 von 18
         meldeten an X den Titel „Domenic Moran – AI Product Engineer" und die
         Beschreibung der Startseite, darunter jeder der zehn Artikel und
         beide Kurzprofile.

         Zwei Felder, eine Aussage: Was auf der einen Karte steht, steht auch
         auf der anderen. */
      const rohesHtml = readFileSync(pfad, "utf8");
      const xTitel = rohesHtml.match(
        /<meta name="twitter:title" content="([^"]*)"/,
      )?.[1];
      const ogText = rohesHtml.match(
        /<meta property="og:description" content="([^"]*)"/,
      )?.[1];
      const xText = rohesHtml.match(
        /<meta name="twitter:description" content="([^"]*)"/,
      )?.[1];
      if (xTitel && xTitel !== titel) {
        funde.push(
          `${route}: X-Karte heißt „${xTitel}“, die Vorschaukarte „${titel}“`,
        );
      }
      if (ogText && xText && ogText !== xText) {
        funde.push(`${route}: X-Karte beschreibt etwas anderes als die Vorschaukarte`);
      }
    }
  };

  /* Die Startseiten zuerst, damit ihr Titel bekannt ist, wenn die uebrigen
     dagegen gehalten werden. */
  for (const start of ["index.html", "en.html"]) {
    const pfad = join(bauOrdner, start);
    if (!existsSync(pfad)) continue;
    seitentitel ??= readFileSync(pfad, "utf8").match(
      /<meta property="og:title" content="([^"]*)"/,
    )?.[1];
  }
  sammeln(bauOrdner);

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Seite(n) ohne eigene Vorschaukarte:`);
    for (const f of funde.slice(0, 8)) zeilen.push(`        ${f}`);
  } else if (geprueft > 0) {
    zeilen.push(
      `  ok  Vorschaukarten      ${String(geprueft).padStart(6)} Seiten mit eigenem Kartentitel`,
    );
  } else {
    zeilen.push("  --  Vorschaukarten: kein Bau vorhanden, übersprungen");
  }
}

/* ---------------------------------------------------------------------------
   Die Adressen der Produkte, jede einmal abgerufen
   ---------------------------------------------------------------------------

   Jede Fallstudie verweist auf ihr Produkt: Store-Eintrag, Live-Adresse,
   Statusseite. Das sind die Verweise, mit denen die Seite ihre stärkste
   Behauptung belegt — „vier Systeme in Produktion" —, und sie sind die
   einzigen, die von außen kaputtgehen können, ohne dass hier jemand etwas
   ändert: Eine App wird aus dem Store genommen, eine Domain läuft ab, eine
   Statusseite zieht um.

   `check-links` lässt äußere Adressen bewusst draußen, weil ein Lauf, der bei
   jedem Netzwackler rot wird, ignoriert wird. Deshalb steht die Prüfung hier,
   mit derselben Regel wie bei den Zertifikaten: Ein Netzfehler wird
   übersprungen und gesagt; nur eine Antwort mit 4xx oder 5xx ist ein Befund.

   Das 999 von LinkedIn ist keiner — es ist deren Abwehr gegen Abrufe ohne
   Browser, und das Profil steht. */
{
  const adressen = [
    ...new Set(
      [...quelle.matchAll(/href:\s*"(https:\/\/[^"]+)"/g)]
        .map((m) => m[1])
        /* Drei bleiben draussen, jede mit Grund: die eigene Adresse, weil sie
            prueft; LinkedIn, weil es Abrufen ohne Browser mit 999
           antwortet; und der Udemy-Kurznachweis, der hinter einer Bot-Pruefung
           liegt und einer Maschine grundsaetzlich 403 gibt — dieselbe Stelle
           steht schon in der Zertifikatspruefung darueber. */
        .filter(
          (a) =>
            !a.includes("domenicmoran.de") &&
            !a.includes("linkedin.com") &&
            !a.includes("ude.my"),
        ),
    ),
  ];

  const funde = [];
  const abgewehrt = [];
  let uebersprungen = 0;
  let erreicht = 0;

  for (const adresse of adressen) {
    try {
      const antwort = await fetch(adresse, {
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(15000),
      });
      /*
        Nur „weg“ ist ein Befund.

        Der erste Entwurf zählte jede Antwort ab 400 als kaputt. Damit ging
        der Lauf schon am selben Tag einmal rot, ohne dass etwas fehlte: Ein
        Store antwortet einer Maschine gelegentlich mit 403 oder 429, und
        beides sagt nur, dass gerade nicht geantwortet wird — nicht, dass es
        die Seite nicht mehr gibt. Ein Wächter, der bei Gegenwehr rot wird,
        wird abgeschaltet.

        404 und 410 sagen es dagegen ausdrücklich, und ein 5xx über eine
        Minute hinweg ebenso. Alles andere wird gezählt und gesagt.
      */
      if (antwort.status === 404 || antwort.status === 410) {
        funde.push(`${adresse} antwortet mit ${antwort.status}`);
      } else if (antwort.status >= 400) {
        abgewehrt.push(`${antwort.status} von ${new URL(adresse).host}`);
      } else {
        erreicht++;
      }
    } catch {
      uebersprungen++;
    }
  }

  if (funde.length > 0) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Produktadresse(n) kaputt:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (uebersprungen > 0 && erreicht === 0) {
    zeilen.push("  --  Produktadressen: nicht erreichbar, übersprungen");
  } else {
    zeilen.push(
      `  ok  Produktadressen    ${String(erreicht).padStart(6)} erreichbar` +
        (uebersprungen ? `, ${uebersprungen} ohne Antwort` : "") +
        (abgewehrt.length
          ? `, abgewehrt: ${[...new Set(abgewehrt)].join(", ")}`
          : ""),
    );
  }
}

/* ---------------------------------------------------------------------------
   Ein Titel, überall derselbe
   ---------------------------------------------------------------------------

   Die Rolle steht auf sechs öffentlichen Flächen: Seite, Vorschaukarte,
   Kurzprofil, Profil-README, Repo-README und LinkedIn. Gemessen am
   03.08.2026 stand im README des Portfolios „AI-Native Product Engineer",
   überall sonst „AI Product Engineer" — zwei Titel für dieselbe Person, und
   zwar genau dort, wo jemand nachschaut, der den Code sehen will.

   Die Datei mit dem Bewerbungstext liegt außerhalb des Repos; fehlt sie,
   wird sie übersprungen und nicht als Fehler gemeldet. */
{
  const rolle = quelle.match(/^\s*role: "([^"]+)"/m)?.[1];
  if (!rolle) {
    zeilen.push("  !!  Rolle: keine `role` in site.ts gefunden.");
    abweichungen++;
  } else {
    /* Nur Dateien, die jemand von außen sehen kann. `docs/` ist privat und
       steht bewusst nicht in dieser Liste — bis auf die beiden Vorlagen,
       aus denen Veröffentlichtes entsteht. */
    const flaechen = [
      ["README.md", "README.md"],
      ["Profil-README", "../docs/GITHUB-PROFILE-README.md"],
      ["Lebenslauf", "../docs/LEBENSLAUF.md"],
    ];

    /* Gesucht wird die Wortfolge „… Product Engineer" mit allem, was davor
       ohne Leerzeichen daran hängt. So fällt „AI-Native“ auf, ohne dass der
       Lauf jede Schreibweise vorher kennen muss. */
    const muster = /([\wÄÖÜäöüß-]+[ -])?Product Engineer/g;

    let geprueft = 0;
    let abweichend = 0;
    for (const [name, pfad] of flaechen) {
      if (!existsSync(pfad)) {
        zeilen.push(`  --  Rolle in ${name}: Datei nicht da, übersprungen`);
        continue;
      }
      const gefunden = [...readFileSync(pfad, "utf8").matchAll(muster)]
        .map((m) => m[0].replace(/s$/, ""))
        .filter((t) => t !== rolle);
      geprueft++;
      if (gefunden.length > 0) {
        zeilen.push(
          `  !!  Rolle in ${name}: „${[...new Set(gefunden)].join('“, „')}“ statt „${rolle}"`,
        );
        abweichungen++;
        abweichend++;
      }
    }
    /* Die gute Zeile erscheint nur, wenn sie stimmt. Ein "ok" neben einem
       "!!" über derselben Sache ist genau die Sorte Bericht, die man
       überfliegt und für grün hält. */
    if (geprueft > 0 && abweichend === 0) {
      zeilen.push(
        `  ok  Rolle             ${String(geprueft).padStart(6)} Flächen sagen „${rolle}"`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Das Faktenblatt sagt dasselbe wie der Lebenslauf
   ---------------------------------------------------------------------------

   Vier Angaben stehen zweimal: in der Tabelle des Lebenslaufs und in der
   Faktenkachel des Recruiter-Bereichs. Es sind die vier, nach denen als
   erstes gefragt wird — was gesucht ist, wo, ab wann, in welchen Sprachen.
   Der Lebenslauf geht als PDF mit, die Kachel steht auf der Seite, und wer
   beides nebeneinanderlegt, liest zwei Fassungen derselben Auskunft.

   Geprüft wird auf Enthaltensein und nicht auf Gleichheit: Die Kachel ist an
   zwei Stellen absichtlich kürzer — „Deutsch (Muttersprache) · Englisch“ ohne
   den Zusatz „(verhandlungssicher in Fachkontext)“, und „Festanstellung“
   steht dort als eigene Zeile statt im Satz über die gesuchte Rolle. Kürzer
   ist erlaubt, anders nicht.
   ------------------------------------------------------------------------ */
{
  const pfad = "../docs/LEBENSLAUF.md";
  if (!existsSync(pfad)) {
    zeilen.push("  --  Lebenslauf nicht da, Faktenblatt übersprungen");
  } else {
    const lebenslauf = readFileSync(pfad, "utf8").replace(/\s+/g, " ");
    const quelle = readFileSync(join("src", "content", "site.ts"), "utf8");
    const holen = (schluessel) =>
      new RegExp(`${schluessel}:\\s*"([^"]+)"`).exec(quelle)?.[1];

    const angaben = [
      ["Standort", holen("detail")],
      ["Verfügbar", holen("entry")],
      ["Sprachen", holen("languages")],
      [
        "Gesucht",
        /"Produktteam, in dem[^"]*"/.exec(quelle)?.[0]?.slice(1, -1),
      ],
    ];

    const funde = [];
    let geprueft = 0;
    for (const [was, wert] of angaben) {
      if (!wert) {
        funde.push(`${was}: in site.ts nicht gefunden`);
        continue;
      }
      geprueft++;
      if (!lebenslauf.includes(wert.replace(/\s+/g, " "))) {
        funde.push(`${was}: „${wert}“ steht so nicht im Lebenslauf`);
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} Angabe(n) weichen vom Lebenslauf ab:`);
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Faktenblatt        ${String(geprueft).padStart(6)} Angaben wie im Lebenslauf`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Das Profil-README, wie GitHub es zeigt
   ---------------------------------------------------------------------------

   Der Wächter darunter vergleicht Artikeltitel gegen `docs/GITHUB-PROFILE-README.md`
   — eine Datei in diesem Rechner, die niemand aufruft. Gerendert wird auf
   GitHub der Inhalt des Repositoriums `DomenicMoran/DomenicMoran`, und beide
   können auseinanderlaufen: Wer dort über die Weboberfläche etwas ändert,
   ändert die örtliche Datei nicht mit, und ab da prüft der nächste
   Wächter eine Fassung, die es nirgends gibt.

   Verglichen wird deshalb zuerst die Vorlage gegen das Veröffentlichte.
   Zeilenenden und Leerraum am Zeilenende bleiben außen vor, sonst schlägt
   der Lauf unter Windows bei jedem Durchgang an.

   Dazu die Zahlen im README: Es nennt je Paket eine Testzahl und "null
   Abhängigkeiten". Gezählt wird in den örtlichen Klonen unter ../oss —
   dieselbe Quelle, aus der die Pakete veröffentlicht sind.

   Ohne Netz wird übersprungen und das gesagt. */
/* ---------------------------------------------------------------------------
   Die Live-Adressen zeigen wirklich das Produkt.

   Der Lauf weiter unten ruft jede Produktadresse ab und prüft den Status.
   Das reicht nicht: Eine abgelaufene Domain antwortet mit 200 und einer
   Parkseite, ein umgezogenes Projekt mit der Startseite des neuen Anbieters.
   Die stärkste Behauptung dieser Seite — „vier Systeme in Produktion“ — hinge
   dann an einem Verweis, der zwar antwortet, aber nichts belegt.

   Geprüft wird deshalb der Inhalt: Nennt die Seite den Namen des Produkts,
   unter dem sie hier steht? Das ist eine schwache Bedingung, und genau so ist
   sie gemeint — sie soll den Totalausfall finden, nicht den Inhalt bewerten.
   ------------------------------------------------------------------------ */
{
  const ZUORDNUNG = [
    ["https://www.salati.pro", "Salati"],
    ["https://menucloud-berlin.de", "MenuCloud"],
    ["https://nouri-fitness.vercel.app", "NOURI"],
  ];

  const funde = [];
  let geprueft = 0;
  let uebersprungen = 0;

  for (const [adresse, name] of ZUORDNUNG) {
    try {
      const antwort = await fetch(adresse, {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 Pruefstempel" },
        signal: AbortSignal.timeout(20000),
      });
      if (!antwort.ok) {
        uebersprungen++;
        continue;
      }
      const text = await antwort.text();
      geprueft++;
      if (!text.toLowerCase().includes(name.toLowerCase()))
        funde.push(`${adresse} antwortet, nennt aber „${name}“ nicht`);
    } catch {
      uebersprungen++;
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Produktadresse(n) ohne ihr Produkt:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (geprueft) {
    zeilen.push(
      `  ok  Produktinhalt      ${String(geprueft).padStart(6)} Live-Adressen nennen ihr Produkt` +
        (uebersprungen ? `, ${uebersprungen} nicht erreichbar` : ""),
    );
  } else {
    zeilen.push("  --  Produktinhalt: keine Adresse erreichbar, übersprungen");
  }
}

/* ---------------------------------------------------------------------------
   Die Geräteklassen werden überall gleich aufgezählt.

   „Vier Geräteklassen“ steht in der Salati-Fallstudie, im Recruiter-Bereich,
   auf der Kennzahlenkachel und als Titel des Architekturbilds — je zweimal,
   deutsch und englisch. Zweimal davon folgte eine Aufzählung, und die beiden
   waren verschieden: „iOS, Android, Android TV und Wear OS" in der einen
   Zeile, „Phone, Tablet, Android TV, Wear OS" zwei Zeilen darunter. Dieselbe
   Vier, zwei verschiedene Gruppen, und iOS ist kein Gerät.

   Geprüft wird deshalb nicht die Zahl — die steht ohnehin unter den
   Kennzahlen —, sondern die Aufzählung: Wo eine folgt, muss es dieselbe sein.
   Verglichen wird als Menge, damit die Reihenfolge frei bleibt.
   ------------------------------------------------------------------------ */
{
  const gruppen = [];
  for (const [datei, muster] of [
    ["src/content/site.ts", /vier Geräteklassen[^:]{0,30}:\s*([^.]{5,90})\./g],
    ["src/content/site.ts", /Vier Geräteklassen[^:]{0,30}:\s*([^"]{5,90})"/g],
    ["src/content/en.ts", /four device classes[^:]{0,30}:\s*([^.]{5,90})\./g],
    ["src/content/en.ts", /Four device classes[^:]{0,30}:\s*([^"]{5,90})"/g],
  ]) {
    if (!existsSync(datei)) continue;
    const text = readFileSync(datei, "utf8");
    for (const treffer of text.matchAll(muster)) {
      const teile = treffer[1]
        .split(/,| und | and /)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (teile.length >= 3) gruppen.push({ datei, teile: new Set(teile) });
    }
  }

  /* Deutsch und englisch getrennt: „Telefon" und „phone" sind dieselbe
     Klasse und trotzdem verschiedene Wörter. */
  const funde = [];
  for (const sprache of ["site.ts", "en.ts"]) {
    const hier = gruppen.filter((g) => g.datei.endsWith(sprache));
    if (hier.length < 2) continue;
    const erste = [...hier[0].teile].sort().join(", ");
    for (const g of hier.slice(1)) {
      const diese = [...g.teile].sort().join(", ");
      if (diese !== erste)
        funde.push(`${sprache}: „${erste}" gegen „${diese}"`);
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Aufzählung(en) der Geräteklassen weichen ab:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (gruppen.length) {
    zeilen.push(
      `  ok  Geräteklassen       ${String(gruppen.length).padStart(6)} Aufzählungen nennen dieselben Geräte`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Die Zahlen in den Architekturbildern.

   Jedes Bild trägt Beschriftungen wie „63 Workflows · Watchdogs“ oder
   „11.892 Rezepte · Trainingspläne“. Das sind dieselben Aussagen, die
   nebenan im Text stehen und dort seit Langem geprüft werden — nur an einer
   zweiten Stelle, in einer eigenen Datei, und bis hierher von keiner Prüfung
   gelesen.

   Gefunden am 08.08.2026: Im MenuCloud-Bild stand „75+ Workflows“, während
   der Automatisierungsreiter derselben Fallstudie „63 Workflows“ nennt und
   das Repo 63 verfolgte Dateien führt. Zwei Zahlen für dieselbe Sache, eine
   davon zwölf zu hoch, sichtbar nebeneinander auf einer Seite.

   Geprüft wird jede Zahl aus den Beschriftungen gegen die Zahlen, die dieser
   Lauf ohnehin aus den Repos kennt. Was dort nicht vorkommt, bleibt außen
   vor: Ein Bild darf auch Zahlen nennen, die nirgends sonst stehen.
   ------------------------------------------------------------------------ */
{
  const datei = "src/components/ArchitectureDiagram.tsx";
  if (!existsSync(datei)) {
    zeilen.push(`  --  ${datei} nicht vorhanden, Bildzahlen übersprungen`);
  } else {
    const text = readFileSync(datei, "utf8");
    /* Nur Beschriftungen, nicht der ganze Quelltext: `label:` und `sub:`. */
    const beschriftungen = [
      ...text.matchAll(/(?:label|sub):\s*"([^"]*)"/g),
    ].map((m) => m[1]);

    /* Dieselben Paare, die der Lauf oben schon gegen die Repos gehalten hat.
       Der Vergleich ist bewusst eng: Zahl plus Wort, sonst träfe „59“ auch
       eine Zeilennummer. */
    const bekannt = [
      [/(\d[\d.]*) Workflows/, "63", "Workflows"],
      [/(\d[\d.]*) Rezepte/, "11.892", "Rezepte"],
      [/(\d[\d.]*) Tabellen/, "59", "Tabellen"],
      [/(\d[\d.]*) Migrationen/, "12", "Migrationen"],
    ];

    const funde = [];
    let geprueft = 0;
    for (const beschriftung of beschriftungen) {
      for (const [muster, soll, was] of bekannt) {
        const treffer = beschriftung.match(muster);
        if (!treffer) continue;
        geprueft++;
        if (treffer[1] !== soll)
          funde.push(
            `„${beschriftung}“ nennt ${treffer[1]} ${was}, der Text nennt ${soll}`,
          );
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} Zahl(en) im Architekturbild weichen ab:`);
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Bildzahlen         ${String(geprueft).padStart(6)} Angaben in den Architekturbildern wie im Text`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Wie viele Apps in wie vielen Stores stehen.

   Im Werdegang stand „drei Apps in den Stores und zwei davon in beiden". Das
   war eine Woche lang zu wenig: Salati war am 01.08.2026 nur bei Apple
   erreichbar, am 08.08.2026 auch bei Google Play — und der Satz zählte weiter
   die alte Lage. Eine Seite, die weniger sagt als wahr ist, fällt niemandem
   auf; sie kostet nur.

   Gezählt wird an den Verweisen selbst: Jede Fallstudie führt ihre
   Store-Einträge, und daraus ergeben sich beide Zahlen von allein.
   ------------------------------------------------------------------------ */
{
  const ZAHLWORT = { eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5 };

  /* Je Fallstudie: welche Plattformen sie verlinkt. Der Block einer Studie
     endet am nächsten `id:` auf derselben Ebene. */
  const bloecke = quelle.split(/^ {4}id: "/m).slice(1);
  let apps = 0;
  let inBeiden = 0;
  for (const block of bloecke) {
    const apple = /apps\.apple\.com/.test(block);
    const play = /play\.google\.com/.test(block);
    const anzahl = Math.max(
      (block.match(/apps\.apple\.com/g) ?? []).length,
      (block.match(/play\.google\.com/g) ?? []).length,
    );
    if (!apple && !play) continue;
    apps += anzahl;
    if (apple && play)
      inBeiden += Math.min(
        (block.match(/apps\.apple\.com/g) ?? []).length,
        (block.match(/play\.google\.com/g) ?? []).length,
      );
  }

  const satz = quelle.match(
    /(\w+) Apps in den Stores, (alle \w+|\w+ davon) in beiden/,
  );

  if (!satz) {
    zeilen.push("  --  Store-Zahlen: Satz im Werdegang nicht gefunden");
  } else {
    const behauptetApps = ZAHLWORT[satz[1].toLowerCase()];
    const zweiteAngabe = satz[2].startsWith("alle")
      ? ZAHLWORT[satz[2].split(" ")[1]]
      : ZAHLWORT[satz[2].split(" ")[0]];
    const funde = [];
    if (behauptetApps !== apps)
      funde.push(`Satz nennt ${behauptetApps} Apps, verlinkt sind ${apps}`);
    if (zweiteAngabe !== inBeiden)
      funde.push(
        `Satz nennt ${zweiteAngabe} in beiden Stores, verlinkt sind ${inBeiden}`,
      );
    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push("  !!  Store-Zahlen im Werdegang stimmen nicht:");
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Store-Zahlen        ${String(apps).padStart(6)} Apps verlinkt, ${inBeiden} in beiden Stores`,
      );
    }
  }

  /* Dieselbe Lage, anders gezählt: Das Profil-README spricht von Systemen,
     nicht von Apps. „Zwei davon mit Apps in beiden Stores" meint zwei
     Fallstudien, in denen beide Plattformen vorkommen. Auch diese Zahl hing
     an der Lage bei Google Play und stand eine Woche lang neben ihr. */
  {
    const systemeInBeiden = bloecke.filter(
      (b) => /apps\.apple\.com/.test(b) && /play\.google\.com/.test(b),
    ).length;
    const profil = "../docs/GITHUB-PROFILE-README.md";
    if (!existsSync(profil)) {
      zeilen.push(`  --  ${profil} nicht vorhanden, Systemzahl übersprungen`);
    } else {
      const satz = readFileSync(profil, "utf8").match(
        /(\w+) davon mit Apps in beiden Stores/,
      );
      if (!satz) {
        zeilen.push("  --  Profil-README: Satz zu den Stores nicht gefunden");
      } else if (ZAHLWORT[satz[1].toLowerCase()] !== systemeInBeiden) {
        abweichungen++;
        zeilen.push(
          `  !!  Profil-README nennt ${satz[1]} System(e) mit Apps in beiden Stores, verlinkt sind ${systemeInBeiden}`,
        );
      } else {
        zeilen.push(
          `  ok  Store-Zahlen        ${String(systemeInBeiden).padStart(6)} Systeme mit Apps in beiden Stores, wie im Profil-README`,
        );
      }
    }
  }
}

/* ---------------------------------------------------------------------------
   Die ausgeschriebene Zahl der Artikel.

   Die Artikelübersicht heißt „Fünf Fehler, die mich etwas gelehrt haben“, der
   Vorspann darunter sagt „Fünf Probleme aus meinen eigenen Systemen“, und der
   Verweis von der Startseite lautet „Alle fünf Artikel lesen“. Dieselbe Zahl
   steht englisch noch einmal an drei Stellen.

   Sechs Zeichenketten, alle fest geschrieben, keine davon aus der Liste
   abgeleitet. Ein sechster Artikel würde die Liste verlängern und alle sechs
   stehen lassen — auf der Seite, deren Argument ist, dass ihre Zahlen stimmen.
   Ausgerechnet die Überschrift wäre falsch.

   Geprüft wird gegen die Länge von `artikelDe`: Steht in einer der Stellen ein
   Zahlwort, muss es das zur Anzahl passende sein.
   ------------------------------------------------------------------------ */
{
  const datei = "src/content/articles/index.ts";
  if (!existsSync(datei)) {
    zeilen.push(`  --  ${datei} nicht vorhanden, Artikelzahl übersprungen`);
  } else {
    const text = readFileSync(datei, "utf8");

    /* Die Liste selbst: alles zwischen `artikelDe = sortiert([` und `])`. */
    const liste = text.match(/artikelDe = sortiert\(\[([\s\S]*?)\]\)/);
    const anzahl = liste
      ? liste[1].split(",").map((z) => z.trim()).filter(Boolean).length
      : 0;

    const woerter = {
      de: ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"],
      en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
    };

    const funde = [];
    let geprueft = 0;

    for (const [sprache, block] of [
      ["de", text.slice(text.indexOf("chromeDe"), text.indexOf("chromeEn"))],
      ["en", text.slice(text.indexOf("chromeEn"))],
    ]) {
      const richtig = woerter[sprache][anzahl];
      for (const stelle of block.matchAll(/(title|lede|cta):\s*"([^"]+)"/g)) {
        const satz = stelle[2];
        for (const [i, wort] of woerter[sprache].entries()) {
          if (i === 0 || i === 1) continue; /* „ein“ und „one“ sind zu häufig. */
          /* Nur das Zahlwort direkt vor der Sache, die gezählt wird. Sonst
             trifft es auch „Zwei davon hatte monatelang niemand bemerkt" —
             dieselbe Zeile, eine andere Aussage. */
          if (
            !new RegExp(
              `\\b${wort}\\s+(Fehler|Probleme|Artikel|bugs|problems|articles)\\b`,
              "i",
            ).test(satz)
          )
            continue;
          geprueft++;
          if (wort !== richtig)
            funde.push(
              `${sprache}, ${stelle[1]}: „${wort}“ bei ${anzahl} Artikeln — „${richtig}“`,
            );
        }
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} Zahlwort(e) passen nicht zur Artikelzahl:`);
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Artikelzahl        ${String(geprueft).padStart(6)} ausgeschriebene Zahlen passen zu ${anzahl} Artikeln`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Jeder Commit, den ein Artikel nennt, existiert auch.

   Die Belegliste unter jedem Artikel nennt Dateien, Zeilennummern und bei drei
   von fünf einen Commit. Die Dateien kann von außen niemand öffnen — die Repos
   sind privat —, und genau deshalb ist der Commit die Angabe, die am meisten
   Gewicht trägt und am wenigsten kostet: acht Zeichen, die jeder abtippt und
   niemand nachschlagen kann.

   Ein Zahlendreher darin fiele nirgends auf. Hier fällt er auf: `git cat-file`
   im Nachbar-Repo sagt, ob es den Commit gibt.

   Neben dem Commit steht meist ein Datum — „Commit 71bd8d2b vom 30. Juli 2026“,
   englisch „commit 71bd8d2b, 30 July 2026“. Das ist die Angabe, die der Leser
   tatsächlich einordnen kann, und bis hierher prüfte sie niemand: Ein Artikel
   durfte einen existierenden Commit mit einem falschen Datum zitieren, und
   beide Sprachfassungen durften sich dabei widersprechen. Geprüft wird deshalb
   auch das Datum, gegen `%cs` desselben Commits.
   ------------------------------------------------------------------------ */
{
  /**
   * Das Datum, das der Text neben einem Commit nennt, als ISO-Datum.
   *
   * Beide Sprachfassungen schreiben es anders, und beide sollen gelten:
   * deutsch „vom 30. Juli 2026“, englisch „, 30 July 2026“. Steht kein Datum
   * daneben, kommt `null` zurück — das ist erlaubt, nur falsch darf es nicht
   * sein.
   */
  function datumNebenCommit(text, hash) {
    const monate = {
      januar: "01", february: "02", februar: "02", january: "01",
      märz: "03", march: "03", april: "04", mai: "05", may: "05",
      juni: "06", june: "06", juli: "07", july: "07", august: "08",
      september: "09", oktober: "10", october: "10", november: "11",
      dezember: "12", december: "12",
    };
    const treffer = text.match(
      new RegExp(`${hash}[^"]{0,12}?(\\d{1,2})\\.? (\\p{L}+) (\\d{4})`, "u"),
    );
    if (!treffer) return null;
    const monat = monate[treffer[2].toLowerCase()];
    if (!monat) return null;
    return `${treffer[3]}-${monat}-${treffer[1].padStart(2, "0")}`;
  }

  /* Nicht nur die Artikel nennen Commits.

     Die Agenten-Sitzung auf der Startseite endet mit „Ursache, Datei und
     Änderung stehen in Commit bce08f5e“, und die Zeile darüber trägt ihn
     ebenfalls. Das ist derselbe Beleg wie in einem Artikel, an der meist
     gelesenen Stelle der Seite — und er stand außerhalb dieser Prüfung. */
  const repoZuArtikel = {
    "../site.ts": "../../SalatiTech",
    "../de.ts": "../../SalatiTech",
    "../en.ts": "../../SalatiTech",
    "de-ota.ts": "../../SalatiTech",
    "de-shaper.ts": "../../SalatiTech",
    "de-widget.ts": "../../SalatiTech",
    "de-whisper.ts": "../../SalatiTech",
    "de-kassensichv.ts": "../../MenuCloud",
    "en-ota.ts": "../../SalatiTech",
    "en-shaper.ts": "../../SalatiTech",
    "en-widget.ts": "../../SalatiTech",
    "en-whisper.ts": "../../SalatiTech",
    "en-kassensichv.ts": "../../MenuCloud",
  };

  const funde = [];
  let geprueft = 0;
  let uebersprungen = 0;
  let datumsangaben = 0;

  for (const [datei, repo] of Object.entries(repoZuArtikel)) {
    const pfad = `src/content/articles/${datei}`;
    if (!existsSync(pfad)) continue;
    const text = readFileSync(pfad, "utf8");
    const hashes = [
      ...new Set(
        [...text.matchAll(/[Cc]ommit ([0-9a-f]{7,40})\b/g)].map((m) => m[1]),
      ),
    ];
    if (hashes.length === 0) continue;
    if (!existsSync(repo)) {
      uebersprungen += hashes.length;
      continue;
    }
    for (const hash of hashes) {
      geprueft++;
      let art = "";
      let wann = "";
      try {
        art = execFileSync("git", ["cat-file", "-t", hash], {
          cwd: repo,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        wann = execFileSync("git", ["show", "-s", "--format=%cs", hash], {
          cwd: repo,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
      } catch {
        art = "";
      }
      if (art !== "commit") {
        funde.push(`${datei}: ${hash} gibt es in ${repo} nicht`);
        continue;
      }

      /* Steht im Text ein Datum daneben, muss es das des Commits sein. */
      const genannt = datumNebenCommit(text, hash);
      if (genannt) {
        datumsangaben++;
        if (genannt !== wann)
          funde.push(
            `${datei}: ${hash} ist vom ${wann}, der Text nennt den ${genannt}`,
          );
      }
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} genannte(r) Commit(s) mit Abweichung:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (geprueft) {
    zeilen.push(
      `  ok  Genannte Commits    ${String(geprueft).padStart(6)} genannte Commits gibt es im jeweiligen Repo` +
        (datumsangaben ? `, ${datumsangaben} mit passendem Datum` : "") +
        (uebersprungen ? `, ${uebersprungen} ohne Repo übersprungen` : ""),
    );
  } else {
    zeilen.push("  --  Genannte Commits: kein Repo erreichbar, übersprungen");
  }

}

/* ---------------------------------------------------------------------------
   Die Kennzahlen der Fallstudie ohne Git-Historie.

   WohnungsJäger liegt neben diesem Repo, aber nicht bei GitHub. Der Jahrescheck
   lässt es deshalb aus, und der Bericht sagt das auch — „3 von 4 Fallstudien".
   Daraus wurde stillschweigend: gar nichts an dieser Fallstudie wird geprüft.

   Gefunden am 07.08.2026: Auf der Seite standen „fünf Portale“, an zwei
   Stellen je Sprache. Die Registrierung im Repo führt sechs Einträge, davon
   vier echte Portale (`is24`, `immowelt`, `kleinanzeigen`, `wggesucht`), dazu
   `custom` für eine selbst eingetragene Quelle und `demo` als Prüfvorrichtung.
   Ein Demo-Portal mitzuzählen wäre auf einer Seite, die mit Nachprüfbarkeit
   argumentiert, die teuerste Zahl von allen.

   Für den Dateipfad braucht es keine Historie — die Zahl steht im Quelltext.
   ------------------------------------------------------------------------ */
{
  const registrierung = "../../KIWohnung/src/scanner/registry.ts";
  if (!existsSync(registrierung)) {
    zeilen.push(`  --  ${registrierung} nicht vorhanden, Portalzahl übersprungen`);
  } else {
    const text = readFileSync(registrierung, "utf8");
    const block = text.slice(text.indexOf("export const portals"));
    const eingetragen = [
      ...new Set(
        [...block.slice(0, block.indexOf("}")).matchAll(/\b([a-z0-9]+)\b/g)].map(
          (m) => m[1],
        ),
      ),
    ].filter((n) => !["export", "const", "portals", "Record", "string", "Portal"].includes(n));

    /* `custom` ist eine leere Stelle für eine eigene Quelle, `demo` eine
       Prüfvorrichtung. Beide sind keine überwachten Portale. */
    const echte = eingetragen.filter((n) => !["custom", "demo"].includes(n));

    const behauptet = [
      ...quelle.matchAll(/value: "(\d+)", label: "Überwachte Portale"/g),
    ].map((m) => Number(m[1]));
    const imFliesstext = [
      ...quelle.matchAll(/rund um die Uhr (\w+) Portale scannt/g),
    ].map((m) => m[1]);
    const alsWort = { vier: 4, fünf: 5, sechs: 6, drei: 3, zwei: 2 };

    const funde = [];
    for (const zahl of behauptet)
      if (zahl !== echte.length)
        funde.push(`Kachel nennt ${zahl}, die Registrierung führt ${echte.length}`);
    for (const wort of imFliesstext)
      if (alsWort[wort] !== echte.length)
        funde.push(
          `Fließtext nennt „${wort}“, die Registrierung führt ${echte.length}`,
        );

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  WohnungsJäger: Portalzahl stimmt nicht:`);
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  WohnungsJäger        ${String(echte.length).padStart(6)} Portale wie in der Registrierung (${echte.join(", ")})`,
      );
    }
  }
}

{
  const vorlage = "../docs/GITHUB-PROFILE-README.md";
  if (!existsSync(vorlage)) {
    zeilen.push("  --  Profil-README: keine Vorlage, übersprungen");
  } else {
    const oertlich = readFileSync(vorlage, "utf8");
    const glatt = (t) => t.replace(/\r\n/g, "\n").replace(/[ 	]+$/gm, "").trim();

    try {
      /* Über die API und nicht über raw.githubusercontent.com: Deren
         Auslieferung liegt hinter einem Zwischenspeicher und zeigte nach
         einer Änderung noch minutenlang die alte Fassung — der Wächter
         meldete dann eine Abweichung, die es nicht gab. */
      const veroeffentlicht = ghHolen(
        "repos/DomenicMoran/DomenicMoran/contents/README.md",
        true,
      );
      if (glatt(oertlich) !== glatt(veroeffentlicht)) {
        abweichungen++;
        const a = glatt(oertlich).split("\n");
        const b = glatt(veroeffentlicht).split("\n");
        const erste = a.findIndex((z, i) => z !== b[i]);
        zeilen.push(
          "  !!  Profil-README: Vorlage und Veröffentlichtes weichen ab",
        );
        zeilen.push(`        Zeile ${erste + 1}`);
        zeilen.push(`        hier:    ${(a[erste] ?? "(fehlt)").slice(0, 70)}`);
        zeilen.push(
          `        auf GitHub: ${(b[erste] ?? "(fehlt)").slice(0, 70)}`,
        );
      } else {
        zeilen.push(
          `  ok  Profil-README        ${String(glatt(oertlich).split("\n").length).padStart(6)} Zeilen wie auf GitHub`,
        );
      }

      /* Und die Anführungszeichen schließen deutsch.
         ------------------------------------------
         Das Profil ist die meistgelesene öffentliche Fläche, und der
         Artikelvergleich darunter kann das nicht sehen: Er macht aus jedem
         Anführungszeichen dasselbe Zeichen, bevor er vergleicht — mit Absicht,
         sonst meldet er eine Titelabweichung, wo nur die Schreibweise abweicht.

         Gefunden am 06.08.2026: „Published" mit geradem Schlusszeichen, zwei
         Zeilen weiter „Sollte jetzt funktionieren“ mit dem richtigen. Der
         Artikel selbst setzt beide deutsch. */
      const gemischt = veroeffentlicht.match(/„[^„“"\n]{1,60}"/g);
      if (gemischt) {
        abweichungen += gemischt.length;
        zeilen.push(
          `  !!  ${gemischt.length} Anführungszeichen im Profil-README schließen gerade:`,
        );
        for (const g of gemischt.slice(0, 5)) zeilen.push(`        ${g}`);
      }
    } catch {
      zeilen.push("  --  Profil-README: GitHub nicht erreichbar, übersprungen");
    }

    /* Die Kurzbeschreibung des Repos nennt zwei Zahlen.
       ------------------------------------------------
       „Vier Fallstudien zu Produktionssystemen, fünf Fachartikel" steht als
       Beschreibung am Repo und damit in jeder Repo-Liste, in jeder Suche und
       über jedem Klon-Befehl. Es ist die erste Zeile, die jemand über diese
       Arbeit liest, und sie stand bisher außerhalb jeder Prüfung: Alle
       Wächter dieses Laufs sehen in Dateien, keiner in die Angaben, die
       GitHub selbst führt.

       Ein sechster Artikel ändert die Seite, die Sitemap, den Feed und die
       Lesezeiten — die Beschreibung ändert er nicht, weil sie in keinem
       Verzeichnis liegt. Genau daran veraltet so ein Satz, ohne dass jemand
       ihn anfasst. */
    const ZAHLWORT = new Map([
      ["eine", 1],
      ["zwei", 2],
      ["drei", 3],
      ["vier", 4],
      ["fünf", 5],
      ["sechs", 6],
      ["sieben", 7],
      ["acht", 8],
      ["neun", 9],
      ["zehn", 10],
    ]);
    try {
      const beschreibung =
        JSON.parse(ghHolen("repos/DomenicMoran/portfolio")).description ?? "";

      const quelle = readFileSync(join("src", "content", "site.ts"), "utf8");
      const von = quelle.indexOf("export const caseStudies");
      const bis = quelle.indexOf("\nexport const", von + 10);
      const fallstudien = (
        quelle.slice(von, bis < 0 ? quelle.length : bis).match(/id:\s*"/g) ?? []
      ).length;
      const artikel = readdirSync(join("src", "content", "articles")).filter(
        (f) => /^de-.*\.ts$/.test(f),
      ).length;

      /* Gelesen wird das Zahlwort vor dem Substantiv, nicht die Zahl: Der
         Satz schreibt „Vier Fallstudien", nicht „4 Fallstudien“. */
      const gelesen = (wort) => {
        const treffer = new RegExp(
          `(\\d+|[A-Za-zÄÖÜäöüß]+)\\s+${wort}`,
          "i",
        ).exec(beschreibung);
        if (!treffer) return null;
        const roh = treffer[1].toLowerCase();
        return /^\d+$/.test(roh) ? Number(roh) : (ZAHLWORT.get(roh) ?? null);
      };

      for (const [wort, ist] of [
        ["Fallstudien", fallstudien],
        ["Fachartikel", artikel],
      ]) {
        const behauptet = gelesen(wort);
        if (behauptet === null) {
          abweichungen++;
          zeilen.push(
            `  !!  Repo-Beschreibung nennt keine Zahl vor „${wort}" (${ist} vorhanden)`,
          );
        } else if (behauptet !== ist) {
          abweichungen++;
          zeilen.push(
            `  !!  Repo-Beschreibung sagt ${behauptet} ${wort}, es sind ${ist}`,
          );
          zeilen.push(`        auf GitHub: ${beschreibung.slice(0, 90)}`);
        } else {
          zeilen.push(
            `  ok  Repo-Beschreibung   ${String(ist).padStart(6)} ${wort} wie im Inhalt`,
          );
        }
      }
    } catch {
      zeilen.push(
        "  --  Repo-Beschreibung: GitHub nicht erreichbar, übersprungen",
      );
    }

    /* Die Testzahlen und die Abhängigkeitsfreiheit je Paket. */
    const funde = [];
    let gezaehlt = 0;
    for (const treffer of oertlich.matchAll(
      /\[([a-z-]+)\]\(https:\/\/github\.com\/DomenicMoran\/[a-z-]+\)[^\n|]*\|[^\n|]*?(\d+) Tests?, null Abhängigkeiten/g,
    )) {
      const [, paket, behauptet] = treffer;
      const ordner = join(OSS, paket);
      if (!existsSync(ordner)) {
        funde.push(`${paket}: kein Klon unter ../oss, nicht nachzählbar`);
        continue;
      }

      /* Gezählt wird mit dem Testläufer, nicht mit einem Suchmuster.

         Vorher las der Lauf `src/*.test.ts` und zählte darin `it(` und
         `test(`. Das hielt, solange alle drei genannten Pakete gleich gebaut
         waren. Mit `verified-done` kam ein viertes dazu, das seine Tests
         unter `test/` legt und einen Teil über `it.each` erzeugt — der Lauf
         stürzte dort mit ENOENT ab, und ein Suchmuster hätte 12 statt 16
         gezählt. Der Läufer zählt dasselbe wie das README behauptet. */
      const bericht = vitestLauf(ordner);
      if (!bericht) {
        funde.push(`${paket}: kein Vitest im Klon, nicht nachzählbar`);
        continue;
      }
      const echt = bericht.numTotalTests;
      if (String(echt) !== behauptet) {
        funde.push(`${paket}: README sagt ${behauptet} Tests, gezählt ${echt}`);
      }
      const manifest = JSON.parse(
        readFileSync(join(ordner, "package.json"), "utf8"),
      );
      const abh = Object.keys(manifest.dependencies ?? {}).length;
      if (abh > 0)
        funde.push(`${paket}: README sagt null Abhängigkeiten, es sind ${abh}`);

      /* Dieselbe Testzahl auf der Seite wie im README.
         ----------------------------------------------
         Geprüft wurde bisher die Tabelle im Profil-README. Dieselben Zahlen
         stehen ein zweites Mal in `site.ts` als „TypeScript · 23 Tests · null
         Abhängigkeiten" unter jedem Paket, und diese Fassung liest der
         Besucher der Seite. Wer nur eine der beiden anfasst, hinterlässt zwei
         Zahlen für dieselbe Sache — und der Lauf sah bisher nur eine davon an. */
      const metaZeile = new RegExp(
        `name:\\s*"${paket}"[\\s\\S]{0,400}?meta:\\s*"([^"]+)"`,
      ).exec(quelle)?.[1];
      if (metaZeile) {
        const aufDerSeite = /(\d+)\s+Tests/.exec(metaZeile)?.[1];
        if (aufDerSeite && String(echt) !== aufDerSeite) {
          funde.push(
            `${paket}: die Seite sagt ${aufDerSeite} Tests, gezählt ${echt}`,
          );
        }
        if (/null Abhängigkeiten/.test(metaZeile) && abh > 0) {
          funde.push(
            `${paket}: die Seite sagt null Abhängigkeiten, es sind ${abh}`,
          );
        }
      }

      /* Die Zahl der Skills, wo die Seite eine nennt.
         --------------------------------------------
         Für `verified-done` steht in `site.ts` „Claude Code · 4 Skills ·
         16 Tests · null Abhängigkeiten". Zwei der drei Zahlen prüft der Lauf
         seit jeher, die erste nicht: Ein fünftes Verzeichnis unter `skills/`
         ändert das Paket und nicht die Seite, und aufgefallen wäre es
         niemandem.

         Gezählt werden die Verzeichnisse mit einer `SKILL.md` — dieselbe
         Einheit, die auch das Marketplace-Manifest als Skill führt. */
      const skillOrdner = join(ordner, "skills");
      if (existsSync(skillOrdner)) {
        const skills = readdirSync(skillOrdner).filter((e) =>
          existsSync(join(skillOrdner, e, "SKILL.md")),
        ).length;
        const genannt = /(\d+)\s+Skills/.exec(quelle)?.[1];
        if (genannt && Number(genannt) !== skills) {
          funde.push(
            `${paket}: die Seite sagt ${genannt} Skills, im Klon sind es ${skills}`,
          );
        }
      }

      gezaehlt++;
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(
        `  !!  ${funde.length} Abweichung(en) bei den Paketzahlen im README:`,
      );
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Paketzahlen im README ${String(gezaehlt).padStart(6)} Pakete: Tests und Abhängigkeiten stimmen`,
      );
    }

    /* Die Themen der Paket-Repos gegen das, was im Klon steht.
       ------------------------------------------------------
       Themen sind die Schlagworte, nach denen auf GitHub gesucht wird, und
       auf dem Profil stehen sie unter jedem Repo. Sie liegen in keiner Datei
       und ändern sich nur, wenn jemand sie von Hand anfasst — also driften
       sie.

       Gefunden am 05.08.2026: `whisper-ggml-header` bestand zu vier Fünfteln
       aus TypeScript und trug als einziges der drei TypeScript-Pakete nicht
       das Thema. Am 06.08.2026 dasselbe eine Ebene weiter: `verified-done`
       und `whisper-ggml-header` haben beide keine einzige Laufzeit-Abhängig-
       keit, und `zero-dependencies` stand nur an den anderen zwei.

       Geprüft wird gegen Tatsachen, nicht gegen eine Wunschliste: die Sprache,
       die GitHub selbst aus dem Repo errechnet, und die `dependencies` aus der
       `package.json` des Klons. Dazu eine Untergrenze — ein Aufruf, der die
       Themen versehentlich überschreibt, lässt genau eines stehen, und ohne
       diese Zeile fiele das niemandem auf. */
    const themenFunde = [];
    let geprueftePakete = 0;
    for (const [paket] of PAKETE) {
      const ordner = join(OSS, paket);
      if (!existsSync(ordner)) continue;
      let daten;
      try {
        daten = JSON.parse(ghHolen(`repos/DomenicMoran/${paket}`));
      } catch {
        continue;
      }
      geprueftePakete++;
      const themen = daten.topics ?? [];

      if (themen.length < 4) {
        themenFunde.push(
          `${paket}: nur ${themen.length} Thema/Themen (${themen.join(", ") || "keins"})`,
        );
      }
      if (daten.language === "TypeScript" && !themen.includes("typescript")) {
        themenFunde.push(`${paket}: GitHub nennt TypeScript, das Thema fehlt`);
      }
      const manifest = JSON.parse(
        readFileSync(join(ordner, "package.json"), "utf8"),
      );
      const laufzeit = Object.keys(manifest.dependencies ?? {}).length;
      if (laufzeit === 0 && !themen.includes("zero-dependencies")) {
        themenFunde.push(
          `${paket}: keine Laufzeit-Abhängigkeit, das Thema zero-dependencies fehlt`,
        );
      }
      if (laufzeit > 0 && themen.includes("zero-dependencies")) {
        themenFunde.push(
          `${paket}: Thema zero-dependencies, aber ${laufzeit} Abhängigkeit(en)`,
        );
      }
    }
    if (themenFunde.length) {
      abweichungen += themenFunde.length;
      zeilen.push(`  !!  ${themenFunde.length} Abweichung(en) bei den Repo-Themen:`);
      for (const f of themenFunde) zeilen.push(`        ${f}`);
    } else if (geprueftePakete > 0) {
      zeilen.push(
        `  ok  Repo-Themen         ${String(geprueftePakete).padStart(6)} Pakete: Sprache und Abhängigkeitsfreiheit verschlagwortet`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Artikeltitel im Profil-README
   ---------------------------------------------------------------------------

   Das Profil-README auf GitHub verlinkt die fünf Artikel mit ihrem Titel als
   Linktext. Zwei davon wichen ab: „was in der Dokumentation nicht steht" gegen
   „was die Dokumentation auslässt“ und „mein größeres geschlagen hat" gegen
   „mein größeres schlug". Wer dort klickt, landete auf einer Seite mit anderer
   Überschrift als versprochen — und das ist die erste Seite, die ein Leser des
   Profils überhaupt sieht.

   Verglichen wird der Linktext gegen `title` in der jeweiligen Artikeldatei.
   Das README liegt außerhalb dieses Repos; fehlt es, wird übersprungen. */
{
  const readme = "../docs/GITHUB-PROFILE-README.md";
  if (!existsSync(readme)) {
    zeilen.push("  --  Profil-README nicht gefunden, übersprungen");
  } else {
    const text = readFileSync(readme, "utf8");
    const titelJeSlug = new Map();
    for (const datei of readdirSync("src/content/articles")) {
      if (!datei.startsWith("de-")) continue;
      const inhalt = readFileSync(join("src/content/articles", datei), "utf8");
      const slug = inhalt.match(/slug: "([^"]+)"/)?.[1];
      const titel = inhalt.match(/^  title: "([^"]+)"/m)?.[1];
      if (slug && titel) titelJeSlug.set(slug, titel);
    }

    const funde = [];
    for (const treffer of text.matchAll(
      /\[([^\]]+)\]\(https:\/\/domenicmoran\.de\/artikel\/([a-z0-9-]+)\)/g,
    )) {
      const [, linktext, slug] = treffer;
      const echt = titelJeSlug.get(slug);
      if (!echt) {
        funde.push(`${slug}: im README verlinkt, gibt es als Artikel nicht`);
      } else if (
        linktext.replace(/[“”„“]/g, '"') !== echt.replace(/[“”„“]/g, '"')
      ) {
        funde.push(
          `${slug}: README sagt „${linktext}“, der Artikel heißt „${echt}“`,
        );
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(
        `  !!  ${funde.length} Titelabweichung(en) im Profil-README:`,
      );
      for (const f of funde) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Profil-README            ${String(titelJeSlug.size).padStart(6)} Artikeltitel stimmen`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Jahresangabe einer Fallstudie gegen die Repo-Historie
   ---------------------------------------------------------------------------

   Der One-Pager wies MenuCloud als "2025–2026" aus, und die Fallstudie
   ebenso, in beiden Sprachen. Der erste Commit des Repos stammt vom
   26.03.2026 ("Initialize MenuCloud Berlin Web Application"), vor 2026 gibt
   es null Commits. Zugleich stand auf derselben Seite "über 4.000 Commits
   seit März 2026" und "in vier Monaten" — die Angabe widersprach sich
   innerhalb eines Blattes.

   Geprüft wird deshalb das früheste Jahr jeder Angabe gegen den ersten
   Commit des zugehörigen Repos. Ein späteres Endjahr ist erlaubt: Die
   Arbeit läuft weiter. Ein früheres Anfangsjahr ist es nicht. */
{
  const zuRepo = {
    salati: resolve("../../SalatiTech"),
    menucloud: resolve("../../MenuCloud"),
    nouri: resolve("../../NOURI"),
  };

  const quelle = readFileSync("src/content/site.ts", "utf8");

  /* WohnungsJäger fehlt in der Zuordnung oben, weil das Verzeichnis keine
     Git-Historie hat — es gibt dort keinen ersten Commit, gegen den sich ein
     Jahr halten ließe. Die Zahl unten nennt das ausdrücklich: „3 von 4“ statt
     „3“, sonst liest sich die Zeile wie eine vollständige Prüfung. */
  const anfang = quelle.indexOf("export const caseStudies");
  const fallstudienBlock = quelle.slice(
    anfang,
    quelle.indexOf("\nexport const", anfang + 10),
  );
  const alleFallstudien = [...fallstudienBlock.matchAll(/^ {4}id: "[a-z-]+"/gm)]
    .length;

  const funde = [];
  let geprueft = 0;
  let uebersprungen = 0;

  for (const [id, repo] of Object.entries(zuRepo)) {
    const block = quelle.slice(quelle.indexOf(`id: "${id}"`));
    const jahr = /year:\s*"([^"]+)"/.exec(block)?.[1];
    if (!jahr) continue;
    const angegeben = Number(jahr.match(/\d{4}/)?.[0]);
    if (!angegeben) continue;

    if (!existsSync(join(repo, ".git"))) {
      uebersprungen++;
      continue;
    }

    let erstes;
    try {
      erstes = Number(
        execFileSync(
          "git",
          ["-C", repo, "log", "--reverse", "--format=%ad", "--date=format:%Y"],
          {
            encoding: "utf8",
          },
        )
          .split("\n")[0]
          .trim(),
      );
    } catch {
      uebersprungen++;
      continue;
    }

    geprueft++;
    if (angegeben < erstes) {
      funde.push(`${id}: Seite sagt ${jahr}, erster Commit ${erstes}`);
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Jahresangabe(n) vor dem ersten Commit:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (uebersprungen) {
    zeilen.push(
      `  --  Jahresangaben: ${uebersprungen} Repo(s) nicht da, übersprungen`,
    );
  } else {
    zeilen.push(
      `  ok  Jahresangaben          ${String(geprueft).padStart(6)} von ${alleFallstudien} Fallstudien nicht vordatiert` +
        (alleFallstudien > geprueft
          ? ` (${alleFallstudien - geprueft} ohne Git-Historie)`
          : ""),
    );
  }
}

/* ---------------------------------------------------------------------------
   Jede Bestätigungsseite eines Zertifikats antwortet und trägt den Namen
   ---------------------------------------------------------------------------

   Die Seite sagt, alle zehn Zertifikate seien beim Aussteller prüfbar, und
   das Zertifikate-Repository schreibt dazu: "Die PDF daneben ist nur die
   Kopie — maßgeblich ist der Link, weil eine PDF sich fälschen lässt und
   eine Bestätigungsseite nicht." Genau dieser Satz macht den Link zum
   stärksten Beleg der Seite und zum teuersten Verlust, wenn er stirbt.

   Geprüft wird nicht nur der Statuscode: Eine Bestätigungsseite, die 200
   antwortet, aber den Namen nicht mehr enthält, ist kein Nachweis. Der
   Udemy-Kurznachweis bleibt außen vor, er steht hinter einer Bot-Prüfung
   und antwortet einer Maschine grundsätzlich mit 403.

   Ohne Netz wird übersprungen und das gesagt, nicht stillschweigend
   bestanden. */
{
  const ids = [...quelle.matchAll(/coursera\.org\/verify\/([A-Z0-9]+)/g)].map(
    (m) => m[1],
  );
  const einmalig = [...new Set(ids)];
  const funde = [];
  let geprueft = 0;
  let uebersprungen = 0;

  for (const id of einmalig) {
    try {
      const antwort = await fetch(`https://coursera.org/verify/${id}`, {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 Pruefstempel" },
        signal: AbortSignal.timeout(20000),
      });
      const text = await antwort.text();
      geprueft++;
      if (antwort.status !== 200) funde.push(`${id}: Status ${antwort.status}`);
      else if (!/Domenic|Moran/i.test(text))
        funde.push(`${id}: Seite ohne den Namen`);
    } catch {
      uebersprungen++;
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Zertifikatsnachweis(e) auffällig:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (uebersprungen) {
    zeilen.push(
      `  --  Zertifikatsnachweise: ${uebersprungen} nicht erreichbar, übersprungen`,
    );
  } else {
    zeilen.push(
      `  ok  Zertifikatsnachweise   ${String(geprueft).padStart(6)} Seiten antworten mit dem Namen`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Impressum und Datenschutz stehen auf jeder Seite
   ---------------------------------------------------------------------------

   § 5 DDG verlangt das Impressum leicht erkennbar, unmittelbar erreichbar und
   ständig verfügbar — von jeder Seite des Angebots. Gemessen am 02.08.2026
   fehlte der Verweis auf fünf von elf ausgelieferten Adressen: beide
   One-Pager, beide Rechtsseiten und die 404. Am schwersten wogen die
   One-Pager, weil genau diese Adresse an Recruiter geht.

   Geprüft wird die gebaute Datei, nicht das Bauteil: Der Verweis kann in
   einem Layout hängen, das eine Route nicht benutzt, und genau so ist es
   entstanden. */
{
  const bauOrdner = join(".next", "server", "app");
  const funde = [];
  let geprueft = 0;

  const suchen = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) {
        suchen(pfad);
        continue;
      }
      if (!eintrag.name.endsWith(".html")) continue;
      if (eintrag.name.startsWith("_")) continue;

      const html = readFileSync(pfad, "utf8");
      geprueft++;
      const fehlt = [
        /href="\/impressum"/.test(html) ? null : "Impressum",
        /href="\/datenschutz"/.test(html) ? null : "Datenschutz",
      ].filter(Boolean);
      if (fehlt.length) {
        const route = pfad.slice(bauOrdner.length).split("\\").join("/");
        funde.push(`${route}: ohne ${fehlt.join(" und ")}`);
      }
    }
  };

  if (!existsSync(bauOrdner)) {
    zeilen.push(
      "  --  Rechtsverweise nicht gebaut, übersprungen (npm run build)",
    );
  } else {
    suchen(bauOrdner);
    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} Seite(n) ohne Rechtsverweise:`);
      for (const f of funde.slice(0, 8)) zeilen.push(`        ${f}`);
    } else {
      zeilen.push(
        `  ok  Rechtsverweise         ${String(geprueft).padStart(6)} Seiten mit Impressum und Datenschutz`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Sicherheitskontaktdatei läuft nicht ab
   ---------------------------------------------------------------------------

   RFC 9116 verlangt in security.txt ein `Expires` weniger als ein Jahr in der
   Zukunft. Steht dort ein vergangener Zeitpunkt, behandeln Scanner die Datei
   als ungültig — stillschweigend, es gibt keine Meldung.

   Die Datei lag als statische Kopie in public/ mit fest eingetragenem
   „2027-07-31“. Ein Datum ein Jahr voraus fällt niemandem auf, bis es vorbei
   ist. Sie entsteht jetzt beim Bauen mit sechs Monaten Vorlauf; geprüft wird
   das gebaute Ergebnis, nicht die Absicht. */
{
  const datei = join(
    ".next",
    "server",
    "app",
    ".well-known",
    "security.txt.body",
  );
  if (!existsSync(datei)) {
    zeilen.push(
      "  --  security.txt nicht gebaut, übersprungen (npm run build)",
    );
  } else {
    const inhalt = readFileSync(datei, "utf8");
    const treffer = inhalt.match(/^Expires:\s*(\S+)/m);
    const bis = treffer ? Date.parse(treffer[1]) : NaN;
    const tage = Math.round((bis - Date.now()) / 86_400_000);

    if (!treffer || Number.isNaN(bis)) {
      abweichungen++;
      zeilen.push("  !!  security.txt: kein gültiges Expires nach RFC 3339");
    } else if (tage <= 0) {
      abweichungen++;
      zeilen.push(
        `  !!  security.txt ist seit ${-tage} Tagen abgelaufen (${treffer[1]})`,
      );
    } else if (tage >= 365) {
      abweichungen++;
      zeilen.push(
        `  !!  security.txt gilt ${tage} Tage — RFC 9116 verlangt weniger als ein Jahr`,
      );
    } else {
      zeilen.push(
        `  ok  security.txt          ${String(tage).padStart(6)} Tage gültig`,
      );
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

/* ---------------------------------------------------------------------------
   Jede Adresse, die nach draußen zeigt, antwortet noch
   ---------------------------------------------------------------------------

   `check:links` prüft die eigenen Adressen und lässt die fremden aus, mit
   gutem Grund: Ein Lauf in der CI, der rot wird, weil ein Store gerade
   langsam ist, wird abgeschaltet statt gelesen. Hier ist der richtige Ort,
   denn dieser Lauf misst ohnehin gegen die Wirklichkeit und läuft von Hand.

   Und die Ziele sind keine Zierde. "Live im App Store", "Live in Produktion"
   — die Fallstudien behaupten das, und der Verweis daneben ist der einzige
   Beleg. Verschwindet eine Store-Seite oder geht ein System vom Netz, steht
   die Behauptung weiter da.

   Zwei Ziele antworten einer Maschine grundsätzlich anders als einem
   Menschen: LinkedIn mit 999 und der Udemy-Kurznachweis mit 403, beide aus
   Bot-Abwehr. Sie stehen als benannte Ausnahme hier, nicht als stille
   Sonderbehandlung im Vergleich. */
{
  /* Je Dienst die Antworten, die für ein Werkzeug normal sind.

     Eine Zahl je Host reichte nicht: LinkedIn antwortete diesem Lauf über
     Monate mit 999, am 08.08.2026 einmal mit 403 und unmittelbar danach
     wieder zweimal mit 999. Beides ist dieselbe Bot-Abwehr, und ein Lauf,
     der davon rot wird, meldet die Tagesform eines fremden Dienstes als
     Fehler der eigenen Seite. Was zählt, bleibt der Fall, der wirklich
     etwas bedeutet: 404 und 410 stehen hier nicht. */
  const AUSNAHMEN = new Map([
    ["www.linkedin.com", [999, 403]],
    ["ude.my", [403]],
  ]);

  const gebaut = join(".next", "server", "app");
  const dateien = [];
  const sammle = (ordner) => {
    if (!existsSync(ordner)) return;
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const voll = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) sammle(voll);
      else if (eintrag.name.endsWith(".html")) dateien.push(voll);
    }
  };
  sammle(gebaut);

  const ziele = new Set();
  for (const datei of dateien) {
    const html = readFileSync(datei, "utf8");
    for (const treffer of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      const adresse = treffer[1];
      if (adresse.includes("domenicmoran.de")) continue;
      if (adresse.includes("schema.org")) continue;
      if (adresse.includes("coursera.org/verify")) continue;
      ziele.add(adresse.replace(/&amp;/g, "&"));
    }
  }

  if (!dateien.length) {
    zeilen.push("  --  Äußere Verweise: kein Bau vorhanden, übersprungen");
  } else {
    const funde = [];
    let geprueft = 0;
    let uebersprungen = 0;

    /* Ein einzelner schlechter Moment ist kein toter Verweis.

       Der Lauf meldete am 08.08.2026 einen auffälligen Verweis; der Aufruf
       unmittelbar danach war grün. Dasselbe war zuvor bei LinkedIn passiert,
       das einmal 403 statt 999 antwortete. Beides ist die Tagesform eines
       fremden Dienstes, und ein Lauf, der davon rot wird, schickt die Suche
       zu einer Seite, an der nichts ist.

       Deshalb ein zweiter Versuch nach kurzer Pause, und erst der zweite
       zählt. Ein Ziel, das wirklich weg ist, antwortet auch beim zweiten Mal
       mit 404 — die Wiederholung verdeckt nichts, sie trennt nur den Ausfall
       vom Zufall. */
    const abrufen = async (adresse) =>
      await fetch(adresse, {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 Pruefstempel" },
        signal: AbortSignal.timeout(20000),
      });

    for (const adresse of [...ziele].sort()) {
      const host = new URL(adresse).host;
      const erlaubt = AUSNAHMEN.get(host);
      const inOrdnung = (antwort) =>
        antwort.status === 200 || erlaubt?.includes(antwort.status);
      try {
        let antwort = await abrufen(adresse);
        if (!inOrdnung(antwort)) {
          await new Promise((weiter) => setTimeout(weiter, 1500));
          antwort = await abrufen(adresse);
        }
        geprueft++;
        if (inOrdnung(antwort)) continue;
        funde.push(`${adresse}: Status ${antwort.status}, auch im zweiten Versuch`);
      } catch {
        uebersprungen++;
      }
    }

    if (funde.length) {
      abweichungen += funde.length;
      zeilen.push(`  !!  ${funde.length} äußere(r) Verweis(e) auffällig:`);
      for (const f of funde) zeilen.push(`        ${f}`);
    } else if (uebersprungen) {
      zeilen.push(
        `  --  Äußere Verweise: ${uebersprungen} nicht erreichbar, übersprungen`,
      );
    } else {
      zeilen.push(
        `  ok  Äußere Verweise      ${String(geprueft).padStart(6)} Ziele antworten`,
      );
    }
  }
}

/* ------------------------------------------------------------------
   Die Versionsangaben in den Tech-Stacks gegen die Repos.

   Eine Zahl wie „React Native 0.86“ ist eine Behauptung wie jede andere,
   nur altert sie schneller: Sie ändert sich, wenn in einem ganz anderen
   Verzeichnis `pnpm up` läuft, und niemand denkt dabei an das Portfolio.
   Ein Bewerber, der eine überholte Version nennt, sieht aus, als hätte er
   das Projekt zuletzt vor einem Jahr angefasst — von allen Fehlern auf
   dieser Seite der unnötigste.

   Geprüft wird gegen die `package.json` des jeweiligen Projekts, auf so
   viele Stellen, wie die Seite nennt: „Fastify 5“ gegen die Hauptversion,
   „React Native 0.86“ gegen zwei Stellen.

   Die Tabelle ist bewusst ausgeschrieben statt geraten. Ein Parser, der
   sich aus „Next.js 16 App Router" den Paketnamen zusammensucht, hätte
   drei Sonderfälle und einen stillen Fehlschlag, sobald ein vierter kommt.
------------------------------------------------------------------ */

const ANGABEN = [
  {
    text: "React Native 0.86",
    datei: "../../SalatiTech/apps/mobile/package.json",
    paket: "react-native",
    stellen: 2,
  },
  {
    text: "Expo SDK 57",
    datei: "../../SalatiTech/apps/mobile/package.json",
    paket: "expo",
    stellen: 1,
  },
  {
    text: "Reanimated 4",
    datei: "../../SalatiTech/apps/mobile/package.json",
    paket: "react-native-reanimated",
    stellen: 1,
  },
  {
    text: "Next.js 16 App Router",
    datei: "../../MenuCloud/package.json",
    paket: "next",
    stellen: 1,
  },
  {
    text: "React 19 RSC",
    datei: "../../MenuCloud/package.json",
    paket: "react",
    stellen: 1,
  },
  {
    text: "Next.js 16 App Router",
    datei: "../../NOURI/apps/web/package.json",
    paket: "next",
    stellen: 1,
  },
  {
    text: "React 19",
    datei: "../../NOURI/apps/web/package.json",
    paket: "react",
    stellen: 1,
  },
  {
    text: "Expo SDK 54",
    datei: "../../NOURI/apps/mobile/package.json",
    paket: "expo",
    stellen: 1,
  },
  {
    text: "React Native 0.81",
    datei: "../../NOURI/apps/mobile/package.json",
    paket: "react-native",
    stellen: 2,
  },
  {
    text: "TypeScript 5.9",
    datei: "../../NOURI/apps/mobile/package.json",
    paket: "typescript",
    stellen: 2,
  },
  {
    text: "Fastify 5",
    datei: "../../NOURI/services/api/package.json",
    paket: "fastify",
    stellen: 1,
  },
  {
    text: "Zod 4",
    datei: "../../NOURI/services/api/package.json",
    paket: "zod",
    stellen: 1,
  },
  {
    text: "pnpm 10 Workspaces",
    datei: "../../NOURI/package.json",
    feld: "packageManager",
    stellen: 1,
  },
  /* WohnungsJäger legt keine `engines` fest — die Anforderung steht im README,
     dreimal, und dort liest sie auch der Nutzer, der die Anwendung aufsetzt.
     Also wird gegen den Text geprüft statt gegen ein Feld, das es nicht gibt.
     Der Beleg ist damit derselbe, den ein Fremder finden würde. */
  {
    text: "Node.js 22",
    datei: "../../KIWohnung/README.md",
    text_muster: /Node\.js (\d+)\+/,
    stellen: 1,
  },
];

{
  const stackBloecke = [
    ...quelle.matchAll(/group: "[^"]+",\s*items: \[([^\]]*)\]/g),
  ];
  const aufDerSeite = new Set();
  for (const block of stackBloecke) {
    for (const eintrag of block[1].matchAll(/"([^"]+)"/g)) {
      /* Eine Versionsnummer steht für sich, mit Leerzeichen davor. Ohne diese
         Bedingung hielt der Lauf „Cloudflare R2" und „n8n“ für Versionen und
         verlangte einen Beleg für eine Zahl, die zum Namen gehört. */
      if (/(?:^|\s)\d+(?:\.\d+)*(?:\s|$)/.test(eintrag[1])) {
        aufDerSeite.add(eintrag[1]);
      }
    }
  }

  const funde = [];
  let geprueft = 0;
  let ausgefallen = 0;

  for (const angabe of ANGABEN) {
    if (!aufDerSeite.has(angabe.text)) {
      funde.push(`„${angabe.text}“ steht nicht mehr auf der Seite`);
      continue;
    }
    const pfad = resolve(angabe.datei);
    if (!existsSync(pfad)) {
      ausgefallen++;
      continue;
    }
    let roh;
    if (angabe.text_muster) {
      roh = readFileSync(pfad, "utf8").match(angabe.text_muster)?.[1] ?? "";
    } else {
      const json = JSON.parse(readFileSync(pfad, "utf8"));
      roh = angabe.feld
        ? json[angabe.feld]
        : ({ ...json.dependencies, ...json.devDependencies }[angabe.paket] ??
          "");
    }
    const echt = String(roh).replace(/^[^\d]*/, "");
    const genannt = angabe.text.match(/(\d+(?:\.\d+)*)/)?.[1] ?? "";
    const kurz = (v) => v.split(".").slice(0, angabe.stellen).join(".");

    geprueft++;
    if (kurz(echt) !== kurz(genannt)) {
      funde.push(
        `„${angabe.text}“ — im Repo ${angabe.feld ?? angabe.paket} ${echt}`,
      );
    }
  }

  /* Der umgekehrte Weg: Was auf der Seite steht und hier nicht vorkommt,
     wird ausgeliefert, ohne dass es jemand nachhält. */
  const bekannt = new Set(ANGABEN.map((a) => a.text));
  for (const text of [...aufDerSeite].sort()) {
    if (!bekannt.has(text)) {
      funde.push(`„${text}“ steht auf der Seite, wird aber nirgends geprüft`);
    }
  }

  if (funde.length) {
    abweichungen += funde.length;
    zeilen.push(`  !!  ${funde.length} Versionsangabe(n) auffällig:`);
    for (const f of funde) zeilen.push(`        ${f}`);
  } else if (ausgefallen) {
    zeilen.push(
      `  --  Versionsangaben: ${ausgefallen} Repo(s) nicht vorhanden, übersprungen`,
    );
  } else {
    zeilen.push(
      `  ok  Versionsangaben     ${String(geprueft).padStart(6)} Angaben stimmen mit den Repos`,
    );
  }

}

/* ---------------------------------------------------------------------------
   Was die READMEs der Pakete importieren, muss es auch geben.

   Diese vier Dateien sind das Erste, was jemand öffnet, der den Code sehen
   will — auf npm stehen sie über dem Paket, auf GitHub unter der Dateiliste.
   Ein Beispiel darin, das nicht läuft, ist teurer als eine fehlende Zeile:
   Wer es kopiert, bekommt einen Fehler und schließt daraus auf das Paket.

   Geprüft wird die Verbindung zwischen beiden Seiten: Jeder Name, den ein
   `import { … } from "<paket>"` im README nennt, muss aus `src/index.ts`
   ausgeführt werden. Umbenennen bricht damit sichtbar, statt still.
--------------------------------------------------------------------------- */

{
  const readmefunde = [];
  let geprueft = 0;
  let ausgefallen = 0;

  for (const [name] of PAKETE) {
    const wurzel = join(OSS, name);
    const readme = join(wurzel, "README.md");
    const einstieg = join(wurzel, "src", "index.ts");

    if (!existsSync(readme)) {
      ausgefallen++;
      continue;
    }

    const text = readFileSync(readme, "utf8");

    /* Ein Paket ohne Importe im README hat hier nichts zu prüfen, und das ist
       kein Ausfall: `verified-done` liefert Skill-Dateien und keinen Einstieg,
       den man importieren könnte. Fehlt dagegen `src/index.ts`, obwohl das
       README daraus importiert, ist genau das der Fund. */
    if (!/import\s*\{[^}]+\}\s*from\s*["']/.test(text)) continue;

    if (!existsSync(einstieg)) {
      readmefunde.push(
        `${name}: README zeigt Importe, es gibt aber kein src/index.ts`,
      );
      continue;
    }

    const quelle = readFileSync(einstieg, "utf8");

    /* Nur Importe aus dem Paket selbst. Beispiele importieren auch aus `node:`
       und aus fremden Paketen, und die gehen diesen Lauf nichts an. */
    const namen = new Set();
    for (const treffer of text.matchAll(
      /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g,
    )) {
      if (!treffer[2].startsWith(name)) continue;
      for (const roh of treffer[1].split(",")) {
        const sauber = roh.replace(/\s+as\s+\w+/, "").trim();
        if (sauber) namen.add(sauber);
      }
    }

    for (const bezeichner of namen) {
      geprueft++;
      const muster = new RegExp(
        `export\\s+(?:async\\s+)?(?:function|const|let|class|type|interface|enum)\\s+${bezeichner}\\b`,
      );
      const reExport = new RegExp(`export\\s*\\{[^}]*\\b${bezeichner}\\b`);
      if (!muster.test(quelle) && !reExport.test(quelle)) {
        readmefunde.push(
          `${name}: README importiert „${bezeichner}", src/index.ts führt es nicht aus`,
        );
      }
    }
  }

  if (readmefunde.length) {
    abweichungen += readmefunde.length;
    zeilen.push(`  !!  ${readmefunde.length} Beispiel(e) in einem README zeigen ins Leere:`);
    for (const f of readmefunde) zeilen.push(`        ${f}`);
  } else if (ausgefallen) {
    zeilen.push(
      `  --  README-Beispiele: ${ausgefallen} Paket(e) ohne README oder Einstieg, übersprungen`,
    );
  } else {
    zeilen.push(
      `  ok  README-Beispiele   ${String(geprueft).padStart(6)} Bezeichner werden ausgeführt`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Die Verweise im Profil-README, gegen die Wirklichkeit.

   Diese Datei ist die Startseite des GitHub-Kontos: das Erste, was jemand
   sieht, der den Namen aus einer Bewerbung in die Suche eingibt. Sie verweist
   auf die Seite, auf die fünf Artikel und auf sechs Repositories — und keiner
   dieser Verweise wurde je nachgesehen. Ein Artikel, der eine neue Adresse
   bekommt, hinterlässt hier ein 404, und zwar an der sichtbarsten Stelle
   überhaupt.

   Geprüft wird die Vorlage unter `docs/`, aus der die veröffentlichte Fassung
   entsteht. Sie liegt außerhalb dieses Repos; fehlt sie, wird übersprungen und
   das gesagt.
--------------------------------------------------------------------------- */

{
  const vorlage = "../docs/GITHUB-PROFILE-README.md";
  if (!existsSync(vorlage)) {
    zeilen.push(`  --  ${vorlage} nicht vorhanden, Verweise übersprungen`);
  } else {
    const text = readFileSync(vorlage, "utf8");
    const ziele = [
      ...new Set(
        [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]),
      ),
    ];

    const tot = [];
    let erreicht = 0;
    let stumm = 0;

    for (const ziel of ziele) {
      const host = new URL(ziel).host;
      try {
        const antwort = await fetch(ziel, {
          redirect: "follow",
          headers: { "user-agent": "Mozilla/5.0 Pruefstempel" },
          signal: AbortSignal.timeout(20000),
        });
        if (antwort.status === 200) {
          erreicht++;
          continue;
        }
        /* Dieselben Ausnahmen wie bei den Verweisen der Seite: Manche Dienste
           antworten Werkzeugen grundsätzlich anders als einem Browser. */
        if (AUSNAHMEN.get(host)?.includes(antwort.status)) {
          erreicht++;
          continue;
        }
        tot.push(`${ziel}: Status ${antwort.status}`);
      } catch {
        /* Bei der eigenen Adresse ist „antwortet nicht" kein Grund zum
           Überspringen, sondern der Fund selbst: Genau so verhält sich ein
           Verweis auf einen Artikel, den es nicht mehr gibt. Übersprungen
           wird nur, was fremden Diensten gehört — die antworten Werkzeugen
           regelmäßig anders als einem Browser. */
        if (host.endsWith("domenicmoran.de")) {
          tot.push(`${ziel}: keine Antwort`);
        } else {
          stumm++;
        }
      }
    }

    if (tot.length) {
      abweichungen += tot.length;
      zeilen.push(
        `  !!  ${tot.length} Verweis(e) im Profil-README führen ins Leere:`,
      );
      for (const t of tot) zeilen.push(`        ${t}`);
    } else if (stumm) {
      zeilen.push(
        `  --  Profil-README: ${stumm} Ziel(e) nicht erreichbar, übersprungen`,
      );
    } else {
      zeilen.push(
        `  ok  Profil-README        ${String(erreicht).padStart(6)} Verweise antworten`,
      );
    }
  }
}

console.log(zeilen.join("\n"));

if (abweichungen) {
  /* Die Funde noch einmal am Ende.
     Der Bericht ist knapp sechzig Zeilen lang, und die Schlusszeile nannte
     bisher nur die Anzahl. Wer den Lauf in der Actions-Ansicht rot sieht,
     bekam damit eine Zahl und musste im Protokoll nach oben suchen — beim
     ersten Mal in dieser Runde stand die Fundzeile außerhalb dessen, was
     ausgegeben war, und die Abweichung war aus dem Bericht allein nicht mehr
     zu benennen. */
  /* Mit den eingerückten Folgezeilen: Ein Fund wie „2 Versionsangaben
     auffällig" steht in einer Kopfzeile, und was genau auffiel, in den
     Zeilen darunter. Ohne sie wiederholt die Zusammenfassung die Überschrift
     und lässt den Befund weg. */
  const auffaellig = [];
  let sammelnd = false;
  for (const z of zeilen) {
    if (/^\s{2}(!=|!!)/.test(z)) {
      auffaellig.push(z);
      sammelnd = true;
    } else if (sammelnd && /^\s{6}\S/.test(z)) {
      auffaellig.push(z);
    } else {
      sammelnd = false;
    }
  }
  console.error(
    `\n${abweichungen} Abweichung${abweichungen === 1 ? "" : "en"} zwischen Seite und Wirklichkeit:\n`,
  );
  for (const z of auffaellig) console.error(z);
  /* Wenn hier nichts steht, hat eine Prüfung den Zähler erhöht, ohne eine
     Zeile zu hinterlassen. Das ist ein Fehler im Lauf und muss es auch sagen —
     ein stummes Rot ist schlimmer als gar keine Prüfung. */
  if (auffaellig.length === 0) {
    console.error(
      "  (keine Fundzeile im Bericht — eine Prüfung zählt, ohne zu melden)",
    );
  }
  process.exit(1);
}

/* Hinweise stehen im Bericht, auch wenn der Lauf grün bleibt.

   Sie sagen, dass etwas gepflegt gehört, nicht dass die Seite etwas Falsches
   behauptet. Als Abweichung gezählt war der Lauf an jedem Morgen rot, bevor
   der Zahlen-Automat lief. */
if (hinweise) {
  const zumPflegen = zeilen.filter((z) => /^\s{2}~/.test(z));
  console.log(
    `
${hinweise} Hinweis${hinweise === 1 ? "" : "e"} auf Pflegebedarf, ` +
      `keine Falschaussage:
`,
  );
  for (const z of zumPflegen) console.log(z);
}
/*
  Die Schlusszeile darf keine Vollständigkeit behaupten, die es nicht gab.

  Vorher stand hier immer "Alle Zahlen auf der Seite stimmen mit den Repos
  überein" — auch dann, wenn zwei Prüfungen mangels Zugriff ausgefallen waren.
  Genau so blieb tagelang unbemerkt, dass "64 ausgelieferte Versionen" und
  "14 Sprachen" ungeprüft auf der Seite standen: Die übersprungenen Zeilen
  standen mitten im Bericht, und die letzte Zeile sagte, alles sei gut.
*/
const uebersprungen = zeilen.filter((z) => z.startsWith("  --")).length;
if (uebersprungen > 0) {
  console.log(
    `\nAlle geprüften Zahlen stimmen mit den Repos überein. ` +
      `${uebersprungen} Prüfung${uebersprungen === 1 ? "" : "en"} ausgefallen, siehe oben — ` +
      `diese Angaben sind damit unbelegt.`,
  );
} else {
  console.log("\nAlle Zahlen auf der Seite stimmen mit den Repos überein.");
}
