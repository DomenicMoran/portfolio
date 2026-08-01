"use client";

import { motion } from "framer-motion";
import { Fragment, type ReactNode } from "react";
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
 * Used for section headlines: the effect only reads well at large sizes.
 *
 * `css` schaltet dieselbe Bewegung auf eine reine CSS-Animation um. Der
 * Unterschied ist der Startzeitpunkt: Die JS-Variante beginnt, wenn der
 * Abschnitt ins Bild kommt, und ist bis zur Hydration unsichtbar. Für eine
 * Überschrift über der Falz ist genau das teuer, weil sie damit das
 * LCP-Element ist und erst nach der Hydration erscheint. Gemessen auf der
 * Artikelübersicht: 4,1 s als JS-Animation.
 *
 * Unterhalb der Falz bleibt die JS-Variante richtig, weil die Bewegung dort
 * erst beim Hineinscrollen laufen soll und nicht schon vorher abgelaufen sein
 * darf.
 */
export function RevealWords({
  text,
  className,
  wordClassName,
  delay = 0,
  css = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  css?: boolean;
}) {
  const words = text.split(" ");

  if (css) {
    return (
      <span className={cn("inline", className)}>
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            <span className="inline-block overflow-hidden pb-[0.05em] align-bottom">
              <span
                className={cn("animate-word-rise inline-block", wordClassName)}
                style={{ animationDelay: `${delay + 0.06 + i * 0.045}s` }}
              >
                {word}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    );
  }

  return (
    <motion.span
      className={cn("inline", className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delayChildren: delay, staggerChildren: 0.05 }}
    >
      {words.map((word, i) => (
        // The space is a real text node BETWEEN the clip wrappers, not inside
        // one; innerhalb eines overflow:hidden inline-block it collapses and the
        // words run together. Outside, it spaces them visually and keeps the
        // heading readable for screen readers and copy-paste.
        <Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.05em] align-bottom">
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
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.span>
  );
}
