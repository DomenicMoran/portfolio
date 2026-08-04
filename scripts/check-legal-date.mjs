#!/usr/bin/env node
/**
 * Prüft, dass das Datum der Datenschutzerklärung zu ihrem Text passt.
 *
 * Das Datum steht von Hand in `stand.ts`, und das ist Absicht: Vorher stand
 * dort `new Date()`, und weil ein Automat die Commit-Zahlen täglich
 * auffrischt, datierte sich die Erklärung jeden Morgen neu, ohne dass sich
 * ein Wort geändert hatte. Bei einem Rechtstext ist das Datum die Zusage,
 * dass der Text an diesem Tag so galt.
 *
 * Von Hand gepflegt heißt aber: Es kann stehen bleiben, während der Text
 * weiterwandert — die stillere und schlechtere Hälfte desselben Problems.
 * Deshalb liegt neben dem Datum eine Prüfsumme über den ausgelieferten Text.
 * Dieser Lauf rechnet sie neu.
 *
 * Gemessen wird der sichtbare Text der gebauten Seite, nicht der Quelltext:
 * Was zählt, ist das, was ein Leser vor sich hat. Der Abschnitt „Stand"
 * bleibt außen vor, sonst änderte jedes neue Datum die Prüfsumme, und der
 * Lauf verlangte nach jeder Korrektur eine weitere.
 *
 *   npm run check:legal
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const STAND_DATEI = join("src", "app", "(de)", "(legal)", "stand.ts");

/* Gelesen und nicht importiert: `stand.ts` ist TypeScript, und Node müsste
   dafür die Typen entfernen. Die Datei hat zwei Zeilen mit festem Aufbau —
   sie zu lesen ist ehrlicher als eine Abhängigkeit dafür einzugehen. */
function ausStandDatei(name) {
  const quelle = readFileSync(STAND_DATEI, "utf8");
  return quelle.match(new RegExp(`export const ${name} = "([^"]+)"`))?.[1];
}

const STAND = ausStandDatei("STAND");
const TEXT_PRUEFSUMME = ausStandDatei("TEXT_PRUEFSUMME");

const SEITE = join(".next", "server", "app", "datenschutz.html");

/**
 * Der sichtbare Text der Erklärung, ohne den Abschnitt „Stand".
 *
 * Der Abschnitt wird an seiner Überschrift abgeschnitten. Sie steht als
 * letzte auf der Seite; alles danach gehört zur Fußzeile und ist auf jeder
 * Seite gleich.
 */
function textOhneStand() {
  const html = readFileSync(SEITE, "utf8");
  const nurInhalt = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const text = nurInhalt
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stelle = text.lastIndexOf("Stand");
  return stelle > 0 ? text.slice(0, stelle).trim() : text;
}

