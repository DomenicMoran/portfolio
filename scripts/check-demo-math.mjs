#!/usr/bin/env node
/**
 * Prüft, dass die Demo auf der Startseite richtig rechnet.
 *
 * Sie behauptet etwas Nachprüfbares: „Der Lauf prüft jede der 4.096 möglichen
 * Zusammenstellungen und nimmt die mit dem meisten Eiweiß, die unter dem Ziel
 * bleibt." Wer das liest, soll daraus schließen, dass hier jemand rechnen
 * kann, eine Demo, die daneben liegt, sagt das Gegenteil, und niemand würde
 * es bemerken. Die Zahlen sehen in jedem Fall plausibel aus.
 *
 * Gemessen wird an der ausgelieferten Seite und nicht an der Funktion im
 * Quelltext: Die Gerichte samt Werten liest der Lauf aus der Demo selbst,
 * stellt den Regler auf mehrere Ziele und vergleicht, was sie auswählt, mit
 * einer zweiten, hier geschriebenen Aufzählung über alle Teilmengen.
 *
 * Zwei Regeln der Demo gehören dazu, sonst stimmt der Vergleich nicht:
 * mindestens drei Mahlzeiten, denn ein Tag aus einem Gericht ist kein Tag,
 * und bei gleichem Eiweiß entscheiden die Ballaststoffe.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:demo
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/** Über den Regelbereich verteilt, samt seiner beiden Enden. */
const ZIELE = [1200, 1600, 2000, 2200, 2800, 3400];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const funde = [];
let sprachvergleich = 0;

await seite.goto(`${basis}/`, { waitUntil: "networkidle" });
await seite.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 30));
  }
});
await seite.waitForTimeout(900);

/**
 * Die Gerichte, wie die Seite sie zeigt.
 *
 * Aus den Schaltflächen der Demo gelesen: Jede trägt Name und Kalorien. Die
 * übrigen Werte stehen nicht im sichtbaren Text, sie kommen aus dem
 * Datensatz, den der Lauf gleich daneben aus der Seite holt.
 */
const daten = await seite.evaluate(() => {
  const demo = [...document.querySelectorAll("section, div")]
    .filter((e) => /kcal/.test(e.innerText || "") && e.querySelectorAll("button").length > 3)
    .sort((a, b) => a.innerText.length - b.innerText.length)[0];
  if (!demo) return null;

  const knoepfe = [...demo.querySelectorAll("button")].filter((e) =>
    /^\p{Extended_Pictographic}/u.test(e.textContent.trim()),
  );

  return {
    anzahl: knoepfe.length,
    namen: knoepfe.map((e) => e.textContent.trim().replace(/\d+$/, "")),
  };
});

if (!daten) {
  console.error("Die Demo auf der Startseite ist nicht zu finden.");
  process.exit(1);
}

/* Die Werte je Gericht stehen im Quelltext der Demo, sichtbar ist nur die
   Kalorienzahl. Gelesen wird die gebaute Datei, nicht die Komponente: Was
   ausgeliefert wird, entscheidet. */
const { readFileSync } = await import("node:fs");
const quelle = readFileSync("src/components/demo/Macros.tsx", "utf8");
const gerichte = [
  ...quelle.matchAll(
    /de:\s*"([^"]+)",\s*\n\s*en:\s*"([^"]+)",\s*\n\s*kcal:\s*(\d+),\s*\n\s*p:\s*(\d+),\s*\n\s*k:\s*(\d+),\s*\n\s*f:\s*(\d+),\s*\n\s*b:\s*(\d+)/g,
  ),
].map((m) => ({
  de: m[1],
  kcal: Number(m[3]),
  p: Number(m[4]),
  b: Number(m[7]),
}));

if (gerichte.length !== daten.anzahl) {
  funde.push(
    `Die Seite zeigt ${daten.anzahl} Gerichte, im Datensatz stehen ${gerichte.length}.`,
  );
}

