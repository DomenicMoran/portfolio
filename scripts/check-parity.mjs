#!/usr/bin/env node
/**
 * Prüft, dass die englische Fassung dasselbe zeigt wie die deutsche.
 *
 * Die Typen erzwingen, dass `en.ts` jedes Feld hat — eine Übersetzung kann
 * nicht stillschweigend unvollständig werden. Was sie nicht erzwingen: dass
 * beide Fassungen am Ende gleich viel *rendern*. Ein Eintrag, der nur in der
 * deutschen Liste steht, eine Fallstudie ohne englische Aufnahmen, ein
 * Verweisfeld, das nur auf einer Seite gefüllt ist — all das kommt durch den
 * Typecheck und fällt erst jemandem auf, der beide Seiten nebeneinander legt.
 *
 * Genau das macht dieser Lauf, und zwar an der gebauten Seite: Gezählt werden
 * die Dinge, die ein Leser sieht. Absolute Zahlen, keine Stichproben — zwei
 * Seiten, die dasselbe sagen, haben dieselbe Anzahl Abschnitte, Überschriften,
 * Verweise, Bilder, Reiter und Kennzahlen.
 *
 * Was bewusst **nicht** verglichen wird: der Text selbst. Englisch ist kürzer
 * als Deutsch, und eine Prüfung auf gleiche Zeichenzahl wäre eine Prüfung auf
 * eine falsche Erwartung.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:parity
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Die Seitenpaare, die dasselbe zeigen sollen. */
const PAARE = [
  { de: "/", en: "/en", name: "Startseite" },
  { de: "/artikel", en: "/en/articles", name: "Artikelübersicht" },
  { de: "/onepager", en: "/en/onepager", name: "One-Pager" },
  /* Alle fünf Artikel, nicht mehr einer als Stichprobe.
     Sie sind der Teil der Seite, der einzeln geteilt wird und den ein CTO
     zuerst liest — und der einzige, bei dem beide Fassungen unabhängig
     geschrieben sind statt übersetzt. Vier von fünf Paaren waren ungeprüft. */
  {
    de: "/artikel/published-ist-kein-beleg",
    en: "/en/articles/published-is-not-proof",
    name: "Artikel: Published",
  },
  {
    de: "/artikel/gestrichelter-kreis-kam-nicht-aus-der-schrift",
    en: "/en/articles/the-dotted-circle-was-not-the-font",
    name: "Artikel: Kreis",
  },
  {
    de: "/artikel/widget-leer-trotz-gruener-tests",
    en: "/en/articles/green-tests-empty-widget",
    name: "Artikel: Widget",
  },
  {
    de: "/artikel/kassensichv-in-der-praxis",
    en: "/en/articles/german-till-law-in-practice",
    name: "Artikel: KassenSichV",
  },
  {
    de: "/artikel/kleineres-whisper-modell",
    en: "/en/articles/a-smaller-whisper-model",
    name: "Artikel: Whisper",
  },
];

const browser = await chromium.launch();

/** Was ein Leser sieht, in Zahlen. */
async function zaehle(pfad) {
  const seite = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });

  /* Erst durchscrollen: Was auf das Hineinscrollen wartet, hängt sich sonst
     gar nicht ein, und der Vergleich liefe über die halbe Seite. */
  await seite.evaluate(async () => {
    const hoehe = document.documentElement.scrollHeight;
    for (let y = 0; y < hoehe; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
  });

  const werte = await seite.evaluate(() => ({
    Abschnitte: [...document.querySelectorAll("section[id]")]
      .map((s) => s.id)
      .join(","),
    Überschriften2: document.querySelectorAll("h2").length,
    Überschriften3: document.querySelectorAll("h3").length,
    Verweise: document.querySelectorAll("a[href]").length,
    Bilder: document.querySelectorAll("img").length,
    Reiter: document.querySelectorAll('[role="tab"]').length,
    Kennzahlen: document.querySelectorAll("dt").length,
    Listeneinträge: document.querySelectorAll("li").length,
  }));

  await seite.close();
  return werte;
}

const funde = [];
let verglichen = 0;

