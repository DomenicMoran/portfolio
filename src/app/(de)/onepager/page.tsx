import type { Metadata } from "next";
import Link from "next/link";
import { about, caseStudies, site, skillDomains } from "@/content/site";
import { PrintButton } from "./PrintButton";

/**
 * Eine Kennzahl aus dem Inhalt holen, statt sie hier hinzuschreiben.
 *
 * `about.stats` ist dieselbe Quelle, aus der die Startseite ihre Kacheln
 * baut. Damit kann der One-Pager nicht mehr eine andere Zahl zeigen als die
 * Seite, und genau das war er: 3.971 gegen 4.053.
 */
function kennzahl(anfang: string): string {
  const treffer = about.stats.find((s) => s.label.startsWith(anfang));
  if (!treffer) throw new Error(`Kennzahl "${anfang}" fehlt in about.stats.`);
  return treffer.value;
}

/**
 * Auf den nächsten runden Tausender abrunden.
 *
 * Das Kurzprofil geht als PDF an Firmen und liegt danach in einem Postfach,
 * das niemand mehr aktualisiert. Eine exakte Zahl darin ist ab dem nächsten
 * Commit überholt; eine Untergrenze bleibt wahr, solange die Zahl wächst.
 *
 * Auf der Webseite steht weiterhin der genaue Wert. Der Unterschied ist nicht
 * Genauigkeit, sondern Erreichbarkeit: Was der stündliche Prüflauf nachzählen
 * und neu ausliefern kann, darf exakt sein.
 */
function untergrenze(zahl: string): string {
  const roh = Number(zahl.replace(/\./g, ""));
  if (!Number.isFinite(roh) || roh < 1000) {
    throw new Error(`Kennzahl "${zahl}" lässt sich nicht auf Tausender abrunden.`);
  }
  return `${Math.floor(roh / 1000)}.000`;
}

export const metadata: Metadata = {
  title: "Kurzprofil",
  description: `Kurzprofil von ${site.name}, ${site.role} aus Berlin: vier Systeme in Produktion, Werdegang und Kontakt auf einer Seite.`,
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
 * abbreviations and decimals ("§ 146a AO", "1.44") do not cut the sentence short.
 */
function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](?=\s+[A-ZÄÖÜ])/);
  return match ? match[0] : text;
}

/**
 * Commit-Zahlen auf dem gedruckten Blatt als Untergrenze, alles andere exakt.
 *
 * Dieselbe Regel wie beim LinkedIn-Titelbild und im Lebenslauf: Was der
 * stündliche Prüflauf nachzählen und neu ausliefern kann, bleibt exakt — die
 * Webseite. Was einmal verschickt wird und danach in einem Postfach liegt,
 * bekommt eine Grenze, die hält.
 *
 * Betroffen sind nur die Commits. Sie wachsen täglich, ohne dass jemand den
 * Inhalt anfasst. API-Routen, Migrationen, Testfälle oder Rezepte ändern sich
 * nur mit dem Code, und dann meldet es der Prüflauf und beide Stellen werden
 * zusammen nachgezogen.
 */
function gedruckt(metrik: { value: string; label: string }) {
  if (!/commits/i.test(metrik.label)) return metrik.value;
  const roh = Number(metrik.value.replace(/\./g, ""));
  if (!Number.isFinite(roh) || roh < 1000) return metrik.value;
  return `über ${Math.floor(roh / 1000).toLocaleString("de-DE")}.000`;
}

