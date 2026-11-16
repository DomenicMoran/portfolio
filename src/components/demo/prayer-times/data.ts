export const ORTE = [
  { name: "Berlin", lat: 52.52, lon: 13.405, zone: "Europe/Berlin" },
  { name: "Istanbul", lat: 41.0082, lon: 28.9784, zone: "Europe/Istanbul" },
  {
    name: "Kairo",
    lat: 30.0444,
    lon: 31.2357,
    en: "Cairo",
    zone: "Africa/Cairo",
  },
  { name: "Tromsø", lat: 69.6496, lon: 18.956, zone: "Europe/Oslo" },
] as const;

/**
 * Die Zeitzone gehört zum Ort, nicht zum Betrachter.
 *
 * `adhan` liefert echte Zeitpunkte. Wer sie mit `getHours()` ausliest, bekommt
 * sie in der Zone des Browsers, und damit sah dieselbe Auswahl je nach
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

/** Die fünf Pflichtgebete plus Sonnenaufgang, in der Reihenfolge des Tages. */
export const GEBETE = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

/**
 * Die Regeln für hohe Breiten, in der Reihenfolge der Schaltflächen.
 *
 * `auto` ist keine eigene Regel der Bibliothek, sondern die Entscheidung der
 * App: oberhalb von 48° die winkelbasierte, darunter Mitte der Nacht. Hier
 * stand „die Standardrechnung", und das war an derselben Zeile Code die
 * zweite, andere Aussage, weiter unten steht sie richtig.
 *
 * Was das für die Schaltflächen heißt, ist nicht offensichtlich: An einem Ort
 * über 48° liefern „wie in der App" und „winkelbasiert" zwangsläufig
 * dieselben Zeiten, weil es dieselbe Rechnung ist. Gemessen in Tromsø, Berlin
 * und Kairo stimmen sie an allen drei Orten überein, unterhalb von 48° aus
 * einem anderen Grund: Dort wird der Dämmerungswinkel jeden Tag erreicht, und
 * dann greift keine der Ausweichregeln.
 */
export const REGELN = ["auto", "angle", "seventh", "middle"] as const;

/** Das Band zeigt ein volles Jahr. Der Schalttag bleibt außen vor. */
export const TAGE = 365;
export const MINUTEN = 24 * 60;

/**
 * Die sechs Flächen zwischen den Zeiten, von der Nacht aufwärts gelesen.
 *
 * Die Farben sind der Tageslauf und keine Palette: Nacht dunkel, Dämmerung
 * mit Akzent, Tag neutral hell. Dadurch entsteht die Sanduhrform, an der man die
 * Jahreszeiten sieht, ohne dass eine Beschriftung es sagen müsste.
 *
 * Der Tag war zuerst grün, aus der Akzentfarbe der Seite. Grün mit niedriger
 * Deckung auf Schwarz ergibt Oliv, und das ganze Band wirkte trüb. Die
 * Akzentfarbe gehört den Linien: Flächen tragen die Tageszeit, Linien die
 * Aussage.
 */
export const FLAECHEN = [
  { von: "isha", bis: "fajr", farbe: "var(--color-void)", deckung: 0.92 },
  { von: "fajr", bis: "sunrise", farbe: "var(--color-acid)", deckung: 0.45 },
  { von: "sunrise", bis: "dhuhr", farbe: "var(--color-ink)", deckung: 0.1 },
  { von: "dhuhr", bis: "asr", farbe: "var(--color-ink)", deckung: 0.17 },
  { von: "asr", bis: "maghrib", farbe: "var(--color-ink)", deckung: 0.1 },
  { von: "maghrib", bis: "isha", farbe: "var(--color-acid)", deckung: 0.4 },
] as const;

/** Höhe des Bandes im Koordinatensystem. Ein Tag ist eine Einheit breit. */
export const HOEHE = 190;

/**
 * Der erste Tag jedes Monats, im Nicht-Schaltjahr.
 *
 * Ohne Raster ist das Band ein hübsches Bild und keine Ablesung: Man sieht,
 * dass sich etwas verändert, aber nicht wann. Zwölf Beschriftungen wären zu
 * viel, die Striche stehen für alle Monate, die Zahlen nur an den Quartalen.
 */
export const MONATSANFANG = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
];

/** Die Anfangsbuchstaben der Monate, deutsch wie englisch gleich bis auf zwei. */
export const MONATE = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

export type Gebet = (typeof GEBETE)[number];
export type Regel = (typeof REGELN)[number];
export type Tag = (number | null)[];
