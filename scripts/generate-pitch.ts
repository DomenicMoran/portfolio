/** Run: npm run generate:pitch -- https://company.example/careers */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type Project = {
  name: string;
  description: string;
  url: string;
  tags: string[];
};

type Lead = {
  companyName: string;
  founderName: string;
  techStack: string[];
  painPointSummary: string;
  matchedProjects: Array<Project | string>;
  linkedin: string;
  email: string;
};

const portfolioProjects: Record<string, Project> = {
  "MenuCloud Berlin": {
    name: "MenuCloud Berlin",
    description: "Multi-tenant commerce and operations SaaS.",
    url: "https://domenicmoran.de/#case-menucloud",
    tags: ["TypeScript", "PostgreSQL", "Operations"],
  },
  Salati: {
    name: "Salati",
    description: "Production mobile app with reliable delivery and platform integration.",
    url: "https://domenicmoran.de/#case-salati",
    tags: ["React Native", "Mobile", "Operations"],
  },
  "WohnungsJäger": {
    name: "WohnungsJäger",
    description: "AI-assisted product workflow for a high-trust consumer journey.",
    url: "https://domenicmoran.de/#case-kiwohnung",
    tags: ["AI workflow", "Product UX"],
  },
  NOURI: {
    name: "NOURI",
    description: "Product app built around a focused daily user workflow.",
    url: "https://domenicmoran.de/#case-nouri",
    tags: ["Product", "Mobile"],
  },
};

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Model response is missing ${field}.`);
  }
  return value.trim();
}

function removeModelSalutationAndSignoff(value: string) {
  return value
    .replace(/^(?:hallo|hi)\s+[^,\n]+,\s*/i, "")
    .replace(/\n\s*(?:beste|viele|liebe)\s+gr(?:ü|ue)(?:ß|ss)e[\s,\S]*$/i, "")
    .trim();
}
function normaliseCandidate(value: unknown, verifiedCompany?: string, verifiedContact?: string): Lead {
  if (!value || typeof value !== "object") throw new Error("Model response is not an object.");
  const candidate = value as Partial<Lead>;
  const techStack = Array.isArray(candidate.techStack)
    ? candidate.techStack.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
  const matchedProjects = Array.isArray(candidate.matchedProjects) ? candidate.matchedProjects : [];

  return {
    companyName: verifiedCompany ?? requireText(candidate.companyName, "companyName"),
    founderName: verifiedContact ?? requireText(candidate.founderName, "founderName"),
    techStack: techStack.length > 0 ? techStack : ["Product engineering", "Web platform", "AI workflows"],
    painPointSummary: requireText(candidate.painPointSummary, "painPointSummary"),
    matchedProjects: matchedProjects.length > 0 ? matchedProjects : ["MenuCloud Berlin"],
    linkedin: removeModelSalutationAndSignoff(requireText(candidate.linkedin, "linkedin")),
    email: removeModelSalutationAndSignoff(requireText(candidate.email, "email")),
  };
}

function assertPitchQuality(lead: Lead) {
  const prohibited = [
    /\bich hoffe\b/i,
    /\bich freue mich\b/i,
    /\binteresse an einem austausch\b/i,
    /\bvernetzen wir uns\b/i,
    /\bspricht mich (sehr )?an\b/i,
    /\bwollen wir .*sprechen\b/i,
    /\bich w(ü|ue)rde mich freuen\b/i,
    /\bmehr zu mir\b/i,
    /\bg(e|ä)rne bespreche ich\b/i,
    /\bbeste gr(ü|ue)(ß|ss)e\b/i,
    /\bgr(ü|ue)(ß|ss)e,?\s*domenic\b/i,
    /^hallo\b/im,
  ];

  for (const pitch of [lead.linkedin, lead.email]) {
    const matchedFiller = prohibited.find((pattern) => pattern.test(pitch));
    if (matchedFiller) {
      throw new Error(`Generated pitch contains generic outreach filler (${matchedFiller}); retrying.`);
    }
  }

  if (lead.linkedin.length > 280) {
    throw new Error(`Generated LinkedIn pitch is ${lead.linkedin.length} characters.`);
  }
  if (wordCount(lead.email) > 120) {
    throw new Error("Generated email exceeds 120 words.");
  }
  if (!lead.email.includes("https://domenicmoran.de")) {
    throw new Error("Generated email does not link to the live portfolio.");
  }
  if (!lead.email.includes("01.02.2027")) {
    throw new Error("Generated email does not state the full-time start date.");
  }
}

function clipAtWordBoundary(value: string, limit: number) {
  if (value.length <= limit) return value;
  return value.slice(0, limit + 1).replace(/\s+\S*$/, "").replace(/[,:;–-]+$/, "");
}

function makeFallbackPitch(lead: Lead): Lead {
  const firstName = lead.founderName.split(/\s+/)[0] || lead.founderName;
  const sourceObservation = lead.painPointSummary.replace(/\s+/g, " ").split(/[.!?]/)[0].trim();
  const productSurface = lead.techStack.slice(0, 3).join(", ") || "Produktlogik und Datenflüsse";
  const linkedInPrefix = `${firstName}, bei ${lead.companyName}: `;
  const linkedInSuffix = " Ich baue solche Flows mit Next.js und TypeScript. Ab 01.02.2027 Vollzeit als Product Engineer — 20 Minuten zu einem Release?";
  const issue = clipAtWordBoundary(sourceObservation || productSurface, 280 - linkedInPrefix.length - linkedInSuffix.length - 1);
  const linkedin = `${linkedInPrefix}${issue}.${linkedInSuffix}`;
  const email = `${firstName},\n\nbei ${lead.companyName} müssen ${productSurface} im Produkt verlässlich zusammenlaufen. Ich baue solche Flows mit Next.js, TypeScript, Node.js und PostgreSQL/Supabase — von UX bis Betrieb. Live-Demos: https://domenicmoran.de. Ab 01.02.2027 suche ich eine Vollzeitrolle als Product Engineer. Passt ein 20-Minuten-Call zu einem konkreten ersten Release?`;

  return { ...lead, linkedin, email };
}
function fewShotExamples(source: string) {
  const preparedSection = source.split("## Vorbereitete, individuelle Nachrichten")[1] ?? source;

  return preparedSection
    .split(/^### /m)
    .slice(1, 31)
    .map((example) => `### ${example.trim()}`)
    .join("\n\n")
    .slice(0, 60_000);
}

function getInputUrl() {
  const value = process.argv.find(
    (argument, index) =>
      index > 1 &&
      !argument.startsWith("--") &&
      process.argv[index - 1] !== "--contact" &&
      process.argv[index - 1] !== "--company",
  );
  if (!value) {
    throw new Error('Usage: npm run generate:pitch -- <job-or-company-url> [--contact "Verified Name"] [--company "Company"]');
  }

  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http(s) URLs are supported.");
  return url;
}

async function main() {
  const input = getInputUrl();
  const inputUrl = input.toString();
  const verifiedContact = option("--contact");
  const verifiedCompany = option("--company");

  for (const name of ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[name]) throw new Error(`${name} is required.`);
  }

  const sourceResponse = await fetch(inputUrl, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; DomenicMoranPitch/1.0)" },
  });
  if (!sourceResponse.ok) throw new Error(`Could not fetch ${inputUrl}: ${sourceResponse.status}`);

  const html = await sourceResponse.text();
  const pageText = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30_000);
  if (pageText.length < 100) throw new Error("The source page did not expose enough readable text.");

  const examples = await readFile(
    "C:/Users/domen/Documents/Projektordner/50_Sitzungen/2026-09-15-bewerbungsprofile.md",
    "utf8",
  ).catch(() => "");
  const system = [
    "You write direct, credible German outreach for Domenic Moran, Berlin AI-Native Product Engineer.",
    "Skills: Next.js, React, TypeScript, Node.js, PostgreSQL/Supabase, Tailwind, Vercel and AI workflows.",
    "He seeks a full-time Product Engineer role starting 01.02.2027.",
    "Output every value and both pitches in idiomatic German. Never invent a person, stack, customer, metric or product claim.",
    "No corporate filler, formal salutation, empty praise, sign-off or generic connection request.",
    "Start with a concrete observation and end with a precise product-conversation CTA.",
    "LinkedIn must be <=280 characters. Email must be <=120 words.",
    "Return strict JSON only.",
    "These are the best 30 verified style examples:",
    fewShotExamples(examples),
  ].join("\n");
  const prompt = [
    `Source URL: ${inputUrl}`,
    verifiedCompany ? `Verified company name: ${verifiedCompany}` : "",
    verifiedContact ? `Verified decision-maker (use exactly this name): ${verifiedContact}` : "",
    `Page text: ${pageText}`,
    "Return companyName, founderName, techStack, painPointSummary, matchedProjects, linkedin and email.",
    "matchedProjects must be an array of 1–3 project names chosen only from MenuCloud Berlin, Salati, WohnungsJäger, NOURI.",
    "Name one concrete execution issue. The email must include https://domenicmoran.de and the exact date 01.02.2027.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let lead: Lead | undefined;
  let fallbackCandidate: Lead | undefined;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const retryPrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nThe prior draft failed the quality gate. Replace generic connection language with a specific engineering observation and a concrete CTA.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_PITCH_MODEL ?? "gpt-4.1-mini",
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: retryPrompt },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI failed: ${response.status} ${await response.text()}`);

    try {
      const message = (await response.json()).choices?.[0]?.message?.content;
      const candidate = normaliseCandidate(JSON.parse(requireText(message, "model content")), verifiedCompany, verifiedContact);
      if (["unknown", "team", "n/a"].includes(candidate.founderName.toLowerCase())) {
        throw new Error("No verified responsible person extracted; lead was not saved.");
      }
      fallbackCandidate = candidate;
      assertPitchQuality(candidate);
      lead = candidate;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!lead && fallbackCandidate) {
    lead = makeFallbackPitch(fallbackCandidate);
    assertPitchQuality(lead);
  }
  if (!lead) throw lastError;

  const slug = (lead.companyName || basename(input.pathname) || "company")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new Error("Could not derive a safe company slug.");

  const projects = lead.matchedProjects.map((project): Project => {
    const name = typeof project === "string" ? project : project.name;
    return portfolioProjects[name] ?? portfolioProjects["MenuCloud Berlin"];
  });
  const uniqueProjects = [...new Map(projects.map((project) => [project.name, project])).values()];
  const row = {
    slug,
    company_name: lead.companyName,
    founder_name: lead.founderName,
    tech_stack: lead.techStack,
    pain_point_summary: lead.painPointSummary,
    matched_projects: uniqueProjects,
    company_url: inputUrl,
  };
  const database = `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/targeted_companies?on_conflict=slug`;
  const saved = await fetch(database, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!saved.ok) throw new Error(`Supabase save failed: ${saved.status} ${await saved.text()}`);

  const siteUrl = process.env.SITE_URL ?? "https://domenicmoran.de";
  if (process.env.REVALIDATE_SECRET) {
    const revalidation = await fetch(`${siteUrl.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": process.env.REVALIDATE_SECRET,
      },
      body: JSON.stringify({ slug }),
    });
    if (!revalidation.ok) throw new Error(`Lead saved but revalidation failed: ${revalidation.status}`);
  }

  console.log(
    JSON.stringify(
      {
        linkedin: lead.linkedin,
        email: lead.email,
        landingPage: `https://domenicmoran.de/for/${slug}`,
        lead: (await saved.json())[0],
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
