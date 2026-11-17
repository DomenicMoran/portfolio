"use client";

import { HeroDeko } from "@/components/hero/HeroDeko";
import { HeroMarquee } from "@/components/hero/HeroMarquee";

/** Signal Field und Technologiezeile, direkt nach dem ersten Paint. */
export function HeroWowMount() {
  return (
    <>
      <HeroDeko />
      <HeroMarquee />
    </>
  );
}