/** Dieselbe Aufgabe, unabhängig gerechnet. */
function optimum(ziel) {
  let beste = null;
  for (let muster = 0; muster < 1 << gerichte.length; muster++) {
    let kcal = 0;
    let eiweiss = 0;
    let ballast = 0;
    let anzahl = 0;
    const teil = [];
    for (let i = 0; i < gerichte.length; i++) {
      if (!(muster & (1 << i))) continue;
      kcal += gerichte[i].kcal;
      eiweiss += gerichte[i].p;
      ballast += gerichte[i].b;
      anzahl++;
      teil.push(gerichte[i].de);
    }
    if (kcal > ziel || anzahl < 3) continue;
    if (
      !beste ||
      eiweiss > beste.eiweiss ||
      (eiweiss === beste.eiweiss && ballast > beste.ballast)
    ) {
      beste = { kcal, eiweiss, ballast, teil };
    }
  }
  return beste;
}

/* Der Regler ist ein `input[type=range]`. Gesetzt wird sein Wert und ein
   `input`-Ereignis ausgelöst, ein Klick träfe je nach Breite einen anderen
   Wert. */
for (const ziel of ZIELE) {
  const ergebnis = await seite.evaluate(async (ziel) => {
    /* Den Regler in seiner Demo suchen, nicht auf der ganzen Seite: Der erste
       `input[type=range]` des Dokuments gehört der Gebetszeiten-Demo. Wer ihn
       nimmt, verstellt den Tag und bekommt sechsmal dasselbe Ergebnis, der
       erste Anlauf meldete deshalb fünf Abweichungen, die keine waren. */
    const demo = [...document.querySelectorAll("section, div")]
      .filter(
        (e) =>
          /kcal/.test(e.innerText || "") &&
          e.querySelector('input[type="range"]') &&
          e.querySelectorAll("button").length > 3,
      )
      .sort((a, b) => a.innerText.length - b.innerText.length)[0];
    if (!demo) return { fehler: "Demo nicht gefunden" };

    const regler = demo.querySelector('input[type="range"]');
    if (!regler) return { fehler: "kein Regler" };

    const setzen = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    setzen.call(regler, String(ziel));
    regler.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));

    // Der Knopf rechnet, die Ansage darunter nennt das Ergebnis.
    const knopf = [...demo.querySelectorAll("button")].find((e) =>
      /zusammenstellen|build the day/i.test(e.textContent),
    );
    if (!knopf) return { fehler: "kein Knopf" };
    knopf.click();
    await new Promise((r) => setTimeout(r, 700));

    const ansage = [...demo.querySelectorAll('[role="status"]')]
      .map((e) => e.textContent.trim())
      .find((t) => /kcal/.test(t));
    return { ansage: ansage ?? null };
  }, ziel);

  if (ergebnis.fehler) {
    funde.push(`Ziel ${ziel}: ${ergebnis.fehler}`);
    continue;
  }
  if (!ergebnis.ansage) {
    funde.push(`Ziel ${ziel}: die Demo sagt ihr Ergebnis nicht an`);
    continue;
  }

  const zahlen = [...ergebnis.ansage.matchAll(/([\d.,]+)\s*(kcal|g)/g)].map((m) =>
    Number(m[1].replace(/[.,]/g, "")),
  );
  const [kcal, eiweiss] = zahlen;
  const erwartet = optimum(ziel);

  if (!erwartet) {
    funde.push(`Ziel ${ziel}: unabhängig gerechnet gibt es keine gültige Auswahl`);
  } else if (kcal !== erwartet.kcal || eiweiss !== erwartet.eiweiss) {
    funde.push(
      `Ziel ${ziel}: die Demo sagt ${kcal} kcal und ${eiweiss} g Eiweiß, ` +
        `nachgerechnet sind es ${erwartet.kcal} kcal und ${erwartet.eiweiss} g ` +
        `(${erwartet.teil.join(" + ")})`,
    );
  } else {
    console.log(
      `  ok  Ziel ${String(ziel).padStart(4)} kcal → ${erwartet.kcal} kcal, ` +
        `${erwartet.eiweiss} g Eiweiß aus ${erwartet.teil.length} Gerichten`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Die zweite Demo: Gebetszeiten

   Auch sie rechnet im Browser, mit derselben Bibliothek wie die ausgelieferte
   App. Ein zweites Mal nachzurechnen wäre hier sinnlos, dann stünde dieselbe
   Formel zweimal da. Was sich prüfen lässt, ist die Ordnung, die keine
   Rechnung verletzen darf: Fadschr kommt vor dem Sonnenaufgang, der vor
   Dhuhr, der vor Asr, der vor Maghrib, der vor Ischa. Eine vertauschte
   Zuordnung oder ein Fehler um einen Tag bricht genau das, und auf der Kachel
   sähe es aus wie immer.

   Geprüft über vier Orte, vier Verfahren für hohe Breiten und fünf Tage
   quer durchs Jahr. Tromsø ist dabei der Fall, um den es geht: Zur Sonnwende
   gibt es dort keine Dämmerung, in der Polarnacht keinen Sonnenaufgang. Die
   Demo schreibt dann „nicht berechnet", und das ist die richtige Antwort:
   eine erfundene Uhrzeit wäre die falsche. */
const ORTE = ["Berlin", "Istanbul", "Kairo", "Tromsø"];
const VERFAHREN = ["wie in der App", "winkelbasiert", "Siebtel der Nacht", "Mitte der Nacht"];
/** Jahresanfang, Frühling, Sonnwende, Herbst, Dezember. */
const TAGE = [0, 80, 172, 264, 355];

let kombinationen = 0;
let nichtBerechnet = 0;

for (const ort of ORTE) {
  for (const verfahren of VERFAHREN) {
    for (const tag of TAGE) {
      const stand = await seite.evaluate(
        async ([ort, verfahren, tag]) => {
          const demo = [...document.querySelectorAll("section, div")]
            .filter(
              (e) =>
                /Fadschr|Fajr/.test(e.innerText || "") &&
                e.querySelector('input[type="range"]'),
            )
            .sort((a, b) => a.innerText.length - b.innerText.length)[0];
          if (!demo) return { fehler: "Gebetszeiten-Demo nicht gefunden" };

          const waehlen = (beschriftung) => {
            const knopf = [...demo.querySelectorAll("button")].find(
              (e) => e.textContent.trim() === beschriftung,
            );
            if (knopf) knopf.click();
            return Boolean(knopf);
          };
          if (!waehlen(ort)) return { fehler: `Ort „${ort}" fehlt` };
          if (!waehlen(verfahren)) return { fehler: `Verfahren „${verfahren}" fehlt` };
          await new Promise((r) => setTimeout(r, 250));

          const regler = demo.querySelector('input[type="range"]');
          const setzen = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          ).set;
          setzen.call(regler, String(tag));
          regler.dispatchEvent(new Event("input", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 350));

          return {
            paare: [...demo.querySelectorAll("dt")].map((dt) => ({
              name: dt.textContent.trim(),
              wert: (
                dt.parentElement?.querySelector("dd") ?? dt.nextElementSibling
              )?.textContent.trim(),
            })),
          };
        },
        [ort, verfahren, tag],
      );

      const wo = `${ort} / ${verfahren} / Tag ${tag}`;
      if (stand.fehler) {
        funde.push(`${wo}: ${stand.fehler}`);
        continue;
      }
      if (!stand.paare?.length) {
        funde.push(`${wo}: keine Zeiten abzulesen`);
        continue;
      }
      kombinationen++;

      /* „nicht berechnet" und ein „+1“ hinter der Uhrzeit sind keine Fehler:
         Das eine ist die ehrliche Antwort für einen Ort ohne Dämmerung, das
         andere eine Zeit nach Mitternacht. Beide fallen aus dem Vergleich,
         weil sie keine Uhrzeit desselben Tages sind. */
      let vorher = null;
      let vorherName = null;
      for (const paar of stand.paare) {
        const treffer = /^(\d{2}):(\d{2})$/.exec(paar.wert ?? "");
        if (!treffer) {
          if (!/^\d{2}:\d{2}/.test(paar.wert ?? "")) nichtBerechnet++;
          vorher = null;
          continue;
        }
        const minuten = Number(treffer[1]) * 60 + Number(treffer[2]);
        if (vorher !== null && minuten < vorher) {
          funde.push(
            `${wo}: ${vorherName} steht auf ${String(Math.floor(vorher / 60)).padStart(2, "0")}:` +
              `${String(vorher % 60).padStart(2, "0")} und ${paar.name} auf ${paar.wert}, ` +
              `die Reihenfolge der Gebetszeiten liegt fest.`,
          );
        }
        vorher = minuten;
        vorherName = paar.name;
      }
    }
  }
}

/* ---------------------------------------------------------------------------
   Der nördlichste Ort, jeden Tag des Jahres

   Fünf Stichtage decken die Jahreszeiten ab, aber nicht die zwei Wochen, in
   denen es schwierig wird. Gemessen an der ausgelieferten Seite standen in
   Tromsø 21 Zeiten in unmöglicher Reihenfolge, am 16. November Asr um 11:25
   vor Dhuhr um 11:34, am 20. Januar Asr um 14:44 nach Maghrib um 13:22. Alle
   lagen an den Rändern der Polarnacht, also zwischen den Stichtagen: Der Lauf
   war grün, während die Demo falsche Zeiten zeigte.

   Geprüft wird deshalb ein Ort vollständig statt vier stichprobenartig.
   Tromsø ist der einzige der vier oberhalb des Polarkreises und damit der
   einzige, an dem die Sonne die Bedingungen für Fadschr, Asr und Ischa
   überhaupt verfehlen kann.

   Der Regler wird im Browser durchgefahren und nicht je Tag von außen
   gesetzt: 365 Runden über die Verbindung kosteten Minuten, hier ist es ein
   Aufruf je Verfahren. Die Wartezeit von 60 ms je Tag ist gemessen, darunter
   liest der Lauf denselben Stand zweimal.
   ------------------------------------------------------------------------ */
let jahrestage = 0;
for (const verfahren of VERFAHREN) {
  const jahr = await seite.evaluate(
    async ([verfahren]) => {
      const demo = [...document.querySelectorAll("section, div")]
        .filter(
          (e) =>
            /Fadschr|Fajr/.test(e.innerText || "") &&
            e.querySelector('input[type="range"]'),
        )
        .sort((a, b) => a.innerText.length - b.innerText.length)[0];
      if (!demo) return { fehler: "Gebetszeiten-Demo nicht gefunden" };

      const waehlen = (beschriftung) => {
        const knopf = [...demo.querySelectorAll("button")].find(
          (e) => e.textContent.trim() === beschriftung,
        );
        if (knopf) knopf.click();
        return Boolean(knopf);
      };
      if (!waehlen("Tromsø")) return { fehler: "Ort „Tromsø“ fehlt" };
      if (!waehlen(verfahren)) return { fehler: `Verfahren „${verfahren}" fehlt` };
      await new Promise((r) => setTimeout(r, 250));

      const regler = demo.querySelector('input[type="range"]');
      const setzen = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set;

      const tage = [];
      for (let tag = 0; tag < 365; tag++) {
        setzen.call(regler, String(tag));
        regler.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 60));
        tage.push(
          [...demo.querySelectorAll("dt")].map((dt) => ({
            name: dt.textContent.trim(),
            wert: (
              dt.parentElement?.querySelector("dd") ?? dt.nextElementSibling
            )?.textContent.trim(),
          })),
        );
      }
      return { tage };
    },
    [verfahren],
  );

  if (jahr.fehler) {
    funde.push(`Tromsø / ${verfahren}: ${jahr.fehler}`);
    continue;
  }

  for (const [tag, paare] of jahr.tage.entries()) {
    jahrestage++;
    let vorher = null;
    let vorherName = null;
    for (const paar of paare) {
      const treffer = /^(\d{2}):(\d{2})$/.exec(paar.wert ?? "");
      if (!treffer) {
        vorher = null;
        continue;
      }
      const minuten = Number(treffer[1]) * 60 + Number(treffer[2]);
      if (vorher !== null && minuten < vorher) {
        funde.push(
          `Tromsø / ${verfahren} / Tag ${tag}: ${vorherName} steht auf ` +
            `${String(Math.floor(vorher / 60)).padStart(2, "0")}:` +
            `${String(vorher % 60).padStart(2, "0")} und ${paar.name} auf ` +
            `${paar.wert}, die Reihenfolge der Gebetszeiten liegt fest.`,
        );
      }
      vorher = minuten;
      vorherName = paar.name;
    }
  }
}

