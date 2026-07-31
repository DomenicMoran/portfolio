"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { about, site } from "@/content/site";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The biography section.
 *
 * Placed after the case studies on purpose: the work earns the right to the
 * story. A visitor who has just seen four production systems reads "employer
 * officer" as remarkable; a visitor who reads it first reads it as a
 * disclaimer.
 */
export function About() {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb animate-float top-0 right-[10%] size-[30rem] bg-violet/10" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={about.eyebrow} title={about.title} />

        <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-20">
          {/* Narrative */}
          <div className="flex flex-col gap-6">
            {/* Porträt nur, wenn ein echtes hinterlegt ist — siehe site.ts */}
            {about.portrait ? (
              <Reveal>
                <div className="lit relative mb-2 w-fit overflow-hidden rounded-2xl border border-line">
                  <Image
                    src={about.portrait}
                    alt={`Porträtfoto von ${site.name}`}
                    width={220}
                    height={220}
                    sizes="220px"
                    className="h-auto w-[13.75rem] object-cover"
                  />
                </div>
              </Reveal>
            ) : null}

            {about.paragraphs.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p
                  className={cn(
                    "leading-relaxed text-pretty",
                    i === 0 ? "text-lg text-ink sm:text-xl" : "text-ink-dim",
                  )}
                >
                  {paragraph}
                </p>
              </Reveal>
            ))}

            {/* Stats */}
            <motion.dl
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
              className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4"
            >
              {about.stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: ease.expo },
                    },
                  }}
                  // A <dl> may only contain dt/dd groups — label and note both
                  // live inside <dt>, the number in <dd>, and flex-col-reverse
                  // puts the number back on top visually.
                  className="flex flex-col-reverse gap-1"
                >
                  <dt className="flex flex-col gap-0.5">
                    <span className="text-xs leading-snug text-ink">{stat.label}</span>
                    <span className="text-[11px] leading-snug text-ink-faint">
                      {stat.note}
                    </span>
                  </dt>
                  <dd className="text-2xl font-semibold tracking-tight text-acid tabular-nums sm:text-3xl">
                    <Counter value={stat.value} />
                  </dd>
                </motion.div>
              ))}
            </motion.dl>

            {/* Prüfdatum sichtbar: macht die Zahlen nachvollziehbar und erklärt
                jede Abweichung, die durch Weiterarbeiten entsteht. */}
            <Reveal delay={0.1}>
              <p className="max-w-[62ch] text-xs leading-relaxed text-ink-faint text-pretty">
                {about.statsHinweis}
              </p>
            </Reveal>
          </div>

          {/* Timeline */}
          <div className="lg:pt-2">
            <h3 className="text-eyebrow mb-8">Werdegang</h3>
            <ol className="relative flex flex-col">
              {/* Spine */}
              <span
                aria-hidden
                className="absolute top-1.5 bottom-2 left-[5px] w-px bg-line"
              />

              {about.timeline.map((entry, i) => (
                <Reveal as="li" key={entry.period} delay={i * 0.05} className="relative pb-9 pl-8 last:pb-0">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1.5 left-0 size-[11px] rounded-full border-2",
                      entry.current
                        ? "border-acid bg-acid"
                        : "border-line bg-base",
                    )}
                  />
                  <span className="font-mono text-[11px] tracking-wide text-ink-faint">
                    {entry.period}
                  </span>
                  <h4 className="mt-1.5 text-sm font-semibold text-ink">{entry.title}</h4>
                  <p className="text-sm text-ink-dim">{entry.org}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-faint text-pretty">
                    {entry.body}
                  </p>
                </Reveal>
              ))}
            </ol>

            {/* Öffentlicher Code — beantwortet die „wo ist der Code?"-Frage,
                bevor sie gestellt wird. */}
            <Reveal delay={0.08} className="mt-10 border-t border-line pt-8">
              <h3 className="text-eyebrow mb-3">{about.openSource.label}</h3>
              <p className="mb-5 text-xs leading-relaxed text-ink-faint text-pretty">
                {about.openSource.lede}
              </p>
              <ul className="flex flex-col gap-4">
                {about.openSource.items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg border border-line bg-surface/40 p-3.5 transition-colors hover:border-acid/40"
                    >
                      <span className="flex items-center gap-1.5 font-mono text-xs text-acid">
                        {item.name}
                        <ArrowUpRight
                          className="size-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-ink-dim text-pretty">
                        {item.body}
                      </span>
                      <span className="mt-2 block font-mono text-[10px] text-ink-faint">
                        {item.meta}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Zertifikate füllen die Spalte mit Beleg statt mit Weißraum. */}
            <Reveal delay={0.1} className="mt-10 border-t border-line pt-8">
              <h3 className="text-eyebrow mb-5">{about.certificates.label}</h3>
              <div className="flex flex-col gap-5">
                {about.certificates.groups.map((group) => (
                  <div key={group.issuer}>
                    <h4 className="mb-2 font-mono text-[11px] tracking-wide text-ink-dim">
                      {group.issuer}
                    </h4>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-xs leading-snug text-ink-faint"
                        >
                          <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-acid/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
