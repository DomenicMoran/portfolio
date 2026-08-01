"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function AiWorkflow() {
  const { workflow } = useContent();

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
  const { workflow, a11y } = useContent();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [shown, setShown] = useState(0);
  const [runId, setRunId] = useState(0);

  const lines = workflow.demo.lines;

  // Rewind during render when the replay button bumps runId, dasselbe Muster wie
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
        {/* 32px statt 24: 24×24 ist exakt die WCAG-Untergrenze und selbst mit
            Maus fummelig. Das Symbol bleibt klein, die Trefferfläche wächst. */}
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="-mr-1.5 grid size-8 place-items-center rounded-md text-ink-faint transition-colors hover:bg-raised hover:text-ink"
          aria-label={a11y.replay}
        >
          <RotateCcw className="size-3.5" aria-hidden />
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
        {workflow.demo.label} {workflow.demo.note}
      </p>
    </div>
  );
}

/**
 * Standalone speed comparison. Sits between the workflow and skills sections.
 */
export function DeliverySpeed() {
  const { workflow } = useContent();
  const { speed } = workflow;

  return (
    <section className="px-6 pb-28 sm:pb-40">
      <div className="mx-auto max-w-6xl">
        <div className="lit rounded-3xl border border-line bg-surface/40 p-8 sm:p-12">
          <span className="text-eyebrow">{speed.eyebrow}</span>
          <h3 className="mt-4 max-w-3xl text-title text-ink text-balance">
            {speed.title}
          </h3>
          <p className="mt-4 max-w-[62ch] leading-relaxed text-ink-dim text-pretty">
            {speed.lede}
          </p>

          {/* Drei gezählte Werte statt zweier Balken ohne Skala.
              Balken brauchen eine gemeinsame Einheit; Tage, Versionen und
              Stunden je Version haben keine. Als Zahlen tragen dieselben
              Angaben mehr und behaupten weniger. */}
          <dl className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-3">
            {speed.facts.map((fakt, i) => (
              <motion.div
                key={fakt.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, ease: ease.expo, delay: 0.08 * i }}
                // flex-col-reverse: In der DOM-Reihenfolge steht dt vor dd,
                // wie ein <dl> es verlangt. Optisch steht die Zahl trotzdem
                // oben.
                className="flex flex-col-reverse gap-1.5"
              >
                <dt className="flex flex-col gap-1">
                  <span className="text-sm leading-snug text-ink">{fakt.label}</span>
                  <span className="text-xs leading-relaxed text-ink-faint text-pretty">
                    {fakt.note}
                  </span>
                </dt>
                <dd className="text-3xl font-semibold tracking-tight text-acid tabular-nums sm:text-4xl">
                  {fakt.value}
                </dd>
              </motion.div>
            ))}
          </dl>

          {/* Zeilenmaß in ch: gemessen lief dieser Absatz vorher bei 112
              Zeichen pro Zeile, deutlich jenseits des Lesbaren. */}
          <p className="mt-8 max-w-[58ch] text-xs leading-relaxed text-ink-faint">
            {speed.note}
          </p>
        </div>
      </div>
    </section>
  );
}