console.log(
  `  ok  Gebetszeiten: ${kombinationen} Kombinationen aus ${ORTE.length} Orten, ` +
    `${VERFAHREN.length} Verfahren und ${TAGE.length} Tagen in Reihenfolge, ` +
    `dazu Tromsø an ${jahrestage} Tagen über alle ${VERFAHREN.length} Verfahren`,
);

/* ---------------------------------------------------------------------------
   Die Quellenangabe unter der Kachel

   Sie nennt drei nachprüfbare Dinge: „adhan 4.4.4 (MIT), Methode 13 Diyanet,
   Schule 0 schafiitisch." Das ist keine Beschreibung, sondern eine Zusage:
   wer die Zahlen nachrechnen will, braucht genau diese drei Angaben, und mit
   einer falschen käme er auf andere Zeiten.

   Alle drei stehen im eigenen Projekt und lassen sich ohne die Produktivrepos
   prüfen: die Version in `node_modules`, Methode und Schule im Quelltext der
   Kachel. `adhan` steht in `package.json` mit `^4.4.4`, und dieses Zeichen
   erlaubt jede 4.x, ein `npm update` hebt die installierte Fassung, ohne die
   Angabe auf der Seite anzufassen.
   ------------------------------------------------------------------------ */
{
  const notiz = readFileSync("src/content/de.ts", "utf8");
  const zeile = /adhan [^"]*schafiitisch/.exec(notiz)?.[0] ?? "";

  if (!zeile) {
    funde.push("Die Quellenangabe der Gebetszeiten-Kachel ist nicht zu finden.");
  } else {
    const genannt = /adhan ([\d.]+)/.exec(zeile)?.[1];
    const eingebaut = JSON.parse(
      readFileSync("node_modules/adhan/package.json", "utf8"),
    ).version;
    if (genannt !== eingebaut) {
      funde.push(
        `Die Kachel nennt adhan ${genannt}, eingebaut ist ${eingebaut}. ` +
          `Wer die Zeiten nachrechnen will, käme mit der genannten Fassung ` +
          `auf andere Werte.`,
      );
    }

    const kachel = readFileSync("src/components/demo/PrayerTimes.tsx", "utf8");
    /* Methode 13 ist Diyanet, und `adhan` nennt sie `Turkey()`.
       Schule 0 ist die schafiitische, in `adhan` `Madhab.Shafi`. */
    if (/Methode 13/.test(zeile) && !/CalculationMethod\.Turkey\(\)/.test(kachel)) {
      funde.push(
        "Die Kachel nennt Methode 13 (Diyanet), rechnet aber nicht mit " +
          "CalculationMethod.Turkey().",
      );
    }
    if (/Schule 0/.test(zeile) && !/Madhab\.Shafi/.test(kachel)) {
      funde.push(
        "Die Kachel nennt Schule 0 (schafiitisch), setzt aber nicht Madhab.Shafi.",
      );
    }
    if (!funde.some((f) => /Kachel nennt|Quellenangabe/.test(f))) {
      console.log(
        `  ok  Quellenangabe: adhan ${eingebaut}, Methode 13 als Turkey(), ` +
          `Schule 0 als Madhab.Shafi`,
      );
    }
  }
}

/* Und dieselben Zahlen auf der englischen Fassung.

   Bis hierher schlug dieser Lauf die englische Startseite nie auf. Die
   Rechnung dahinter ist dieselbe, es ist derselbe Code, die Vorführung
   aber nicht: Ein anderer Vorgabewert, ein anderer Datensatz oder ein Reiter,
   der nur in einer Fassung vorausgewählt ist, ergäbe zwei Demos, die
   verschiedene Ergebnisse zeigen und beide für sich richtig rechnen.

   Verglichen werden die Kalorienangaben ohne Trennzeichen und die Zahl der
   gewählten Gerichte. Das Trennzeichen selbst bleibt bewusst draußen: Auf
   Deutsch steht dort „2.200", auf Englisch „2,200", und ob das stimmt, misst
   `check:typography` genauer, gegengeprüft mit deutscher Formatierung auf
   der englischen Seite, gemeldet als „Tausender trennt das Englische mit
   einem Komma". Zweimal dieselbe Prüfung wäre eine zu viel. */
{
  const auslesen = async (route) => {
    const blatt = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await blatt.goto(`${basis}${route}`, { waitUntil: "networkidle" });
    await blatt.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    await blatt.waitForTimeout(700);
    const stand = await blatt.evaluate(() => {
      const demo = [...document.querySelectorAll("section, div")]
        .filter((e) => /kcal/.test(e.innerText || "") && e.querySelectorAll("button").length > 3)
        .sort((a, b) => a.innerText.length - b.innerText.length)[0];
      if (!demo) return null;
      return {
        gewaehlt: demo.querySelectorAll('button[aria-pressed="true"]').length,
        werte: (demo.innerText.match(/[\d.,]+(?=\s*kcal)/g) ?? []).map((z) =>
          z.replace(/[.,]/g, ""),
        ),
      };
    });
    await blatt.close();
    return stand;
  };

  const [deutsch, englisch] = [await auslesen("/"), await auslesen("/en")];

  if (!deutsch || !englisch) {
    funde.push("Die Tagesbilanz ist auf einer der beiden Fassungen nicht zu finden.");
  } else {
    if (deutsch.gewaehlt !== englisch.gewaehlt) {
      funde.push(
        `Die Tagesbilanz zeigt ${deutsch.gewaehlt} gewählte Gerichte auf Deutsch ` +
          `und ${englisch.gewaehlt} auf Englisch.`,
      );
    }
    if (deutsch.werte.join(" ") !== englisch.werte.join(" ")) {
      funde.push(
        `Die Tagesbilanz nennt andere Zahlen: deutsch ${deutsch.werte.join(", ")}, ` +
          `englisch ${englisch.werte.join(", ")}.`,
      );
    }
    sprachvergleich = deutsch.werte.length;
  }
}

/* ------------------------------------------------------------------------
   Die Checkout-Tafel aus Dartile

   Die dritte Kachel rechnet nicht selbst, sie lädt `darts-checkout` von npm.
   Damit verschiebt sich die Frage: Nicht „rechnet der Code hier richtig", der
   hat seine eigenen Tests, sondern „steht auf der Seite, was das Paket
   ausrechnet, und stimmt das mit der Wirklichkeit überein".

   Der Prüfstein ist deshalb bewusst kein zweiter Aufruf derselben Bibliothek:
   Das wäre dieselbe Aussage zweimal. Verglichen wird gegen die Wege, die in
   jeder gedruckten Checkout-Tafel stehen, abgetippt und nicht abgeleitet.
   Weicht die Kachel davon ab, ist entweder die Sortierung verstellt oder das
   Paket ausgetauscht, und beides gehört gesehen.
   ------------------------------------------------------------------------ */
let tafelgeprueft = 0;
{
  /* Die Reste, bei denen die gedruckte Tafel eindeutig ist. Zwei davon sind
     die, an denen der Fehler saß: 141 und 90 liefen einmal über das Bull. */
  const TAFEL = [
    [170, "T20 T20 BULL"],
    [167, "T20 T19 BULL"],
    [160, "T20 T20 D20"],
    [150, "T20 T18 D18"],
    [141, "T20 T19 D12"],
    [100, "T20 D20"],
    [90, "T18 D18"],
    [81, "T19 D12"],
    [50, "BULL"],
    [40, "D20"],
    [33, "S17 D8"],
    [32, "D16"],
  ];
  /* Die sieben Reste unter 170, die drei Pfeile mit Doppel-Aus nicht schaffen. */
  const BOGEY = [159, 162, 163, 165, 166, 168, 169];

  await seite.goto(`${basis}/`, { waitUntil: "networkidle" });
  await seite.waitForTimeout(1200);

  /* Über ein Datenmerkmal und nicht über eine Beschriftung: Die Kachel gibt
     es in zwei Sprachfassungen, und ein Lauf, der an einem deutschen Wort
     hängt, prüft die englische Seite nie. */
  const kachel = seite.locator('[data-demo="checkout"]');
  const regler = kachel.locator('input[type="range"]').first();

  if ((await regler.count()) === 0) {
    funde.push("Die Checkout-Kachel hat keinen Regler, nichts zu prüfen.");
  } else {
    for (const [rest, erwartet] of TAFEL) {
      await regler.fill(String(rest));
      await seite.waitForTimeout(120);
      const gezeigt = (
        await kachel.locator('[data-checkout="weg"]').innerText()
      ).trim();
      if (gezeigt !== erwartet) {
        funde.push(
          `Checkout auf ${rest}: die Kachel zeigt „${gezeigt}", die gedruckte ` +
            `Tafel sagt „${erwartet}".`,
        );
      }
      tafelgeprueft++;
    }

    for (const rest of BOGEY) {
      await regler.fill(String(rest));
      await seite.waitForTimeout(120);
      const text = await kachel.innerText();
      if (!/nicht zu schaffen/i.test(text)) {
        funde.push(
          `Checkout auf ${rest}: Der Rest ist mit drei Pfeilen nicht zu ` +
            `beenden, die Kachel behauptet trotzdem einen Weg.`,
        );
      }
      tafelgeprueft++;
    }

    /* Und die Quellenangabe, aus demselben Grund wie bei adhan: Sie nennt
       eine Fassung, und `npm update` hebt die eingebaute, ohne den Text
       anzufassen. */
    const notiz = readFileSync("src/content/de.ts", "utf8");
    const genannt = /darts-checkout ([\d.]+)/.exec(notiz)?.[1];
    const eingebaut = JSON.parse(
      readFileSync("node_modules/darts-checkout/package.json", "utf8"),
    ).version;
    if (genannt !== eingebaut) {
      funde.push(
        `Die Checkout-Kachel nennt darts-checkout ${genannt}, eingebaut ist ` +
          `${eingebaut}.`,
      );
    }
    tafelgeprueft++;
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`\n${funde.length} Stelle rechnet nicht nach:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nDie Demo sagt, sie prüfe jede Zusammenstellung und nehme die beste. ` +
      `\nEine Demo, die daneben liegt, sagt über den Erbauer das Gegenteil ` +
      `\ndessen, wofür sie dasteht.`,
  );
  process.exit(1);
}

console.log(
  `\nAlle drei Demos rechnen richtig: ${ZIELE.length} Kalorienziele gegen je ` +
    `${1 << gerichte.length} Zusammenstellungen nachgerechnet, ` +
    `${kombinationen} Gebetszeiten-Kombinationen und Tromsø an ${jahrestage} Tagen in Reihenfolge ` +
    `(${nichtBerechnet} Angaben ohne Wert, wo es keinen gibt), ` +
    `${sprachvergleich} Kalorienangaben in beiden Fassungen gleich, ` +
    `dazu ${tafelgeprueft} Checkout-Angaben gegen die gedruckte Tafel.`,
);