for (const paar of PAARE) {
  const de = await zaehle(paar.de);
  const en = await zaehle(paar.en);

  for (const schluessel of Object.keys(de)) {
    verglichen++;
    if (String(de[schluessel]) !== String(en[schluessel])) {
      funde.push(
        `${paar.name}: ${schluessel} — deutsch ${de[schluessel]}, englisch ${en[schluessel]}`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Sprachangaben im Kopf

   Zwei Fassungen sind nur dann zwei Fassungen, wenn eine Suchmaschine sie
   auseinanderhalten kann. Dafür braucht jede Seite drei Angaben: `de`, `en`
   und `x-default` — die letzte sagt, welche Fassung jemand bekommt, dessen
   Sprache in keiner der beiden vorkommt.

   Gemessen an der ausgelieferten Seite fehlte `x-default` auf beiden
   Kurzprofilen. Jede andere Seite nannte sie; die zwei nicht, und keine
   Prüfung sah hin. */
const sprachSeite = await browser.newPage();
for (const paar of PAARE) {
  for (const pfad of [paar.de, paar.en]) {
    await sprachSeite.goto(`${basis}${pfad}`, {
      waitUntil: "domcontentloaded",
    });
    const sprachen = await sprachSeite.evaluate(() =>
      [...document.querySelectorAll("link[rel=alternate][hreflang]")].map((l) =>
        l.getAttribute("hreflang"),
      ),
    );
    verglichen++;
    for (const erwartet of ["de", "en", "x-default"]) {
      if (!sprachen.includes(erwartet)) {
        funde.push(
          `${paar.name} (${pfad}): keine Sprachangabe „${erwartet}“ im Kopf`,
        );
      }
    }
  }
}
await sprachSeite.close();

/*
  Die Architekturdiagramme, jedes einzeln aufgeklappt.

  Sie stehen hinter einem Reiter, der nicht der erste ist — im gebauten HTML
  taucht ihr Text deshalb gar nicht auf, und keiner der Läufe, die Dateien
  lesen, konnte sie je sehen. Gemessen an der ausgelieferten Seite trugen alle
  vier auf `/en` deutsche Beschriftungen: „GETEILTE LOGIK", „ZUGÄNGE",
  „QR-Bestellung", „Mensch entscheidet". Also ausgerechnet in dem Bild, das
  eine fachliche Führung als Erstes aufmacht.

  Gesucht wird nach Umlauten und nach einer kurzen Liste von Wörtern, die es
  im Englischen nicht gibt. Eigennamen bleiben draußen.
*/
const NUR_DEUTSCH =
  /(?:^|\s)(?:und|oder|nicht|eine|mit|Zugänge|Betrieb|Anwendung|Freigabe|Quellen|Versand|Persistenz|Oberflächen|Geteilte|Geteilter|Bestellung|QR-Bestellung|Konten|Inhalte|Mensch|entscheidet|Leanback-Fokus|Hash-Kette|Gebetszeiten|Verträge|Rezepte|Tabellen|Migrationen|Regeln|Suche|Natives|Vermieter-Sites|Kriterien-Filter)(?=\s|$)/g;

{
  const seite = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const funde2 = [];
  let bilder = 0;

  for (const id of ["salati", "menucloud", "nouri", "wohnungsjaeger"]) {
    await seite.goto(`${basis}/en#case-${id}`, { waitUntil: "networkidle" });
    await seite.waitForTimeout(400);
    const reiter = seite.locator(`#${id}-tab-architecture`);
    if ((await reiter.count()) === 0) continue;
    await reiter.click();

    /*
      Gewartet wird auf das Bild, nicht auf die Uhr.

      Die Tafeln werden eingeblendet, und während der Blende hängt die vorige
      noch im Dokument. Gemessen an der ausgelieferten Seite: 300 ms nach dem
      Klick auf „Architektur" stand dort noch der Text des vorigen Reiters,
      erst nach rund 900 ms das Diagramm. Eine feste Wartezeit prüft damit
      mal das eine und mal das andere — ein Wächter, der nicht weiß, was er
      gerade misst, ist schlimmer als keiner.
    */
    await seite
      .locator(`#${id}-panel svg text`)
      .first()
      .waitFor({ state: "attached", timeout: 5000 });

    const texte = await seite.evaluate(
      (kennung) =>
        [...document.querySelectorAll(`#${kennung}-panel svg text`)]
          .map((t) => t.textContent.trim())
          .filter(Boolean),
      id,
    );
    if (texte.length === 0) continue;
    bilder++;

    const deutsch = [
      ...new Set(
        [...texte.join(" ").matchAll(NUR_DEUTSCH)].map((m) => m[0].trim()),
      ),
    ];
    if (deutsch.length > 0) {
      funde2.push(
        `Architekturbild ${id} auf /en: ${deutsch.slice(0, 6).join(", ")}`,
      );
    }
  }

  await seite.close();

  if (funde2.length > 0) {
    await browser.close();
    beenden();
    console.error(
      `${funde2.length} Architekturbild(er) mit deutschen Beschriftungen:\n`,
    );
    for (const f of funde2) console.error(`  ${f}`);
    console.error(
      `\nDie Beschriftung fehlt in src/content/architecture-en.ts. Ohne ` +
        `Eintrag bleibt der deutsche Text stehen.`,
    );
    process.exit(1);
  }
  console.log(
    `${bilder} Architekturbilder auf /en, alle mit englischer Beschriftung.`,
  );
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(
    `${funde.length} Abweichung(en) zwischen den Sprachfassungen:\n`,
  );
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nBeide Fassungen sollen dasselbe zeigen. Entweder fehlt der einen etwas, ` +
      `oder die andere hat etwas zu viel.`,
  );
  process.exit(1);
}

console.log(
  `Beide Sprachfassungen zeigen dasselbe: ${PAARE.length} Seitenpaare, ` +
    `${verglichen} Vergleiche ohne Abweichung, jede Seite mit de, en und x-default.`,
);
