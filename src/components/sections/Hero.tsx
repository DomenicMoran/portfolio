"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Fragment, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { TECH_TICKER as techTicker } from "@/content/types";
import { Counter } from "@/components/ui/Counter";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { cn } from "@/lib/utils";

export function Hero() {
  const { hero, site } = useContent();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Gentle parallax on exit. Kept small. Big values make the section feel
  // detached from the scroll and hurt perceived smoothness on low-end devices.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-10"
    >
      {/* Ambient light. Three blurred orbs, GPU-composited, no canvas. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
        <div className="glow-orb animate-float -top-40 left-[8%] size-[20rem] bg-violet/18 sm:size-[38rem]" />
        {/* The two secondary orbs are pure decoration; they only appear once
            the viewport is wide enough for the cost to be irrelevant. */}
        <div
          className="glow-orb animate-float top-[10%] right-[2%] hidden size-[30rem] bg-cyan/12 sm:block"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="glow-orb animate-float bottom-[6%] left-[38%] hidden size-[26rem] bg-acid/10 sm:block"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="mx-auto w-full max-w-6xl px-6 pt-32"
      >
        {/* Availability pill */}
        <div
          style={{ animationDelay: "0.1s" }}
          className="animate-fade-rise mb-10 flex flex-wrap items-center gap-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-acid" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.14em] text-ink-dim uppercase">
              {hero.eyebrow}
            </span>
          </span>
          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
            {site.role}
          </span>
        </div>

        {/* Headline: each word rises out of its own clip mask */}
        <h1 className="text-display max-w-[18ch] text-balance text-ink">
          {hero.headline.map((word, i) => (
            // The space is a real text node BETWEEN the clip wrappers, not
            // inside one; innerhalb eines overflow:hidden inline-block it collapses
            // and the words run together. Outside, it spaces them visually and
            // keeps the heading readable for screen readers and copy-paste.
            <Fragment key={i}>
              <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <span
                  className={cn(
                    "animate-word-rise inline-block",
                    word.accent && "font-editorial text-acid",
                  )}
                  style={{ animationDelay: `${0.06 + i * 0.045}s` }}
                >
                  {word.text}
                </span>
              </span>
              {i < hero.headline.length - 1 ? " " : null}
            </Fragment>
          ))}
        </h1>

        {/* Alles im Hero läuft als CSS-Animation, nicht über Framer Motion.
            Als `motion.p` mit `initial opacity 0` war dieser Absatz bis zur
            Hydration unsichtbar; auf einem gedrosselten Telefon war er damit
            das LCP-Element und erschien erst nach 4,6 Sekunden. Die
            Überschrift daneben stand zu dem Zeitpunkt schon seit 1,35
            Sekunden da. */}
        <p
          style={{ animationDelay: "0.42s" }}
          className="animate-fade-rise mt-8 max-w-2xl text-lg leading-relaxed text-ink-dim text-pretty sm:text-xl"
        >
          {hero.lede}
        </p>

        {/* CTAs */}
        <div
          style={{ animationDelay: "0.55s" }}
          className="animate-fade-rise mt-10 flex flex-wrap items-center gap-3"
        >
          <Magnetic>
            <a
              href={hero.ctaPrimary.href}
              // Der durchsichtige Rahmen ist normal unsichtbar. Im
              // Kontrastmodus von Windows ersetzt das System jede Farbe, auch
              // "transparent", und der Rahmen wird sichtbar. Ohne ihn verliert
              // der gefüllte Knopf dort seine Form und liest sich wie
              // gewöhnlicher Text.
              className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-acid px-6 py-3.5 font-medium text-void transition-colors hover:bg-ink"
            >
              {hero.ctaPrimary.label}
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
            </a>
          </Magnetic>

          <Magnetic>
            <a
              href={hero.ctaSecondary.href}
              className="group inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-medium text-ink transition-colors hover:border-ink-faint hover:bg-surface"
            >
              {hero.ctaSecondary.label}
              {/* Derselbe Pfeil nach unten wie beim ersten Knopf: Beide führen
                  zu einem Abschnitt weiter unten im Dokument. Der Pfeil nach
                  schräg oben steht überall sonst auf dieser Seite für ein
                  Ziel außerhalb. */}
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
            </a>
          </Magnetic>
        </div>

        {/* Proof strip */}
        <dl
          style={{ animationDelay: "0.68s" }}
          className="animate-fade-rise mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4"
        >
          {hero.proof.map((item) => (
            // flex-col-reverse: DOM order stays dt → dd (the only structure a
            // <dl> may contain), while the number still renders above its
            // label. A <span> sibling here is invalid markup and axe flags it.
            <div key={item.label} className="flex flex-col-reverse gap-1.5">
              <dt className="text-xs leading-snug text-ink-faint">{item.label}</dt>
              <dd className="text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
                <Counter value={item.value} />
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <div style={{ animationDelay: "0.85s" }} className="animate-fade-rise mt-14">
        <Marquee items={techTicker} duration={60} />
      </div>
    </section>
  );
}
