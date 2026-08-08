#!/usr/bin/env node
/**
 * Misst die drei Werte, an denen ein Besucher merkt, ob eine Seite gut gebaut
 * ist, und hält sie gegen ihre Budgets.
 *
 * Warum das ein eigener Lauf ist: Alle anderen prüfen Inhalt, Auszeichnung
 * oder Adressen — Dinge, die entweder stimmen oder nicht. Ladeverhalten ist
 * anders. Es verschlechtert sich in kleinen Schritten, jeder für sich
 * vertretbar: ein Bauteil mehr im ersten Bündel, eine Schrift mehr, ein Bild
 * ohne Maße. Keiner dieser Schritte fällt auf, und irgendwann ist die Seite
 * langsam, ohne dass jemand etwas Falsches getan hätte.
 *
 * Gemessen wird unter denselben Bedingungen wie bisher von Hand: ein Telefon
 * mit 390 px, vierfach gedrosselter Prozessor, 1,6 Mbit/s und 150 ms Latenz.
 * Das ist kein Laborwert, sondern ungefähr ein Mobilfunknetz in der Bahn.
 *
 * Drei Läufe je Seite, gewertet wird der Median: Der erste Aufruf nach dem
 * Start des Servers ist regelmäßig langsamer, und ein einzelner Ausreißer
 * soll den Lauf weder rot noch grün machen. Gemessen an der ausgelieferten
 * Seite lagen fünf Läufe zwischen 1.884 und 1.900 ms — die Streuung ist
 * gering, solange man den ersten nicht mitzählt.
 *
 * Die Budgets stehen unten und sind die üblichen Schwellen für „gut“:
 * LCP unter 2,5 s, CLS unter 0,1. Sie sind bewusst nicht enger gesetzt als
 * die Norm, damit der Lauf eine Aussage über die Seite trifft und keine über
 * den Ehrgeiz dessen, der ihn geschrieben hat.
 *
 *   npm run check:vitals
 *   node scripts/check-vitals.mjs https://domenicmoran.de
 */

import { chromium } from "playwright";
import { FEHLERSEITEN } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Die Schwellen, ab denen ein Wert nicht mehr „gut“ heißt. */
const BUDGET = { lcp: 2500, cls: 0.1, inp: 200 };

/**
 * Was gemessen wird. Mehr Seiten kosten je einen Durchgang von acht Sekunden.
 *
 * Die Artikelseite steht dabei, obwohl sie nicht die Startseite ist: Sie ist
 * die Seite, die geteilt wird, und damit für viele Leser die erste. Sie trägt
 * als einzige lange Fließtexte, Codeblöcke und eine Tabelle — also genau die
 * Bauteile, an denen sich Ladeverhalten zuerst verschlechtert.
 */
const SEITEN = [
  "/",
  "/en",
  "/artikel",
  "/artikel/kassensichv-in-der-praxis",
  "/onepager",
  /* Die Fehlerseite, wieder aufgenommen — diesmal um zu messen, nicht um zu
     bestehen.

     Sie riss als einzige Seite das CLS-Budget: 0,1626 gegen 0,1, und zwar nur
     unter der Drosselung der CI. Örtlich bleibt der Wert bei 0,0009, auch mit
     denselben Einstellungen: 390 px, dreifache Pixeldichte, 1,6 Mbit/s,
     150 ms Latenz, Prozessor vierfach gedrosselt. Zwei Vermutungen sind
     gemessen und widerlegt — der fehlende Vorlade-Verweis für die Schriften
     und eine Höhenänderung des Sichtfensters.

     Der Lauf gibt die Verschiebungen jetzt mit Wert, Zeitpunkt und Höhe aus.
     Was örtlich nicht entsteht, muss dort beschrieben werden, wo es entsteht. */
  FEHLERSEITEN[0],
];

