"use client";

import { Fragment } from "react";
import { ArrowDown } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { TECH_TICKER as techTicker } from "@/content/types";
import { Counter } from "@/components/ui/Counter";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { cn } from "@/lib/utils";

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
      className="relative flex min-h-svh flex-col justify-end overflow-x-clip pb-10"
    >
      {/* Ambient light. Three blurred orbs, GPU-composited, no canvas.
          Diese Hülle beschneidet zusätzlich senkrecht, damit die Kreise nicht
          in den nächsten Abschnitt hängen. Sie enthält nur Deko, hier schneidet
          der Beschnitt also nie Text. */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
        <div className="glow-orb animate-float -top-40 left-[8%] size-[20rem] bg-violet/18 sm:size-[38rem]" />
        {/* Die beiden hinteren Glühkreise sind reine Dekoration und erscheinen
            erst, wenn der Sichtbereich breit genug ist, dass ihr Preis nicht
            mehr ins Gewicht fällt. */}
        <div
          className="glow-orb animate-float top-[10%] right-[2%] hidden size-[30rem] bg-cyan/12 sm:block"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="glow-orb animate-float bottom-[6%] left-[38%] hidden size-[26rem] bg-acid/10 sm:block"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <div className="w-full">
        <div className="mx-auto w-full max-w-6xl px-6 pt-32">
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

        {/* Überschrift: Jedes Wort steigt aus seiner eigenen Maske auf */}
        <h1 className="text-display max-w-[18ch] text-balance text-ink">
          {hero.headline.map((word, i) => (
            // Das Leerzeichen ist ein echter Textknoten ZWISCHEN den Masken,
            // nicht in einer: Innerhalb eines inline-block mit overflow:hidden
            // wird es zusammengefaltet, und die Wörter kleben aneinander.
            // Außerhalb trennt es sichtbar und hält die Überschrift für
            // Screenreader und zum Kopieren lesbar.
            <Fragment key={i}>
{/* Das Polster ist die Maske, nicht Zierde.

                  Jedes Wort sitzt in einem inline-block mit overflow:hidden,
                  aus dem es beim Auftritt hervorkommt. Die untere Kante dieses
                  Kastens schneidet damit auch die Unterlängen ab.

                  Gemessen bei 1440 px: Schriftgröße 129,6 px, Zeilenbox
                  114 px (line-height 0,88). Unter der Grundlinie bleiben
                  dadurch nur 9 px im Kasten. Die Grundschrift trägt 21 px
                  Tinte unter die Grundlinie, die kursive Auszeichnungsschrift
                  28 px — das "g" in "fertige" und das "y" in "Prototypen"
                  endeten flach abgeschnitten.

                  0,2 em Polster deckt 25,9 px ab und damit beide Schriften mit
                  Reserve. Der gleich große negative Außenabstand nimmt die
                  zusätzliche Höhe wieder heraus: Der Kasten wird tiefer, die
                  Zeile bleibt, wo sie war. */}
              <span className="inline-block overflow-hidden pb-[0.2em] -mb-[0.14em] align-bottom">
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
            // flex-col-reverse: Im Baum bleibt die Reihenfolge dt → dd, die
            // einzige Struktur, die eine <dl> enthalten darf — und die Zahl
            // steht trotzdem über ihrer Beschriftung. Ein <span> als
            // Geschwister wäre ungültig, und axe meldet das.
            <div key={item.label} className="flex flex-col-reverse gap-1.5">
              <dt className="text-xs leading-snug text-ink-faint">{item.label}</dt>
              <dd className="text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
                <Counter value={item.value} />
              </dd>
            </div>
            ))}
          </dl>
        </div>

        <div style={{ animationDelay: "0.85s" }} className="animate-fade-rise mt-14">
          <Marquee items={techTicker} duration={60} />
        </div>
      </div>
    </section>
  );
}
