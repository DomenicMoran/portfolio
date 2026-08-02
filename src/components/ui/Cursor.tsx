"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Eigener Mauszeiger: ein kleiner Punkt, der genau folgt, dazu ein Ring, der
 * nachläuft und über bedienbaren Elementen größer wird.
 *
 * Nur bei genauem Zeigegerät und nur, wenn Bewegung erlaubt ist. Der Zeiger des
 * Systems wird nie global per CSS ausgeblendet: Hängt sich diese Komponente
 * nicht ein, hat der Besucher trotzdem einen funktionierenden Zeiger.
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
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 z-[10000]">
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
