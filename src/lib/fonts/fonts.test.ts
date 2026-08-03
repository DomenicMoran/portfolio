import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ogSchriften } from "./index";

/**
 * Ein Schriftgewicht, das nicht registriert ist, fällt still auf den regulären
 * Schnitt zurück.
 *
 * Satori erfindet keine Fettung. Fehlt der Schnitt, rendert es den
 * nächstbesten — und das ist der eingebaute reguläre. Es gibt keine Warnung,
 * keinen Fehler und kein Bild, dem man es ansieht, solange man nicht zwei
 * Fassungen nebeneinander legt. Gemessen an den ausgelieferten Karten
 * verlangten alle drei Erzeuger `fontWeight` 600 oder 700 und bekamen 400.
 *
 * Deshalb steht die Prüfung hier und nicht bei den Browser-Läufen: Sie
 * vergleicht die verlangten Gewichte mit den vorhandenen Schnitten. Ein
 * neuer Erzeuger mit `fontWeight: 500` fällt damit beim Testlauf auf, nicht
 * erst, wenn jemand die Karte teilt.
 */

/** Der Schnitt, den `next/og` mitbringt: Geist Regular. */
const EINGEBAUT = 400;

const ERZEUGER = [
  "src/lib/og-card.tsx",
  "src/app/(de)/artikel/[slug]/opengraph-image.tsx",
  "src/app/(en)/en/articles/[slug]/opengraph-image.tsx",
];

describe("Schriftgewichte der Vorschaubilder", () => {
  const vorhanden = new Set([EINGEBAUT, ...ogSchriften.map((s) => s.weight)]);

  it.each(ERZEUGER)("%s verlangt nur Gewichte, die es gibt", (pfad) => {
    const quelle = readFileSync(pfad, "utf8");
    const verlangt = [...quelle.matchAll(/fontWeight:\s*(\d+)/g)].map((m) => Number(m[1]));

    /* Ein Erzeuger ohne jedes Gewicht wäre kein Erfolg, sondern ein Zeichen
       dafür, dass der Pfad nicht mehr stimmt. */
    expect(verlangt.length).toBeGreaterThan(0);

    for (const gewicht of verlangt) {
      expect(vorhanden, `Gewicht ${gewicht} in ${pfad}`).toContain(gewicht);
    }
  });

  it("liefert die halbfette Schrift als lesbare Schriftdatei", () => {
    const halbfett = ogSchriften.find((s) => s.weight === 600);
    expect(halbfett).toBeDefined();
    /* Die vier Bytes am Anfang sind die Kennung einer TrueType-Datei. Eine
       leere oder halb geladene Datei bringt satori sonst erst zur Bauzeit
       zu Fall, und dann fehlt die Karte ganz. */
    expect([...halbfett!.data.subarray(0, 4)]).toEqual([0x00, 0x01, 0x00, 0x00]);
  });
});
