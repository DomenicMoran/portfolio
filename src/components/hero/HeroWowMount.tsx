"use client";

import { useEffect } from "react";
import { HeroDeko } from "@/components/hero/HeroDeko";
import { HeroMarquee } from "@/components/hero/HeroMarquee";

export function HeroWowMount() {
  useEffect(() => {
    const stroke = document.querySelector(".hero-headline-stroke");
    if (!stroke) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stroke.classList.add("hero-headline-stroke--filled");
      return;
    }
    const fill = () => stroke.classList.add("hero-headline-stroke--filled");
    stroke.addEventListener("mouseenter", fill, { once: true });
    const onScroll = () => {
      if (window.scrollY > 24) fill();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <HeroDeko />
      <HeroMarquee />
    </>
  );
}
