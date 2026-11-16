"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { TECH_TICKER as techTicker } from "@/content/types";
import { Counter } from "@/components/ui/Counter";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { SignalFieldLazy } from "@/components/hero/SignalFieldLazy";

export function Hero() {
  const { hero, site } = useContent();
  // Kein scrollgebundenes Verblassen und keine Parallaxe mehr.
  //
  // Beides stand hier und war ein Fehler, gemessen: Die vier Kennzahlen sind
  // der staerkste Inhalt der Seite, und sie standen bei scrollY 500 mitten im
  // Bild mit 10 Prozent Deckkraft. Der Verlauf war ausserdem nicht monoton
  // (1 -> 0,51 -> 0,10 -> 0,37 -> 0,86), was beim Scrollen flackert.
  //
  // Dazu kam, dass der Verlauf an scrollYProgress haengt und damit auch unter
  // prefers-reduced-motion lief. MotionConfig erreicht ihn nicht, weil er
  // keine Animation ist, sondern eine Abbildung der Scrollposition.
  //
  // Der Hero steht jetzt still. Bewegung liefern die geblurrten Kreise in der
  // Deko-Huelle, und die sind aria-hidden und rein dekorativ.
  // Der Abschnitt beschneidet nur waagerecht. Beide Achsen zu beschneiden
  // wäre falsch, und beide offen zu lassen ebenfalls:
  //
  // - Waagerecht muss er beschneiden, sonst schiebt die Laufschrift das
  //   Dokument bei 320 px um gemessene 1168 px in die Breite.
  // - Senkrecht darf er nicht beschneiden, sonst trennt die Unterkante die
  //   untere Kennzahlenreihe mitten durch die Ziffern, sobald die Parallaxe
  //   den Inhalt nach unten schiebt.
  //
  // `overflow-x: clip` kann genau das. `hidden` kann es nicht: Steht es auf
  // einer Achse, wird die andere automatisch zu `auto`.
  return (
    <section
      id="top"
      /* Der Abschnitt traegt die Hauptueberschrift als Namen. Er ist ein
         Sprungziel, die Marke in der Kopfleiste zeigt darauf, und ein
         Sprungziel ohne Namen ist im Barrierefreiheitsbaum keine Landmarke,
         sondern gar nichts. */
      aria-labelledby="top-titel"
      className="relative flex min-h-svh flex-col justify-end overflow-x-clip pb-10"
    >
      {/* Das Umgebungslicht: drei weiche Kreise, von der Grafikkarte gesetzt,
          ohne Zeichenfläche.
          Diese Hülle beschneidet zusätzlich senkrecht, damit die Kreise nicht
          in den nächsten Abschnitt hängen. Sie enthält nur Deko, hier schneidet
          der Beschnitt also nie Text. */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <SignalFieldLazy className="absolute inset-0" />
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
        <div className="glow-orb animate-float bg-acid/12 -top-40 left-[8%] size-[20rem] sm:size-[38rem]" />
        <div
          className="glow-orb animate-float bg-acid/10 bottom-[6%] left-[38%] hidden size-[26rem] sm:block"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <div className="w-full">
        <div className="mx-auto w-full max-w-6xl px-6 pt-32">
          {/* Die Verfügbarkeitsmarke */}
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

          <p className="text-ink-dim mt-8 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl">
            {hero.lede}
          </p>

          {/* Der Hinweis auf die beiden Vorführungen.

              Sie stecken in ihrer Fallstudie, also weit unten: Gemessen
              beginnt die erste bei 3.100 px. Wer den Kopf liest und
              weiterzieht, erfährt sonst nie, dass auf dieser Seite etwas zum
              Anfassen steht, und genau das unterscheidet sie von jedem
              anderen Portfolio.

              Eine Zeile und kein dritter Knopf: Zwei Knöpfe führen, ein
              dritter teilt. */}
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

          {/* Die beiden Handlungsaufforderungen */}
          <div
            style={{ animationDelay: "0.3s" }}
            className="animate-fade-rise mt-8 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <a
                href={hero.ctaPrimary.href}
                // Der durchsichtige Rahmen ist normal unsichtbar. Im
                // Kontrastmodus von Windows ersetzt das System jede Farbe, auch
                // "transparent", und der Rahmen wird sichtbar. Ohne ihn verliert
                // der gefüllte Knopf dort seine Form und liest sich wie
                // gewöhnlicher Text.
                className="group bg-acid text-void hover:bg-ink inline-flex items-center gap-2 rounded-full border border-transparent px-6 py-3.5 font-medium transition-colors"
              >
                {hero.ctaPrimary.label}
                <ArrowDown
                  className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden
                />
              </a>
            </Magnetic>

            <Magnetic>
              <a
                href={hero.ctaSecondary.href}
                /* Der zweite Knopf führt seit dem Produkt-Einstieg nach
                   draußen, zur MFC-Landing mit dem Kaufknopf. Ein Ziel
                   außerhalb trägt den Pfeil nach schräg oben und öffnet in
                   einem neuen Tab; der erste Knopf bleibt ein Sprungziel im
                   Dokument und behält den Pfeil nach unten. */
                {...(hero.ctaSecondary.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group border-line text-ink hover:border-ink-faint hover:bg-surface inline-flex items-center gap-2 rounded-full border px-6 py-3.5 font-medium transition-colors"
              >
                {hero.ctaSecondary.label}
                {hero.ctaSecondary.href.startsWith("http") ? (
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
            </Magnetic>
          </div>

          {/* Die Belegleiste */}
          <dl
            style={{ animationDelay: "0.4s" }}
            className="animate-fade-rise border-line mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-8 sm:grid-cols-4"
          >
            {hero.proof.map((item) => (
              // flex-col-reverse: Im Baum bleibt die Reihenfolge dt → dd, die
              // einzige Struktur, die eine <dl> enthalten darf, und die Zahl
              // steht trotzdem über ihrer Beschriftung. Ein <span> als
              // Geschwister wäre ungültig, und axe meldet das.
              <div key={item.label} className="flex flex-col-reverse gap-1.5">
                <dt className="text-ink-faint text-xs leading-snug">
                  {item.label}
                </dt>
                <dd className="text-ink text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  <Counter value={item.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          style={{ animationDelay: "0.85s" }}
          className="animate-fade-rise mt-14"
        >
          <Marquee items={techTicker} duration={60} />
        </div>
      </div>
    </section>
  );
}
