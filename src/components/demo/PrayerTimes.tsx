"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Content } from "@/content/types";

/**
 * Ein Jahr Gebetszeiten, im Browser des Besuchers gerechnet.
 *
 * Kein Video, kein Bildschirmfoto, keine Nachbildung: Diese Kachel lädt
 * dieselbe Bibliothek, die in der ausgelieferten App rechnet (`adhan`, MIT),
 * und setzt dieselben Werte, die dort voreingestellt sind: Methode 13
 * (Diyanet), Schule 0 (schafiitisch). Nachgelesen in
 * `apps/mobile/src/features/prayer-times/calc.ts`.
 *
 * Der erste Anlauf zeigte einen einzelnen Tag: sechs Uhrzeiten und einen Bogen
 * darunter. Das war richtig gerechnet und trotzdem nichts wert — sechs Zahlen
 * anzuzeigen ist keine Leistung, die man vorführt, und wer sie sieht, kann
 * nicht unterscheiden, ob dahinter eine Bibliothek oder eine Textdatei steckt.
 *
 * Diese Fassung zeigt das ganze Jahr auf einmal und dazu die Stelle, an der die
 * Sache in Produktion wirklich schwierig wurde: Oberhalb von etwa 48° geht die
 * Sonne im Sommer nie tief genug unter den Horizont, und Fadschr und Ischa sind
 * nicht mehr eindeutig bestimmt. Es gibt drei übliche Regeln, sie liegen in
 * Berlin am 21. Juni über zwei Stunden auseinander, und keine ist
 * allgemeingültig richtig. Genau das ist hier umschaltbar, und das Band
 * verformt sich sichtbar dabei.
 *
 * Vier Bedingungen bestimmen den Aufbau:
 *
 * - **Nichts über die Leitung.** Die Datenschutzerklärung sagt, dass diese
 *   Seite keine Verbindung nach außen aufbaut, und `check:privacy` misst das.
 *   Die Rechnung läuft vollständig hier, wie in der App ohne Netz.
 * - **Nicht im ersten Bündel.** `adhan` wird erst geladen, wenn diese Kachel
 *   gebraucht wird, damit die Startseite davon nichts merkt.
 * - **Keine springende Zeile.** Das Band hat seine Höhe, bevor die Zahlen da
 *   sind; der Wechsel von Ort oder Regel ändert daran nichts.
 * - **Ohne Maus bedienbar.** Der Tag wird über einen Schieberegler gewählt und
 *   nicht über die Zeigerposition. Das Band selbst ist Darstellung und für
 *   Vorleseprogramme ausgeblendet — die sechs Zeiten stehen darunter als Text.
 */

/** Die Orte. Der letzte ist der Grenzfall, und er steht bewusst dabei. */
const ORTE = [
  { name: "Berlin", lat: 52.52, lon: 13.405, zone: "Europe/Berlin" },
  { name: "Istanbul", lat: 41.0082, lon: 28.9784, zone: "Europe/Istanbul" },
  { name: "Kairo", lat: 30.0444, lon: 31.2357, en: "Cairo", zone: "Africa/Cairo" },
  { name: "Tromsø", lat: 69.6496, lon: 18.956, zone: "Europe/Oslo" },
] as const;

/**
 * Die Zeitzone gehört zum Ort, nicht zum Betrachter.
 *
 * `adhan` liefert echte Zeitpunkte. Wer sie mit `getHours()` ausliest, bekommt
 * sie in der Zone des Browsers — und damit sah dieselbe Auswahl je nach
 * Standort des Lesers anders aus. Gemessen an der ausgelieferten Seite für
 * Tromsø am 5. August: aus Berlin „01:34 · 02:42 · 12:55 · 17:25 · 22:53 ·
 * 23:57", aus New York „19:34 −1 · 20:42 −1 · 06:55 …“, aus Tokio „08:37 ·
 * 09:48 · 19:55 · 00:24 +1 …" und Ischa gar nicht mehr berechenbar, weil der
 * Wert aus dem Tagesfenster fiel.
 *
 * Gerechnet wird deshalb in Ortszeit: Der Zeitpunkt wird über `Intl` in der
 * Zone des Ortes zerlegt, und die Minuten zählen ab dessen Mitternacht. Genau
 * so rechnet die App, die auf dem Gerät im Ort steht.
 */
function minutenImOrt(zeitpunkt: Date, zone: string, bezugstag: string) {
  const teile = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(zeitpunkt)
      .map((t) => [t.type, t.value]),
  );
  const tag = `${teile.year}-${teile.month}-${teile.day}`;
  const minuten = Number(teile.hour) * 60 + Number(teile.minute);
  const tagesversatz = Math.round(
    (Date.parse(`${tag}T00:00:00Z`) - Date.parse(`${bezugstag}T00:00:00Z`)) /
      86_400_000,
  );
  return minuten + tagesversatz * 1440;
}

/** Die fünf Pflichtgebete plus Sonnenaufgang, in der Reihenfolge des Tages. */
const GEBETE = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
type Gebet = (typeof GEBETE)[number];

