"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { workflow } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function AiWorkflow() {
  return (
    <section
      id="workflow"
      className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb animate-float top-1/4 -left-20 size-[32rem] bg-violet/12" />
        <div
          className="glow-orb animate-float right-0 bottom-0 size-[28rem] bg-cyan/10"
          style={{ animationDelay: "-7s" }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={workflow.eyebrow}
          title={workflow.title}
          lede={workflow.lede}
        />

        <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
          {/* Principles */}
          <ol className="flex flex-col">
            {workflow.principles.map((principle, i) => (
              <Reveal
                as="li"
                key={principle.n}
                delay={i * 0.04}
                className="group border-t border-line py-8 first:border-t-0 first:pt-0"
              >
                <div className="flex gap-5 sm:gap-8">
                  <span className="shrink-0 pt-1 font-mono text-xs text-ink-faint transition-colors group-hover:text-acid">
                    {principle.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
                      {principle.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-ink-dim text-pretty">
                      {principle.body}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {principle.artifacts.map((artifact) => (
                        <li
                          key={artifact}
                          className="rounded-md border border-line bg-surface/60 px-2.5 py-1 font-mono text-[10px] tracking-wide text-ink-faint"
                        >
                          {artifact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          {/* Terminal */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <AgentTerminal />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

const LINE_STYLE = {
  prompt: { prefix: "›", className: "text-ink" },
  think: { prefix: "·", className: "text-ink-faint" },
  run: { prefix: "→", className: "text-cyan" },
  warn: { prefix: "!", className: "text-acid" },
  ok: { prefix: "✓", className: "text-acid" },
} as const;

/**
 * Replays a scripted agent iteration.
 *
 * Deliberately a *replay*, not a fake live session: it is labelled as an
 * illustration, and the "Nochmal"-button makes clear it is a recording. A
 * portfolio that fakes a live terminal is doing the exact thing the copy next
 * to it argues against.
 */
function AgentTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [shown, setShown] = useState(0);
  const [runId, setRunId] = useState(0);

  const lines = workflow.demo.lines;

  // Rewind during render when the replay button bumps runId — same pattern as
  // the palette: no effect, no cascading render, no flash of the old lines.
  const [playedRun, setPlayedRun] = useState(runId);
  if (runId !== playedRun) {
    setPlayedRun(runId);
    setShown(0);
  }

  useEffect(() => {
    if (!inView) return;

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setShown(index);
      if (index >= lines.length) window.clearInterval(timer);
    }, 620);

    return () => window.clearInterval(timer);
  }, [inView, lines.length, runId]);

  return (
    <div ref={ref} className="lit overflow-hidden rounded-2xl border border-line bg-base">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
          agent-session
        </span>
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="grid size-6 place-items-center rounded text-ink-faint transition-colors hover:text-ink"
          aria-label="Ablauf erneut abspielen"
        >
          <RotateCcw className="size-3" aria-hidden />
        </button>
      </div>

      <div className="min-h-[19rem] p-4 font-mono text-[12px] leading-relaxed sm:min-h-[21rem]">
        {lines.slice(0, shown).map((line, i) => {
          const style = LINE_STYLE[line.kind as keyof typeof LINE_STYLE];
          return (
            <motion.p
              key={`${runId}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: ease.expo }}
              className={cn("flex gap-2.5 py-1", style.className)}
            >
              <span className="shrink-0 opacity-60">{style.prefix}</span>
              <span className="text-pretty">{line.text}</span>
            </motion.p>
          );
        })}

        {shown < lines.length ? (
          <span className="inline-block h-3.5 w-1.5 animate-caret bg-acid align-middle" />
        ) : null}
      </div>

      <p className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-faint">
        {workflow.demo.label} — nachgestellter Ablauf, keine Live-Sitzung.
      </p>
    </div>
  );
}

/**
 * Standalone speed comparison. Sits between the workflow and skills sections.
 */
export function DeliverySpeed() {
  const rows = [
    { label: "Klassisch, allein", weeks: 100, note: "Wochen bis Store-Release" },
    { label: "Mit Agenten-Setup", weeks: 22, note: "dieselbe Feature-Tiefe" },
  ];

  return (
    <section className="px-6 pb-28 sm:pb-40">
      <div className="mx-auto max-w-6xl">
        <div className="lit rounded-3xl border border-line bg-surface/40 p-8 sm:p-12">
          <span className="text-eyebrow">Größenordnung</span>
          <h3 className="mt-4 max-w-3xl text-title text-ink text-balance">
            Der Unterschied ist nicht, dass ich schneller tippe.
          </h3>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-dim text-pretty">
            Er ist, dass Recherche, Implementierung, Test und Verifikation
            parallel statt nacheinander laufen — und dass der Kontext zwischen
            den Sitzungen nicht verloren geht.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            {rows.map((row, i) => (
              <div key={row.label} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-ink">{row.label}</span>
                  <span className="font-mono text-[11px] text-ink-faint">{row.note}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-raised">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      i === 0 ? "bg-line" : "bg-gradient-to-r from-acid to-cyan",
                    )}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${row.weeks}%` }}
                    viewport={viewportOnce}
                    transition={{ duration: 1.2, ease: ease.expo, delay: 0.15 * i }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink-faint">
            Relative Darstellung aus meinen eigenen Projekten — kein
            Branchen-Benchmark. Die belastbare Zahl daneben: Salati steht bei 44
            ausgelieferten Versionen über fünf Gerätetypen, gebaut neben drei
            weiteren Systemen in Produktion.
          </p>
        </div>
      </div>
    </section>
  );
}
