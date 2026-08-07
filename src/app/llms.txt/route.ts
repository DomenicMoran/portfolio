import { dateLong } from "@/lib/date-format";
import { en } from "@/content/en";
// Die Profil-URLs stehen nur in der deutschen Quelle, weil sie sprachneutral
// sind. Sie hier zu wiederholen hiesse, sie an zwei Stellen zu pflegen.
import { site as quelle } from "@/content/site";
import { artikelIn } from "@/content/articles";
import verified from "@/content/verified.json";

/**
 * llms.txt — die Fassung dieser Seite für Sprachmodelle.
 *
 * Der Anlass ist beobachtbares Verhalten, kein Trend: Wer heute eine Bewerbung
 * prüft, wirft die URL zunehmend in ChatGPT oder Claude und fragt "passt der?".
 * Was das Modell dann liest, ist gerendertes HTML mit Navigation, Fußzeile und
 * Bildbeschriftungen — und es rät sich den Rest zusammen. Bei einer Seite,
 * deren Kernaussage Belegbarkeit ist, ist genau das der falsche Ausgang.
 *
 * Diese Datei gibt stattdessen die Fakten in der Form, in der ein Modell sie
 * nicht missverstehen kann: kurze Sätze, jede Zahl mit ihrer Messmethode, jede
 * Aussage mit ihrer Quelle. Was nicht belegbar ist, steht nicht drin.
 *
 * Englisch, obwohl die Hauptfassung deutsch ist: Die Datei wird von Werkzeugen
 * gelesen, nicht von Besuchern, und sie nennt beide Sprachfassungen. Ein
 * zweites, deutsches llms.txt wäre dieselbe Information ein zweites Mal — und
 * damit die nächste Stelle, die auseinanderläuft.
 *
 * Erzeugt aus `src/content` und dem Prüfstempel, nicht getippt. Eine Datei mit
 * Zahlen, die niemand nachzieht, wäre schlechter als keine.
 */

/*
   Die veröffentlichten Pakete kommen aus derselben Quelle wie die Seite.

   Vorher standen sie hier von Hand, mit eigenen Kurzbeschreibungen — und nur
   das erste trug eine Adresse. Ein Modell, das nach `cron-last-due` gefragt
   wird, konnte also weder sagen, wo es liegt, noch was die Seite selbst
   darüber schreibt. Zwei Fassungen derselben Angabe sind außerdem genau die
   Stelle, an der eine von beiden veraltet.

   `meta` trägt die Kennzahlen (Tests, Abhängigkeiten); `check-figures.mjs`
   liest sie gegen die Repos gegen. Sie gehören damit auch hierher.
*/
const pakete = en.about.openSource.items
  .map((p) =>
    [`- ${p.name} — ${p.body}`, `  ${p.meta}`, `  ${p.href}`].join("\n"),
  )
  .join("\n");

export const dynamic = "force-static";

/**
 * Die Commit-Zahl steht im Stempel mit deutschem Tausenderpunkt ("4.058").
 * In einem englischen Dokument liest sich das als vier Komma null fünf acht.
 * `en.ts` macht an derselben Stelle dasselbe.
 */
const commits = verified.commitsHead.replace(".", ",");

const measuredOn = dateLong(verified.date);

export function GET() {
  const { site, caseStudies, recruiter } = en;
  const artikel = artikelIn("en");

  // Kurzbeschreibung und Problem sind zwei Sätze aus zwei Feldern. Ohne
  // Trennung dazwischen lief beides ineinander: "…runs offline Existing
  // prayer apps are…" — ein Satz, den so niemand geschrieben hat.
  /* Mit den Adressen, unter denen das System wirklich liegt.

     Vorher standen hier Name, Jahr, Status und das Problem — und keine
     einzige Adresse. Ein Modell, das nach den Apps gefragt wird, konnte aus
     dieser Datei nicht antworten, obwohl sie genau dafür geschrieben ist:
     Vier Apps im Play Store, drei im App Store, dazu die Live-Adressen. Wer
     eine Behauptung nachprüfen will, braucht den Weg dorthin. */
  const projekte = caseStudies
    .map((p) => {
      const adressen = (p.links ?? [])
        .filter((l) => l.kind === "live" || l.kind === "store")
        .map((l) => `- ${l.label}: ${l.href}`)
        .join("\n");
      return (
        `### ${p.name} — ${p.tagline}\n${p.year} · ${p.statusLabel}\n\n${p.problem}` +
        (adressen ? `\n\n${adressen}` : "")
      );
    })
    .join("\n\n");

  const fakten = recruiter.facts
    .map((f) => `- **${f.label}:** ${f.value}`)
    .join("\n");

  const schriften = artikel
    .map((a) => `- [${a.title}](${site.url}/en/articles/${a.slug}) — ${a.dek}`)
    .join("\n");

  const text = `# ${site.name} — ${site.role}

> ${site.meta.description}
> Written for language models. Humans want ${site.url}/en (English) or
> ${site.url} (German, the primary version).

## How to read the numbers on this site

Every figure is counted, not estimated, and carries the date it was counted on.
The commit total is refreshed daily by a scheduled job that reads the GitHub API
over ${verified.repos} repositories and redeploys the site; local commits are
deliberately excluded because an outsider cannot verify them.

- Commits since March 2026: ${commits} (measured ${measuredOn}, source: ${verified.source})
- The figure only grows, so any deviation you find will be higher, not lower.

## Facts

${fakten}

## Systems in production

${projekte}

The production repositories are private: they carry customer data and licensed
content. Read access on request. What could be separated out is published — see
below.

## Published code

${pakete}

## Written

Five failures from these systems, each with cause, fix and the commit that
carries it:

${schriften}

## Contact

- Email: ${site.email}
- LinkedIn: ${quelle.socials.linkedin}
- GitHub: ${quelle.socials.github}
- Fact sheet for recruiters: ${site.url}/en#hire
- One-page profile as PDF: ${site.url}/domenic-moran-one-pager.pdf

## What is deliberately absent

- No phone number. The email satisfies the German § 5 DDG requirement for fast
  contact, and a published number gets scraped.
- No screenshot of the WohnungsJäger dashboard: it shows real listings and real
  applicant data.
`;

  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
