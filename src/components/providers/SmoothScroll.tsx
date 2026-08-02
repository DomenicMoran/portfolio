"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Weiches Scrollen mit Lenis, angetrieben von `requestAnimationFrame`.
 *
 * Bewusst nicht geladen, wenn jemand weniger Bewegung eingestellt hat: Einem
 * Menschen mit Gleichgewichtsempfindlichkeit das Scrollen aus der Hand zu
 * nehmen, ist das Unfreundlichste, was eine „hochwertige" Seite tun kann. Dann
 * bleibt das Scrollen des Browsers unangetastet.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      // Entspricht --ease-out-expo, damit Nachlauf und CSS-Übergänge zusammenpassen.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Sprungmarken innerhalb der Seite müssen über Lenis laufen: Sonst kämpft
    // der Sprung des Browsers gegen die Animationsschleife und landet daneben.
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
      history.replaceState(null, "", id);
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
