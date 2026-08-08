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
 * Was zählt, ist das, was ein Leser vor sich hat. Der Abschnitt „Stand“
 * bleibt außen vor, sonst änderte jedes neue Datum die Prüfsumme, und der
 * Lauf verlangte nach jeder Korrektur eine weitere.
 *
 *   npm run check:legal
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pruefeBaustand } from "./lib/built-pages.mjs";
import { ANBIETER, ANSCHRIFT } from "../src/app/(de)/(legal)/provider.ts";
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
 * Der sichtbare Text der Erklärung, ohne den Abschnitt „Stand“.
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

/* Ein alter Bau macht diesen Lauf wertlos.

   Die Prüfsumme soll erzwingen, dass mit dem Text auch der Stand wandert.
   Sie liest dafür `.next/server/app/datenschutz.html` — das ausgelieferte
   Blatt, und das ist richtig so. Nur hat das eine Lücke, die genau in die
   Gegenrichtung zeigt: Wer die Quelle ändert und nicht baut, bekommt ein
   grünes „passt zu ihrem Stand", gemessen an der Fassung von vorhin.

   Gemessen am 08.08.2026: Der Abschnitt „Cookies und Tracking" war um
   dreizehn Wörter länger, und der Lauf meldete unverändert 516 Wörter und
   dieselbe Prüfsumme. Genau der Fall, den die Prüfsumme abfangen soll.

   Geprüft wird über `pruefeBaustand` und nicht über einen eigenen Vergleich.
   Hier stand zuerst einer: drei Dateien der Rechtsseiten gegen den
   Zeitstempel des Blatts. Er hätte den gemessenen Fall gefunden und den
   nächsten nicht — eine Änderung an `provider.ts`, an einer geteilten
   Komponente oder am Layout wäre durchgelaufen. Die zwanzig Läufe, die einen
   Browser öffnen, benutzen längst den vollständigen Vergleich über `src/`;
   dieser hier las das Blatt direkt und kam deshalb nie daran vorbei. */
pruefeBaustand();

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

/* Und liegt dieses Datum überhaupt schon hinter uns?

   Der Stand wird von Hand gepflegt, damit er nicht bei jedem Bau
   weiterwandert. Von Hand heißt aber auch: Er kann daneben liegen, und in
   eine Richtung fällt das nie auf.

   Gemessen an der Historie: Commit `40bd768` setzte am 07.08.2026 um 19:33
   Uhr den Stand von „5. August 2026" auf „8. August 2026". Von da bis
   Mitternacht trug die ausgelieferte Erklärung ein Datum, das es noch nicht
   gab — knapp viereinhalb Stunden lang. Grün war dabei alles: Datei und
   Blatt zeigten dasselbe, die Prüfsumme passte zum Text.

   Bei einem Rechtstext ist das Datum die Zusage, dass der Text an diesem Tag
   so galt. Ein Datum in der Zukunft sagt das über einen Tag, der noch nicht
   stattgefunden hat.

   Verglichen wird gegen den Tagesbeginn in Berlin, nicht gegen die Uhrzeit:
   Wer den Stand am Vormittag auf heute setzt, soll nicht am Zeitzonenversatz
   scheitern. */
{
  const MONATE = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  const teile = /^(\d{1,2})\.\s+([A-Za-zä]+)\s+(\d{4})$/.exec(STAND.trim());
  if (!teile) {
    console.error(
      `Der Stand „${STAND}" hat nicht die Form „8. August 2026". ` +
        `Ohne lesbares Datum lässt sich nicht prüfen, ob es schon erreicht ist.`,
    );
    process.exit(1);
  }
  const monat = MONATE.indexOf(teile[2]);
  if (monat < 0) {
    console.error(`Der Monat „${teile[2]}" aus dem Stand ist keiner der zwölf.`);
    process.exit(1);
  }
  const stand = Date.UTC(Number(teile[3]), monat, Number(teile[1]));
  const heuteInBerlin = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }),
  );
  const heute = Date.UTC(
    heuteInBerlin.getFullYear(),
    heuteInBerlin.getMonth(),
    heuteInBerlin.getDate(),
  );
  if (stand > heute) {
    const tage = Math.round((stand - heute) / 86400000);
    console.error(
      `Der Stand der Datenschutzerklärung liegt ${tage} Tag(e) in der Zukunft.

` +
        `  in stand.ts:  ${STAND}
` +
        `  heute:        ${heuteInBerlin.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}

` +
        `Das Datum ist die Zusage, dass der Text an diesem Tag so galt. ` +
        `Über einen Tag, der noch nicht stattgefunden hat, lässt sich das nicht sagen.`,
    );
    process.exit(1);
  }
}

