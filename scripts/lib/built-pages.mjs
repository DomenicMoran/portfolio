import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Die Adressen aller gebauten Seiten, aus dem Bau gelesen.
 *
 * Fünf Prüfläufe brauchen dieselbe Liste und brachten sie fünfmal mit —
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
 *   trotzdem geprüft, aber über eine erfundene Adresse — nur so kommt sie so
 *   heraus, wie Next sie ausliefert.
 * - **`/index` wird zu `/`.** Der Bau legt die Startseite als `index.html` ab;
 *   ausgeliefert wird sie unter der Wurzel.
 */
export function gebauteSeiten(bauOrdner = join(".next", "server", "app")) {
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
