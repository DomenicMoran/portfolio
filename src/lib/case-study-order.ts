import type { CaseStudy } from "@/content/types";

/** Ausgelieferte Produkte, Reihenfolge verbindlich (DE + EN). */
export const FERTIG_FALLSTUDIEN = [
  "menucloud",
  "salati",
  "nouri",
  "lexipulse",
  "dartile",
] as const;

const FERTIG = new Set<string>(FERTIG_FALLSTUDIEN);

export function istFertigFallstudie(id: string): boolean {
  return FERTIG.has(id);
}

/**
 * Sortiert Fallstudien: die fünf fertigen zuerst, danach alle übrigen in
 * ihrer bisherigen Reihenfolge. Setzt `prototyp` für alles außer den fünf
 * fertigen Systemen.
 */
export function bereiteFallstudienVor(
  studies: readonly CaseStudy[],
): CaseStudy[] {
  const byId = new Map(studies.map((s) => [s.id, s]));
  const fertig = FERTIG_FALLSTUDIEN.map((id) => byId.get(id)).filter(
    (s): s is CaseStudy => Boolean(s),
  );
  const rest = studies.filter((s) => !FERTIG.has(s.id));
  return [...fertig, ...rest].map((study) => {
    const fertigIndex = FERTIG_FALLSTUDIEN.indexOf(
      study.id as (typeof FERTIG_FALLSTUDIEN)[number],
    );
    const index =
      fertigIndex >= 0
        ? String(fertigIndex + 1).padStart(2, "0")
        : "";
    return {
      ...study,
      index,
      prototyp: !FERTIG.has(study.id),
    };
  });
}
