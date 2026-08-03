#!/usr/bin/env node
/**
 * Prüft, dass die genannte Technik in den Produktivrepos wirklich vorkommt.
 *
 * Jede Fallstudie listet ihren Stack, und die Architekturdiagramme nennen
 * dieselben Namen noch einmal. Das ist eine Behauptung über fremden Code, die
 * niemand von außen prüfen kann — die Repos sind privat. Geprüft wurden bisher
 * die Dateipfade aus den Artikeln und die Commit-Kennungen daneben; die
 * Technik selbst nicht.
 *
 * Am 03.08.2026 stand deshalb sechs Tage lang „On-Device-LLM (GGUF/llama.cpp)"
 * auf der Startseite, obwohl Salati 1.34.0 `llama.rn` aus dem Projekt genommen
 * hatte. Gefunden wurde das von Hand. Dieser Lauf findet es beim nächsten Mal
 * von selbst.
 *
 * Gesucht wird in zwei Quellen je Repo: in den Abhängigkeiten aller
 * `package.json` und im Quelltext. Ein Name gilt als belegt, wenn er in einer
 * der beiden vorkommt — vieles ist kein npm-Paket (Hetzner, Coolify, Mailcow,
 * n8n stehen in Konfigurationen und Skripten).
 *
 * Was hier bewusst **nicht** geprüft wird: Versionsnummern. „React Native
 * 0.86" gegen die installierte Fassung zu halten wäre richtig und ist ein
 * eigener Lauf; hier geht es um die Frage, ob die Sache überhaupt da ist.
 *
 * Fehlt ein Repo, wird übersprungen statt zu scheitern.
 *
 *   npm run check:stack
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const REPOS = {
  salati: "../../SalatiTech",
  menucloud: "../../MenuCloud",
  nouri: "../../NOURI",
  wohnungsjaeger: "../../KIWohnung",
};

/*
   Namen, die keine Technik sind, sondern Überschriften der Stack-Gruppen oder
   Eigenschaften des Projekts. Sie stehen in derselben Liste und lassen sich
   nirgends nachschlagen.
*/
const KEINE_TECHNIK = new Set([
  "Mobile",
  "Clients",
  "Frontend",
  "Backend",
  "Native",
  "Infrastruktur",
  "Qualität",
  "Budget",
  "Runtime",
  "Automation",
  "Apps",
  "Services",
  "Delivery",
  "Daten",
  "Betrieb",
  "Agent",
  "Oberflächen",
  "Kuratierter Korpus",
  "Prompt-Konditionierung",
  "Eigenes Retrieval",
  "Persistente Browser-Profile",
  "Regelbasierter Fallback",
  "Lighthouse-Budgets",
  "Bundle-Budget",
  "Lighthouse-Cron",
  "Cron-Scheduler",
  "App Widgets",
  "Live Activities",
  "KI on-device",
  "Backend & Delivery",
  "Backend & Daten",
  "Daten & KI",
]);

/*
   Was auf der Seite steht, heißt im Repo oft anders: Der Name ist für Leser
   gewählt, der Suchbegriff muss zum Code passen. Ohne diese Zuordnung meldete
   der Lauf „Turborepo" als fehlend, obwohl `turbo.json` im Wurzelverzeichnis
   liegt — ein Fehlalarm, und ein Wächter mit Fehlalarmen wird abgeschaltet.
*/
const ANDERS_IM_CODE = {
  Turborepo: "turbo.json",
  "pnpm Workspaces": "pnpm-workspace",
  "React 19 RSC": "react",
  "EAS Build & Update": "eas.json",
  "Row Level Security": "row level security",
  RLS: "row level security",
  "Server-Sent Events": "text/event-stream",
  "node:sqlite": "node:sqlite",
  "Anthropic API": "anthropic",
  "Fiskaly TSE": "fiskaly",
  "Android TV": "leanback",
  "Wear OS": "wear",
};

/*
   Wo ein Name ein npm-Paket ist, zählt nur die Abhängigkeit.

   Die Textsuche allein reicht dafür nicht, und das ist gemessen: Nach dem
   Entfernen von `llama.rn` steht in `features/ki/model.ts` weiterhin ein
   Kommentar, der die Abschaffung erklärt — die Suche nach „llama" findet ihn
   und meldet die Technik als belegt. Ein Wort im Quelltext ist kein Beweis
   dafür, dass etwas benutzt wird; ein Eintrag in `dependencies` schon.
*/
const ALS_PAKET = {
  /* Dienste stehen bewusst nicht hier: Supabase wird über `DATABASE_URL` und
     die REST-Schnittstelle benutzt, nicht zwingend über das npm-Paket —
     gemessen in Salati (`@salatibox/db` gegen dieselbe Instanz) und in NOURI
     (reine `fetch`-Aufrufe). Für sie gilt die Textsuche. */
  "llama.cpp / GGUF": "llama.rn",
  "React Native 0.86": "react-native",
  "Expo SDK 57": "expo",
  "Expo Router": "expo-router",
  "Reanimated 4": "react-native-reanimated",
  "whisper.rn": "whisper.rn",
  "Next.js 16 App Router": "next",
  "React 19 RSC": "react",
  Tailwind: "tailwindcss",
  "Stripe Connect": "stripe",
  Vitest: "vitest",
  Playwright: "playwright",
  Sentry: "sentry",
  Fastify: "fastify",
  "Next.js": "next",
  Expo: "expo",
  TypeScript: "typescript",
};

