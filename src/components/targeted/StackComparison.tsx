"use client";

import { useState } from "react";
import { targetedPageCopy } from "@/content/targeted-page";

type Props = { skills: readonly string[] };

export function StackComparison({ skills }: Props) {
  const [active, setActive] = useState(skills[0] ?? null);
  const coreFocus = new Set(["next.js", "react", "typescript", "node.js", "postgresql"]);
  const direct = active ? coreFocus.has(active.toLowerCase()) : false;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-wrap content-start gap-2.5" role="group" aria-label={targetedPageCopy.stackLabel}>
        {skills.map((technology) => {
          const matched = coreFocus.has(technology.toLowerCase());
          return <button key={technology} type="button" onClick={() => setActive(technology)} aria-pressed={active === technology} className={`rounded-full border px-4 py-2.5 text-sm transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] ${active === technology ? "border-acid bg-acid text-void" : "border-line bg-surface text-ink-dim hover:border-ink-faint hover:text-ink"}`}>
            <span>{technology}</span><span className="ml-2 font-mono text-[10px] uppercase opacity-100">{matched ? targetedPageCopy.overlap : targetedPageCopy.adjacent}</span>
          </button>;
        })}
      </div>
      <p className="lit relative rounded-3xl border border-line bg-surface/80 p-6 leading-relaxed text-ink-dim" aria-live="polite">
        <span className="relative z-10 block font-mono text-[11px] tracking-[0.14em] text-acid uppercase">{active ? (direct ? targetedPageCopy.overlap : targetedPageCopy.adjacent) : targetedPageCopy.stackKicker}</span>
        <span className="relative z-10 mt-3 block">{active ? <><strong className="text-ink">{active}.</strong> {direct ? targetedPageCopy.directDelivery : targetedPageCopy.adjacentDelivery}</> : targetedPageCopy.emptyStack}</span>
      </p>
    </div>
  );
}
