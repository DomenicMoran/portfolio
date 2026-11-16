"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Word = { readonly text: string; readonly accent?: boolean };

type Props = {
  words: readonly Word[];
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** Erste Zeile gefuellt, zweite als Kontur die sich einmal bei Scroll/Hover fuellt. */
export function HeroHeadline({ words }: Props) {
  const [filled, setFilled] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const strokeFilled = filled || reducedMotion;

  useEffect(() => {
    if (strokeFilled) return;
    const onScroll = () => {
      if (window.scrollY > 24) setFilled(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [strokeFilled]);

  const line1 = words.slice(0, 2);
  const line2 = words.slice(2);

  return (
    <h1
      id="top-titel"
      className="hero-display text-ink max-w-[18ch] tracking-[-0.03em] text-balance uppercase"
    >
      <span className="block leading-[0.92]">
        {line1.map((word, i) => (
          <span key={i}>
            <span className={cn(word.accent && "text-acid")}>{word.text}</span>
            {i < line1.length - 1 ? " " : null}
          </span>
        ))}
      </span>
      <span
        className={cn(
          "hero-headline-stroke mt-1 block leading-[0.92]",
          strokeFilled && "hero-headline-stroke--filled",
        )}
        onMouseEnter={() => setFilled(true)}
      >
        {line2.map((word, i) => (
          <span key={i}>
            <span
              className={cn(
                word.accent && "text-acid hero-headline-stroke__accent",
              )}
            >
              {word.text}
            </span>
            {i < line2.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </h1>
  );
}
