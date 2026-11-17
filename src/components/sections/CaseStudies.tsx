"use client";

import { useContent } from "@/content/ContentProvider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AUSFUEHRLICH } from "./case-studies/shared";
import { CaseStudyPanel } from "./case-studies/CaseStudyPanel";
import { WeitereProjekte } from "./case-studies/WeitereProjekte";
import { WeitereVorfuehrungen } from "./case-studies/WeitereVorfuehrungen";
import { Werkbank } from "./case-studies/Werkbank";

export function CaseStudies() {
  const { work, caseStudies, werkbank } = useContent();
  const ausfuehrlich = caseStudies
    .filter((s) => !s.prototyp)
    .slice(0, AUSFUEHRLICH);
  /* `nochNichtAusgeliefert` heißt: kein Live-Verweis, nicht: unsichtbar.
     Die Typangabe sagt dasselbe, und WohnungsJäger trägt genau deshalb den
     Satz zur begründeten Leerstelle statt eines erfundenen Bildes. Wer diese
     Projekte hinter dem Filter verbirgt, nimmt den Satz von der Seite und
     widerspricht der Zusage, dass ein System ohne Adresse trotzdem steht. */
  const weitere = caseStudies.filter((s) => s.prototyp);

  return (
    <section
      id="work"
      aria-labelledby="work-titel"
      className="relative scroll-mt-24 px-6 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="work-titel"
          eyebrow={work.eyebrow}
          title={work.title}
          lede={work.lede}
        />

        <div className="mt-20 flex flex-col gap-24 sm:gap-36">
          {ausfuehrlich.map((study) => (
            <CaseStudyPanel key={study.id} study={study} />
          ))}
        </div>

        {/* Immer sichtbar, auch wenn NOURI und Dartile unter den
            ausführlichen Fallstudien stehen. Sonst verschwinden die
            Vorführungen hinter der Offenlegung, und wer nicht klickt,
            findet keine Tagesbilanz und keine Checkout-Tafel. */}
        <WeitereVorfuehrungen fehlend={["nouri", "dartile"]} />

        {weitere.length > 0 && <WeitereProjekte studies={weitere} />}

        {werkbank.items.length > 0 && <Werkbank />}
      </div>
    </section>
  );
}
