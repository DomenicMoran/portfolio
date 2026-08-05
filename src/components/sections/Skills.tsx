"use client";

import { Cloud, Cpu, Database, Layout } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONS = {
  frontend: Layout,
  backend: Database,
  cloud: Cloud,
  ai: Cpu,
} as const;

/**
 * Fähigkeiten als Fähigkeit plus Beleg, ohne Prozentbalken.
 *
 * Selbstvergebene Prozentwerte ("TypeScript 93 %") sind ein bekannt schwaches
 * Signal: Niemand kann sie prüfen, und der Unterschied zwischen 88 und 93 ist
 * frei erfunden. Was tatsächlich trägt, ist das System, an dem die Fähigkeit
 * entstanden ist. Genau das steht jetzt an der Stelle, wo vorher der Balken war.
 */
export function Skills() {
  const { skills } = useContent();

  return (
    <section
      id="skills"
      aria-labelledby="skills-titel"
      className="relative scroll-mt-24 px-6 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="skills-titel"
          eyebrow={skills.eyebrow}
          title={skills.title}
          lede={skills.lede}
        />

        <div className="mt-16 grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
          {skills.domains.map((domain, i) => (
            <Reveal key={domain.id} delay={i * 0.06}>
              <DomainCard domain={domain} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DomainCard({
  domain,
}: {
  domain: Content["skills"]["domains"][number];
}) {
  const Icon = ICONS[domain.id as keyof typeof ICONS] ?? Layout;

  return (
    <div className="lit group h-full rounded-2xl border border-line bg-surface/40 p-7 transition-colors duration-500 hover:border-ink-faint/40 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-raised text-acid transition-colors duration-500 group-hover:border-acid/40">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-ink">
            {domain.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-faint text-pretty">
            {domain.summary}
          </p>
        </div>
      </div>

      <dl className="mt-8 flex flex-col">
        {domain.skills.map((skill) => (
          <div
            key={skill.name}
            className="flex flex-col gap-0.5 border-t border-line py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <dt className="text-sm text-ink">{skill.name}</dt>
            {/* `text-balance` verteilt den Beleg auf gleich lange Zeilen.

                Rechtsbündig und zweizeilig sah er vorher aus, als wäre etwas
                abgerissen: Die zweite Zeile trug oft nur ein Wort. Gemessen an
                der ausgelieferten Seite bei 1024 px endeten 13 von 24 Zellen
                auf Deutsch so und 10 von 24 auf Englisch — „Strict überall,
                0 Fehler / als Merge-Gate", „whisper.rn, Spracherkennung /
                ohne Netz".

                `text-balance` statt `text-pretty`: Letzteres verhindert nur
                das einzelne Wort am Ende, hier stehen aber ohnehin nie mehr
                als drei Zeilen, und zwei gleich lange lesen sich neben der
                linken Spalte ruhiger als eine lange und ein Rest. */}
            <dd className="font-mono text-[11px] leading-snug text-ink-faint text-balance sm:max-w-[55%] sm:text-right">
              {skill.evidence}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
