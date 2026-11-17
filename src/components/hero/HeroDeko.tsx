"use client";

import { SignalFieldLazy } from "@/components/hero/SignalFieldLazy";

/** Dekoration hinter dem Kopf: Signal Field und Glüh-Kreise, nach LCP nachladen. */
export function HeroDeko() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <SignalFieldLazy className="absolute inset-0" />
      <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
      <div className="glow-orb animate-float bg-acid/12 -top-40 left-[8%] size-[20rem] sm:size-[38rem]" />
      <div
        className="glow-orb animate-float bg-acid/10 bottom-[6%] left-[38%] hidden size-[26rem] sm:block"
        style={{ animationDelay: "-9s" }}
      />
    </div>
  );
}