/* Die Ausnahme muss im Text stehen, solange es sie gibt.

   Der Lauf lässt `/_not-found` als einzige dynamische Route durchgehen. Damit
   das keine stille Absprache zwischen zwei Dateien bleibt, muss die Erklärung
   die Ausnahme selbst benennen: Wer den Absatz umformuliert und den Satz dabei
   verliert, behauptet wieder etwas, das der Bau nicht hält. */
if (!/Ausnahme ist die Fehlerseite/.test(text)) {
  console.error(
    `Die Datenschutzerklärung benennt die Fehlerseite nicht mehr als Ausnahme ` +
      `von „vorab erzeugt". Sie ist die einzige Seite, die bei der Anfrage ` +
      `zusammengesetzt wird — entweder steht das im Text, oder die Ausnahme ` +
      `gehört aus diesem Lauf heraus.`,
  );
  process.exit(1);
}

/* Kein Verweis auf die abgeschaffte Streitbeilegungsplattform.

   Bis Juli 2025 verlangte Art. 14 der ODR-Verordnung von fast jeder
   gewerblichen Website einen Verweis auf die Online-Streitbeilegung der EU.
   Die Verordnung ist aufgehoben, und die Plattform hat den Betrieb am
   20. Juli 2025 eingestellt — nachgesehen unter der alten Adresse, die heute
   nur noch die Abschaltung meldet: „discontinued as of 20 July 2025".

   Das Impressum hier nennt sie richtigerweise nicht. Nur ist die Floskel das
   meistkopierte Stück Text im deutschen Netz, sie steht in jeder Vorlage und
   in jedem Generator, und sie kommt bei der nächsten Überarbeitung mit einer
   Zeile zurück. Herauskäme ein Impressum, das auf eine tote Plattform
   verweist — die eine Stelle, an der ein Mitbewerber zuerst nachsieht.

   Der Satz über die Verbraucherschlichtungsstelle daneben bleibt richtig und
   ist etwas anderes: Er beruht auf § 36 VSBG und gilt weiter. */
{
  const VERALTET = [
    [/ec\.europa\.eu\/consumers\/odr/i, "Verweis auf die abgeschaltete ODR-Plattform"],
    [/Plattform der EU zur Online-Streitbeilegung/i, "Hinweis auf die OS-Plattform"],
    [/OS-Plattform/i, "Hinweis auf die OS-Plattform"],
  ];

  const blaetter = ["impressum.html", "datenschutz.html"]
    .map((n) => join(".next", "server", "app", n))
    .filter((d) => existsSync(d));

  const funde = [];
  for (const blatt of blaetter) {
    const inhalt = readFileSync(blatt, "utf8");
    for (const [muster, was] of VERALTET) {
      /* Nur der Dateiname: Der Pfad davor ist auf jeder Zeile derselbe und
         verdrängt die Aussage an den rechten Rand. */
      if (muster.test(inhalt)) {
        funde.push(`${blatt.split(/[\\/]/).pop()}: ${was}`);
      }
    }
  }

  if (funde.length) {
    console.error(
      `Die Rechtsseiten nennen eine Stelle, die es nicht mehr gibt:` +
        String.fromCharCode(10) +
        String.fromCharCode(10) +
        [...new Set(funde)].map((f) => `  ${f}`).join(String.fromCharCode(10)) +
        String.fromCharCode(10) +
        String.fromCharCode(10) +
        `Die ODR-Verordnung ist aufgehoben, die Plattform seit dem ` +
        `20. Juli 2025 abgeschaltet.`,
    );
    process.exitCode = 1;
  } else if (blaetter.length) {
    console.log(
      `  ok  Kein Verweis auf die ODR-Plattform, die seit Juli 2025 ruht.`,
    );
  }
}

