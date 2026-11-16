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
  const weitere = caseStudies.filter(
    (s) => s.prototyp && !s.nochNichtAusgeliefert,
  );

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

        <WeitereVorfuehrungen
          fehlend={["nouri", "dartile"].filter(
            (id) => !ausfuehrlich.some((s) => s.id === id),
          )}
        />

        {weitere.length > 0 && <WeitereProjekte studies={weitere} />}

        {werkbank.items.length > 0 && <Werkbank />}
      </div>
    </section>
  );
}
