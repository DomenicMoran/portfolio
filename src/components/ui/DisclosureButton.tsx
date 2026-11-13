"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const SCHALTER =
  "no-print group inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink";

type Props = {
  offen: boolean;
  expandLabel: string;
  hideLabel: string;
  ariaControls: string;
  onToggle: () => void;
  className?: string;
};

export function DisclosureButton({
  offen,
  expandLabel,
  hideLabel,
  ariaControls,
  onToggle,
  className,
}: Props) {
  const beiTaste = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggle();
  };

  return (
  <>
    <noscript>
      <style>{`.offenlegungs-schalter{display:none}`}</style>
    </noscript>
    <button
      type="button"
      aria-expanded={offen}
      aria-controls={ariaControls}
      onClick={onToggle}
      onKeyDown={beiTaste}
      className={cn(SCHALTER, "offenlegungs-schalter", className)}
    >
      {offen ? hideLabel : expandLabel}
      {offen ? (
        <ArrowUp className="size-3.5" aria-hidden />
      ) : (
        <ArrowDown
          className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
          aria-hidden
        />
      )}
    </button>
  </>
  );
}