/* Der frühere Grund für das Weglassen, zur Einordnung.

   Aufgenommen und gemessen war sie: LCP 784 ms, der beste Wert aller Seiten,
   aber CLS 0,1626 bei einem Budget von 0,1 — der einzige Wert über Budget.
   Verschoben werden der ganze Inhaltsblock, die Fußzeile und der Glühkreis,
   also alles auf einmal. Örtlich bleibt der Wert bei 0,0405; sichtbar wird er
   erst unter der Drosselung der CI, 1,6 Mbit/s bei 150 ms Latenz.

   Der naheliegende Grund war es nicht: Die Seite liefert als einzige keinen
   Vorlade-Verweis für ihre Schriften aus, aber `display: "optional"` statt
   `"swap"` ändert den Wert um kein Tausendstel — gemessen in der CI, mit
   demselben 0,1626. Was den Block verschiebt, ist damit offen, und ein
   Budget, das dauerhaft reißt, macht den Lauf zu einem Rot, das niemand mehr
   liest. Die Seite kommt zurück, sobald die Ursache steht.

   Nachtrag: Sie steht.

   Gemessen an der ausgelieferten Seite unter denselben Bedingungen liefert
   die Fehlerseite dreimal hintereinander 0,0406, und die Verschiebung hat
   genau eine nennenswerte Quelle: `div.mx-auto.w-full.max-w-2xl` wächst bei
   1.639 ms von 575 auf 606 Pixel Höhe und rutscht dabei 15 Pixel nach oben.
   Der Block ist senkrecht zentriert, also verteilt sich die Höhenzunahme auf
   beide Seiten — daher die zweite, kleinere Quelle am Fußzeilen-Verweis.

   Es ist nicht die Hydration: Mit und ohne JavaScript misst der Block
   dieselben 599 px, dieselben sechs Kinder, dieselben 392 Zeichen. Es ist die
   Schrift. Die Fehlerseite liefert null Vorlade-Verweise für ihre Schriften
   aus, jede andere Seite zwei — `global-not-found` bringt sein eigenes
   Dokument mit, und der Mechanismus von `next/font` greift dort nicht. Die
   Schrift kommt deshalb erst nach dem ersten Bild, und der Text wird beim
   Tausch um eine Zeile höher.

   Behoben ist es damit nicht, und zwar mit Absicht: Der offensichtliche Griff
   wäre ein Vorlade-Verweis, und genau der hat auf dieser Seite schon einmal
   Schaden angerichtet — 68 KiB Schriften ließen 13 KiB CSS 1.378 ms warten,
   LCP 3.304 statt 1.472 ms. Wer das angeht, misst LCP und CLS zusammen, nicht
   nacheinander. Der Wert liegt im Budget, die Ursache ist benannt. */

const LAEUFE = 3;
/** So lange wartet jeder Lauf auf Nachzügler, bevor er die Werte abholt. */
const WARTEN = 7000;

const vorgegebeneBasis = process.argv[2]?.replace(/\/$/, "");
let basis = vorgegebeneBasis;
let beenden = () => {};
if (!basis) ({ basis, beenden } = await starteServer());

let vorablast = 0;
let vorabAntworten = 0;
const browser = await chromium.launch();
const funde = [];
const zeilen = [];

