import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { Content } from "@/content/types";
import { TECH_TICKER } from "@/content/types";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { MagneticIdle } from "@/components/ui/MagneticIdle";
import { Counter } from "@/components/ui/Counter";
import { Marquee } from "@/components/ui/Marquee";

type Props = {
  hero: Content["hero"];
  site: Content["site"];
  lang: Content["lang"];
};

/**
 * Server-Vorspann mit den CSS-Auftritten, die ab dem ersten Paint laufen.
 *
 * Zaehler, Magnet und die spaetere Deko sind Client-Inseln. Sie stehen im
 * Baum, blockieren den Lead aber nicht hinter einer gemeinsamen Hydration
 * des gesamten Abschnitts.
 */
export function Hero({ hero, site, lang }: Props) {
  const secondaryExternal = hero.ctaSecondary.href.startsWith("http");

  return (
    <section
      id="top"
      aria-labelledby="top-titel"
      className="relative flex min-h-svh flex-col justify-end overflow-x-clip pb-10"
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
        <div className="glow-orb animate-float bg-acid/12 -top-40 left-[8%] size-[20rem] sm:size-[38rem]" />
        <div
          className="glow-orb animate-float bg-acid/10 bottom-[6%] left-[38%] hidden size-[26rem] sm:block"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <div className="w-full">
        <div className="mx-auto w-full max-w-6xl px-6 pt-32">
          <div
            style={{ animationDelay: "0.05s" }}
            className="animate-fade-rise mb-10 flex flex-wrap items-center gap-3"
          >
            <span className="border-line bg-surface/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="bg-acid absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                <span className="bg-acid relative inline-flex size-1.5 rounded-full" />
              </span>
              <span className="text-ink-dim font-mono text-[11px] tracking-[0.14em] uppercase">
                {hero.eyebrow}
              </span>
            </span>
            <span className="text-ink-faint font-mono text-[11px] tracking-[0.14em] uppercase">
              {site.role}
            </span>
          </div>

          <HeroHeadline words={hero.headline} />

          {/* `animate-rise` und nicht `animate-fade-rise`: Dieser Absatz ist
              das LCP-Element der Startseite, und eine Blende versteckt ihn so
              lange, wie sie laeuft. Die Bewegung bleibt, der Text steht ab
              dem ersten Bild. */}
          <p
            style={{ animationDelay: "0.2s" }}
            className="animate-rise text-ink-dim mt-8 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl"
          >
            {hero.lede}
          </p>

          <p className="text-ink-faint mt-5 max-w-[52ch] text-sm leading-snug text-pretty">
            {hero.tryIt.before}{" "}
            <a
              href={hero.tryIt.href}
              className="text-ink-dim decoration-ink-faint/60 hover:text-ink hover:decoration-acid -my-1 py-1 underline underline-offset-4 transition-colors"
            >
              {hero.tryIt.label}
            </a>{" "}
            {hero.tryIt.after}
          </p>

          <div
            style={{ animationDelay: "0.3s" }}
            className="animate-fade-rise mt-8 flex flex-wrap items-center gap-3"
          >
            <MagneticIdle>
              <a
                href={hero.ctaPrimary.href}
                className="group bg-acid text-void hover:bg-ink inline-flex items-center gap-2 rounded-full border border-transparent px-6 py-3.5 font-medium transition-colors"
              >
                {hero.ctaPrimary.label}
                <ArrowDown
                  className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden
                />
              </a>
            </MagneticIdle>
            <MagneticIdle>
              <a
                href={hero.ctaSecondary.href}
                {...(secondaryExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group border-line text-ink hover:border-ink-faint hover:bg-surface inline-flex items-center gap-2 rounded-full border px-6 py-3.5 font-medium transition-colors"
              >
                {hero.ctaSecondary.label}
                {secondaryExternal ? (
                  <ArrowUpRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                ) : (
                  <ArrowDown
                    className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                    aria-hidden
                  />
                )}
              </a>
            </MagneticIdle>
          </div>

          <dl
            style={{ animationDelay: "0.4s" }}
            className="animate-fade-rise border-line mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-8 sm:grid-cols-4"
          >
            {hero.proof.map((item) => (
              <div key={item.label} className="flex flex-col-reverse gap-1.5">
                <dt className="text-ink-faint text-xs leading-snug">
                  {item.label}
                </dt>
                <dd className="text-ink text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  <Counter value={item.value} lang={lang} beimStart />
                </dd>
              </div>
            ))}
          </dl>

          <div
            style={{ animationDelay: "0.85s" }}
            className="animate-fade-rise mt-14"
          >
            <Marquee items={TECH_TICKER} duration={60} />
          </div>
        </div>
        <div id="hero-wow-slot" className="contents" />
      </div>
    </section>
  );
}
