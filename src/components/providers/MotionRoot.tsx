"use client";

import { MotionProvider } from "@/components/providers/MotionProvider";
import type { ReactNode } from "react";

/** Framer-Grenze nur um interaktive Bauteile, nicht um den statischen Kopf. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}
