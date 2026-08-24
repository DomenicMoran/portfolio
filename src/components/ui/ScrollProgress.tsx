"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Haarfeiner Lesefortschritt, festgeheftet am oberen Rand des Sichtbereichs. */
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
      className="no-print fixed inset-x-0 top-0 z-[9998] h-px origin-left bg-acid"
    />
  );
}
