import { describe, expect, it } from "vitest";
import { alsSprungmarke } from "./slug";

/**
 * Sprungmarken sind Adressen, und Adressen dürfen sich nicht ändern.
 *
 * Sobald jemand einen Abschnittsverweis weitergibt, ist die Marke ein
 * Versprechen: Sie muss dieselbe bleiben, solange die Überschrift dieselbe
 * ist. Auf der Seite sieht man einer falschen Marke nichts an — der Verweis
 * springt einfach nicht, und niemand meldet das. Deshalb steht die Regel hier
 * und nicht in einem Prüflauf gegen die gebaute Seite.
 */
describe("alsSprungmarke", () => {
  it("macht aus einer Überschrift eine lesbare Marke", () => {
    expect(alsSprungmarke("Das Ergebnis: kleiner ist besser")).toBe(
      "das-ergebnis-kleiner-ist-besser",
    );
  });

  it("schreibt Umlaute aus, statt sie wegzuwerfen", () => {
    // Weggeworfen hießen „Hebel“ und „Hübel“ dieselbe Marke — und die zweite
    // Überschrift auf derselben Seite überschriebe stumm die erste.
    expect(alsSprungmarke("Der zweite Hebel")).not.toBe(
      alsSprungmarke("Der zweite Hübel"),
    );
    expect(alsSprungmarke("Größe, Maß und Öffnung")).toBe(
      "groesse-mass-und-oeffnung",
    );
  });

  it("lässt keine Trennstriche am Rand oder in Ketten stehen", () => {
    expect(alsSprungmarke("„Published!“ — ist kein Beleg")).toBe(
      "published-ist-kein-beleg",
    );
    expect(alsSprungmarke("  Rand  ")).toBe("rand");
  });

  it("liefert nur Zeichen, die in einer Adresse ohne Kodierung stehen dürfen", () => {
    const marke = alsSprungmarke("KassenSichV §146a AO: 30 % weniger Aufwand");
    expect(marke).toMatch(/^[a-z0-9-]+$/);
    expect(encodeURIComponent(marke)).toBe(marke);
  });
});
