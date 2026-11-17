"use client";

import { SignalFieldLazy } from "@/components/hero/SignalFieldLazy";

/**
 * Signal Field hinter dem Kopf.
 *
 * Raster und Glueh-Kreise stehen bereits im ersten HTML, damit die Bewegung
 * nicht auf dieses Nachladen warten muss. Hier kommt nur die Zeichenflaeche
 * dazu, sobald der Vorspann gemalt ist.
 */
export function HeroDeko() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <SignalFieldLazy className="absolute inset-0" />
    </div>
  );
}
