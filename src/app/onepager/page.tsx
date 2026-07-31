import type { Metadata } from "next";
import Link from "next/link";
import { about, caseStudies, recruiter, site, skillDomains } from "@/content/site";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "One-Pager",
  description: `Kurzprofil von ${site.name} — ${site.role}.`,
  robots: { index: false, follow: true },
};

/**
 * A4-shaped summary that becomes the downloadable PDF via the browser's own
 * print pipeline.
 *
 * Why not generate a PDF server-side: a headless-Chrome dependency for one
 * static document is a maintenance liability, and the print stylesheet gives
 * identical output with selectable text and working links. The button below
 * just calls window.print().
 */
/**
 * Keeps the PDF to a single A4 page. The full argument lives on the site; here
 * only the opening claim of each "hard part" is needed.
 *
 * Splits on sentence-ending punctuation followed by a space and a capital, so
 * abbreviations and decimals ("§146a AO", "1.44") do not cut the sentence short.
 */
function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](?=\s+[A-ZÄÖÜ])/);
  return match ? match[0] : text;
}

export default function OnePager() {
  // Die ersten vier je Bereich — die Reihenfolge in der Inhaltsdatei ist
  // bewusst gewählt, es gibt keine Rangzahl mehr, nach der sortiert würde.
  const topSkills = skillDomains.map((domain) => ({
    title: domain.title,
    items: domain.skills.slice(0, 4).map((s) => s.name),
  }));

  return (
    // `color-scheme: light` ist hier nicht kosmetisch, sondern der Fix gegen
    // Androids "Force Dark" und Samsung Internets Dunkelmodus: Ohne die Angabe
    // invertieren die den weissen Hintergrund, lassen den fest gesetzten
    // dunklen Text aber stehen — Ergebnis ist Schwarz auf Schwarz. Mit der
    // Angabe erklaert die Seite, dass sie ihr Farbschema selbst kennt, und
    // wird in Ruhe gelassen.
    //
    // print:min-h-0: min-h-svh loest auch auf Papier zur vollen Viewport-Hoehe
    // auf und schiebt sonst eine leere zweite Seite an.
    <div
      style={{ colorScheme: "light" }}
      className="min-h-svh bg-white text-[#101014] print:min-h-0 print:bg-white"
    >
      <PrintButton />

      <article className="onepager mx-auto max-w-[820px] px-8 py-14 print:px-0 print:py-0">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#101014] pb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{site.name}</h1>
            <p className="mt-1.5 text-lg text-[#3a3a44]">{site.role}</p>
          </div>
          <div className="text-right text-sm leading-relaxed text-[#4a4a55]">
            <p>{site.location}</p>
            <p>{site.email}</p>
            {site.socials.github ? (
              <p>{site.socials.github.replace("https://", "")}</p>
            ) : null}
            {site.socials.linkedin ? (
              <p>{site.socials.linkedin.replace("https://", "")}</p>
            ) : null}
            <p className="mt-1 font-medium text-[#101014]">
              {site.availability.label}
            </p>
          </div>
        </header>

        {/* Positioning */}
        <section className="mt-7 print:mt-5">
          <p className="text-[14px] leading-snug text-[#25252e]">
            Fullstack Product Engineer mit vier eigenständig gebauten Systemen in
            Produktion: Apps in beiden Stores, eine mandantenfähige Gastro-SaaS mit
            gesetzlich vorgeschriebener Fiskalisierung, ein autonomer Agent.
            3.946 Commits in vier Monaten, neben einem Vollzeitjob.
            Softwareentwicklung autodidaktisch seit 2022. Schwerpunkt:
            agentengestützte Entwicklung mit strikter Verifikationsdisziplin —
            ein grüner Testlauf ist kein Beweis.
          </p>
        </section>

        {/* Projects */}
        <section className="mt-8 print:mt-6">
          <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            Projekte
          </h2>

          <div className="flex flex-col gap-5 print:gap-4">
            {caseStudies.map((study) => (
              <div key={study.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">
                    {study.name}
                    <span className="ml-2 text-[13px] font-normal text-[#5a5a66]">
                      {study.statusLabel} · {study.year}
                    </span>
                  </h3>
                  <span className="font-mono text-[10px] text-[#6a6a76]">
                    {study.metrics.map((m) => `${m.value} ${m.label}`).join("  ·  ")}
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-[#25252e]">
                  {study.tagline}.{" "}
                  <strong className="font-semibold">{study.hardPart.title}:</strong>{" "}
                  {firstSentence(study.hardPart.body)}
                </p>
                <p className="mt-1 font-mono text-[10.5px] leading-snug text-[#6a6a76]">
                  {study.stack.flatMap((g) => g.items).slice(0, 7).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Schwerpunkte und Werdegang nebeneinander. Beide sind kompakte Listen;
            untereinander kosten sie die zweite Seite, nebeneinander passen sie. */}
        <div className="mt-8 grid grid-cols-2 gap-x-8 break-inside-avoid print:mt-6">
          <section>
            <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
              Schwerpunkte
            </h2>
            <dl className="flex flex-col gap-1.5">
              {topSkills.map((group) => (
                <div key={group.title}>
                  <dt className="text-[12.5px] font-semibold">{group.title}</dt>
                  <dd className="text-[12.5px] leading-snug text-[#3a3a44]">
                    {group.items.join(" · ")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
              Werdegang
            </h2>
            <dl className="flex flex-col gap-1.5">
              {/* Schulstationen bleiben dem vollständigen Lebenslauf vorbehalten —
                  auf einer Seite zählt, was die Projekte erklärt. */}
              {about.timeline.slice(0, 3).map((entry) => (
                <div key={entry.period} className="text-[12.5px] leading-snug">
                  <dt className="font-mono text-[10.5px] text-[#5a5a66]">
                    {entry.period}
                  </dt>
                  <dd>
                    <span className="font-semibold">{entry.title}</span>
                    <span className="text-[#3a3a44]"> — {entry.org}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11.5px] leading-snug text-[#3a3a44]">
              Softwareentwicklung autodidaktisch — kein Studium, kein Bootcamp.
              Der Nachweis sind vier Systeme in Produktion.
            </p>
          </section>
        </div>

        {/* Way of working */}
        <section className="mt-7 break-inside-avoid print:mt-5">
          <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            Arbeitsweise
          </h2>
          <ul className="flex flex-col gap-1.5">
            {recruiter.strengths.map((item) => (
              <li key={item.title} className="text-[13px] leading-snug">
                <strong className="font-semibold">{item.title}.</strong>{" "}
                <span className="text-[#25252e]">{firstSentence(item.body)}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-9 flex flex-wrap print:mt-6 items-center justify-between gap-3 border-t border-[#d4d4dc] pt-4 text-[11.5px] text-[#6a6a76]">
          <span>
            Vollständige Fallstudien mit Architekturdiagrammen: {site.url.replace("https://", "")}
          </span>
          <span>
            Stand:{" "}
            {new Date().toLocaleDateString("de-DE", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </footer>
      </article>

      <div className="no-print mx-auto max-w-[820px] px-8 pb-16">
        <Link
          href="/"
          className="text-sm text-[#4a4a55] underline underline-offset-4"
        >
          ← Zurück zur Seite
        </Link>
      </div>
    </div>
  );
}