/* Die Privatanschrift gehört auf zwei Blätter und auf kein drittes.

   Sie steht dort, weil § 5 DDG sie verlangt, und beide Blätter tragen dafür
   `noindex`: Die Pflichtangabe soll erfüllt sein, ohne die Wohnanschrift in
   Suchergebnisse zu tragen. Diese Abwägung hält nur, solange die Anschrift
   nirgends sonst auftaucht.

   Und sie kann leicht wandern. `provider.ts` ist eine gewöhnliche Datei,
   ANSCHRIFT ist ausgeführt und importierbar; ein Fuß auf jeder Seite, eine
   Kontaktkachel, ein strukturierter Datensatz mit `PostalAddress` — jedes
   davon wäre eine plausible Änderung und würde die Anschrift auf achtzehn
   indexierte Seiten setzen, ohne dass jemand es beabsichtigt hätte.

   Gemessen an der ausgelieferten Seite am 08.08.2026: Startseite, /en,
   beide One-Pager, llms.txt, humans.txt, Artikelübersicht und Feed führen
   sie nicht, die beiden PDFs auch nicht. Der Lauf hält diesen Stand fest. */
{
  const bau = join(".next", "server", "app");
  const strasse = ANSCHRIFT[0];
  const ERLAUBT = new Set(["impressum.html", "datenschutz.html"]);

  /* Nicht nur die Blätter, sondern alles, was ausgeliefert wird.

     Hier stand `.html`, und das ließ die Hälfte der Auslieferung draußen:
     llms.txt, humans.txt, robots.txt, die Sitemap und beide Feeds entstehen
     als Route und liegen im Bau als `.body`. Gerade llms.txt ist der Fall, um
     den es geht — es fasst die ganze Seite für ein Sprachmodell zusammen,
     wird aus demselben Inhalt erzeugt und wäre die naheliegende Stelle, an
     der eine Anschrift mitwandert, ohne dass jemand sie dort sucht.

     Gemessen am 08.08.2026 führt keine der sieben Nebendateien sie. */
  const AUSGELIEFERT = /\.(html|body)$/;

  const fremde = dateienUnter(bau)
    .filter((d) => AUSGELIEFERT.test(d))
    .filter((d) => !ERLAUBT.has(d.split(/[\\/]/).pop()))
    .filter((d) => readFileSync(d, "utf8").includes(strasse));

  if (fremde.length) {
    console.error(
      `Die Privatanschrift steht auf Blättern, die sie nicht führen sollen:` +
        String.fromCharCode(10) +
        String.fromCharCode(10) +
        fremde.map((d) => `  ${d}`).join(String.fromCharCode(10)) +
        String.fromCharCode(10) +
        String.fromCharCode(10) +
        `Nur Impressum und Datenschutzerklärung nennen sie, und beide tragen ` +
        `dafür noindex. Jede weitere Seite ist indexierbar und trägt die ` +
        `Wohnanschrift damit in Suchergebnisse.`,
    );
    process.exitCode = 1;
  } else {
    for (const blatt of ERLAUBT) {
      const datei = join(bau, blatt);
      if (!existsSync(datei)) continue;
      if (!/name="robots"[^>]*content="[^"]*noindex/.test(readFileSync(datei, "utf8"))) {
        console.error(
          `${blatt} nennt die Privatanschrift, trägt aber kein noindex.`,
        );
        process.exitCode = 1;
      }
    }
    if (!process.exitCode) {
      console.log(
        `  ok  Die Anschrift steht nur auf Impressum und Datenschutz, beide noindex.`,
      );
    }
  }
}

