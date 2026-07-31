"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Honours `prefers-reduced-motion` for Framer Motion.
 *
 * The `@media (prefers-reduced-motion)` block in globals.css only reaches CSS
 * animations and transitions. Framer Motion drives inline styles from
 * requestAnimationFrame, so it ignores that rule entirely. Without this
 * provider the site would claim to respect the setting while still animating
 * every reveal.
 *
 * `reducedMotion="user"` keeps opacity/colour transitions but drops transform
 * and layout animation, which is exactly the distinction the setting is about:
 * movement is the problem, not change.
 *
 * Children pass through as a slot, so pages above this boundary stay Server
 * Components.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