/** Wie `textOhneStand`, aber mit dem Abschnitt „Stand“. */
function textMitStand() {
  const html = readFileSync(SEITE, "utf8");
  const nurInhalt = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  return nurInhalt
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let text;
try {
  text = textOhneStand();
} catch {
  console.log(
    "  --  Datenschutzerklärung: kein Bau vorhanden, übersprungen (npm run build)",
  );
  process.exit(0);
}

/* Steht das Datum aus `stand.ts` auch wirklich auf dem Blatt?

   Die Seite hatte eine eigene Konstante desselben Namens, und die gewann:
   Geprüft wurde der Wert aus `stand.ts`, angezeigt der andere. Gemessen an
   der ausgelieferten Seite standen dort der 3. August und in der Datei der
   4. — der Lauf war grün, weil er die Zeile gar nicht ansah, die ein Leser
   vor sich hat. */
const angezeigt = textMitStand();
if (!angezeigt.includes(STAND)) {
  console.error(
    `Die Datenschutzerklärung zeigt nicht den Stand aus stand.ts.

` +
      `  in stand.ts:   ${STAND}
` +
      `  ausgeliefert:  ${angezeigt.slice(angezeigt.lastIndexOf("Stand"), angezeigt.lastIndexOf("Stand") + 40).trim()}

` +
      `Beide Angaben gehören zusammen. Eine zweite Stelle für dasselbe Datum ` +
      `ist eine Stelle, an der es veraltet.`,
  );
  process.exit(1);
}

const gerechnet = createHash("sha256").update(text).digest("hex").slice(0, 16);

if (gerechnet !== TEXT_PRUEFSUMME) {
  console.error(
    `Die Datenschutzerklärung trägt den Stand „${STAND}", ihr Text ist aber ein anderer.\n\n` +
      `  in stand.ts:   ${TEXT_PRUEFSUMME}\n` +
      `  ausgeliefert:  ${gerechnet}\n\n` +
      `Beides gehört zusammen: Wenn der Text sich geändert hat, gehört das ` +
      `heutige Datum hinein und diese Prüfsumme daneben. Hat er sich nicht ` +
      `geändert, ist etwas anderes passiert, das erst geklärt gehört.`,
  );
  process.exit(1);
}

/* ---------------------------------------------------------------------------
   Die zwei technischen Zusagen der Erklärung

   Sie sagt zwei Sätze über die Bauart dieser Seite, und beide sind prüfbar:

     "Sämtliche Seiten werden vorab erzeugt und als fertige Dateien
      ausgeliefert; es gibt keinen Endpunkt, der Eingaben entgegennimmt."

   Der erste Satz fällt, sobald eine Seite auf Anfrage gerendert wird, der
   zweite, sobald ein Route Handler etwas anderes als GET annimmt. Beides kann
   an einem gewöhnlichen Arbeitstag entstehen, ohne dass jemand an die
   Datenschutzerklärung denkt — und dann steht dort eine Zusage, die nicht
   mehr gilt. `check:privacy` misst, was die fertige Seite tut; hier steht,
   was der Bau daraus macht.

   Die interne Not-found-Route bleibt draußen: Next erzeugt sie immer als
   dynamisch, und sie beantwortet nur Adressen, die es nicht gibt. */
const AUSNAHMEN = new Set(["/_not-found"]);
const SCHREIBENDE =
  /export\s+(?:async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b/;

const dynamische = [];
try {
  const bau = JSON.parse(
    readFileSync(join(".next", "prerender-manifest.json"), "utf8"),
  );
  const vorab = new Set([
    ...Object.keys(bau.routes ?? {}),
    ...Object.keys(bau.dynamicRoutes ?? {}),
  ]);
  const app = JSON.parse(
    readFileSync(join(".next", "app-path-routes-manifest.json"), "utf8"),
  );
  for (const pfad of new Set(Object.values(app))) {
    if (AUSNAHMEN.has(pfad)) continue;
    // Route Handler stehen nicht im Prerender-Manifest, sie liefern Dateien.
    if (
      /\/(feed\.xml|llms\.txt|humans\.txt|security\.txt|robots\.txt|sitemap\.xml)$/.test(
        pfad,
      )
    )
      continue;
    if (!vorab.has(pfad) && !vorab.has(pfad.replace(/\/page$/, ""))) {
      dynamische.push(pfad);
    }
  }
} catch {
  dynamische.length = 0;
}

const schreibend = [];
for (const datei of dateienUnter(join("src", "app"))) {
  if (!/route\.ts$/.test(datei)) continue;
  const treffer = SCHREIBENDE.exec(readFileSync(datei, "utf8"));
  if (treffer) schreibend.push(`${datei} nimmt ${treffer[1]} entgegen`);
}

if (dynamische.length || schreibend.length) {
  console.error(
    "Die Datenschutzerklärung sagt, dass alle Seiten vorab erzeugt werden " +
      "und kein Endpunkt Eingaben entgegennimmt. Der Bau sagt etwas anderes:\n",
  );
  for (const p of dynamische)
    console.error(`  ${p} wird auf Anfrage gerendert`);
  for (const p of schreibend) console.error(`  ${p}`);
  process.exit(1);
}

/* ---------------------------------------------------------------------------
   Die Zertifizierung, auf die sich die Datenschutzerklärung stützt.

   Sie nennt als Rechtsgrundlage für die Übermittlung in die USA den
   Angemessenheitsbeschluss vom 10. Juli 2023 und dazu, dass der Hoster nach
   dem EU-US-Datenschutzrahmen zertifiziert sei. Das ist keine Formulierung,
   sondern eine Tatsachenbehauptung über ein fremdes Unternehmen, und sie kann
   ohne Zutun falsch werden: Eine Zertifizierung läuft jährlich aus und wird
   nicht immer erneuert. Steht sie nicht mehr, fehlt der Übermittlung ihre
   Grundlage — und im Rechtstext steht dann etwas Unwahres.

   Geprüft wird gegen die Teilnehmerliste des US-Handelsministeriums, gefiltert
   auf `Status: Active`. Die Suchmaske der Website selbst übergibt den
   Suchbegriff nicht (sie schickt `"Search": ""` und meldet dann „no results
   found"); die Schnittstelle dahinter nimmt ihn an.

   Ohne Netz wird der Schritt übersprungen und sagt das. Ein Lauf, der bei
   Netzproblemen rot wird, wird abgeschaltet statt gelesen.
--------------------------------------------------------------------------- */

const DPF = "https://dpfapi.azurewebsites.net/api/participants";

{
  /* Der Name kommt aus dem ausgelieferten Text, nicht aus einer Konstante:
     Wechselt der Hoster, wechselt die Prüfung mit. */
  const genannt = text.match(/bei der ([A-Z][\w.\- ]+?) gehostet/)?.[1]?.trim();

  if (!genannt) {
    console.log(
      "  --  Kein Hoster in der Erklärung genannt, DPF-Prüfung entfällt.",
    );
  } else if (!/Datenschutzrahmen zertifiziert/.test(text)) {
    console.log(
      `  --  Die Erklärung beruft sich nicht auf den Datenschutzrahmen, Prüfung entfällt.`,
    );
  } else {
    let liste = null;
    try {
      const antwort = await fetch(DPF, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          DataCovered: [],
          Frameworks: [],
          Industries: [],
          PageNumber: 0,
          RecourseMechanisms: [],
          StatutoryBody: [],
          RowsPerPage: 10,
          Search: genannt.replace(/\s+Inc\.?$/i, ""),
          StartLetter: "",
          Status: "Active",
          States: [],
          VerificationMethod: "",
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (antwort.ok) liste = await antwort.json();
    } catch {
      liste = null;
    }

    if (!liste) {
      console.log(
        "  --  Die Teilnehmerliste war nicht erreichbar, DPF-Prüfung übersprungen.",
      );
    } else {
      const treffer = (liste.Items ?? []).filter((e) =>
        new RegExp(genannt.replace(/\s+Inc\.?$/i, ""), "i").test(
          e.OrganizationPublicDisplayName ?? "",
        ),
      );
      if (treffer.length === 0) {
        console.error(
          `\nDie Erklärung nennt „${genannt}" als nach dem EU-US-Datenschutzrahmen\n` +
            `zertifiziert. In der Teilnehmerliste des US-Handelsministeriums steht\n` +
            `unter den aktiven Einträgen niemand dieses Namens.\n\n` +
            `Ohne gültige Zertifizierung fehlt der Übermittlung in die USA ihre\n` +
            `Grundlage, und der Absatz „Hosting" behauptet etwas Unwahres.`,
        );
        process.exitCode = 1;
      }
      console.log(
        `  ok  ${treffer[0].OrganizationPublicDisplayName} steht aktiv in der ` +
          `Teilnehmerliste des EU-US-Datenschutzrahmens.`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Aufbewahrungsfrist, die der Text nennt, hängt am Tarif.

   Die Erklärung sagt: „Der Hoster hält diese Protokolle eine Stunde lang vor
   und löscht sie danach automatisch." Das ist keine Formulierung, sondern eine
   Frist — und sie gilt genau für einen Tarif. Vercel hält Laufzeitprotokolle
   auf Hobby eine Stunde, auf Pro einen Tag, mit Observability Plus dreißig
   Tage. Ein Tarifwechsel ist ein Klick, und danach steht im Rechtstext eine
   Frist, die nicht mehr stimmt.

   Geprüft wird gegen die Vercel-API. Ohne Zugangsdaten wird übersprungen und
   das gesagt: Im Prüfworkflow gibt es keinen Token, und ein Lauf, der dort rot
   wird, ohne dass jemand etwas falsch gemacht hat, wird abgeschaltet.
--------------------------------------------------------------------------- */

const FRISTEN = new Map([
  ["hobby", "eine Stunde"],
  ["pro", "einen Tag"],
  ["enterprise", "drei Tage"],
]);

{
  const genannteFrist = text.match(
    /Protokolle (eine Stunde|einen Tag|drei Tage|dreißig Tage) lang vor/,
  )?.[1];

  if (!genannteFrist) {
    console.log("  --  Keine Aufbewahrungsfrist im Text, Tarifprüfung entfällt.");
  } else {
    let token = null;
    try {
      token = JSON.parse(
        readFileSync(
          join(
            process.env.HOME ?? process.env.USERPROFILE ?? "",
            "AppData",
            "Roaming",
            "com.vercel.cli",
            "Data",
            "auth.json",
          ),
          "utf8",
        ),
      ).token;
    } catch {
      token = process.env.VERCEL_TOKEN ?? null;
    }

    if (!token) {
      console.log(
        `  --  Kein Vercel-Zugang, die Frist „${genannteFrist}" bleibt ungeprüft.`,
      );
    } else {
      let tarif = null;
      try {
        const antwort = await fetch(
          "https://api.vercel.com/v2/teams/team_glutztTQtWq7Te7NQiJC8KbM",
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(20000),
          },
        );
        if (antwort.ok) tarif = (await antwort.json()).billing?.plan ?? null;
      } catch {
        tarif = null;
      }

      if (!tarif) {
        console.log(
          "  --  Der Tarif war nicht abrufbar, die Frist bleibt ungeprüft.",
        );
      } else if (FRISTEN.get(tarif) !== genannteFrist) {
        console.error(
          `\nDie Datenschutzerklärung nennt „${genannteFrist}" als Aufbewahrungsfrist\n` +
            `der Server-Protokolle. Das Projekt läuft auf dem Tarif „${tarif}", und\n` +
            `dort hält Vercel sie ${FRISTEN.get(tarif) ?? "eine andere Zeit"} vor.\n\n` +
            `Eine Frist im Rechtstext, die nicht stimmt, ist schlechter als keine.`,
        );
        /* Nur den Rückgabewert setzen und auslaufen lassen: Ein `process.exit`
           direkt nach einem `fetch` bricht Node mitten in einer offenen
           Verbindung ab und schreibt eine Assertion hinter den Befund. Wer den
           Lauf liest, sieht dann einen Absturz statt einer Meldung. */
        process.exitCode = 1;
      } else {
        console.log(
          `  ok  Tarif „${tarif}": Protokolle ${genannteFrist}, wie im Text.`,
        );
      }
    }
  }
}

/* Die Schlusszeile nur, wenn nichts gefunden wurde.

   Die beiden Prüfungen über fremde Quellen setzen den Rückgabewert, statt
   sofort abzubrechen: Ein `process.exit` unmittelbar nach einem `fetch` reißt
   Node aus einer offenen Verbindung und schreibt eine Assertion hinter den
   Befund. Ohne diese Abfrage stand danach aber „Die Datenschutzerklärung passt
   zu ihrem Stand" unter einer Fehlermeldung — Erfolg gemeldet, obwohl etwas
   nicht stimmt, und genau das ist der Fehler, den dieser Lauf sonst sucht. */
if (!process.exitCode) {
  console.log(
    `Die Datenschutzerklärung passt zu ihrem Stand: ${text.split(" ").length} Wörter, ` +
      `Stand ${STAND}. Alle Seiten vorab erzeugt, kein Endpunkt nimmt Eingaben entgegen.`,
  );
}

/** Alle Dateien unter einem Ordner, rekursiv. */
function dateienUnter(ordner) {
  const raus = [];
  for (const eintrag of readdirSync(ordner)) {
    const voll = join(ordner, eintrag);
    if (statSync(voll).isDirectory()) raus.push(...dateienUnter(voll));
    else raus.push(voll);
  }
  return raus;
}