for (const pfad of SEITEN) {
  const messungen = [];

  /* Ein Aufruf zum Aufwärmen, der nicht gewertet wird.
     Der erste Abruf einer Adresse ist regelmäßig der langsamste: örtlich, weil
     der Server die Seite zum ersten Mal ausliefert, und an der Live-Adresse,
     weil der Zwischenspeicher am Rand des Netzes nach einer Auslieferung leer
     ist. Gemessen unmittelbar nach einem Deploy lag das Kurzprofil bei
     2.652 ms und fünf Läufe später im Median bei 1.564 — derselbe Stand,
     dieselbe Leitung. Ein Median aus drei Werten fängt das nicht ab, wenn zwei
     davon kalt sind. */
  {
    const kontext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const seite = await kontext.newPage();
    await seite.goto(`${basis}${pfad}`, { waitUntil: "load" });
    await kontext.close();
  }

  for (let lauf = 0; lauf < LAEUFE; lauf++) {
    /* Jeder Lauf mit eigenem Kontext: Ein zweiter Aufruf im selben Profil
       findet Schriften und Bündel im Zwischenspeicher und misst dann die
       Wiederkehr statt des ersten Eindrucks. Genau der zählt hier. */
    const kontext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const seite = await kontext.newPage();
    const cdp = await seite.context().newCDPSession(seite);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await seite.goto(`${basis}${pfad}`, { waitUntil: "load" });

    /* `buffered: true` ist der ganze Trick: Ohne das Flag bekommt ein
       Beobachter nur, was nach seiner Anmeldung passiert — und das Wichtigste
       ist längst vorbei, bevor dieser Code läuft.

       Die Verschiebungen werden mit ihrer Quelle mitgeschrieben. Eine Zahl
       allein sagt, dass etwas gerutscht ist; erst der Knoten sagt, was. */
    const werte = await seite.evaluate(
      (wartezeit) =>
        new Promise((fertig) => {
          const aus = { lcp: 0, cls: 0, quellen: [] };
          new PerformanceObserver((liste) => {
            for (const eintrag of liste.getEntries()) {
              if (eintrag.hadRecentInput) continue;
              aus.cls += eintrag.value;
              for (const quelle of eintrag.sources ?? []) {
                const knoten = quelle.node;
                if (!knoten) continue;
                /* Mit Wert, Zeitpunkt und Höhe, nicht nur mit dem Namen.

                   Der Name allein sagt „der Inhaltsblock ist gerutscht" — das
                   war er auf der Fehlerseite, zusammen mit Fußzeile und
                   Glühkreis, also alles auf einmal. Was ihn schiebt, steht
                   erst in den Zahlen: Wann es passiert, wie weit, und ob sich
                   dabei eine Höhe geändert hat. Örtlich ließ sich derselbe
                   Wert nicht herstellen; die Zahlen müssen deshalb dort
                   entstehen, wo er entsteht. */
                aus.quellen.push(
                  `${knoten.tagName ?? "?"}.${String(knoten.className ?? "").slice(0, 40)}` +
                    ` [${eintrag.value.toFixed(4)} bei ${Math.round(eintrag.startTime)} ms,` +
                    ` oben ${Math.round(quelle.previousRect.top)}→${Math.round(quelle.currentRect.top)},` +
                    ` hoch ${Math.round(quelle.previousRect.height)}→${Math.round(quelle.currentRect.height)}]`,
                );
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((liste) => {
            for (const eintrag of liste.getEntries()) {
              aus.lcp = Math.round(eintrag.startTime);
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });
          setTimeout(() => fertig(aus), wartezeit);
        }),
      WARTEN,
    );

    messungen.push(werte);
    await kontext.close();

    /* Eine Pause zwischen den Läufen, wenn gegen die Live-Adresse gemessen
       wird.

       Vier Aufrufe je Seite mal fünf Seiten, jeder mit allen Bildern und
       Bündeln, kommen in weniger als einer Minute von derselben Adresse — für
       Vercels Schutz sieht das aus wie ein Angriff. Am 04.08.2026 hat er
       daraufhin für einige Minuten jede Anfrage mit einem „Security
       Checkpoint" beantwortet, Status 403, auch im gewöhnlichen Browser. Wer
       die Seite in dem Moment geöffnet hat, sah sie nicht.

       Örtlich gibt es das Problem nicht, deshalb kostet die Pause dort nichts. */
    if (vorgegebeneBasis) await new Promise((r) => setTimeout(r, 1500));
  }

  const median = (zahlen) =>
    [...zahlen].sort((a, b) => a - b)[Math.floor(zahlen.length / 2)];
  const lcp = median(messungen.map((m) => m.lcp));
  const cls = median(messungen.map((m) => m.cls));
  const quellen = [...new Set(messungen.flatMap((m) => m.quellen))];

  const marke = lcp > BUDGET.lcp || cls > BUDGET.cls ? "  <-- über Budget" : "";
  zeilen.push(
    `${pfad.padEnd(36)} LCP ${String(lcp).padStart(5)} ms   CLS ${cls.toFixed(4)}${marke}`,
  );

  if (lcp > BUDGET.lcp) {
    funde.push(`${pfad}: LCP ${lcp} ms, Budget ${BUDGET.lcp} ms`);
  }
  if (cls > BUDGET.cls) {
    funde.push(
      `${pfad}: CLS ${cls.toFixed(4)}, Budget ${BUDGET.cls}` +
        (quellen.length ? `\n      verschoben: ${quellen.join(", ")}` : ""),
    );
  }
}

/* ---------------------------------------------------------------------------
   INP: was die Seite tut, nachdem sie da ist

   Der Kopf dieser Datei sprach von drei Werten, gemessen wurden zwei. LCP und
   CLS beschreiben das Laden; INP beschreibt das Bedienen, und seit März 2024
   ist es die dritte Kernmetrik. Bei einer Seite mit Bewegungsbibliothek,
   eigenem Mauszeiger, Reitern, Reglern und einer Befehlspalette ist das genau
   der Wert, der leise wandert: Ein Handler, der bei jedem Tastendruck etwas
   nachrechnet, kostet kein Byte im Bündel und faellt in keiner anderen
   Prüfung auf.

   Gemessen wird auf der ruhigen Seite, sechs Sekunden nach `load`, und das
   ist eine bewusste Entscheidung. Wer beim vierfach gedrosselten Prozessor
   während der Hydration eine Taste drückt, wartet auf den Hauptthread:
   gemessen 2.808 ms bei 0,3 Sekunden nach `load`, gegen 48 ms auf derselben
   Seite nach sechs Sekunden. Der erste Wert sagt etwas über die Menge an
   JavaScript beim Start, und dafür gibt es `check:bundle`. Dieser Lauf misst
   die Reaktion auf eine Eingabe, und die soll er nicht mit der Ladephase
   vermischen — sonst prüft er zweimal dasselbe und keins davon genau.
   ------------------------------------------------------------------------ */
{
  const seite = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  const cdp = await seite.context().newCDPSession(seite);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await seite.addInitScript(() => {
    window.__inp = [];
    new PerformanceObserver((liste) => {
      for (const eintrag of liste.getEntries()) {
        if (!eintrag.interactionId) continue;
        window.__inp.push({
          dauer: Math.round(eintrag.duration),
          art: eintrag.name,
          ziel: eintrag.target?.tagName ?? "?",
        });
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });

  await seite.goto(`${basis}/`, { waitUntil: "load" });
  await seite.waitForTimeout(6000);

  /* Bedient wird, was auf der Startseite wirklich anklickbar ist: Tastatur,
     die Reiter der Fallstudien und die Regler der beiden Demos. */
  await seite.keyboard.press("Tab").catch(() => {});
  await seite.waitForTimeout(300);
  await seite.keyboard.press("Tab").catch(() => {});
  await seite.waitForTimeout(300);

  const reiter = seite.locator('[role="tab"]');
  for (let i = 0; i < Math.min(await reiter.count(), 3); i++) {
    await reiter
      .nth(i)
      .click({ timeout: 5000 })
      .catch(() => {});
    await seite.waitForTimeout(300);
  }

  const regler = seite.locator('input[type="range"]');
  for (let i = 0; i < Math.min(await regler.count(), 2); i++) {
    await regler
      .nth(i)
      .click({ timeout: 5000 })
      .catch(() => {});
    await seite.waitForTimeout(300);
  }
  await seite.waitForTimeout(1200);

  const gemessen = await seite.evaluate(() => window.__inp ?? []);
  await seite.close();

  if (gemessen.length === 0) {
    funde.push(
      "/: keine einzige Interaktion gemessen. Entweder reagiert nichts mehr, " +
        "oder die Bauteile heißen anders als dieser Lauf annimmt.",
    );
  } else {
    gemessen.sort((a, b) => b.dauer - a.dauer);
    const schlechtester = gemessen[0];
    zeilen.push(
      `${"/ (Bedienung)".padEnd(36)} INP ${String(schlechtester.dauer).padStart(5)} ms   ` +
        `aus ${gemessen.length} Interaktionen` +
        (schlechtester.dauer > BUDGET.inp ? "  <-- über Budget" : ""),
    );
    if (schlechtester.dauer > BUDGET.inp) {
      funde.push(
        `/: INP ${schlechtester.dauer} ms, Budget ${BUDGET.inp} ms ` +
          `(${schlechtester.art} auf ${schlechtester.ziel})`,
      );
    }
  }
}

/* Was die Seite nachlädt, ohne dass jemand klickt.

   Next holt die Zielseite jedes sichtbaren Verweises im Voraus. Das ist meist
   richtig — ein Klick fühlt sich dadurch sofort an —, aber es ist Verkehr, den
   niemand angefordert hat, und er taucht in keinem Bündelbudget auf: Die
   Antworten kommen als `fetch` und nicht als Skript.

   Gemessen an der ausgelieferten Startseite auf dem Telefon, vor dem Eingriff:
   36 Antworten mit zusammen 625 kB. Davon 443 kB für sechs vollständige
   Artikelseiten — geholt, bevor jemand einen Titel gelesen hat, und wer hier
   klickt, klickt einen davon an, nicht sechs. Ohne das Vorabladen an den
   Artikelverweisen, am Sprachwechsel und an den beiden Rechtsseiten sind es
   20 Antworten und 308 kB. Beim Zeigen mit der Maus lädt Next weiterhin vor,
   der Klick bleibt also gleich schnell.

   Die Kernwerte bleiben davon unberührt: Das Nachladen beginnt nach dem
   Aufbau. Es kostet Daten auf einer bezahlten Verbindung und Bandbreite beim
   Scrollen, und genau deshalb steht die Messung hier und nicht bei den
   Skripten.

   Die Grenze steht bei 400 kB: hoch genug, dass die Schwankung zwischen zwei
   Läufen sie nicht reißt, niedrig genug, dass ein zurückgenommenes
   `prefetch={false}` sofort auffällt. */
{
  const NACHLADEGRENZE_KB = 400;
  const seite = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  let bytes = 0;
  let antworten = 0;
  seite.on("response", async (antwort) => {
    if (antwort.request().resourceType() !== "fetch") return;
    antworten++;
    try {
      bytes += (await antwort.body()).length;
    } catch {
      /* Eine Antwort ohne Körper zählt als Anfrage und mit null Bytes. */
    }
  });

  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });
  await seite.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await seite.waitForTimeout(2000);
  await seite.close();

  vorablast = Math.round(bytes / 1024);
  if (vorablast > NACHLADEGRENZE_KB) {
    console.error(
      `${String.fromCharCode(10)}Die Startseite lädt ${vorablast} kB im Voraus ` +
        `nach (${antworten} Antworten), erlaubt sind ${NACHLADEGRENZE_KB}. ` +
        `Wahrscheinlich fehlt prefetch={false} an einem Verweis, dem fast ` +
        `niemand folgt.`,
    );
    await browser.close();
    beenden();
    process.exit(1);
  }
  vorabAntworten = antworten;
}

await browser.close();
beenden();

console.log(zeilen.join("\n"));

if (funde.length > 0) {
  console.error(`\n${funde.length} Wert über Budget:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nGemessen auf 390 px, Prozessor vierfach gedrosselt, 1,6 Mbit/s, ` +
      `150 ms Latenz, Median aus ${LAEUFE} kalten Läufen.`,
  );
  process.exit(1);
}

console.log(
  `\nAlle Kernwerte im Budget: ${SEITEN.length} Seiten × ${LAEUFE} Läufe nach dem Aufwärmen ` +
    `auf einem gedrosselten Telefon, LCP unter ${BUDGET.lcp} ms, CLS unter ${BUDGET.cls}, INP unter ${BUDGET.inp} ms. ` +
    `Die Startseite lädt dazu ${vorablast} kB in ${vorabAntworten} Antworten vorab.`,
);
