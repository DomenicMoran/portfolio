"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Der Abschnitt zur Person.
 *
 * Steht mit Absicht hinter den Fallstudien: Die Arbeit verdient sich das Recht
 * auf die Geschichte. Wer gerade vier Produktionssysteme gesehen hat, liest
 * „selbst beigebracht, neben einem Vollzeitjob" als bemerkenswert. Zuerst
 * gelesen klingt derselbe Satz nach einer Ausrede.
 */
/**
 * Aus "2022-07-25" wird "07/2022". Der Tag trägt bei einem Zertifikat keine
 * Information, und Monat/Jahr ist in beiden Sprachen gleich lesbar.
 */
function jahrMonat(iso: string) {
  const [jahr, monat] = iso.split("-");
  return `${monat}/${jahr}`;
}

export function About() {
  const { about, site } = useContent();

  return (
    <section
      id="about"
      aria-labelledby="about-titel"
      className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb animate-float top-0 right-[10%] size-[30rem] bg-violet/10" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="about-titel"
          eyebrow={about.eyebrow}
          title={about.title}
        />

        <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-20">
          {/* Narrative */}
          <div className="flex flex-col gap-6">
            {/* Porträt und erster Absatz stehen nebeneinander.
                Darunter stand das Bild allein in der linken Spalte, mit einer
                leeren Fläche daneben bis zur Werdegangs-Spalte: Es sah
                hineingelegt aus statt gesetzt. Neben dem Absatz füllt es die
                Zeile, und die Sektion beginnt mit Gesicht und Aussage
                zugleich. Unter 640 px stapelt es wie vorher.

                Der Grund der Aufnahme ist die Farbe der Seite, nicht die Wand
                dahinter — siehe `portraitPrint` in site.ts. Auf fast Schwarz
                war die helle Wand die einzige helle Fläche der ganzen Seite
                und damit das, was man zuerst sah. */}
            {about.portrait ? (
              <Reveal>
                <div className="mb-2 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                  <Image
                    src={about.portrait}
                    alt={site.name}
                    width={220}
                    height={220}
                    sizes="(max-width: 640px) 60vw, 220px"
                    className="w-[13.75rem] max-w-[60vw] shrink-0 rounded-2xl object-cover"
                  />
                  <p className="text-lg leading-relaxed text-ink text-pretty sm:text-xl">
                    {about.paragraphs[0]}
                  </p>
                </div>
              </Reveal>
            ) : null}

            {about.paragraphs
              .slice(about.portrait ? 1 : 0)
              .map((paragraph, i) => (
                <Reveal key={paragraph} delay={i * 0.06}>
                  <p
                    className={cn(
                      "leading-relaxed text-pretty",
                      !about.portrait && i === 0
                        ? "text-lg text-ink sm:text-xl"
                        : "text-ink-dim",
                    )}
                  >
                    {paragraph}
                  </p>
                </Reveal>
              ))}

            {/* Stats */}
            <motion.dl
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
              className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4"
            >
              {about.stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: ease.expo },
                    },
                  }}
                  // Eine <dl> darf nur dt/dd-Paare enthalten: Beschriftung und
                  // Anmerkung stehen zusammen im <dt>, die Zahl im <dd>, und
                  // flex-col-reverse stellt die Zahl optisch wieder nach oben.
                  className="flex flex-col-reverse gap-1"
                >
                  <dt className="flex flex-col gap-0.5">
                    <span className="text-xs leading-snug text-ink">
                      {stat.label}
                    </span>
                    <span className="text-[11px] leading-snug text-ink-faint">
                      {stat.note}
                    </span>
                  </dt>
                  <dd className="text-2xl font-semibold tracking-tight text-acid tabular-nums sm:text-3xl">
                    <Counter value={stat.value} />
                  </dd>
                </motion.div>
              ))}
            </motion.dl>

            {/* Prüfdatum sichtbar: macht die Zahlen nachvollziehbar und erklärt
                jede Abweichung, die durch Weiterarbeiten entsteht. */}
            <Reveal delay={0.1}>
              <p className="max-w-[62ch] text-xs leading-relaxed text-ink-faint text-pretty">
                {about.statsHinweis}
              </p>
            </Reveal>
          </div>

          {/* Timeline */}
          <div className="lg:pt-2">
            <h3 className="text-eyebrow mb-8">{about.timelineLabel}</h3>
            <ol className="relative flex flex-col">
              {/* Spine */}
              <span
                aria-hidden
                className="absolute top-1.5 bottom-2 left-[5px] w-px bg-line"
              />

              {about.timeline.map((entry, i) => (
                <Reveal
                  as="li"
                  key={entry.period}
                  delay={i * 0.05}
                  className="relative pb-9 pl-8 last:pb-0"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1.5 left-0 size-[11px] rounded-full border-2",
                      entry.current
                        ? "border-acid bg-acid"
                        : "border-line bg-base",
                    )}
                  />
                  <span className="font-mono text-[11px] tracking-wide text-ink-faint">
                    {entry.period}
                  </span>
                  <h4 className="mt-1.5 text-sm font-semibold text-ink">
                    {entry.title}
                  </h4>
                  <p className="text-sm text-ink-dim">{entry.org}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-faint text-pretty">
                    {entry.body}
                  </p>
                </Reveal>
              ))}
            </ol>

            {/* Zertifikate füllen die Spalte mit Beleg statt mit Weißraum.
                Einträge mit Prüf-Link werden zum Link, alle anderen bleiben
                Text. So ist auf einen Blick sichtbar, was nachschlagbar ist. */}
            <Reveal delay={0.1} className="mt-10 border-t border-line pt-8">
              <h3 className="text-eyebrow mb-5">{about.certificates.label}</h3>
              <div className="flex flex-col gap-5">
                {about.certificates.groups.map((group) => (
                  <div key={group.issuer}>
                    <h4 className="mb-2 font-mono text-[11px] tracking-wide text-ink-dim">
                      {group.issuer}
                    </h4>
                    <ul className="flex flex-col gap-1.5">
                      {group.items.map((item) => (
                        <li
                          key={item.name}
                          className="flex gap-2 text-xs leading-snug text-ink-faint"
                        >
                          <span
                            aria-hidden
                            className="mt-1.5 size-1 shrink-0 rounded-full bg-acid/60"
                          />
                          <span>
                            {item.href ? (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="-my-1 py-1 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-acid"
                              >
                                {item.name}
                              </a>
                            ) : (
                              item.name
                            )}
                            {/* Das Datum steht in derselben Zeile und bricht
                                mit um. Eine eigene Zeile je Datum hätte die
                                Liste auf die doppelte Höhe gebracht. */}
                            {item.date ? (
                              <>
                                {/* Ein echtes Leerzeichen im Text, nicht nur
                                    ein Rand: Ohne das steht im kopierten Text
                                    und in der Vorlesereihenfolge
                                    "Version Control07/2022". */}{" "}
                                <time
                                  dateTime={item.date}
                                  /* Volle Deckkraft statt /70: Mit der
                                     Abschwaechung kam das Datum auf
                                     #5f5f67 ueber #08080a und damit auf
                                     3,16:1 — unter den 4,5:1, die WCAG fuer
                                     10-px-Text verlangt. Gemessen mit
                                     axe-core an der gebauten Seite, zehn
                                     Stellen auf der Startseite je Sprache. */
                                  className="font-mono text-[10px] whitespace-nowrap text-ink-faint"
                                >
                                  {jahrMonat(item.date)}
                                </time>
                              </>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {about.certificates.groups.some((g) =>
                g.items.some((i) => i.href),
              ) && about.certificates.note ? (
                <p className="mt-5 text-[11px] leading-relaxed text-ink-faint">
                  {about.certificates.note}{" "}
                  {about.certificates.noteHref ? (
                    <a
                      href={about.certificates.noteHref.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="-my-1 py-1 underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-acid"
                    >
                      {about.certificates.noteHref.label}
                    </a>
                  ) : null}
                </p>
              ) : null}
            </Reveal>
          </div>
        </div>

        {/* Öffentlicher Code über die volle Breite.
            Vorher stand die Liste in der schmalen Seitenspalte. Mit fünf
            Einträgen war sie dort länger als der Lebenslauf daneben, und jede
            Karte hatte ein Zeilenmaß von rund 30 Zeichen. Über die volle
            Breite passen drei Karten nebeneinander, und die Beschreibungen
            kommen auf ein lesbares Maß. */}
        <div className="mt-20 border-t border-line pt-14">
          <h3 className="text-eyebrow mb-3">{about.openSource.label}</h3>
          <p className="mb-8 max-w-[68ch] text-sm leading-relaxed text-ink-dim text-pretty">
            {about.openSource.lede}
          </p>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {about.openSource.items.map((item, i) => (
              <Reveal as="li" key={item.name} delay={i * 0.05}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lit group flex h-full flex-col rounded-xl border border-line bg-surface/40 p-5 transition-colors hover:border-acid/40"
                >
                  <span className="flex items-center gap-1.5 font-mono text-sm text-acid">
                    {item.name}
                    <ArrowUpRight
                      className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-2.5 block text-sm leading-relaxed text-ink-dim text-pretty">
                    {item.body}
                  </span>
                  {/* mt-auto hält die Kennzeilen auf einer Linie, auch wenn die
                      Beschreibungen unterschiedlich lang sind. */}
                  <span className="mt-auto block pt-4 font-mono text-[10px] text-ink-faint">
                    {item.meta}
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
