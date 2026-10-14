/** Run: npm run set:pitch-context -- <slug> "<positiver Produktkontext>" [--anrede sie|du]
 * Ersetzt nur pain_point_summary (sichtbarer Produktkontext auf /for/<slug>) und revalidiert die Seite.
 * Gleiche Regeln wie generate:pitch: positiv, keine Problem-Wörter, kein Satz doppelt. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const argv = process.argv.slice(2);
  const ai = argv.indexOf("--anrede");
  const anrede = ai >= 0 ? argv.splice(ai, 2)[1]?.toLowerCase() : undefined;
  if (anrede !== undefined && anrede !== "sie" && anrede !== "du") throw new Error("--anrede must be sie or du.");
  const [slug, context] = argv;
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !context?.trim()) {
    throw new Error('Usage: npm run set:pitch-context -- <slug> "<context>"');
  }
  if (/herausforderung|problem|\bl(ö|oe)s(t|en|ung)\b|adressier|schmerzpunkt/i.test(context)) {
    throw new Error("Context frames a problem; describe the product positively.");
  }
  if (/\b(du|dich|dir|dein\w*|euch|euer|eure\w*)\b/i.test(context)) {
    throw new Error("Context addresses the reader directly; write it in the third person.");
  }
  const sentences = context.split(/(?<=[.!?])\s+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (new Set(sentences).size !== sentences.length) throw new Error("Context repeats a sentence.");
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[name]) throw new Error(`${name} is required.`);
  }
  const url = `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/targeted_companies?slug=eq.${slug}`;
  const patch = (body: Record<string, unknown>) => fetch(url, {
    method: "PATCH",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  let res = await patch(anrede ? { pain_point_summary: context.trim(), anrede } : { pain_point_summary: context.trim() });
  if (!res.ok && anrede && /anrede/.test(await res.clone().text())) {
    console.warn(`anrede column missing (run supabase/targeted_companies_anrede.sql); page falls back to resolveAnrede. Wanted: ${anrede}.`);
    res = await patch({ pain_point_summary: context.trim() });
  }
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
  console.log(JSON.stringify({ slug, anrede, pain_point_summary: context.trim(), revalidated: Boolean(process.env.REVALIDATE_SECRET) }));
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1; });
