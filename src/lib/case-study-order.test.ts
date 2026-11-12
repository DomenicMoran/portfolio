import { describe, expect, it } from "vitest";
import type { CaseStudy } from "@/content/types";
import {
  FERTIG_FALLSTUDIEN,
  bereiteFallstudienVor,
  istFertigFallstudie,
} from "./case-study-order";

const stub = (id: string): CaseStudy => ({
  id,
  index: "00",
  name: id,
  tagline: id,
  year: "2026",
  role: "dev",
  statusLabel: "live",
  accent: "acid",
  problem: "p",
  solution: "s",
  hardPart: { title: "h", body: "b" },
  highlights: [],
  stack: [],
  metrics: [],
  links: [],
  architecture: "",
});

describe("case-study-order", () => {
  it("kennt die fünf fertigen Produkte", () => {
    expect(FERTIG_FALLSTUDIEN).toEqual([
      "menucloud",
      "salati",
      "nouri",
      "lexipulse",
      "dartile",
    ]);
  });

  it("sortiert fertige zuerst und markiert Prototypen", () => {
    const input = ["mfc", "salati", "menucloud", "aether"].map(stub);
    const out = bereiteFallstudienVor(input);
    expect(out.map((s) => s.id)).toEqual(["menucloud", "salati", "mfc", "aether"]);
    expect(out.find((s) => s.id === "mfc")?.prototyp).toBe(true);
    expect(out.find((s) => s.id === "menucloud")?.prototyp).toBe(false);
  });

  it("istFertigFallstudie", () => {
    expect(istFertigFallstudie("salati")).toBe(true);
    expect(istFertigFallstudie("mfc")).toBe(false);
  });
});