/** „Supabase / Postgres" nennt zwei Dinge, „React Native 0.86" eines mit Version. */
function suchbegriffe(eintrag) {
  return eintrag
    .split("/")
    .map((teil) =>
      teil
        .replace(/\s+\d+(\.\d+)*$/, "")
        .replace(/\s*\(.*\)\s*/g, " ")
        .replace(/\s+(SDK|API)\s*\d*$/i, "")
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Sucht im Quelltext eines Repos.
 *
 * Zuerst über `git grep`, weil das schnell ist und `node_modules` ohnehin
 * auslässt. Nicht jedes dieser Verzeichnisse ist ein git-Arbeitsbaum —
 * WohnungsJäger ist keiner —, und dort scheiterte `git grep` an jedem Begriff.
 * Der Lauf meldete daraufhin vier Techniken als fehlend, die im Code stehen:
 * `node:sqlite` in `src/core/db.ts`, die Ereignisströme in `src/core/bus.ts`.
 * Ein Wächter, der die Abwesenheit seines eigenen Werkzeugs als Befund
 * ausgibt, ist schlimmer als keiner.
 */
function imQuelltext(repo, begriff) {
  try {
    execFileSync("git", ["-C", repo, "grep", "-l", "-i", "-F", "--", begriff], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    return true;
  } catch {
    /* Kein git-Baum oder kein Treffer: von Hand nachsehen. */
  }

  const gesucht = begriff.toLowerCase();
  const durchsuchen = (ordner, tiefe = 0) => {
    if (tiefe > 4) return false;
    let eintraege;
    try {
      eintraege = readdirSync(ordner, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const eintrag of eintraege) {
      if (eintrag.name === "node_modules" || eintrag.name.startsWith(".")) continue;
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) {
        if (durchsuchen(pfad, tiefe + 1)) return true;
      } else if (/\.(ts|tsx|js|jsx|mjs|json|md|ya?ml|toml|sql|kt|swift)$/.test(eintrag.name)) {
        try {
          if (readFileSync(pfad, "utf8").toLowerCase().includes(gesucht)) return true;
        } catch {
          /* Unlesbare Datei ist kein Treffer und kein Fehler. */
        }
      }
    }
    return false;
  };
  return durchsuchen(repo);
}

const quelle = readFileSync(join("src", "content", "site.ts"), "utf8");

const funde = [];
let geprueft = 0;
let uebersprungen = 0;

for (const [id, repo] of Object.entries(REPOS)) {
  const block = quelle.match(
    new RegExp(`id: "${id}"[\\s\\S]*?stack: \\[([\\s\\S]*?)\\n    \\],`),
  );
  if (!block) continue;

  if (!existsSync(repo)) {
    uebersprungen++;
    continue;
  }

  /* Alle Abhängigkeiten des Repos, aus jeder package.json unterhalb der Wurzel. */
  const pakete = new Set();
  const sammle = (ordner, tiefe = 0) => {
    if (tiefe > 3) return;
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      if (eintrag.name === "node_modules" || eintrag.name.startsWith(".")) continue;
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) sammle(pfad, tiefe + 1);
      else if (eintrag.name === "package.json") {
        try {
          const d = JSON.parse(readFileSync(pfad, "utf8"));
          for (const name of Object.keys({ ...d.dependencies, ...d.devDependencies })) {
            pakete.add(name.toLowerCase());
          }
        } catch {
          /* Eine unlesbare package.json ist kein Befund dieses Laufs. */
        }
      }
    }
  };
  sammle(repo);

  const namen = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  for (const eintrag of namen) {
    if (KEINE_TECHNIK.has(eintrag)) continue;

    geprueft++;

    /* Pakete zuerst: Hier gilt die Abhängigkeit, nicht der Fließtext. */
    if (ALS_PAKET[eintrag]) {
      /* Ohne Namensraum vergleichen: „Playwright" steht als
         `@playwright/test` in der Liste, `@sentry/nextjs` ebenso. */
      const paket = ALS_PAKET[eintrag].toLowerCase();
      const passt = (p) => {
        const ohneRaum = p.replace(/^@/, "").replace(/\//g, "-");
        return p === paket || ohneRaum === paket || ohneRaum.split("-").includes(paket);
      };
      if (![...pakete].some(passt)) {
        funde.push(
          `${id}: „${eintrag}" steht in keiner package.json von ${repo.split("/").pop()}`,
        );
      }
      continue;
    }

    const begriffe = ANDERS_IM_CODE[eintrag]
      ? [ANDERS_IM_CODE[eintrag]]
      : suchbegriffe(eintrag);

    const treffer = begriffe.every((begriff) => {
      const klein = begriff.toLowerCase();
      if ([...pakete].some((p) => p.includes(klein.replace(/[\s.]/g, "")) || p.includes(klein))) {
        return true;
      }
      /* Zweite Quelle: der Quelltext. Vieles ist kein Paket. */
      return imQuelltext(repo, begriff);
    });

    if (!treffer) funde.push(`${id}: „${eintrag}" ist in ${repo.split("/").pop()} nicht zu finden`);
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} genannte Technik ohne Entsprechung im Repo:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nEntweder ist die Angabe veraltet, oder sie heißt im Code anders. ` +
      `Beides gehört geklärt, bevor jemand danach fragt.`,
  );
  process.exit(1);
}

if (geprueft === 0) {
  console.log("Produktivrepos nicht gefunden, Stack-Prüfung übersprungen.");
} else {
  console.log(
    `Jede genannte Technik ist belegt: ${geprueft} Einträge geprüft` +
      (uebersprungen ? `, ${uebersprungen} Repo(s) nicht da` : "") +
      ".",
  );
}
