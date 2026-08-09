#!/usr/bin/env node
/**
 * Prüft, dass die englische Fassung dasselbe zeigt wie die deutsche.
 *
 * Die Typen erzwingen, dass `en.ts` jedes Feld hat, eine Übersetzung kann
 * nicht stillschweigend unvollständig werden. Was sie nicht erzwingen: dass
 * beide Fassungen am Ende gleich viel *rendern*. Ein Eintrag, der nur in der
 * deutschen Liste steht, eine Fallstudie ohne englische Aufnahmen, ein
 * Verweisfeld, das nur auf einer Seite gefüllt ist, all das kommt durch den
 * Typecheck und fällt erst jemandem auf, der beide Seiten nebeneinander legt.
 *
 * Genau das macht dieser Lauf, und zwar an der gebauten Seite: Gezählt werden
 * die Dinge, die ein Leser sieht. Absolute Zahlen, keine Stichproben, zwei
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
import { gebauteSeiten } from "./lib/built-pages.mjs";

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;

if (!basis) {
  ({ basis, beenden } = await starteServer());
}

/** Die Seitenpaare, die dasselbe zeigen sollen. */
/* Die Artikelpaare entstehen aus dem Bau, nicht aus dieser Liste.

   Hier standen sie ausgeschrieben, fünf Stück. Der sechste Artikel kam dazu
   und fehlte, gemessen am 08.08.2026 meldete der Lauf acht Seitenpaare,
   während neun zu prüfen gewesen wären. Die Lücke sieht man der Ausgabe nicht
   an: „8 Seitenpaare, 97 Vergleiche ohne Abweichung" liest sich wie ein
   vollständiger Lauf.

   Die Zuordnung steht in jedem Artikel selbst: Der Kopf nennt die andere
   Sprachfassung als `rel="alternate"` mit `hreflang`. Von dort geholt, ist
   sie gemessen und nicht gepflegt, und ein Artikel ohne Gegenstück fällt
   sofort auf, statt still aus der Prüfung zu fallen.

   Die drei festen Paare bleiben ausgeschrieben: Sie folgen keiner Regel, die
   sich ableiten ließe. */
const FESTE_PAARE = [
  { de: "/", en: "/en", name: "Startseite" },
  { de: "/artikel", en: "/en/articles", name: "Artikelübersicht" },
  { de: "/onepager", en: "/en/onepager", name: "One-Pager", zahlen: true },
];

const artikelpfade = gebauteSeiten().filter((pfad) =>
  /^\/artikel\/[^/]+$/.test(pfad),
);


/**
 * Wie weit die Textmenge zweier Fassungen auseinanderliegen darf.
 *
 * Gemessen liegt der englische Fließtext bei 91 bis 96 Prozent des deutschen.
 * 0,8 lässt jeder Formulierung Luft und fängt trotzdem den Fall, um den es
 * geht: einen Absatz, der in einer Fassung fehlt.
 */
const ANTEIL_MINDESTENS = 0.8;

const browser = await chromium.launch();

const PAARE = [...FESTE_PAARE];
{
  const leser = await browser.newPage();
  for (const pfad of artikelpfade) {
    await leser.goto(`${basis}${pfad}`, { waitUntil: "domcontentloaded" });
    const englisch = await leser.evaluate(() => {
      const l = document.querySelector('link[rel="alternate"][hreflang="en"]');
      return l ? new URL(l.getAttribute("href"), location.origin).pathname : null;
    });
    if (!englisch || !englisch.startsWith("/en/")) {
      throw new Error(`${pfad} nennt keine englische Fassung im Kopf.`);
    }
    PAARE.push({
      de: pfad,
      en: englisch,
      name: `Artikel: ${pfad.replace("/artikel/", "").slice(0, 26)}`,
    });
  }
  await leser.close();
}


