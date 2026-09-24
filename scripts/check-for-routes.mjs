#!/usr/bin/env node
/**
 * Hält die Outreach-Route /for/[company-slug] im Bau und optional live fest.
 *
 * Die Seiten unter /for/* sind kein Nebenprodukt: Sie sind der Einstieg für
 * gezielte Ansprache. Sie waren schon einmal weg, nicht weil jemand die Route
 * absichtlich entfernte, sondern weil die Produktion von einem Stand ohne
 * /for-Feature überschrieben wurde. Der Bau kann grün sein, während die
 * Live-Adresse 404 liefert — wenn main die Datei nicht mehr kennt.
 *
 * Geprüft wird deshalb der Bau (Route im Manifest, page.tsx vorhanden) und
 * optional die Auslieferung: HTTP 200 und x-matched-path=/for/[company-slug],
 * nicht /_not-found.
 *
 *   npm run check:for
 *   CHECK_FOR_LIVE=1 npm run check:for
 *   node scripts/check-for-routes.mjs --live
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ERWARTETE_ROUTE = "/for/[company-slug]";
const SEITE = join("src", "app", "for", "[company-slug]", "page.tsx");
const LIVE_BASIS = "https://domenicmoran.de";

const live =
  process.env.CHECK_FOR_LIVE === "1" ||
  process.env.CHECK_FOR_LIVE === "true" ||
  process.argv.includes("--live");

const funde = [];
let geprueft = 0;

/** Route im App-Manifest oder im routes-manifest. */
function routeImBau() {
  const appManifest = join(".next", "app-path-routes-manifest.json");
  const routesManifest = join(".next", "routes-manifest.json");

  if (!existsSync(appManifest) && !existsSync(routesManifest)) {
    console.error(
      "Kein Bau gefunden (.next/app-path-routes-manifest.json oder routes-manifest.json). " +
        "Zuerst `npm run build` ausführen.",
    );
    process.exit(1);
  }

  const kandidaten = new Set();

  if (existsSync(appManifest)) {
    const roh = JSON.parse(readFileSync(appManifest, "utf8"));
    for (const w of [...Object.keys(roh), ...Object.values(roh)]) {
      if (typeof w === "string") kandidaten.add(w);
    }
  }

  if (existsSync(routesManifest)) {
    const roh = JSON.parse(readFileSync(routesManifest, "utf8"));
    for (const eintrag of roh.dynamicRoutes ?? []) {
      if (typeof eintrag?.page === "string") kandidaten.add(eintrag.page);
      if (typeof eintrag?.route === "string") kandidaten.add(eintrag.route);
    }
    for (const w of Object.values(roh)) {
      if (typeof w === "string" && w.includes("/for/")) kandidaten.add(w);
    }
  }

  return [...kandidaten].some(
    (r) => r === ERWARTETE_ROUTE || r.replace(/\/page$/, "") === ERWARTETE_ROUTE,
  );
}

geprueft++;
if (!existsSync(SEITE)) {
  funde.push(
    `${SEITE} fehlt. Ohne diese Datei gibt es keine /for/*-Seiten — auch wenn ` +
      `noch alte Deployments sie ausliefern.`,
  );
} else if (!routeImBau()) {
  funde.push(
    `Route ${ERWARTETE_ROUTE} steht nicht im Bau-Manifest. ` +
      `Der nächste Deploy von main würde /for/* verlieren.`,
  );
} else {
  geprueft++;
}

async function pruefeLivePfad(pfad, { unbekannterSlug = false } = {}) {
  const url = `${LIVE_BASIS}${pfad}`;
  let antwort;
  try {
    antwort = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
  } catch (fehler) {
    funde.push(`${pfad}: Live-Adresse nicht erreichbar (${fehler.message})`);
    return;
  }

  geprueft++;
  const matched = (antwort.headers.get("x-matched-path") ?? "").trim();
  const matchedNorm = matched.toLowerCase();

  if (antwort.status !== 200) {
    funde.push(
      `${pfad}: HTTP ${antwort.status} statt 200` +
        (unbekannterSlug
          ? " (auch unbekannte Slugs sollen die Fallback-Seite liefern)"
          : ""),
    );
  }

  if (matchedNorm === "/_not-found") {
    funde.push(
      `${pfad}: x-matched-path ist /_not-found — die Route /for/[company-slug] ` +
        `wird live nicht getroffen.`,
    );
    return;
  }

  const erwartetSegment = "/for/[company-slug]";
  if (!matched.includes(erwartetSegment)) {
    funde.push(
      `${pfad}: x-matched-path „${matched || "(leer)"}` +
        ` statt ${erwartetSegment}.`,
    );
  }
}

if (live) {
  await pruefeLivePfad("/for/wealthapi");
  await pruefeLivePfad("/for/briink");
  await pruefeLivePfad("/for/__check-unbekannter-slug-9f3a2b1c", {
    unbekannterSlug: true,
  });
}

if (funde.length > 0) {
  console.error(`\n${funde.length} Befund/Befunde zu /for/*:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    live
      ? "\nBau und Live-Auslieferung müssen /for/[company-slug] treffen."
      : "\nZuerst `npm run build`, dann erneut. Live: CHECK_FOR_LIVE=1 npm run check:for",
  );
  process.exit(1);
}

console.log(
  live
    ? `\n/for/*: Bau und Live (${geprueft} Prüfungen) — Route ${ERWARTETE_ROUTE} erreichbar.`
    : `\n/for/*: Bau (${geprueft} Prüfungen) — ${SEITE} und ${ERWARTETE_ROUTE} im Manifest.`,
);