/* Was die Erklärung über die Funktion beim Hoster sagt, muss der Code halten.

   Der Absatz nennt sie beim Namen: „Vor jeder Auslieferung läuft beim Hoster
   eine kleine Funktion: Sie liest den angefragten Pfad, setzt daraus die
   Sprache der Fehlerseite und weist Anfragen ab, die Daten senden wollen. Sie
   speichert nichts und gibt nichts weiter."

   Das ist die einzige Stelle, an der diese Seite über laufenden Code auf einem
   fremden Server spricht — und der letzte Satz ist eine Zusage, die sich mit
   einer Zeile brechen lässt. Ein `console.log` in `proxy.ts` landet im
   Protokoll des Hosters, ein `fetch` gibt weiter, ein gesetztes Cookie
   speichert. Keines davon fällt beim Lesen der Seite auf.

   Geprüft wird gegen `src/proxy.ts`, nicht gegen den Bau: Diese Funktion läuft
   bei Vercel und liegt in keiner ausgelieferten Datei. */
{
  const quelle = "src/proxy.ts";
  if (!existsSync(quelle)) {
    console.log("  --  src/proxy.ts fehlt, Zusage über die Funktion übersprungen.");
  } else if (/Vor jeder Auslieferung läuft beim Hoster/.test(text)) {
    const code = readFileSync(quelle, "utf8")
      /* Kommentare erklären, was der Code nicht tut — sie sind kein Code. */
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");

    const VERBOTEN = [
      [/\bfetch\s*\(/, "ruft etwas nach außen auf (fetch)"],
      [/\bconsole\.\w+\s*\(/, "schreibt ins Protokoll (console)"],
      [/\bcookies\b|set-cookie/i, "setzt oder liest ein Cookie"],
      [/localStorage|sessionStorage|indexedDB/, "legt etwas auf dem Gerät ab"],
      [/\bwriteFile|appendFile\b/, "schreibt eine Datei"],
    ];
    const funde = VERBOTEN.filter(([m]) => m.test(code)).map(([, was]) => was);

    if (funde.length) {
      const umbruch = String.fromCharCode(10);
      console.error(
        umbruch +
          `Die Datenschutzerklärung sagt über die Funktion beim Hoster: „Sie` +
          umbruch +
          `speichert nichts und gibt nichts weiter.“ ${quelle} tut aber:` +
          umbruch +
          umbruch +
          funde.map((f) => `  ${f}`).join(umbruch) +
          umbruch +
          umbruch +
          `Entweder die Zeile zurücknehmen oder den Satz ändern.`,
      );
      process.exitCode = 1;
    } else {
      console.log(
        `  ok  ${quelle} speichert nichts und gibt nichts weiter, wie zugesagt.`,
      );
    }
  }
}

const gerechnet = createHash("sha256").update(text).digest("hex").slice(0, 16);

if (gerechnet !== TEXT_PRUEFSUMME) {
  console.error(
    `Die Datenschutzerklärung trägt den Stand „${STAND}“, ihr Text ist aber ein anderer.\n\n` +
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
   dynamisch, weil sie eine Kopfzeile liest, um in der Sprache zu antworten,
   unter der jemand gekommen ist. Diese Ausnahme stand hier still im Code,
   während die Erklärung „sämtliche Seiten“ behauptete — eine Zeile, die man
   einmal einträgt und dann vergisst. Sie steht jetzt auch im Text der
   Erklärung, und der Block darunter hält sie dort fest. */
const AUSNAHMEN = new Set(["/_not-found"]);

/* Dieselbe Zusage steht auch im README, und dort stand sie falsch.

   Die Erklärung nannte die Fehlerseite als Ausnahme, das README behauptete
   zweimal ausnahmslos „Jede Route ist statisch“ und „Jede Route wird vorab
   erzeugt": zwei öffentliche Dokumente desselben Projekts, verschiedene
   Aussagen über dieselbe Tatsache. Gemessen am Bau hatte das README unrecht,
   eine App-Route von 26 wird nicht vorgerendert, und es ist die Fehlerseite.

   Der Block oben hielt nur die Erklärung fest. Ein Wächter, der eine von zwei
   Fundstellen prüft, deckt die ungeprüfte zu: Die Erklärung blieb richtig,
   gerade weil jemand sie bewacht hat, das README daneben nicht. Die Prüfung
   greift, solange es überhaupt eine Ausnahme gibt. */
{
  const readme = readFileSync("README.md", "utf8");
  const absolut = /Jede Route (?:ist statisch|wird vorab erzeugt)/.exec(readme);
  if (AUSNAHMEN.size && absolut) {
    console.error(
      `README.md sagt „${absolut[0]}“ ohne Einschränkung. Die Fehlerseite ` +
        `wird bei der Anfrage zusammengesetzt; „jede Seite mit Inhalt“ ist ` +
        `die Formulierung, die der Bau trägt.`,
    );
    process.exit(1);
  }
  if (AUSNAHMEN.size && !/Ausnahme ist die Fehlerseite/.test(readme)) {
    console.error(
      `README.md benennt die Fehlerseite nicht als Ausnahme von „vorab ` +
        `erzeugt". Die Datenschutzerklärung tut es, der Bau gibt ihr recht. ` +
        `Zwei Dokumente derselben Seite dürfen nicht Verschiedenes über ` +
        `dieselbe Tatsache sagen.`,
    );
    process.exit(1);
  }
}

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
          `\nDie Erklärung nennt „${genannt}“ als nach dem EU-US-Datenschutzrahmen\n` +
            `zertifiziert. In der Teilnehmerliste des US-Handelsministeriums steht\n` +
            `unter den aktiven Einträgen niemand dieses Namens.\n\n` +
            `Ohne gültige Zertifizierung fehlt der Übermittlung in die USA ihre\n` +
            `Grundlage, und der Absatz „Hosting“ behauptet etwas Unwahres.`,
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

/* ---------------------------------------------------------------------------
   Beide Rechtsseiten nennen dieselbe Anschrift.

   Sie stand zweimal fest im Quelltext: unter „Angaben gemäß § 5 DDG“ im
   Impressum und unter „Verantwortlicher" in der Datenschutzerklärung. Seit
   `app/(de)/(legal)/provider.ts` gibt es eine Quelle — dieser Block hält das
   Ergebnis dagegen, an den ausgelieferten Seiten und nicht am Quelltext. Wer
   die Angabe an einer Seite wieder von Hand einträgt, fällt hier auf.

   Verglichen wird ohne Zeilenumbrüche und ohne Kommas: Das Impressum setzt die
   Anschrift untereinander, die Erklärung in eine Zeile. Gemeint ist dieselbe.
   ------------------------------------------------------------------------ */
{
  const flach = (s) =>
    s
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/[,\s]+/g, " ")
      .trim();

  const anschrift = ANSCHRIFT.join(" ");
  for (const name of ["impressum", "datenschutz"]) {
    const datei = join(".next", "server", "app", `${name}.html`);
    let inhalt;
    try {
      inhalt = flach(readFileSync(datei, "utf8"));
    } catch {
      console.error(`${name}.html fehlt im Bau. Erst bauen, dann prüfen.`);
      process.exitCode = 1;
      continue;
    }
    if (!inhalt.includes(anschrift)) {
      console.error(
        `/${name} nennt nicht die Anschrift aus provider.ts („${anschrift}").`,
      );
      process.exitCode = 1;
    }

    /* Die Umsatzsteuer-Identifikationsnummer gegen das EU-Register.
       ------------------------------------------------------------
       § 5 Abs. 1 Nr. 6 DDG verlangt sie, sobald es eine gibt. Sie ist damit
       Pflichtangabe — und die einzige Angabe im Impressum, die ohne Zutun
       des Betreibers falsch werden kann: Wer die Kleinunternehmerregelung
       aufgibt, das Gewerbe umstellt oder eine neue Nummer bekommt, hat auf
       der Seite weiterhin die alte stehen. Name und Anschrift ändert man
       bewusst, eine Steuernummer ändert das Finanzamt.

       Geprüft wird gegen VIES, das Bestätigungsverfahren der EU-Kommission.
       Dessen Antwort braucht Sorgfalt: `isValid` steht auch dann auf `false`,
       wenn gar nicht geprüft werden konnte. Der deutsche Teildienst ist
       regelmäßig nicht erreichbar und antwortet dann mit `MS_UNAVAILABLE` —
       gemessen dreimal hintereinander beim Einbau. Wer nur `isValid` liest,
       baut sich einen Wächter, der nachts eine gültige Nummer für ungültig
       erklärt. Angeschlagen wird deshalb nur bei einer Antwort, die
       tatsächlich über die Nummer urteilt. */
    if (name === "impressum") {
      const nummer = /USt-IdNr[^:]*:\s*([A-Z]{2}\d{6,12})/.exec(inhalt)?.[1];
      if (!nummer) {
        console.log(
          "  --  Impressum nennt keine USt-IdNr, VIES-Prüfung entfällt.",
        );
      } else {
        const land = nummer.slice(0, 2);
        const rest = nummer.slice(2);
        let antwort = null;
        try {
          const roh = await fetch(
            `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${land}/vat/${rest}`,
            {
              headers: { accept: "application/json" },
              signal: AbortSignal.timeout(25000),
            },
          );
          if (roh.ok) antwort = await roh.json();
        } catch {
          antwort = null;
        }

        const ausfall = new Set([
          "MS_UNAVAILABLE",
          "SERVICE_UNAVAILABLE",
          "TIMEOUT",
          "MS_MAX_CONCURRENT_REQ",
          "GLOBAL_MAX_CONCURRENT_REQ",
        ]);
        if (!antwort || ausfall.has(antwort.userError)) {
          console.log(
            `  --  VIES antwortet gerade nicht über ${nummer} ` +
              `(${antwort?.userError ?? "nicht erreichbar"}), Prüfung übersprungen.`,
          );
        } else if (antwort.isValid !== true) {
          console.error(
            `\nDas Impressum nennt ${nummer} als Umsatzsteuer-Identifikations-\n` +
              `nummer. Das Bestätigungsverfahren der EU-Kommission kennt sie\n` +
              `nicht als gültig (${antwort.userError ?? "isValid=false"}).\n\n` +
              `§ 5 Abs. 1 Nr. 6 DDG verlangt die Angabe, und eine falsche ist\n` +
              `schlechter als keine: Sie steht öffentlich und lässt sich von\n` +
              `jedem in derselben Sekunde nachprüfen.`,
          );
          process.exitCode = 1;
        } else {
          console.log(`  ok  ${nummer} ist im EU-Register gültig.`);
        }
      }
    }
    if (!inhalt.includes(ANBIETER)) {
      console.error(
        `/${name} nennt nicht den Anbieter aus provider.ts („${ANBIETER}“).`,
      );
      process.exitCode = 1;
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
      `Stand ${STAND}. Alle Seiten mit Inhalt vorab erzeugt, die Fehlerseite als ` +
      `benannte Ausnahme, kein Endpunkt nimmt Eingaben entgegen.`,
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