/**
 * Die Regeln für hohe Breiten, in der Reihenfolge der Schaltflächen.
 *
 * `auto` ist keine eigene Regel der Bibliothek, sondern die Entscheidung der
 * App: oberhalb von 48° die winkelbasierte, darunter Mitte der Nacht. Hier
 * stand „die Standardrechnung", und das war an derselben Zeile Code die
 * zweite, andere Aussage — weiter unten steht sie richtig.
 *
 * Was das für die Schaltflächen heißt, ist nicht offensichtlich: An einem Ort
 * über 48° liefern „wie in der App" und „winkelbasiert" zwangsläufig
 * dieselben Zeiten, weil es dieselbe Rechnung ist. Gemessen in Tromsø, Berlin
 * und Kairo stimmen sie an allen drei Orten überein — unterhalb von 48° aus
 * einem anderen Grund: Dort wird der Dämmerungswinkel jeden Tag erreicht, und
 * dann greift keine der Ausweichregeln.
 */
const REGELN = ["auto", "angle", "seventh", "middle"] as const;
type Regel = (typeof REGELN)[number];

/** Ein Tag: sechs Zeitpunkte als Minuten seit Mitternacht, `null` = keine. */
type Tag = (number | null)[];

/** Das Band zeigt ein volles Jahr. Der Schalttag bleibt außen vor. */
const TAGE = 365;
const MINUTEN = 24 * 60;

/**
 * Die sechs Flächen zwischen den Zeiten, von der Nacht aufwärts gelesen.
 *
 * Die Farben sind der Tageslauf und keine Palette: Nacht dunkel, Dämmerung
 * violett, Tag neutral hell. Dadurch entsteht die Sanduhrform, an der man die
 * Jahreszeiten sieht, ohne dass eine Beschriftung es sagen müsste.
 *
 * Der Tag war zuerst grün, aus der Akzentfarbe der Seite. Grün mit niedriger
 * Deckung auf Schwarz ergibt Oliv, und das ganze Band wirkte trüb. Die
 * Akzentfarbe gehört den Linien: Flächen tragen die Tageszeit, Linien die
 * Aussage.
 */
const FLAECHEN = [
  { von: "isha", bis: "fajr", farbe: "var(--color-void)", deckung: 0.92 },
  { von: "fajr", bis: "sunrise", farbe: "var(--color-violet)", deckung: 0.45 },
  { von: "sunrise", bis: "dhuhr", farbe: "var(--color-ink)", deckung: 0.1 },
  { von: "dhuhr", bis: "asr", farbe: "var(--color-ink)", deckung: 0.17 },
  { von: "asr", bis: "maghrib", farbe: "var(--color-ink)", deckung: 0.1 },
  { von: "maghrib", bis: "isha", farbe: "var(--color-violet)", deckung: 0.4 },
] as const;

/** Höhe des Bandes im Koordinatensystem. Ein Tag ist eine Einheit breit. */
const HOEHE = 190;

/**
 * Der erste Tag jedes Monats, im Nicht-Schaltjahr.
 *
 * Ohne Raster ist das Band ein hübsches Bild und keine Ablesung: Man sieht,
 * dass sich etwas verändert, aber nicht wann. Zwölf Beschriftungen wären zu
 * viel — die Striche stehen für alle Monate, die Zahlen nur an den Quartalen.
 */
const MONATSANFANG = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Die Anfangsbuchstaben der Monate, deutsch wie englisch gleich bis auf zwei. */
const MONATE = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * Minuten seit Tagesbeginn als Uhrzeit.
 *
 * Die Werte können außerhalb eines Tages liegen: Mit der Regel „Mitte der
 * Nacht“ fällt Ischa in Berlin auf 00:02 des Folgetags (1.442) und Fadschr in
 * Tromsø auf 23:53 des Vortags (−7). Die Uhrzeit ist trotzdem die richtige,
 * sie gehört nur zu einem anderen Kalendertag — deshalb wird auf 24 Stunden
 * zurückgerechnet und der Tagesversatz als Zusatz genannt, statt ihn
 * wegzulassen.
 */
