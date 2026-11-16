"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

function reducedMotionAbonniert(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function reducedMotionAktiv() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Weg, den das Element beim Erscheinen zurücklegt, in Pixeln. */
  y?: number;
  as?: "div" | "section" | "li" | "span" | "p";
  /** Für ein Element, das ein Sprungziel ist, z. B. ein Ankerverweis. */
  id?: string;
};

function useRevealInView() {
  const ref = useRef<HTMLElement>(null);
  const [sichtbar, setSichtbar] = useState(false);
  const reduced = useSyncExternalStore(
    reducedMotionAbonniert,
    reducedMotionAktiv,
    () => false,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSichtbar(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return { ref, sichtbar, reduced };
}

/**
 * Einblenden beim Sichtbarwerden — CSS und IntersectionObserver statt Framer.
 *
 * Unterhalb der Falz bleibt der Eindruck gleich, aber der Parser zieht kein
 * `framer-motion` mehr in die Startseiten-Chunks, die nur Reveal nutzen.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  id,
}: RevealProps) {
  const { ref, sichtbar, reduced } = useRevealInView();
  const animiere = !reduced && sichtbar;
  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={cn(className, animiere && "animate-fade-rise")}
      style={animiere ? { animationDelay: `${delay}s` } : undefined}
      data-reveal=""
    >
      {children}
    </Tag>
  );
}

/**
 * Wort-für-Wort-Einblendung per CSS-Maske. Die `css`-Variante startet sofort;
 * die Standardvariante wartet auf Sichtbarkeit wie `Reveal`.
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
  const { ref, sichtbar, reduced } = useRevealInView();
  const animiere = css || (!reduced && sichtbar);

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={cn("inline", className)}
      data-reveal=""
    >
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="-mb-[0.15em] inline-block overflow-hidden pb-[0.2em] align-bottom">
            <span
              className={cn(
                "inline-block",
                animiere && "animate-word-rise",
                wordClassName,
              )}
              style={
                animiere
                  ? { animationDelay: `${delay + 0.06 + i * 0.045}s` }
                  : undefined
              }
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