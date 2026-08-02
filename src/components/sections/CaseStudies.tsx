"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowUpRight, Bot, Check, Layers, Smartphone, Workflow } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { useContent } from "@/content/ContentProvider";
import type { CaseStudy } from "@/content/types";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { Counter } from "@/components/ui/Counter";
import { DeviceFrame } from "@/components/ui/DeviceFrame";
import { RichText } from "@/components/ui/InlineCode";
import { ShotCarousel } from "@/components/ui/ShotCarousel";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ACCENT = {
  acid: { text: "text-acid", bg: "bg-acid", border: "border-acid/30", soft: "bg-acid/10" },
  violet: { text: "text-violet", bg: "bg-violet", border: "border-violet/30", soft: "bg-violet/10" },
  cyan: { text: "text-cyan", bg: "bg-cyan", border: "border-cyan/30", soft: "bg-cyan/10" },
} as const;

const TAB_IDS = ["highlights", "automation", "architecture", "stack"] as const;
const TAB_ICONS = { highlights: Layers, automation: Bot, architecture: Workflow, stack: Smartphone };

type TabId = (typeof TAB_IDS)[number];

export function CaseStudies() {
  const { work, caseStudies } = useContent();

  return (
    <section id="work" className="relative scroll-mt-24 px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={work.eyebrow}
          title={work.title}
          lede={work.lede}
        />

        <div className="mt-20 flex flex-col gap-24 sm:gap-36">
          {caseStudies.map((study) => (
            <CaseStudyPanel key={study.id} study={study} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyPanel({ study }: { study: CaseStudy }) {
  const { work, a11y } = useContent();
  const [tab, setTab] = useState<TabId>("highlights");
  const accent = ACCENT[study.accent];
  const visibleLinks = study.links.filter((link) => link.href);

  return (
    <article id={`case-${study.id}`} className="scroll-mt-28">
      {/* Header */}
      <Reveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-baseline gap-5">
            <span className={cn("font-mono text-sm", accent.text)}>{study.index}</span>
            <h3 className="text-title text-ink">{study.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase",
                accent.border,
                accent.text,
              )}
            >
              <span className={cn("size-1.5 rounded-full", accent.bg)} />
              {study.statusLabel}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">{study.year}</span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <p className="mt-6 max-w-3xl text-xl leading-snug text-ink text-pretty sm:text-2xl">
          {study.tagline}
        </p>
        <p className="mt-3 font-mono text-xs text-ink-faint">{study.role}</p>
      </Reveal>

      {/* Live screenshots: visual proof before the prose argument.
          Ab drei Bildern wird daraus eine blätterbare Strecke. Nebeneinander
          gelegt schrumpft bei acht Bildern jedes auf eine Breite, auf der man
          nichts mehr erkennt, und die Fallstudie wird doppelt so lang. */}
      {study.shots?.length ? (
        <Reveal delay={0.08}>
          {study.shots.length > 2 ? (
            <ShotCarousel shots={study.shots} label={a11y.shots.label} hinweis={a11y.shots} />
          ) : (
            <div
              className={cn(
                "mt-10 flex flex-col items-center gap-6",
                study.shots.length > 1 && "sm:flex-row sm:items-end",
              )}
            >
              {study.shots.map((shot) => (
                <DeviceFrame
                  key={shot.src}
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  label={shot.label}
                  variant={shot.variant}
                  className={shot.variant === "phone" ? "shrink-0" : "min-w-0 flex-1"}
                />
              ))}
            </div>
          )}
        </Reveal>
      ) : null}

      {/* Begründete Leerstelle statt nachgestelltem Bild */}
      {study.keinScreenshot ? (
        <Reveal delay={0.08}>
          <p className="mt-10 max-w-[62ch] border-l-2 border-line pl-5 text-sm leading-relaxed text-ink-faint text-pretty">
            {study.keinScreenshot}
          </p>
        </Reveal>
      ) : null}

      {/* Problem / solution */}
      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-14">
        <Reveal>
          <h4 className="text-eyebrow mb-4">{work.labels.problem}</h4>
          <p className="leading-relaxed text-ink-dim text-pretty">{study.problem}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h4 className="text-eyebrow mb-4">{work.labels.solution}</h4>
          <p className="leading-relaxed text-ink-dim text-pretty">{study.solution}</p>
        </Reveal>
      </div>

      {/* Der schwierige Teil: der Abschnitt, der eine Bewerbungsseite von einem Lebenslauf trennt */}
      <Reveal delay={0.05}>
        <div
          className={cn(
            "lit relative mt-12 overflow-hidden rounded-2xl border p-7 sm:p-9",
            accent.border,
            accent.soft,
          )}
        >
          <span className="text-eyebrow">{work.labels.hardPart}</span>
          <h4 className={cn("mt-3 text-lg font-semibold tracking-tight sm:text-xl", accent.text)}>
            {study.hardPart.title}
          </h4>
          {/* Zeilenmaß in ch statt rem: 68 Zeichen bleiben 68 Zeichen, egal
              welche Schriftgröße die Klasse gerade setzt. Gemessen lag dieser
              Absatz vorher bei 96 Zeichen pro Zeile, deutlich über dem, was
              sich noch flüssig liest. */}
          <p className="mt-4 max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
            <RichText text={study.hardPart.body} />
          </p>
        </div>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={0.05}>
        <div className="mt-12">
          <div
            role="tablist"
            aria-label={study.name}
            className="flex flex-wrap gap-1.5 border-b border-line pb-3"
          >
            {/* Der Automatisierungs-Tab erscheint nur, wo es etwas zu zeigen gibt. */}
            {TAB_IDS.filter((id) => id !== "automation" || study.automation).map((id) => {
              const Icon = TAB_ICONS[id];
              const selected = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  // Ein Reiter ohne Tafel ist ein halbes Muster.
                  //
                  // `role="tab"` und `aria-selected` standen hier, aber es gab
                  // keine `tabpanel` und kein `aria-controls`: gemessen 4
                  // Tab-Listen, 13 Reiter, null Tafeln. Ein Vorleseprogramm
                  // meldet dann "Registerkarte, ausgewählt" und kann von dort
                  // nirgendwohin, weil die Verbindung zum Inhalt fehlt.
                  id={`${study.id}-tab-${id}`}
                  // `aria-controls` nur am gewählten Reiter.
                  //
                  // Gerendert wird immer nur die gewählte Tafel, AnimatePresence
                  // tauscht sie aus. An allen dreizehn Reitern gesetzt zeigten
                  // deshalb neun auf eine Kennung, die es im Dokument nicht
                  // gibt — gemessen an der ausgelieferten Seite. Ein Verweis
                  // ins Leere ist schlechter als keiner: Er behauptet ein Ziel.
                  aria-controls={selected ? `${study.id}-panel-${id}` : undefined}
                  aria-selected={selected}
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                    // Die Farbfläche liegt als absolut positioniertes Geschwister
                    // darüber (für die Schiebe-Animation). Dieselbe Farbe hier
                    // zusätzlich als Hintergrund des Knopfes: Sollte das
                    // Motion-Element je nicht rendern, bliebe sonst dunkler Text
                    // auf dunklem Grund, unsichtbar statt nur unschön.
                    selected ? cn("text-void", accent.bg) : "text-ink-dim hover:text-ink",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId={`tab-${study.id}`}
                      className={cn("absolute inset-0 rounded-full", accent.bg)}
                      transition={{ duration: 0.35, ease: ease.expo }}
                    />
                  ) : null}
                  <Icon className="relative size-3.5" aria-hidden />
                  <span className="relative">{work.tabs[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                role="tabpanel"
                id={`${study.id}-panel-${tab}`}
                aria-labelledby={`${study.id}-tab-${tab}`}
                // Fokussierbar, weil die Tafel Text enthält, der selbst keine
                // Station in der Tabulator-Reihenfolge hat. Ohne das springt
                // die Tastatur vom Reiter direkt zum nächsten Reiter und
                // überspringt genau den Inhalt, den man gerade gewählt hat.
                tabIndex={0}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: ease.expo }}
              >
                {tab === "highlights" ? (
                  <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                    {study.highlights.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check
                          className={cn("mt-1 size-4 shrink-0", accent.text)}
                          aria-hidden
                        />
                        <span className="text-sm leading-relaxed text-ink-dim">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {tab === "automation" && study.automation ? (
                  <div className="flex flex-col gap-8">
                    <div>
                      <h5 className={cn("text-lg font-semibold tracking-tight", accent.text)}>
                        {study.automation.title}
                      </h5>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim text-pretty">
                        {study.automation.lede}
                      </p>
                    </div>
                    <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
                      {study.automation.groups.map((group) => (
                        <div key={group.title}>
                          <h6 className="text-eyebrow mb-3">{group.title}</h6>
                          <ul className="flex flex-col gap-2">
                            {group.items.map((item) => (
                              <li key={item} className="flex gap-2.5">
                                <span
                                  aria-hidden
                                  className={cn(
                                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                                    accent.bg,
                                  )}
                                />
                                <span className="text-sm leading-relaxed text-ink-dim">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tab === "architecture" ? (
                  <ArchitectureDiagram name={study.architecture} />
                ) : null}

                {tab === "stack" ? (
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {study.stack.map((group) => (
                      <div key={group.group}>
                        <h5 className="text-eyebrow mb-3">{group.group}</h5>
                        <ul className="flex flex-wrap gap-1.5">
                          {group.items.map((item) => (
                            <li
                              key={item}
                              className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-dim"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Reveal>

      {/* Metrics + links */}
      <div className="mt-12 flex flex-wrap items-end justify-between gap-8 border-t border-line pt-8">
        <motion.dl
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ staggerChildren: 0.08 }}
          className="flex flex-wrap gap-x-12 gap-y-6"
        >
          {study.metrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.expo } },
              }}
              // Siehe Hero: Eine <dl> darf nur dt/dd-Paare enthalten, deshalb
              // steht die Beschriftung im <dt> und die sichtbare Reihenfolge
              // kommt von flex-col-reverse.
              className="flex flex-col-reverse gap-1"
            >
              <dt className="text-xs text-ink-faint">{metric.label}</dt>
              <dd
                className={cn(
                  "text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
                  accent.text,
                )}
              >
                <Counter value={metric.value} />
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        {visibleLinks.length > 0 ? (
          <Reveal className="flex flex-wrap gap-2">
            {visibleLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
              >
                {link.kind === "code" ? <GithubIcon className="size-3.5" /> : null}
                {link.label}
                <ArrowUpRight
                  className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            ))}
          </Reveal>
        ) : null}
      </div>
    </article>
  );
}
