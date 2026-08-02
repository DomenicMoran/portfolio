"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Setzt `prefers-reduced-motion` für Framer Motion durch.
 *
 * Der Block `@media (prefers-reduced-motion)` in globals.css erreicht nur
 * CSS-Animationen und -Übergänge. Framer Motion setzt Inline-Stile aus
 * `requestAnimationFrame` und geht an dieser Regel vollständig vorbei. Ohne
 * diesen Anbieter würde die Seite die Einstellung zu achten behaupten und
 * trotzdem jede Einblendung animieren.
 *
 * `reducedMotion="user"` behält Übergänge von Deckkraft und Farbe, lässt aber
 * Verschiebung und Layout-Animation weg — genau die Unterscheidung, um die es
 * bei dieser Einstellung geht: Bewegung stört, Veränderung nicht.
 *
 * Die Kinder laufen als Steckplatz durch, damit Seiten oberhalb dieser Grenze
 * Server Components bleiben.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