export default function OnePager() {
  // Die ersten vier je Bereich. Die Reihenfolge in der Inhaltsdatei ist
  // bewusst gewählt, es gibt keine Rangzahl mehr, nach der sortiert würde.
  const topSkills = skillDomains.map((domain) => ({
    title: domain.title,
    items: domain.skills.slice(0, 4).map((s) => s.name),
  }));

  return (
    // `color-scheme: light` ist hier nicht kosmetisch, sondern der Fix gegen
    // Androids "Force Dark" und Samsung Internets Dunkelmodus: Ohne die Angabe
    // invertieren die den weissen Hintergrund, lassen den fest gesetzten
    // dunklen Text aber stehen. Ergebnis ist Schwarz auf Schwarz. Mit der
    // Angabe erklärt die Seite, dass sie ihr Farbschema selbst kennt, und
    // wird in Ruhe gelassen.
    //
    // print:min-h-0: min-h-svh loest auch auf Papier zur vollen Viewport-Höhe
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
        <section className="mt-7 print:mt-4">
          <p className="text-[14px] leading-snug text-[#25252e]">
            Fullstack Product Engineer mit vier eigenständig gebauten Systemen in
            Produktion: Apps in beiden Stores, eine mandantenfähige Gastro-SaaS mit
            gesetzlich vorgeschriebener Fiskalisierung, ein autonomer Agent.
{" "}
            {/* Die Zahl kommt aus dem Inhalt und steht nicht hier: Fest
                geschrieben blieb sie beim Nachzaehlen als einzige stehen und
                sagte 3.971, waehrend die Seite daneben 4.053 zeigte. Das
                {" "} davor ist noetig, weil ein JSX-Kommentar zwischen zwei
                Textknoten den Umbruch verschluckt: sonst steht dort
                "Agent.4.053". */}
            Über {untergrenze(kennzahl("Commits"))} Commits seit März 2026,
            neben einem Vollzeitjob.
            Softwareentwicklung autodidaktisch seit 2022. Schwerpunkt:
            agentengestützte Entwicklung mit strikter Verifikationsdisziplin,
            ein grüner Testlauf ist kein Beweis.
          </p>
        </section>

        {/* Projects */}
        <section className="mt-8 print:mt-4">
          <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            Projekte
          </h2>

          <div className="flex flex-col gap-5 print:gap-3">
            {caseStudies.map((study) => (
              <div key={study.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  {/* Größe und Farbe stehen hier beide ausdrücklich, und das
                      hat einen gemessenen Grund.

                      `text-base` ist auf dieser Seite keine Schriftgröße. Das
                      Theme definiert eine Farbe namens "base", und Tailwind
                      macht daraus eine Farbklasse, die die eingebaute
                      Größenklasse gleichen Namens verdrängt: gesetzt wurde
                      color, nicht font-size.

                      Auf der hellen Druckseite setzte sonst nichts die Farbe,
                      also erbte die Überschrift das Weiß des dunklen Themas —
                      die vier Projektnamen standen weiß auf weiß. */}
                  <h3 className="text-[16px] font-semibold text-[#101014]">
                    {study.name}
                    <span className="ml-2 text-[13px] font-normal text-[#5a5a66]">
                      {study.statusLabel} · {study.year}
                    </span>
                  </h3>
                  <span className="font-mono text-[10px] text-[#6a6a76]">
                    {study.metrics.map((m) => `${gedruckt(m)} ${m.label}`).join("  ·  ")}
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
        <div className="mt-8 grid grid-cols-2 gap-x-8 break-inside-avoid print:mt-4">
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
              {/* Schulstationen bleiben dem vollständigen Lebenslauf vorbehalten,
                  auf einer Seite zählt, was die Projekte erklärt. */}
              {about.timeline.slice(0, 3).map((entry) => (
                <div key={entry.period} className="text-[12.5px] leading-snug">
                  <dt className="font-mono text-[10.5px] text-[#5a5a66]">
                    {entry.period}
                  </dt>
                  <dd>
                    <span className="font-semibold">{entry.title}</span>
                    <span className="text-[#3a3a44]"> · {entry.org}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11.5px] leading-snug text-[#3a3a44]">
              Softwareentwicklung autodidaktisch, kein Studium, kein Bootcamp.
              Der Nachweis sind vier Systeme in Produktion.
            </p>
          </section>
        </div>

        {/* Der Abschnitt "Arbeitsweise" stand hier und ist raus.

            Grund: Das eingecheckte PDF war einseitig, die Seite erzeugt aber
            seit einer Weile zwei. Gemessen 1.495 px roh, mit zoom 0,83 also
            1.241 px gegen 1.040 px nutzbare Hoehe. Das PDF war schlicht
            veraltet und passte nicht mehr zu der Seite, aus der es entsteht.

            Von allem, was auf dieser Seite steht, war dieser Block der
            entbehrlichste: Seine drei Punkte sagen dasselbe wie der letzte
            Satz des Einleitungsabsatzes, und vollstaendig stehen sie auf der
            Webseite. Die vier Projekte sind die eigentliche Aussage und
            bleiben. */}

        <footer className="mt-9 flex flex-wrap print:mt-4 items-center justify-between gap-3 border-t border-[#d4d4dc] pt-4 text-[11.5px] text-[#6a6a76]">
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
        {/* -my-2/py-2 bringt die Trefferflaeche von gemessenen 18 px auf
            34 px, ohne die Zeile optisch zu verschieben. Ein eigenstaendiger
            Link faellt nicht unter die Inline-Ausnahme von WCAG 2.5.8. */}
        <Link
          href="/"
          className="-my-2 inline-block py-2 text-sm text-[#4a4a55] underline underline-offset-4"
        >
          ← Zurück zur Seite
        </Link>
      </div>
    </div>
  );
}
