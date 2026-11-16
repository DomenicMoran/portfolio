import "server-only";

import type { TargetedAnrede } from "@/content/targeted-page";
import { resolveAnrede, type TargetedCompany } from "@/lib/targeted-companies";

let cached: Set<string> | null = null;

/** Kommagetrennte Slugs aus TARGETED_DU_SLUGS — nur serverseitig, nie im Client-Bundle. */
function getDuSlugsFromEnv(): Set<string> {
  if (cached) return cached;
  const raw = process.env.TARGETED_DU_SLUGS?.trim();
  if (!raw) {
    cached = new Set();
    return cached;
  }
  cached = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return cached;
}

/**
 * Anrede fuer /for-Seiten auf dem Server: DB-Spalte, dann Env-Slugs, dann Datum.
 */
export function resolveAnredeOnServer(
  company: Pick<TargetedCompany, "slug" | "created_at" | "anrede">,
): TargetedAnrede {
  if (company.anrede === "sie" || company.anrede === "du")
    return company.anrede;
  if (getDuSlugsFromEnv().has(company.slug)) return "du";
  return resolveAnrede(company);
}
