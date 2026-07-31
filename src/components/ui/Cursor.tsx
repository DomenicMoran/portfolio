"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Custom cursor: a small dot that tracks exactly, plus a lagging ring that
 * grows over interactive elements.
 *
 * Rendered only for fine pointers and only when motion is allowed. The native
 * cursor is never hidden globally via CSS — if this component does not mount,
 * the user still has a working pointer.
 */
export function Cursor() {
  const finePointer = useMediaQuery("(pointer: fine)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const enabled = finePointer && !reducedMotion;

  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const ringX = useSpring(x, { stiffness: 220, damping: 24, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 220, damping: 24, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.style.cursor = "none";

    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);

      const target = event.target as HTMLElement | null;
      setHovering(
        Boolean(target?.closest("a, button, [role='button'], input, textarea")),
      );
    };

    window.addEventListener("pointermove", move, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.style.cursor = "";
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[10000]">
      <motion.div
        className="absolute size-1.5 rounded-full bg-acid"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="absolute rounded-full border border-acid/50"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovering ? 46 : 26,
          height: hovering ? 46 : 26,
          opacity: hovering ? 1 : 0.5,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
