"use client";

import type { Content } from "@/content/types";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";

/** Klappinhalt der Bio — nur clientseitig, damit er nicht in den LCP-Eingriff fällt. */
export function AboutBioDetail({ about }: { about: Content["about"] }) {
  return (
    <>
      {about.paragraphs.slice(1).map((paragraph, i) => (
        <Reveal key={paragraph} delay={i * 0.06}>
          <p className="text-ink-dim leading-relaxed text-pretty">
            {paragraph}
          </p>
        </Reveal>
      ))}

      <dl className="border-line mt-2 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-8 sm:grid-cols-4">
        {about.stats.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={0.15 + i * 0.08}
            className="flex flex-col-reverse gap-1"
          >
            <dt className="flex flex-col gap-0.5">
              <span className="text-ink text-xs leading-snug">
                {stat.label}
              </span>
              <span className="text-ink-faint text-[11px] leading-snug">
                {stat.note}
              </span>
            </dt>
            <dd className="text-acid text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              <Counter value={stat.value} />
            </dd>
          </Reveal>
        ))}
      </dl>

      <Reveal delay={0.1}>
        <p className="text-ink-faint max-w-[62ch] text-xs leading-relaxed text-pretty">
          {about.statsHinweis}
        </p>
      </Reveal>
    </>
  );
}
