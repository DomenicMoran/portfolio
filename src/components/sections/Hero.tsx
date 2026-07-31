"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { hero, site, techTicker } from "@/content/site";
import { ease } from "@/lib/motion";
import { Counter } from "@/components/ui/Counter";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { cn } from "@/lib/utils";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Gentle parallax on exit. Kept small — big values make the section feel
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
        <div className="glow-orb animate-float -top-40 left-[8%] size-[38rem] bg-violet/18" />
        <div
          className="glow-orb animate-float top-[10%] right-[2%] size-[30rem] bg-cyan/12"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="glow-orb animate-float bottom-[6%] left-[38%] size-[26rem] bg-acid/10"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="mx-auto w-full max-w-6xl px-6 pt-32"
      >
        {/* Availability pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: ease.expo, delay: 0.15 }}
          className="mb-10 flex flex-wrap items-center gap-3"
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
        </motion.div>

        {/* Headline — each word rises out of its own clip mask */}
        <h1 className="text-display max-w-[18ch] text-balance text-ink">
          {hero.headline.map((word, i) => (
            // Word gaps come from margin, not from whitespace: a trailing space
            // inside an inline-block with overflow:hidden gets collapsed away.
            <span
              key={i}
              className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom last:mr-0"
            >
              <motion.span
                className={cn(
                  "inline-block",
                  word.accent && "font-editorial text-acid",
                )}
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 1.1,
                  ease: ease.expo,
                  delay: 0.25 + i * 0.07,
                }}
              >
                {word.text}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.expo, delay: 0.8 }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-dim text-pretty sm:text-xl"
        >
          {hero.lede}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.expo, delay: 0.95 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Magnetic>
            <a
              href={hero.ctaPrimary.href}
              className="group inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3.5 font-medium text-void transition-colors hover:bg-ink"
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
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </a>
          </Magnetic>
        </motion.div>

        {/* Proof strip */}
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: ease.expo, delay: 1.1 }}
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4"
        >
          {hero.proof.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <dt className="sr-only">{item.label}</dt>
              <dd className="text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
                <Counter value={item.value} />
              </dd>
              <span className="text-xs leading-snug text-ink-faint">{item.label}</span>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="mt-14"
      >
        <Marquee items={techTicker} duration={60} />
      </motion.div>
    </section>
  );
}
