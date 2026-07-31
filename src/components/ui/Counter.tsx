"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Counts up when scrolled into view.
 *
 * Handles values that are not plain numbers ("75+", "1.44", "EU", "24/7") by
 * animating only the leading numeric part and keeping the rest verbatim. That
 * way the data file stays human-readable instead of splitting every value into
 * {number, suffix} pairs.
 */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const match = value.match(/^([\d.,]+)(.*)$/);
  const numericPart = match?.[1] ?? "";
  const suffix = match?.[2] ?? "";

  // German formatting: "." groups thousands, "," is the decimal separator.
  const decimals = numericPart.includes(",") ? numericPart.split(",")[1].length : 0;
  const target = Number(numericPart.replace(/\./g, "").replace(",", "."));
  const animatable = match !== null && Number.isFinite(target);

  const [display, setDisplay] = useState(animatable ? "0" : value);

  useEffect(() => {
    if (!inView || !animatable) return;

    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplay(
          latest.toLocaleString("de-DE", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
        );
      },
    });

    return () => controls.stop();
  }, [inView, animatable, target, decimals]);

  return (
    <span ref={ref} className={className}>
      {animatable ? `${display}${suffix}` : value}
    </span>
  );
}
