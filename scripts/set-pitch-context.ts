/** Run: npm run set:pitch-context -- <slug> "<positiver Produktkontext>"
 * Ersetzt nur pain_point_summary (sichtbarer Produktkontext auf /for/<slug>) und revalidiert die Seite.
 * Gleiche Regeln wie generate:pitch: positiv, keine Problem-Wörter, kein Satz doppelt. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [slug, context] = process.argv.slice(2);
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !context?.trim()) {
    throw new Error('Usage: npm run set:pitch-context -- <slug> "<context>"');
  }
  if (/herausforderung|problem|\bl(ö|oe)s(t|en|ung)\b|adressier|schmerzpunkt/i.test(context)) {
    throw new Error("Context frames a problem; describe the product positively.");
  }
  const sentences = context.split(/(?<=[.!?])\s+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (new Set(sentences).size !== sentences.length) throw new Error("Context repeats a sentence.");
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[name]) throw new Error(`${name} is required.`);
  }
  const url = `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/targeted_companies?slug=eq.${slug}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ pain_point_summary: context.trim() }),
  });
  if (!res.ok) throw new Error(`Supabase update failed: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as unknown[];
  if (rows.length !== 1) throw new Error(`Expected 1 row for ${slug}, got ${rows.length}.`);
  const siteUrl = process.env.SITE_URL ?? "https://domenicmoran.de";
  if (process.env.REVALIDATE_SECRET) {
    const r = await fetch(`${siteUrl.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": process.env.REVALIDATE_SECRET },
      body: JSON.stringify({ slug }),
    });
    if (!r.ok) throw new Error(`Updated but revalidation failed: ${r.status}`);
  } else {
    console.warn("REVALIDATE_SECRET missing: page refreshes after ISR window (1h).");
  }
  console.log(JSON.stringify({ slug, pain_point_summary: context.trim(), revalidated: Boolean(process.env.REVALIDATE_SECRET) }));
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1; });
