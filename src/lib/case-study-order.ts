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
 * fertigen Systemen und `index` auf 01–05 in {@link FERTIG_FALLSTUDIEN}-Reihenfolge.
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
    const isFertig = FERTIG.has(study.id);
    const rank = isFertig
      ? FERTIG_FALLSTUDIEN.indexOf(
          study.id as (typeof FERTIG_FALLSTUDIEN)[number],
        ) + 1
      : 0;
    return {
      ...study,
      prototyp: !isFertig,
      index: isFertig ? String(rank).padStart(2, "0") : "",
    };
  });
}
