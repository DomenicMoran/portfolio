"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Hairline reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[9998] h-px origin-left bg-gradient-to-r from-acid via-cyan to-violet"
    />
  );
}