const uhrzeit = (m: number | null, fehlt: string) => {
  if (m === null) return fehlt;
  const tage = Math.floor(m / 1440);
  const rest = ((m % 1440) + 1440) % 1440;
  const zeit = `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;
  if (tage === 0) return zeit;
  return `${zeit} ${tage > 0 ? "+" : "−"}${Math.abs(tage)}`;
};

/** "2 h 34 min" statt "154 min": Als Spanne ist das sofort greifbar. */
function spanne(m: number) {
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}

/**
 * Der laufende Tag des Jahres im gewählten Ort, von 0 an gezählt.
 *
 * „Heute“ ist der Tag dort, nicht der beim Leser: Wer aus Auckland Berlin
 * wählt, sieht Berliner Zeiten und soll das Berliner Datum dazu bekommen.
 * Beim Wechsel des Ortes kann der Tag deshalb springen — genau dann, wenn er
 * es auch in Wirklichkeit tut.
 */
function tagDesJahresImOrt(zone: string, jetzt = new Date()) {
  const heute = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(jetzt);
  const jahr = Number(heute.slice(0, 4));
  return Math.round(
    (Date.parse(`${heute}T00:00:00Z`) - Date.UTC(jahr, 0, 1)) / 86_400_000,
  );
}

export function PrayerTimesDemo({ inhalt }: { inhalt: Content }) {
  const demo = inhalt.demoSalati;
  const [ort, setOrt] = useState(0);
  const [regel, setRegel] = useState<Regel>("auto");

  /* Der heutige Tag als fester Wert für diesen Aufruf.
     Nicht über die Uhr getaktet: Das Band ändert sich innerhalb einer Sitzung
     nicht, und ein Minutentakt würde nur dieselbe Zahl neu setzen. */
  const heuteNr = useMemo(
    () => Math.min(TAGE - 1, tagDesJahresImOrt(ORTE[ort].zone)),
    [ort],
  );
  const [tag, setTag] = useState(() =>
    Math.min(TAGE - 1, tagDesJahresImOrt(ORTE[0].zone)),
  );

  /* Beim Ortswechsel auf dessen heutigen Tag springen, solange der Regler noch
     auf „heute“ stand. Wer den Tag von Hand gewählt hat, behält ihn. */
  const [vorherHeute, setVorherHeute] = useState(heuteNr);
  if (heuteNr !== vorherHeute) {
    if (tag === vorherHeute) setTag(heuteNr);
    setVorherHeute(heuteNr);
  }

  /**
   * Das Jahr, alle vier Regeln nebeneinander.
   *
   * Alle auf einmal, weil die Spanne zwischen ihnen die eigentliche Aussage
   * ist. Gemessen kostet das zusammen etwa 20 ms — billiger, als beim
   * Umschalten jedes Mal neu zu rechnen, und ohne Ruckeln beim Klick.
   */
  const [jahr, setJahr] = useState<Record<Regel, Tag[]> | null>(null);
  const [dauer, setDauer] = useState<number | null>(null);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    let abgebrochen = false;

    (async () => {
      try {
        const adhan = await import("adhan");
        if (abgebrochen) return;

        const { lat, lon } = ORTE[ort];
        const koordinaten = new adhan.Coordinates(lat, lon);
        const jahrZahl = new Date().getFullYear();

        const nachRegel = {
          angle: adhan.HighLatitudeRule.TwilightAngle,
          seventh: adhan.HighLatitudeRule.SeventhOfTheNight,
          middle: adhan.HighLatitudeRule.MiddleOfTheNight,
          // Die Entscheidung der App, nachgebaut wie `resolveHighLatitudeRule`.
          auto:
            lat > 48
              ? adhan.HighLatitudeRule.TwilightAngle
              : adhan.HighLatitudeRule.MiddleOfTheNight,
        } satisfies Record<Regel, unknown>;

        const beginn = performance.now();
        const aus = {} as Record<Regel, Tag[]>;

        for (const r of REGELN) {
          const p = adhan.CalculationMethod.Turkey();
          p.madhab = adhan.Madhab.Shafi;
          p.highLatitudeRule = nachRegel[r];

          const tage: Tag[] = [];
          for (let i = 0; i < TAGE; i++) {
            const zeiten = new adhan.PrayerTimes(
              koordinaten,
              /* Mitternacht in der Browserzone, und das mit Absicht:
                 `adhan` liest aus dem Datum die Kalenderwerte des laufenden
                 Systems. Ein UTC-Mittag fällt in Auckland schon auf den
                 nächsten Tag — gemessen kam von dort für Tromsø „Fadschr
                 02:56 +1, Ischa nicht berechnet" heraus. So bleibt der
                 gemeinte Kalendertag überall derselbe; in welcher Zone seine
                 Uhrzeiten stehen, entscheidet `minutenImOrt`. */
              new Date(jahrZahl, 0, 1 + i),
              p,
            );
            /* Minuten seit Mitternacht DIESES Tages, nicht seit Mitternacht.

               `adhan` liefert echte Zeitpunkte, und die fallen an hohen
               Breiten auf den Nachbartag: Mit der Regel „Mitte der Nacht“
               steht Ischa in Berlin ab Mai um 00:02 — am Tag danach. Fadschr
               fällt in Tromsø umgekehrt auf 23:53 des Vortags.

               `getHours()` wirft das Datum weg. Ein Ischa um 00:02 landete
               damit als Zwei-Minuten-Wert am unteren Bildrand statt oben, und
               die Linie sprang durch das ganze Band. Gemessen an 365 Tagen:
               74 solcher Sprünge in Berlin, 99 in Tromsø.

               Die Differenz zum Tagesbeginn hält die Reihenfolge: Ischa
               bekommt 1.442 Minuten, Fadschr −7. Beides liegt außerhalb des
               gezeigten Tages und wird am Rand beschnitten — genau das ist die
               Aussage. Die Uhrzeiten in der Tafel darunter kommen weiterhin
               aus `getHours()` und stimmen. */
            const d0 = new Date(jahrZahl, 0, 1 + i);
            const bezugstag = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, "0")}-${String(d0.getDate()).padStart(2, "0")}`;
            tage.push(
              GEBETE.map((g) => {
                const d = zeiten[g];
                if (!(d instanceof Date) || Number.isNaN(d.getTime()))
                  return null;
                const m = minutenImOrt(d, ORTE[ort].zone, bezugstag);
                /* Was mehr als einen halben Tag vor dem Tag oder mehr als
                   sechs Stunden nach dem folgenden Mitternacht liegt, ist
                   keine Zeit dieses Tages mehr.

                   Gemessen: In Tromsø liefert `adhan` am 19. Januar für Asr
                   2.925 Minuten — 48 Stunden und 45 Minuten, also übermorgen.
                   Am Rand der Polarnacht erreicht die Sonne die Bedingung an
                   diesem Tag nie, und die Bibliothek rutscht auf den nächsten
                   Tag, an dem sie es tut. Die Nachbartage liegen bei 842 und
                   884. Gezeichnet ergab dieser eine Punkt einen senkrechten
                   Strich quer durch das ganze Band, der aussah wie ein
                   Zeichenfehler. Als Lücke ist er die Aussage: An diesem Tag
                   gibt es die Zeit nicht. Ischa um 00:02 des Folgetags
                   (1.442) und Fadschr um 23:53 des Vortags (−7) bleiben
                   davon unberührt. */
                return m < -720 || m > 1800 ? null : m;
              }),
            );
          }

          /* Die Kette muss steigen, sonst ist der Wert keiner.
             ---------------------------------------------------
             Die Grenzen oben fangen nur, was weit außerhalb des Tages liegt.
             Am Rand der Polarnacht liefert `adhan` aber auch Werte, die
             mitten im Tag stehen und trotzdem unmöglich sind: In Tromsø am
             16. November steht Asr auf 11:25 und Dhuhr auf 11:34 — Asr vor
             dem Sonnenhöchststand. Am 20. Januar liegt Asr um 14:44 nach
             Maghrib um 13:22.

             Der Grund ist derselbe wie oben: Die Sonne erreicht die
             Schattenbedingung an diesem Tag nicht, und die Bibliothek
             rechnet weiter, statt aufzugeben. Gemessen an der ausgelieferten
             Seite über alle 365 Tage: 21 solcher Fälle in Tromsø, keiner in
             Berlin, Istanbul oder Kairo.

             Gekappt wird auf den Sonnenuntergang, und zwar nicht nach eigenem
             Gutdünken: Genau das tut die ausgelieferte App in
             `apps/mobile/src/features/prayer-times/calc.ts`, und diese Kachel
             behauptet, dieselbe Rechnung zu zeigen. Dort steht die Begründung
             ausführlich — der Sonnenuntergang ist der Grenzwert der Formel,
             frühestens dann wäre die Schattenlänge erreicht, und die
             Reihenfolge Dhuhr < Asr ≤ Maghrib bleibt erhalten, auf die die
             Benachrichtigungen der App bauen. Aladhan kappt in denselben
             Fällen auf Dhuhr, was die Schattenbedingung eindeutig verletzt.

             Zwei Anläufe davor waren falsch. Der erste strich jeden Wert vor
             seinem Vorgänger und traf am 15. Januar den Sonnenuntergang statt
             Asr. Der zweite setzte Asr auf „nicht berechnet" — richtig
             geordnet, aber eine dritte Variante neben App und Aladhan, und
             damit eine Kachel, die etwas anderes zeigt als das Produkt, auf
             das sie sich beruft.

             Fadschr und Ischa bleiben unangetastet: Die App behandelt sie
             nicht, und die 21 gemessenen Fälle waren ausnahmslos Asr. */
          const DHUHR = GEBETE.indexOf("dhuhr");
          const ASR = GEBETE.indexOf("asr");
          const MAGHRIB = GEBETE.indexOf("maghrib");

          const FAJR = GEBETE.indexOf("fajr");
          const SONNENAUFGANG = GEBETE.indexOf("sunrise");

          for (const tag of tage) {
            const asr = tag[ASR];
            const dhuhr = tag[DHUHR];
            const maghrib = tag[MAGHRIB];
            if (asr !== null) {
              const gueltig =
                (dhuhr === null || asr > dhuhr) &&
                (maghrib === null || asr <= maghrib);
              /* Ohne Sonnenuntergang gibt es nichts, worauf sich kappen ließe:
                 In der Polarnacht ist Maghrib selbst unbestimmt, und ein
                 gekappter Wert bräuchte einen Grenzwert. Dann bleibt nur die
                 Lücke. Gemessen: Tromsø, 27. bis 30. November. */
              if (!gueltig) tag[ASR] = maghrib;
            }

            /* Fadschr nach dem Sonnenaufgang kappt die App nicht, weil sie
               „Siebtel der Nacht" nicht anbietet — hier ist die Regel
               wählbar, und sie liefert am 16. Mai in Tromsø Fadschr um 01:13
               bei Sonnenaufgang um 01:10. Einen Grenzwert wie beim Schatten
               gibt es hier nicht: Die Dämmerung beginnt entweder oder nicht.
               Deshalb die Lücke und keine erfundene Uhrzeit. */
            const fajr = tag[FAJR];
            const aufgang = tag[SONNENAUFGANG];
            if (fajr !== null && aufgang !== null && fajr > aufgang) {
              tag[FAJR] = null;
            }
          }

          aus[r] = tage;
        }

        if (abgebrochen) return;
        setDauer(Math.round(performance.now() - beginn));
        setJahr(aus);
      } catch {
        if (!abgebrochen) setFehler(true);
      }
    })();

    return () => {
      abgebrochen = true;
    };
  }, [ort]);

  const tage = jahr?.[regel] ?? null;
  const heutiger = tage?.[tag] ?? null;

  /**
   * Die Flächen als Pfade.
   *
   * Jede Fläche wird in Stücke zerlegt, sobald ein Tag keine Zeit hat: In
   * Tromsø sind das 117 von 365 Tagen, und ein durchgezogener Pfad würde
   * quer über die Lücke laufen und eine Zeit behaupten, die es nicht gibt.
   */
  const pfade = useMemo(() => {
    if (!tage) return null;

    /* Die Flächen werden auf den gezeigten Tag geklemmt.

       Seit die Minuten den Tagesversatz mitführen, liegt Ischa an hohen
       Breiten über 1.440 und Fadschr unter 0. Eine Fläche, die dorthin
       läuft, wäre oben und unten offen; geklemmt endet sie am Rand, und
       genau dort geht sie ja auch in den Nachbartag über. Die Linien darunter
       bleiben ungeklemmt — sie sollen das Bild verlassen. */
    const y = (m: number) =>
      HOEHE - (Math.min(Math.max(m, 0), MINUTEN) / MINUTEN) * HOEHE;
    const spalte = (g: string) => GEBETE.indexOf(g as Gebet);

    /** Aus oberer und unterer Kante ein geschlossenes Stück machen. */
    const stueck = (oben: string[], unten: string[]) =>
      oben.length > 1
        ? `M ${oben.join(" L ")} L ${[...unten].reverse().join(" L ")} Z`
        : "";

    return FLAECHEN.map((f) => {
      const stuecke: string[] = [];
      let oben: string[] = [];
      let unten: string[] = [];

      // Die Nacht läuft über Mitternacht und zerfällt deshalb in zwei Bänder:
      // von Ischa bis zum oberen Rand und vom unteren Rand bis Fadschr.
      const ueberNacht = f.von === "isha";

      for (let i = 0; i < TAGE; i++) {
        const a = tage[i][spalte(f.von)];
        const b = tage[i][spalte(f.bis)];
        if (a === null || b === null) {
          stuecke.push(stueck(oben, unten));
          oben = [];
          unten = [];
          continue;
        }
        oben.push(`${i} ${ueberNacht ? y(a) : y(b)}`);
        unten.push(`${i} ${ueberNacht ? 0 : y(a)}`);
      }
      stuecke.push(stueck(oben, unten));

      if (ueberNacht) {
        oben = [];
        unten = [];
        for (let i = 0; i < TAGE; i++) {
          const fajr = tage[i][spalte("fajr")];
          if (fajr === null) {
            stuecke.push(stueck(oben, unten));
            oben = [];
            unten = [];
            continue;
          }
          oben.push(`${i} ${HOEHE}`);
          unten.push(`${i} ${y(fajr)}`);
        }
        stuecke.push(stueck(oben, unten));
      }

      return { ...f, d: stuecke.filter(Boolean).join(" ") };
    });
  }, [tage]);

  /** Aus einem Jahr die sechs Linienzuege machen. */
  const linienAus = useCallback((quelle: Tag[] | null) => {
    if (!quelle) return null;
    const y = (m: number) => HOEHE - (m / MINUTEN) * HOEHE;

    return GEBETE.map((g, spalte) => {
      const stuecke: string[] = [];
      let punkte: string[] = [];
      for (let i = 0; i < TAGE; i++) {
        const m = quelle[i][spalte];
        if (m === null) {
          if (punkte.length > 1) stuecke.push(`M ${punkte.join(" L ")}`);
          punkte = [];
          continue;
        }
        punkte.push(`${i} ${y(m)}`);
      }
      if (punkte.length > 1) stuecke.push(`M ${punkte.join(" L ")}`);
      return { name: g, d: stuecke.join(" ") };
    });
  }, []);

  /** Die Linien der sechs Zeiten, damit die Kanten scharf bleiben. */
  const linien = useMemo(() => linienAus(tage), [tage, linienAus]);

  /**
   * Die beiden anderen Regeln als feine Geisterlinien.
   *
   * Der eigentliche Befund ist nicht, wo Fadschr liegt, sondern wie weit die
   * Regeln auseinanderliegen — und das sah man vorher erst, wenn man auf jede
   * Schaltflaeche einzeln klickte und sich das Bild merkte. Mit den Geistern
   * steht die Spanne im Bild: Im Winter fallen die Linien zusammen, ab Mai
   * laufen sie auf ueber zwei Stunden auseinander. Nur Fadschr und Ischa,
   * weil nur die beiden von der Regel abhaengen.
   */
  const geister = useMemo(() => {
    if (!jahr) return null;

    /* Welche der drei Regeln gerade wirklich rechnet.
       `auto` ist keine eigene Rechnung, sondern die Entscheidung der App: über
       48° die winkelbasierte, darunter Mitte der Nacht. Verglichen wurde hier
       vorher `jahr[r] !== jahr[regel]` — zwei verschiedene Felder, also nie
       gleich. In Tromsø mit „wie in der App" lag deshalb eine gestrichelte
       Geisterlinie Punkt für Punkt auf der durchgezogenen: sechs Geisterpfade
       statt vier, die Legende sprach von „den beiden anderen", und ein Wechsel
       der Regel veränderte das Bild scheinbar nicht. */
    const wirksam =
      regel === "auto" ? (ORTE[ort].lat > 48 ? "angle" : "middle") : regel;
    const andere = (["angle", "seventh", "middle"] as const).filter(
      (r) => r !== wirksam,
    );
    return andere
      .map((r) => linienAus(jahr[r]))
      .filter(Boolean)
      .flatMap((l) => l!.filter((x) => x.name === "fajr" || x.name === "isha"));
  }, [jahr, ort, regel, linienAus]);

  /** Wie weit die drei Regeln an diesem Tag bei Fadschr auseinanderliegen. */
  const abstand = useMemo(() => {
    if (!jahr) return null;
    const werte = (["angle", "seventh", "middle"] as const)
      .map((r) => jahr[r][tag]?.[0])
      .filter((m): m is number => typeof m === "number");
    if (werte.length < 2) return null;
    return Math.max(...werte) - Math.min(...werte);
  }, [jahr, tag]);

  /**
   * Die Tage, an denen die Rechnung an diesem Ort kein Ergebnis liefert.
   *
   * Als zusammenhaengende Bereiche und nicht als Zahl: In Tromsø sind es 117
   * Tage am Stück, und ohne Markierung sieht die Stelle im Band wie ein
   * Zeichenfehler aus. Markiert ist sie die Aussage — dort gibt es die Nacht
   * nicht, auf die sich die Rechnung bezieht.
   */
  const luecken = useMemo(() => {
    if (!tage) return [];
    const raus: { von: number; bis: number }[] = [];
    let offen: number | null = null;
    for (let i = 0; i < TAGE; i++) {
      const leer = tage[i].some((m) => m === null);
      if (leer && offen === null) offen = i;
      if (!leer && offen !== null) {
        raus.push({ von: offen, bis: i });
        offen = null;
      }
    }
    if (offen !== null) raus.push({ von: offen, bis: TAGE });
    return raus;
  }, [tage]);

  const lueckenTage = useMemo(
    () => luecken.reduce((n, l) => n + (l.bis - l.von), 0),
    [luecken],
  );

  const datum = useMemo(
    () =>
      new Date(new Date().getFullYear(), 0, 1 + tag).toLocaleDateString(
        inhalt.lang === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long" },
      ),
    [tag, inhalt.lang],
  );

  const ortName = (o: (typeof ORTE)[number]) =>
    inhalt.lang === "en" && "en" in o ? o.en : o.name;

  return (
    /* `no-print`: Eine Vorführung, die man anfassen muss, gehört nicht auf
       Papier. Gemessen kam sie dort auch nicht an: `check:print` lädt frisch
       und druckt sofort, und in diesem Moment ist die Rechnung noch nicht
       durch — auf dem Blatt stand eine Kachel mit leeren Feldern. Was die
       Aussage trägt, steht in der Fallstudie darüber. */
    <div
      /* Ein Merkmal, an dem eine Prüfung erkennt, dass die Kachel fertig
         gerechnet hat. Ohne das misst jeder Lauf einen Zustand, den kein
         Besucher je sieht: leere Felder. Genau daran ging eine schwarze Zahl
         auf schwarzem Grund durch die Barrierefreiheitsprüfung — zur Messzeit
         stand dort noch kein Text, und was nicht dasteht, hat auch keinen
         Kontrast. */
      data-demo-fertig={jahr ? "" : undefined}
      className="lit no-print rounded-2xl border border-line bg-surface/50 p-6 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* `h4` und nicht `h3`: Die Kachel steckt in der Fallstudie, und deren
            Name ist das `h3`. Als `h3` stand sie in der Überschriftengliederung
            neben den Projekten — der Abschnitt heißt „Vier Produkte“, gezählt
            wurden dort sechs, und Salatis „Ausführlich nachzulesen“ hing
            anschließend unter der Kachel statt unter dem Projekt. */}
        <h4 className="text-base font-semibold tracking-tight text-ink">
          {demo.title}
        </h4>
        {/* Die gemessene Rechenzeit steht dabei, weil sie die Aussage trägt:
            Was hier passiert, ist Rechnen und kein Abrufen. */}
        <p className="font-mono text-[11px] text-ink-faint tabular-nums">
          {dauer === null ? " " : demo.speed.replace("{ms}", String(dauer))}
        </p>
      </div>

      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {demo.lede}
      </p>

      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
        <div
          role="group"
          aria-label={demo.placeLabel}
          className="flex flex-wrap gap-1.5"
        >
          {ORTE.map((o, i) => (
            <button
              key={o.name}
              type="button"
              onClick={() => setOrt(i)}
              aria-pressed={ort === i}
              className={
                ort === i
                  ? "rounded-full border border-acid/50 bg-acid/10 px-3 py-1.5 text-[12px] text-ink"
                  : "rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim"
              }
            >
              {ortName(o)}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label={demo.ruleLabel}
          className="flex flex-wrap gap-1.5"
        >
          {REGELN.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegel(r)}
              aria-pressed={regel === r}
              className={
                regel === r
                  ? "rounded-full border border-violet/50 bg-violet/10 px-3 py-1.5 text-[12px] text-ink"
                  : "rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim"
              }
            >
              {demo.rules[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Was „wie in der App" hier bedeutet.

          Zwei der vier Schaltflächen sind ohne diesen Satz nicht zu
          unterscheiden: Über 48° ist `auto` dieselbe Rechnung wie `angle`,
          darunter wird der Dämmerungswinkel jeden Tag erreicht und keine
          Ausweichregel greift. Gemessen liefern die beiden in Tromsø, Berlin
          und Kairo überall dieselben Zeiten — wer zwischen ihnen wechselt,
          sieht nichts geschehen und hält die Demo für kaputt.

          Der Satz steht nur bei `auto`: Bei den drei anderen ist die
          Beschriftung selbst die Antwort, und eine Zeile, die immer dasteht,
          liest nach dem zweiten Mal niemand mehr.

          `min-h`, damit das Ein- und Ausblenden nichts verschiebt. */}
      <p className="mt-2 min-h-[1.25rem] font-mono text-[11px] text-ink-faint">
        {regel === "auto"
          ? demo.autoIst.replace(
              "{regel}",
              demo.rules[ORTE[ort].lat > 48 ? "angle" : "middle"],
            )
          : ""}
      </p>

      {/* Feste Hoehe: Der Wechsel von Ort oder Regel darf nichts verschieben.
          Links bleibt Platz fuer die Stundenskala, unten fuer die Monate. Beide
          stehen als Text daneben und nicht im Bild: `preserveAspectRatio` ist
          "none", die Breite wird also gestreckt, und ein `<text>` im SVG kaeme
          dadurch verzerrt heraus. */}
      <div className="relative mt-5 pb-5 pl-8">
        <div className="relative h-[190px] overflow-hidden rounded-xl border border-line bg-base">
          {pfade && linien ? (
            <svg
              viewBox={`0 0 ${TAGE} ${HOEHE}`}
              preserveAspectRatio="none"
              aria-hidden
              className="size-full"
            >
              {pfade.map((f) => (
                <path
                  key={f.von}
                  d={f.d}
                  fill={f.farbe}
                  fillOpacity={f.deckung}
                />
              ))}

              {/* Wo nichts gerechnet werden kann, steht auch nichts — aber
                  sichtbar. */}
              {luecken.map((l) => (
                <rect
                  key={l.von}
                  x={l.von}
                  y={0}
                  width={l.bis - l.von}
                  height={HOEHE}
                  fill="var(--color-warn)"
                  fillOpacity={0.13}
                />
              ))}

              {/* Das Raster liegt ueber den Flaechen und unter den Linien:
                  darunter verschwindet es in der Nacht, darueber zerschneidet
                  es die Gebetszeiten. */}
              {MONATSANFANG.slice(1).map((t) => (
                <line
                  key={t}
                  x1={t}
                  x2={t}
                  y1={0}
                  y2={HOEHE}
                  stroke="var(--color-ink)"
                  strokeOpacity={0.09}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {[6, 12, 18].map((h) => (
                <line
                  key={h}
                  x1={0}
                  x2={TAGE}
                  y1={HOEHE - (h / 24) * HOEHE}
                  y2={HOEHE - (h / 24) * HOEHE}
                  stroke="var(--color-ink)"
                  strokeOpacity={0.09}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Die anderen Regeln, so leise, dass sie nur als Spanne wirken.
                  Dieselbe Farbe wie die gewählte Regel, nur gestrichelt und
                  blass: Es ist dieselbe Größe unter einer anderen Annahme, und
                  eine zweite Farbe hätte behauptet, es sei etwas anderes. */}
              {geister?.map((g, i) => (
                <path
                  key={i}
                  d={g.d}
                  fill="none"
                  stroke="var(--color-acid)"
                  strokeOpacity={0.38}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Fadschr und Ischa kraeftiger als der Rest: Sie sind die beiden
                  Zeiten, die von der Regel abhaengen, und damit das, worauf die
                  Schaltflaechen darueber wirken.

                  Gruen und nicht violett, obwohl violett hier die Farbe der
                  Daemmerung ist — und genau deshalb: Die beiden Daemmerungs-
                  flaechen sind in Tromsø im Sommer fast das halbe Bild, und
                  eine violette Linie darin war nicht mehr zu finden. Jetzt
                  traegt Violett die Tageszeit, Gruen die Aussage: Was gruen
                  ist, haengt am Schalter. Die vier uebrigen Zeiten stehen
                  neutral daneben, sie aendern sich nie. */}
              {linien.map((l) => {
                const betroffen = l.name === "fajr" || l.name === "isha";
                return (
                  <path
                    key={l.name}
                    d={l.d}
                    fill="none"
                    stroke={
                      betroffen ? "var(--color-acid)" : "var(--color-ink)"
                    }
                    strokeOpacity={betroffen ? 0.95 : 0.4}
                    strokeWidth={betroffen ? 1.4 : 1}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {/* Zwei Striche, zwei Bedeutungen: Der gestrichelte steht fest
                  auf heute, der durchgezogene folgt dem Regler. */}
              <line
                x1={heuteNr}
                x2={heuteNr}
                y1={0}
                y2={HOEHE}
                stroke="var(--color-ink-faint)"
                strokeWidth={1}
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={tag}
                x2={tag}
                y1={0}
                y2={HOEHE}
                stroke="var(--color-acid)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : (
            <div className="grid size-full place-items-center">
              <p className="font-mono text-[11px] text-ink-faint">
                {fehler ? demo.failed : " "}
              </p>
            </div>
          )}
        </div>

        {/* Stunden links, Monate unten. Als Text, damit sie in jeder Breite
            gleich gross bleiben. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 flex h-[190px] w-7 flex-col justify-between py-[1px] text-right font-mono text-[9px] text-ink-faint/80"
        >
          <span>24</span>
          <span>18</span>
          <span>12</span>
          <span>06</span>
          <span>00</span>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 left-8 flex justify-between pt-1 font-mono text-[9px] text-ink-faint/80"
        >
          {MONATE.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>

      {/* Der Regler ist die Bedienung, nicht das Band: mit der Tastatur
          erreichbar, und ein Vorleseprogramm sagt das Datum statt „180“. */}
      <label className="mt-4 block">
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-eyebrow">{demo.dayLabel}</span>
          <span className="font-mono text-[11px] text-ink tabular-nums">
            {datum}
            {tag === heuteNr ? ` · ${demo.today}` : ""}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={TAGE - 1}
          value={tag}
          onChange={(e) => setTag(Number(e.target.value))}
          aria-valuetext={datum}
          /* 24 px hoch statt 16, über `py-1` mit ausgleichendem `-my-1`:
          Die sichtbare Spur bleibt schlank, die Trefferfläche erreicht das
          Maß aus WCAG 2.5.8. Nötig war das nicht — der Regler steht allein,
          und damit greift die Abstandsausnahme der Norm. Am Finger ist der
          Unterschied trotzdem zu spüren, und es kostet nichts. */
          className="mt-2 -my-1 w-full py-1 accent-acid"
        />
      </label>

      {/* Was der Wechsel ändert, wird angesagt.

          Ort, Regel und Tag tauschen sechs Uhrzeiten und die Spanne aus, ohne
          dass sich am Aufbau etwas ändert. Wer sieht, merkt es sofort; wer
          sich vorlesen lässt, hörte nichts. Angesagt werden der Ort und die
          beiden Zeiten, an denen die Regel hängt — sechs Uhrzeiten
          hintereinander sind eine Liste, die niemand behält. */}
      <p role="status" aria-live="polite" className="sr-only">
        {heutiger
          ? `${ortName(ORTE[ort])}, ${datum}: ${demo.prayers.fajr} ${uhrzeit(heutiger[0], demo.failed)}, ${demo.prayers.isha} ${uhrzeit(heutiger[5], demo.failed)}`
          : ""}
      </p>

      <dl className="mt-4 grid min-h-[4.5rem] grid-cols-2 gap-x-6 gap-y-3 min-[420px]:grid-cols-3 sm:grid-cols-6">
        {GEBETE.map((g, i) => (
          <div key={g}>
            {/* `break-words`, weil die Beschriftung ein einziges Wort sein
                kann: „SONNENAUFGANG“ mit gesperrten Versalien ist 96 px breit,
                und bei 320 px hat die Spalte 94. Ohne Umbruchpunkt schneidet
                der Browser ab, statt umzubrechen — gemessen an der gebauten
                Seite bei 320 und 768 px. */}
            <dt className="font-mono text-[10px] tracking-[0.14em] break-words text-ink-faint uppercase">
              {demo.prayers[g]}
            </dt>
            <dd className="mt-1 font-mono text-lg text-ink tabular-nums">
              {heutiger ? uhrzeit(heutiger[i], demo.failed) : " "}
            </dd>
          </div>
        ))}
      </dl>

      {/* Die Spanne ist der Befund, nicht die Uhrzeit darüber. Sie steht
          deshalb als Wert und nicht als Nebensatz. */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line pt-4">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-eyebrow">{demo.spread}</span>
          {/* `text-[1rem]` und nicht `text-base`: In diesem Farbsystem gibt es
              ein Token `--color-base`, und Tailwind erzeugt daraus neben der
              Schriftgröße auch eine Farbe. In der Reihenfolge der Stilvorlage
              steht `.text-base` hinter `.text-acid` und gewinnt — die Zahl kam
              in der Farbe des Hintergrunds heraus, gemessen 1,01:1. Mit
              `text-violet` fiel das nie auf, weil „violet“ alphabetisch hinter
              „base“ liegt. */}
          <span className="font-mono text-[1rem] text-acid tabular-nums">
            {/* Solange nichts gerechnet ist, steht hier nichts. Ein
                Platzhalterstrich war zuerst da und wurde von
                `check:typography` zu Recht als Gedankenstrich im englischen
                Text gemeldet: Auf /en steht dieses Zeichen nicht. */}
            {abstand === null ? " " : spanne(abstand)}
          </span>
        </p>
        {lueckenTage > 0 ? (
          <p className="font-mono text-[11px] text-warn">
            {demo.gap.replace("{n}", String(lueckenTage))}
          </p>
        ) : null}

        {/* Legende zu den Linien im Band. Ohne sie sind die gestrichelten
            Linien ein Rätsel, und ein Rätsel ist keine Vorführung. */}
        <p
          aria-hidden
          className="flex basis-full items-center gap-4 font-mono text-[10px] text-ink-faint sm:ml-auto sm:basis-auto"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-px w-5 bg-acid" />
            {demo.legend.active}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-5 bg-acid/40 [background-image:repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_5px)]" />
            {demo.legend.others}
          </span>
        </p>
      </div>

      <p className="mt-3 max-w-[68ch] text-[13px] leading-relaxed text-ink-dim text-pretty">
        {demo.hardPart}
      </p>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-faint">
        {demo.note}
      </p>
    </div>
  );
}
