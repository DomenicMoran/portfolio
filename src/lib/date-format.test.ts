import { describe, expect, it } from "vitest";
import { datumLang, dateLong } from "./date-format";

describe("datumLang", () => {
  it("schreibt den Tag ohne führende Null", () => {
    expect(datumLang("2026-08-06")).toBe("6. August 2026");
  });

  it("schreibt den Monat aus", () => {
    expect(datumLang("2026-03-16")).toBe("16. März 2026");
  });

  /* Der Prüfstempel ist ein reines Datum ohne Zeitzone. `new Date("2026-01-01")`
     liest ihn als Mitternacht UTC — östlich von Greenwich ist das derselbe Tag,
     westlich der Tag davor. Hier steht der Fall, der es zeigen würde. */
  it("hält den Jahreswechsel", () => {
    expect(datumLang("2026-01-01")).toBe("1. Januar 2026");
    expect(datumLang("2025-12-31")).toBe("31. Dezember 2025");
  });
});

describe("dateLong", () => {
  it("setzt keinen Punkt hinter den Tag", () => {
    expect(dateLong("2026-08-06")).toBe("6 August 2026");
  });

  it("nennt den Monat vor dem Jahr", () => {
    expect(dateLong("2026-03-16")).toBe("16 March 2026");
  });
});
