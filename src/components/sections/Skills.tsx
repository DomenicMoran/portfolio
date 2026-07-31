"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Cloud, Cpu, Database, Layout } from "lucide-react";
import { skillDomains } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ICONS = {
  frontend: Layout,
  backend: Database,
  cloud: Cloud,
  ai: Cpu,
} as const;

export function Skills() {
  return (
    <section id="skills" className="relative scroll-mt-24 px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Fähigkeiten"
          title="Breit genug für das ganze Produkt, tief genug für die harten Stellen."
          lede="Jede Einschätzung unten steht neben dem System, an dem sie entstanden ist. Selbsteinschätzungen ohne Beleg sind wertlos — deshalb steht hier keine ohne."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {skillDomains.map((domain, i) => (
            <Reveal key={domain.id} delay={i * 0.06}>
              <DomainCard domain={domain} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DomainCard({ domain }: { domain: (typeof skillDomains)[number] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const Icon = ICONS[domain.id as keyof typeof ICONS] ?? Layout;

  return (
    <div className="lit group h-full rounded-2xl border border-line bg-surface/40 p-7 transition-colors duration-500 hover:border-ink-faint/40 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-raised text-acid transition-colors duration-500 group-hover:border-acid/40">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">{domain.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-faint text-pretty">
            {domain.summary}
          </p>
        </div>
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {domain.skills.map((skill, i) => (
          <li
            key={skill.name}
            onMouseEnter={() => setHovered(skill.name)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(skill.name)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            className="flex flex-col gap-1.5 rounded-md outline-offset-4"
          >
            {/* Stacked on phones, side by side from sm up. The evidence is the
                point of this list, so it never gets hidden — only reflowed. */}
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <span className="text-sm text-ink-dim">{skill.name}</span>
              <motion.span
                className="font-mono text-[11px] text-ink-faint sm:shrink-0 sm:text-right"
                animate={{ opacity: hovered === skill.name ? 1 : 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {skill.evidence}
              </motion.span>
            </div>

            <div className="h-[3px] overflow-hidden rounded-full bg-raised">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-colors duration-300",
                  hovered === skill.name ? "bg-acid" : "bg-ink-faint/60",
                )}
                initial={{ width: 0 }}
                whileInView={{ width: `${skill.level}%` }}
                viewport={viewportOnce}
                transition={{ duration: 1, ease: ease.expo, delay: 0.05 * i }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
