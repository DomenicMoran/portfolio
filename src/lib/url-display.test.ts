import { describe, expect, it } from "vitest";
import { alsAnzeige } from "./url-display";

/**
 * Diese Funktion setzt Text auf ein Blatt, das weitergereicht wird.
 *
 * Auf der Seite fällt eine schiefe Adresse auf; im gedruckten Kurzprofil sieht
 * sie niemand mehr, bevor sie beim Empfänger liegt. Deshalb steht die Regel
 * hier und nicht in einem Prüflauf gegen die gebaute Seite.
 */
describe("alsAnzeige", () => {
  it("nimmt Schema und www. weg, damit zwei Zeilen gleich aussehen", () => {
    expect(alsAnzeige("https://github.com/DomenicMoran")).toBe(
      "github.com/DomenicMoran",
    );
    expect(alsAnzeige("https://www.linkedin.com/in/domenicmoran")).toBe(
      "linkedin.com/in/domenicmoran",
    );
  });

  it("lässt einen abschließenden Schrägstrich weg", () => {
    // „domenicmoran.de/" liest sich wie ein Pfad, dem etwas fehlt.
    expect(alsAnzeige("https://domenicmoran.de/")).toBe("domenicmoran.de");
    expect(alsAnzeige("https://domenicmoran.de/en")).toBe("domenicmoran.de/en");
  });

  it("fasst nur den Anfang an", () => {
    // Ein `www.` mitten im Pfad gehört zum Pfad und bleibt stehen.
    expect(alsAnzeige("https://example.com/www.test")).toBe(
      "example.com/www.test",
    );
    expect(alsAnzeige("http://example.com")).toBe("example.com");
  });
});
