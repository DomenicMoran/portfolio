import { describe, expect, it } from "vitest";
import { alsWort, asWord, grossErstes, jahreZwischen, monateZwischen } from "./duration";

/*
   Der teure Fall steht zuerst: der Tag vor und der Tag nach dem Stichtag.

   Der erste Commit fiel auf den 26. März. Wer am 25. Juli fragt, hat drei
   volle Monate hinter sich, wer am 26. Juli fragt, vier. Ohne die Bedingung
   auf den Tag im Monat springt die Angabe schon am 1. Juli, und die Seite
   behauptet einen Monat mehr, als vergangen ist.
*/
const ERSTER_COMMIT = new Date("2026-03-26");

describe("monateZwischen", () => {
  it("zählt einen Monat erst am Stichtag", () => {
    expect(monateZwischen(ERSTER_COMMIT, new Date("2026-07-25"))).toBe(3);
    expect(monateZwischen(ERSTER_COMMIT, new Date("2026-07-26"))).toBe(4);
  });

  it("rechnet über den Jahreswechsel", () => {
    expect(monateZwischen(new Date("2026-11-10"), new Date("2027-02-10"))).toBe(3);
    expect(monateZwischen(new Date("2026-11-10"), new Date("2027-02-09"))).toBe(2);
  });

  it("gibt am ersten Tag einen Monat aus statt null", () => {
    expect(monateZwischen(ERSTER_COMMIT, ERSTER_COMMIT)).toBe(1);
  });

  it("wird bei einem Stand vor dem Start nicht negativ", () => {
    expect(monateZwischen(ERSTER_COMMIT, new Date("2026-01-01"))).toBe(1);
  });
});

describe("jahreZwischen", () => {
  it("zählt volle Jahre", () => {
    expect(jahreZwischen(new Date("2022-07-01"), new Date("2026-06-30"))).toBe(3);
    expect(jahreZwischen(new Date("2022-07-01"), new Date("2026-07-01"))).toBe(4);
  });

  it("gibt mindestens ein Jahr aus", () => {
    expect(jahreZwischen(new Date("2026-07-01"), new Date("2026-07-02"))).toBe(1);
  });
});

describe("alsWort", () => {
  it("unterscheidet Dativ und Nominativ bei der Eins", () => {
    expect(alsWort(1)).toBe("einem");
    expect(alsWort(1, "nominativ")).toBe("ein");
  });

  it("schreibt bis zwölf aus", () => {
    expect(alsWort(4)).toBe("vier");
    expect(alsWort(12)).toBe("zwölf");
  });

  it("nimmt ab dreizehn die Ziffer", () => {
    expect(alsWort(13)).toBe("13");
  });
});

describe("asWord", () => {
  it("schreibt bis zwölf aus", () => {
    expect(asWord(1)).toBe("one");
    expect(asWord(4)).toBe("four");
    expect(asWord(12)).toBe("twelve");
  });

  it("nimmt ab dreizehn die Ziffer", () => {
    expect(asWord(13)).toBe("13");
  });
});

describe("grossErstes", () => {
  it("hebt nur den ersten Buchstaben", () => {
    expect(grossErstes("vier Monate")).toBe("Vier Monate");
  });

  it("kommt mit einer leeren Zeichenkette zurecht", () => {
    expect(grossErstes("")).toBe("");
  });
});
