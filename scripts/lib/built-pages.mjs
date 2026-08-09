import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Die Adressen aller gebauten Seiten, aus dem Bau gelesen.
 *
 * Fünf Prüfläufe brauchen dieselbe Liste und brachten sie fünfmal mit:
 * denselben Baumdurchlauf, dieselbe Umwandlung von Dateipfad zu Adresse,
 * dieselbe Ausnahme für Bau-Interna. Wortgleich, Zeichen für Zeichen. Beim
 * sechsten Mal hätte jemand eine der fünf Fassungen erwischt und die anderen
 * übersehen; genau so entsteht ein Wächter, der eine Seite nicht mehr prüft,
 * ohne dass es auffällt.
 *
 * Zwei Eigenheiten, die hier begründet stehen statt fünfmal kommentiert:
 *
 * - **Namen mit führendem Unterstrich fallen heraus.** `_not-found.html` und
 *   `_global-error.html` sind Bau-Interna und keine Adressen. Die 404 wird
 *   trotzdem geprüft, aber über eine erfundene Adresse, nur so kommt sie so
 *   heraus, wie Next sie ausliefert.
 * - **`/index` wird zu `/`.** Der Bau legt die Startseite als `index.html` ab;
 *   ausgeliefert wird sie unter der Wurzel.
 */
/**
 * Sagt Nein, wenn der gebaute Stand älter ist als die Quellen.
 *
 * Diese Läufe messen die ausgelieferte Seite, und genau das macht sie
 * angreifbar: Ein Lauf gegen einen alten Build ist nicht falsch, er ist
 * unbemerkt beantwortet. Gemessen am 07.08.2026: `check:typography` lief
 * lokal grün, während der Text, den es hätte finden müssen, seit Minuten
 * in `site.ts` stand. In der CI, die immer frisch baut, fiel er sofort auf.
 * Ein grüner Lauf hier und ein roter dort ist das teuerste Ergebnis von
 * allen, weil man dem eigenen Rechner danach nicht mehr glaubt.
 *
 * Verglichen werden Zeitstempel, nicht Inhalte: `.next/BUILD_ID` entsteht am
 * Ende jedes Baus, alles unter `src/` davor. Ist eine Quelle jünger, bricht
 * der Lauf mit dem Befehl ab, der ihn wieder gültig macht.
 */
export function pruefeBaustand() {
  const bauStempel = statSync(".next/BUILD_ID", { throwIfNoEntry: false })?.mtimeMs;
  if (!bauStempel)
    throw new Error("Kein gebauter Stand vorhanden. Erst `npm run build`.");

  let neuste = 0;
  let woher = "";
  const gehe = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) {
        gehe(pfad);
        continue;
      }
      const wann = statSync(pfad).mtimeMs;
      if (wann > neuste) {
        neuste = wann;
        woher = pfad;
      }
    }
  };
  gehe("src");

  if (neuste > bauStempel)
    throw new Error(
      `Der gebaute Stand ist älter als die Quellen (${woher}). ` +
        "Dieser Lauf würde die vorige Fassung messen. Erst `npm run build`.",
    );
}

export function gebauteSeiten(bauOrdner = join(".next", "server", "app")) {
  pruefeBaustand();
  const pfade = [];

  const suchen = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) suchen(pfad);
      else if (eintrag.name.endsWith(".html")) {
        const route = pfad.slice(bauOrdner.length).replace(/\\/g, "/").replace(/\.html$/, "");
        if (!route.split("/").pop().startsWith("_")) pfade.push(route === "/index" ? "/" : route);
      }
    }
  };

  suchen(bauOrdner);
  return pfade.sort();
}

/**
 * Die Adressen der veröffentlichten Seiten, aus der Sitemap der Live-Adresse.
 *
 * Für Läufe gegen Produktion gibt es keinen Bau, aus dem sich die Liste lesen
 * ließe: Der tägliche Lauf checkt aus und misst, ohne zu bauen. Gemessen an
 * `.next/server/app` scheitert er mit ENOENT, und ein Wächter, der wegen
 * seiner Seitenliste stirbt, prüft gar nichts.
 *
 * Die Sitemap ist für diesen Fall auch die richtige Quelle: Sie nennt genau
 * das, was veröffentlicht ist. Der Bau kennt daneben Seiten, die bewusst nicht
 * indexiert werden.
 */
/**
 * Die beiden Adressen, unter denen die Fehlerseite herauskommt.
 *
 * Sie steht in keiner Liste gebauter Seiten: Im Bau liegt sie als
 * `_not-found.html`, und der führende Unterstrich schließt sie aus, mit
 * gutem Grund, denn die Datei ist nicht die Antwort, die ein Besucher
 * bekommt. Die entsteht pro Anfrage und liest ihre Sprache aus einer
 * Kopfzeile, die der Proxy setzt.
 *
 * Die Folge war eine Lücke mit System: Ausgerechnet die Seite, die jeder
 * Vertipper zu sehen bekommt, fiel aus jedem Lauf heraus, der seine Liste
 * aus dem Bau nimmt. `check-a11y` und `check-privacy` trugen die beiden
 * Adressen deshalb je einmal selbst ein, zweimal dieselbe Zeile, und beim
 * dritten Lauf hätte sie jemand vergessen.
 *
 * Nur für Läufe, die einen Server befragen. Wer Dateien liest, kann diese
 * Seite nicht messen: Es gibt sie als Datei nicht.
 */
export const FEHLERSEITEN = [
  "/diese-adresse-gibt-es-nicht",
  "/en/this-address-does-not-exist",
];

export async function veroeffentlichteSeiten(basis) {
  const antwort = await fetch(`${basis}/sitemap.xml`);
  if (!antwort.ok) {
    throw new Error(
      `${basis}/sitemap.xml antwortet mit ${antwort.status}. Ohne sie gibt es ` +
        `keine Liste der veröffentlichten Seiten.`,
    );
  }
  const xml = await antwort.text();
  const pfade = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((treffer) => treffer[1].replace(basis, "") || "/")
    .filter((pfad) => pfad.startsWith("/"));

  if (pfade.length === 0) {
    throw new Error(`${basis}/sitemap.xml nennt keine Adresse.`);
  }
  return [...new Set(pfade)].sort();
}
