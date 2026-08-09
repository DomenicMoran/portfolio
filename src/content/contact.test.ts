import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

/**
 * Die Antwortzeit ist eine Zusage und steht an zwei sichtbaren Stellen.
 *
 * Im Vorspann des Kontaktbereichs und in der Faktenkachel daneben, in beiden
 * Sprachen, vier Stellen für dieselbe Zahl. Sie stammt jetzt aus je einer
 * Konstante; dieser Test hält fest, dass dabei überall dieselbe Zahl
 * herauskommt. Ohne ihn merkt es niemand: Die vier Stellen stehen weit
 * auseinander, und auf der Seite sieht eine falsche Zahl genauso aus wie eine
 * richtige.
 *
 * Geprüft wird der fertige Inhalt und nicht die Konstante. Eine Konstante, die
 * nur eine der beiden Stellen erreicht, ist genau der Fehler, um den es geht.
 */

/** Die erste Stundenangabe in einem Text. */
const stunden = (text: string) => {
  const treffer = text.match(/(\d+)\s+(Stunden|hours)/);
  return treffer ? Number(treffer[1]) : null;
};

const fassungen = [
  { name: "deutsch", inhalt: de, kachel: "Antwortzeit" },
  { name: "englisch", inhalt: en, kachel: "Response time" },
];

describe("Antwortzeit im Kontaktbereich", () => {
  for (const { name, inhalt, kachel } of fassungen) {
    it(`nennt dieselbe Zahl im Vorspann und in der Kachel (${name})`, () => {
      const imVorspann = stunden(inhalt.contact.lede);
      const eintrag = inhalt.contact.fakten.find((f) => f.label === kachel);
      expect(imVorspann, "Vorspann nennt keine Stundenzahl").not.toBeNull();
      expect(eintrag, `Kachel „${kachel}“ fehlt`).toBeTruthy();
      expect(stunden(eintrag!.wert)).toBe(imVorspann);
    });
  }

  it("nennt in beiden Sprachfassungen dieselbe Zahl", () => {
    expect(stunden(en.contact.lede)).toBe(stunden(de.contact.lede));
  });
});