/** Was ein Leser sieht, in Zahlen. */
async function zaehle(pfad, mitZahlen = false) {
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

    /* Knöpfe zählen mit, weil die Bedienung selbst zum Inhalt gehört: Der
       Kopierknopf über jedem Codeblock hängt an einer Beschriftung je Sprache,
       und eine, die nur auf einer Seite gesetzt ist, nimmt der anderen die
       Funktion, ohne dass ein Text fehlt. */
    Knöpfe: document.querySelectorAll("button").length,

    /* Und die Zahlen selbst.
       Bis hierher wurde gezählt, wie viele Kennzahlen dastehen, nicht welche.
       Eine aktualisierte Zahl, die nur in einer Fassung nachgezogen wird,
       ergibt zwei verschiedene öffentliche Aussagen über denselben Gegenstand, und beide Seiten bleiben zählgleich.

       Verglichen wird ohne Trennzeichen: Dieselbe Zahl heißt „4.318“ und
       „4,318“, und genau dieser Unterschied ist gewollt. Datumsangaben
       fallen heraus, weil sie in beiden Sprachen anders geschrieben werden;
       ihren Gleichstand prüft `check:legal-date`. */
    Zahlen: [
      ...new Set(
        (document.body.innerText.match(/\b\d[\d.,]*\b/g) ?? [])
          .filter((z) => z.length > 2)
          .filter((z) => !/^\d{1,2}[.,]\d{1,2}[.,]\d{2,4}$/.test(z))
          .map((z) => z.replace(/[.,](?=\d{3}\b)/g, "")),
      ),
    ]
      .sort()
      .join(" "),

    /* Die Textmenge, nicht als Vergleichswert, sondern als Verhältnis.

       Alles bisher Gezählte ist Struktur: Abschnitte, Überschriften, Verweise,
       Kennzahlen. Ein Absatz, der in einer Fassung fehlt, ändert nichts davon:
       er hat keine eigene Marke, die hier vorkäme. Gemessen liegt der englische
       Fließtext durchweg bei 91 bis 96 Prozent des deutschen, weil Englisch
       kompakter ist; ein fehlender Absatz fiele deutlich darunter. */
    Zeichen: (document.querySelector("main")?.innerText ?? "")
      .replace(/\s+/g, " ")
      .trim().length,
  }));

  /* Die Zahlen werden immer eingesammelt und hier verworfen, statt den Schalter
     in den Browser zu reichen: Der Aufruf im Seitenkontext kostet nichts, und
     ein Argument, das drüben nur eine Verzweigung steuert, war schon einmal
     die Stelle, an der ein unbenutzter Parameter stehen blieb. */
  if (!mitZahlen) delete werte.Zahlen;

  await seite.close();
  return werte;
}

const funde = [];
let verglichen = 0;

for (const paar of PAARE) {
  const de = await zaehle(paar.de, paar.zahlen === true);
  const en = await zaehle(paar.en, paar.zahlen === true);

  /* Die Textmenge wird als Verhältnis geprüft und nicht auf Gleichstand: Zwei
     Sprachen sind nie gleich lang. Die Grenze liegt großzügig bei 80 Prozent,
     weit unter den gemessenen 91 bis 96, sie soll einen fehlenden Absatz
     fangen, nicht eine knappere Formulierung. */
  verglichen++;
  const anteil = de.Zeichen ? en.Zeichen / de.Zeichen : 1;
  if (anteil < ANTEIL_MINDESTENS || anteil > 1 / ANTEIL_MINDESTENS) {
    funde.push(
      `${paar.name}: Textmenge, deutsch ${de.Zeichen} Zeichen, englisch ` +
        `${en.Zeichen} (${Math.round(anteil * 100)} %, erwartet zwischen ` +
        `${Math.round(ANTEIL_MINDESTENS * 100)} und ` +
        `${Math.round((1 / ANTEIL_MINDESTENS) * 100)} %)`,
    );
  }
  delete de.Zeichen;
  delete en.Zeichen;

  for (const schluessel of Object.keys(de)) {
    verglichen++;
    if (String(de[schluessel]) !== String(en[schluessel])) {
      funde.push(
        `${paar.name}: ${schluessel}, deutsch ${de[schluessel]}, englisch ${en[schluessel]}`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Die Sprachangaben im Kopf

   Zwei Fassungen sind nur dann zwei Fassungen, wenn eine Suchmaschine sie
   auseinanderhalten kann. Dafür braucht jede Seite drei Angaben: `de`, `en`
   und `x-default`, die letzte sagt, welche Fassung jemand bekommt, dessen
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

  Sie stehen hinter einem Reiter, der nicht der erste ist, im gebauten HTML
  taucht ihr Text deshalb gar nicht auf, und keiner der Läufe, die Dateien
  lesen, konnte sie je sehen. Gemessen an der ausgelieferten Seite trugen alle
  vier auf `/en` deutsche Beschriftungen: „GETEILTE LOGIK“, „ZUGÄNGE“,
  „QR-Bestellung“, „Mensch entscheidet“. Also ausgerechnet in dem Bild, das
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
      mal das eine und mal das andere, ein Wächter, der nicht weiß, was er
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
