import type { Article } from "./types";

export const kassensichvEn: Article = {
  slug: "german-till-law-in-practice",
  title: "German till law in practice: what the documentation leaves out",
  dek: "Every point of sale in Germany has to sign its transactions in hardware-backed form. The vendor documentation explains the API call. The three things that actually bite are not in it.",
  date: "2026-07-29",
  minutes: 5,
  tags: ["KassenSichV", "§ 146a AO", "Postgres", "Multi-tenant"],
  evidence: [
    "src/lib/tse-chain.ts and supabase/migrations/20260413_tse_chain_atomic_append.sql (lock, hash chain)",
    "src/lib/food-order-tse.ts (signing, token cache)",
    "src/app/api/food-orders/route.ts, line 472 onward (fail-closed, HTTP 503)",
    "src/lib/fiskaly-provision.ts (per-tenant provisioning)",
  ],
  blocks: [
    {
      kind: "p",
      text: "Build a point-of-sale system in Germany and you will meet § 146a of the tax code and the cash-register security regulation. Every transaction has to be signed by a certified technical security element, the signatures have to be kept unbroken and tamper-evident, and during an inspection all of it has to be exportable.",
    },
    {
      kind: "p",
      text: "I built this for MenuCloud, a multi-tenant platform for restaurants. The vendor whose cloud signing unit I use has decent documentation. It explains how to sign a transaction. It does not explain the three things you actually get stuck on.",
    },
    { kind: "h2", text: "One: the signing unit belongs to the tenant, not the platform" },
    {
      kind: "p",
      text: "The obvious build is a single signing unit for the platform with every tenant flowing through it. That is convenient and legally wrong. The record-keeping duty falls on the individual taxpayer. An inspection asks for the records of that one business, not for those of a platform in which it is one of many.",
    },
    {
      kind: "p",
      text: "So every tenant gets its own attributable signing unit. Either they bring one, or one is provisioned for them under the platform's reseller account during setup. In both cases `tss_id` and `client_id` live on the tenant, not in the environment.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "food-order-tse.ts: the per-tenant override, with an environment fallback so single-tenant installs keep working.",
      code: `export interface TseOverride {
  tss_id?: string | null;
  client_id?: string | null;
  env?: 'test' | 'live' | null;
}`,
    },
    {
      kind: "p",
      text: "There is a consequence worth planning for: the teardown has to exist too. When a tenant leaves, their signing unit must be decommissioned cleanly, and their existing signatures must be retained anyway. For ten years.",
    },
    { kind: "h2", text: "Two: two simultaneous orders fork the chain" },
    {
      kind: "p",
      text: "The signatures hang in a hash chain. Every row carries the hash of its predecessor. That is the part which makes a later edit visible, and therefore the actual substance of the evidentiary value.",
    },
    {
      kind: "p",
      text: "My first version computed this in the application: read the last row, hash it, write the new one. That works as long as only one order is finalised at a time. During dinner service it is not. Two concurrent finalisations read the same predecessor, compute the same previous hash, and both insert. The chain forks.",
    },
    {
      kind: "note",
      title: "A forked chain is worse than no chain",
      text: "It looks complete at a glance. It would surface during an inspection, which is precisely when an explanation gets expensive. The bug is timing-dependent and invisible to any test suite that does not run things concurrently.",
    },
    {
      kind: "p",
      text: "The fix does not belong in the application, it belongs in the database. Read, compute and write happen inside one function that first takes a per-restaurant lock. Restaurants do not block one another, but within a restaurant the chain grows strictly linearly.",
    },
    {
      kind: "code",
      lang: "sql",
      caption: "The decisive part of the migration.",
      code: `-- Per-restaurant lock, released when the transaction ends.
PERFORM pg_advisory_xact_lock(
  hashtext('tse-chain:' || p_restaurant_id::text)
);

SELECT row_hash INTO v_prev_row_hash
FROM tse_transactions
WHERE restaurant_id = p_restaurant_id
ORDER BY created_at DESC
LIMIT 1;`,
    },
    {
      kind: "p",
      text: "`pg_advisory_xact_lock` takes a number rather than a string, hence the detour through `hashtext`. The lock ends with the transaction whether or not it succeeded. There is no path on which it can be left held.",
    },
    { kind: "h2", text: "Three: what happens when signing fails" },
    {
      kind: "p",
      text: "This is the question that decides the quality of such a system, and no vendor documentation answers it. The signing unit is someone else's service. Someone else's services go down.",
    },
    {
      kind: "p",
      text: "There are two options. Book the order anyway, which quietly produces unsigned revenue. Or refuse the order, and the guest sees an error. The first is more comfortable and worse for the restaurateur: during an inspection it is their problem, not mine.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "food-orders/route.ts: no booking without a signature.",
      code: `if (needsTseRetry) {
  // Flag for the re-signing sweeper. Do NOT mark as paid.
  await supabase.from('food_orders').update({
    needs_tse_signature: true,
    tse_last_error: tseFailureReason,
  }).eq('id', id).eq('restaurant_id', restaurant_id);

  return NextResponse.json(
    { error: 'tse_signature_required', reason: tseFailureReason },
    { status: 503 },
  );
}`,
    },
    {
      kind: "p",
      text: "503 rather than 500, because the condition is temporary. The order is not lost, it carries a flag, and a scheduled job fetches the signature once the service answers again. The failure reason is stored on the order so that afterwards it is clear what happened.",
    },
    { kind: "h3", text: "The exception worth naming honestly" },
    {
      kind: "p",
      text: "Fail-closed applies when a signing unit is configured for the tenant. With none configured at all, the order goes through and can be signed later. That is deliberate, so a business is not halted mid-setup, and it is the place I would audit myself at the next iteration: the transition from ”not yet set up” to ”set up” has to be unambiguous, or a setup convenience quietly becomes a permanent hole.",
    },
    { kind: "h2", text: "A small thing that grew during dinner service" },
    {
      kind: "p",
      text: "Every signing call needs an access token. In the first version each checkout fetched a fresh one, roughly 300 milliseconds ahead of the actual signature. At one order a minute nobody notices. At thirty orders in five minutes it becomes load on the vendor's auth endpoint that serves no purpose.",
    },
    {
      kind: "p",
      text: "The vendor issues tokens valid for 60 minutes. They are now reused for 50, with a 30-second margin before expiry. This is the kind of change you do not plan, you measure.",
    },
    { kind: "h2", text: "What I would tell a team starting on this" },
    {
      kind: "list",
      ordered: true,
      items: [
        "The signing unit belongs to the taxpayer. Retrofitting that later means migrating the history with it.",
        "Anything that extends a chain belongs in a database transaction with a lock. Not in the application.",
        "Decide the failure path first, not last. It determines who ends up owning the risk.",
        "Design for the retention period from day one. Ten years outlives several rewrites of the system.",
      ],
    },
    {
      kind: "p",
      text: "None of this is especially hard. It is simply absent from the documentation, because these are design questions rather than interface questions. Which is exactly why they take the longest.",
    },
  ],
};
