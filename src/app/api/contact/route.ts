import { NextResponse } from "next/server";
import { site } from "@/content/site";

/**
 * Contact endpoint.
 *
 * Design notes:
 * - Fails loudly, never silently. If mail cannot be sent, the client gets a
 *   non-2xx and shows the direct mail address instead of a fake "sent".
 * - Sends nothing to third parties beyond the mail provider, and stores
 *   nothing — there is no database behind this form.
 * - Rate limited in-process. Good enough for a personal site on a single
 *   region; a distributed store would be over-engineering here.
 */

type Payload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
  website?: unknown;
};

const MAX = { name: 120, email: 200, company: 160, message: 5000 } as const;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Strips CR/LF so a submitted value cannot inject extra mail headers. */
function headerSafe(value: string) {
  return value.replace(/[\r\n]+/g, " ");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte kurz warten." },
      { status: 429 },
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  // Honeypot — a filled hidden field means a bot. Answer 200 so it does not
  // learn anything, but send nothing.
  if (str(body.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const name = str(body.name, MAX.name);
  const email = str(body.email, MAX.email);
  const company = str(body.company, MAX.company);
  const message = str(body.message, MAX.message);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, E-Mail und Nachricht sind erforderlich." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Diese E-Mail-Adresse sieht nicht gültig aus." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || site.email;
  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";

  // No key configured yet (see USER-TODO B4). Say so honestly rather than
  // pretending the message was delivered.
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY missing — message not delivered");
    return NextResponse.json(
      { error: "Mailversand ist noch nicht konfiguriert." },
      { status: 503 },
    );
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#101014">
      <h2 style="margin:0 0 16px">Neue Anfrage über das Portfolio</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
      ${company ? `<p><strong>Unternehmen:</strong> ${escapeHtml(company)}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0">
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Portfolio-Anfrage von ${headerSafe(name)}`,
        html,
      }),
    });

    if (!response.ok) {
      // Log status only — the body can echo back configuration details.
      console.error("[contact] resend rejected the request", response.status);
      return NextResponse.json(
        { error: "Der Versand ist fehlgeschlagen." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] resend unreachable", error);
    return NextResponse.json(
      { error: "Der Mailanbieter ist nicht erreichbar." },
      { status: 503 },
    );
  }
}
