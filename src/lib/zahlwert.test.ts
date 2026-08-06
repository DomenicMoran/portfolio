import { describe, expect, it } from "vitest";
import { schreibe, zerlege, type Sprache } from "./zahlwert";

/**
 * Was hier zählt, sieht man auf der Seite nicht.
 *
 * Der Zähler schreibt seinen Endwert von Anfang an hin; erst die Animation
 * dazwischen zeigt, ob die Zahl richtig gelesen wurde. Ein Fehler um den
 * Faktor tausend fällt dort nur auf, wenn man in genau diesem Moment hinsieht.
 */

/** Ein Wert muss durch Lesen und Schreiben unverändert wieder herauskommen. */
const rundlauf = (wert: string, sprache: Sprache) => {
  const form = zerlege(wert, sprache);
  if (form.zahl === null) return wert;
  return schreibe(form.zahl, form, sprache) + form.zusatz;
};

describe("Zahlwerte lesen und schreiben", () => {
  it("gibt deutsche Werte unverändert zurück", () => {
    for (const wert of ["4", "1.276", "7.464", "11.892", "2022", "1,44"]) {
      expect(rundlauf(wert, "de"), wert).toBe(wert);
    }
  });

  it("gibt englische Werte unverändert zurück", () => {
    for (const wert of ["4", "1,276", "7,464", "11,892", "2022", "1.44"]) {
      expect(rundlauf(wert, "en"), wert).toBe(wert);
    }
  });

  it("liest die Größenordnung richtig", () => {
    // Der eigentliche Punkt: „1,276“ ist auf Englisch tausendzweihundert­sechs­
    // undsiebzig, auf Deutsch eins Komma zwei sieben sechs.
    expect(zerlege("1,276", "en").zahl).toBe(1276);
    expect(zerlege("1,276", "de").zahl).toBe(1.276);
    expect(zerlege("1.276", "de").zahl).toBe(1276);
    expect(zerlege("1.276", "en").zahl).toBe(1.276);
  });

  it("lässt den Zusatz wörtlich stehen", () => {
    expect(rundlauf("100 %", "de")).toBe("100 %");
    expect(rundlauf("100%", "en")).toBe("100%");
    expect(rundlauf("24/7", "de")).toBe("24/7");
  });

  it("gruppiert nur, wo die Quelle es tat", () => {
    // Sonst stünde die Jahreszahl als „2.022“ da.
    expect(rundlauf("2022", "de")).toBe("2022");
    expect(rundlauf("2022", "en")).toBe("2022");
  });

  it("hält zwei Dreiergruppen aus", () => {
    // Der alte Weg ergab hier NaN und ließ die Animation ausfallen.
    expect(zerlege("12,345,678", "en").zahl).toBe(12345678);
    expect(zerlege("12.345.678", "de").zahl).toBe(12345678);
    expect(rundlauf("12,345,678", "en")).toBe("12,345,678");
  });

  it("erkennt, was keine Zahl ist", () => {
    for (const wert of ["EU", "", "AI Product Engineer"]) {
      expect(zerlege(wert, "de").zahl, wert).toBeNull();
    }
  });

  it("verwirft Zeichenketten mit zwei Dezimaltrennzeichen", () => {
    expect(zerlege("1,2,3", "de").zahl).toBeNull();
    expect(zerlege("1.2.3", "en").zahl).toBeNull();
  });
});
