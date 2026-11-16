"use client";

import { TECH_TICKER as techTicker } from "@/content/types";
import { Marquee } from "@/components/ui/Marquee";

export function HeroMarquee() {
  return (
    <div
      style={{ animationDelay: "0.85s" }}
      className="animate-fade-rise mt-14"
    >
      <Marquee items={techTicker} duration={60} />
    </div>
  );
}
