import Link from "next/link";
import type { Content } from "@/content/types";
import { SOCIALS } from "@/content/types";
import { PrintButton } from "@/components/ui/PrintButton";

/**
 * Eine Kennzahl aus dem Inhalt holen, statt sie hier hinzuschreiben.
 *
 * `about.stats` ist dieselbe Quelle, aus der die Startseite ihre Kacheln
 * baut. Damit kann der One-Pager nicht mehr eine andere Zahl zeigen als die
 * Seite, und genau das war er: 3.971 gegen 4.053.
 */
function kennzahl(about: Content["about"], anfang: string): string {
  // Ohne Rücksicht auf Groß- und Kleinschreibung: Die deutsche Beschriftung
  // beginnt mit "Commits seit …", die englische mit "commits since …".
  const treffer = about.stats.find((s) =>
    s.label.toLowerCase().startsWith(anfang.toLowerCase()),
  );
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
function untergrenze(zahl: string, sprache: "de" | "en"): string {
  // Beide Trennzeichen entfernen: Deutsch schreibt 4.094, Englisch 4,094.
  const roh = Number(zahl.replace(/[.,]/g, ""));
  if (!Number.isFinite(roh) || roh < 1000) {
    throw new Error(`Kennzahl "${zahl}" lässt sich nicht auf Tausender abrunden.`);
  }
  return `${Math.floor(roh / 1000)}${sprache === "de" ? ".000" : ",000"}`;
}

/**
 * Hält die PDF auf einer A4-Seite. Die vollständige Begründung steht auf der
 * Website; hier genügt der erste Satz jedes „schwierigen Teils".
 *
 * Getrennt wird an Satzzeichen, denen ein Leerzeichen und ein Großbuchstabe
 * folgt — so schneiden Abkürzungen und Kommazahlen („§ 146a AO", „1.44")
 * den Satz nicht vorzeitig ab.
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
function gedruckt(
  metrik: { value: string; label: string },
  mindestens: string,
  sprache: "de" | "en",
) {
  if (!/commits/i.test(metrik.label)) return metrik.value;
  const roh = Number(metrik.value.replace(/[.,]/g, ""));
  if (!Number.isFinite(roh) || roh < 1000) return metrik.value;
  const tausender = Math.floor(roh / 1000).toLocaleString(
    sprache === "de" ? "de-DE" : "en-GB",
  );
  return `${mindestens.toLowerCase()} ${tausender}${sprache === "de" ? ".000" : ",000"}`;
}

export function OnePager({
  inhalt,
  sprache,
}: {
  inhalt: Content;
  sprache: "de" | "en";
}) {
  const { about, caseStudies, skills, site, onepager } = inhalt;
  // Die ersten vier je Bereich. Die Reihenfolge in der Inhaltsdatei ist
  // bewusst gewählt, es gibt keine Rangzahl mehr, nach der sortiert würde.
  /**
   * Die Untergrenze der Commits steht im Satz, nicht daneben.
   *
   * Der Platzhalter `{commits}` kommt aus der Inhaltsdatei, damit derselbe
   * Absatz in beiden Sprachen dieselbe Zahl trägt und die Zahl trotzdem
   * nirgends fest geschrieben steht. Fest geschrieben blieb sie beim
   * Nachzählen als einzige stehen und sagte 3.971, während die Seite daneben
   * 4.053 zeigte.
   */
  const positionierung = onepager.positioning.replace(
    "{commits}",
    `${onepager.atLeast} ${untergrenze(kennzahl(about, "Commits"), sprache)}`,
  );

  const topSkills = skills.domains.map((domain) => ({
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
      <PrintButton hinweis={onepager.printHint} beschriftung={onepager.printButton} />

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
            {SOCIALS.github ? <p>{SOCIALS.github.replace("https://", "")}</p> : null}
            {SOCIALS.linkedin ? <p>{SOCIALS.linkedin.replace("https://", "")}</p> : null}
            <p className="mt-1 font-medium text-[#101014]">
              {site.availability.label}
            </p>
          </div>
        </header>

        {/* Positioning */}
        <section className="mt-7 print:mt-4">
          <p className="text-[14px] leading-snug text-[#25252e]">
            {positionierung}
          </p>
        </section>

        {/* Projects */}
        <section className="mt-8 print:mt-4">
          <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            {onepager.projects}
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
                    {study.metrics.map((m) => `${gedruckt(m, onepager.atLeast, sprache)} ${m.label}`).join("  ·  ")}
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
              {onepager.focus}
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
              {onepager.path}
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
              {onepager.pathNote}
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
            {onepager.fullCaseStudies} {site.url.replace("https://", "")}
          </span>
          <span>
            {onepager.asOf}{" "}
            {new Date().toLocaleDateString(sprache === "de" ? "de-DE" : "en-GB", {
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
          href={sprache === "de" ? "/" : "/en"}
          className="-my-2 inline-block py-2 text-sm text-[#4a4a55] underline underline-offset-4"
        >
          {onepager.back}
        </Link>
      </div>
    </div>
  );
}
