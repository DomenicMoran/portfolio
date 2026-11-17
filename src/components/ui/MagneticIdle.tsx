"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { whenIdle } from "@/lib/when-idle";

type MagneticCmp = ComponentType<{
  children: ReactNode;
  className?: string;
}>;

/**
 * Magnetische CTAs erst im Leerlauf, damit Framer nicht im Vorspann-Buendel
 * mit hydriert. Bis dahin bleiben die Links unveraendert bedienbar.
 */
export function MagneticIdle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [Magnetic, setMagnetic] = useState<MagneticCmp | null>(null);

  useEffect(() => {
    let cancelled = false;
    whenIdle(() => {
      void import("@/components/ui/Magnetic").then((mod) => {
        if (!cancelled) setMagnetic(() => mod.Magnetic);
      });
    }, 6500);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Magnetic) {
    return (
      <span
        className={className ? `inline-block ${className}` : "inline-block"}
      >
        {children}
      </span>
    );
  }

  return <Magnetic className={className}>{children}</Magnetic>;
}
