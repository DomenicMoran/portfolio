"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance travelled on entrance, in px. */
  y?: number;
  as?: "div" | "section" | "li" | "span" | "p";
};

/**
 * The workhorse entrance animation. One component so timing never drifts
 * between sections.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
}: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.85, ease: ease.expo, delay }}
    >
      {children}
    </Component>
  );
}

/**
 * Splits a string into words and reveals each from behind its own clip mask.
 * Used for section headlines — the effect only reads well at large sizes.
 */
export function RevealWords({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
}) {
  const words = text.split(" ");

  return (
    <motion.span
      className={cn("inline", className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delayChildren: delay, staggerChildren: 0.05 }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="mr-[0.24em] inline-block overflow-hidden pb-[0.05em] align-bottom last:mr-0"
        >
          <motion.span
            className={cn("inline-block", wordClassName)}
            variants={{
              hidden: { y: "110%" },
              visible: {
                y: "0%",
                transition: { duration: 0.9, ease: ease.expo },
              },
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
