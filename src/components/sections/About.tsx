"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { Counter } from "@/components/ui/Counter";
import { DisclosureButton } from "@/components/ui/DisclosureButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useDisclosureFlap } from "@/hooks/useDisclosureFlap";
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

const BIO_REGION = "about-bio-detail";
const ZERTIFIKATE_REGION = "about-zertifikate-detail";
const OSS_REGION = "about-oss-detail";

export function About() {
  const { about, site } = useContent();
  const bio = useDisclosureFlap();
  const zertifikate = useDisclosureFlap();
  const oss = useDisclosureFlap();

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
          <div className="flex flex-col gap-6">
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
            ) : (
              <Reveal>
                <p className="text-lg leading-relaxed text-ink text-pretty sm:text-xl">
                  {about.paragraphs[0]}
                </p>
              </Reveal>
            )}

            <Reveal delay={0.04}>
              <p className="max-w-[62ch] text-sm leading-relaxed text-ink-dim text-pretty">
                {about.disclosure.bio.teaser}
              </p>
              <DisclosureButton
                offen={bio.offen}
                expandLabel={about.disclosure.bio.expand}
                hideLabel={about.disclosure.bio.hide}
                ariaControls={BIO_REGION}
                onToggle={bio.umschalten}
                className="mt-4"
              />
            </Reveal>

            <div
              id={BIO_REGION}
              className={cn("flex flex-col gap-6", !bio.offen && "hidden")}
            >
              {about.paragraphs.slice(1).map((paragraph, i) => (
                  <Reveal key={paragraph} delay={i * 0.06}>
                    <p className="leading-relaxed text-ink-dim text-pretty">
                      {paragraph}
                    </p>
                  </Reveal>
                ))}

              <motion.dl
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
                className="mt-2 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4"
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
                    data-reveal=""
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

              <Reveal delay={0.1}>
                <p className="max-w-[62ch] text-xs leading-relaxed text-ink-faint text-pretty">
                  {about.statsHinweis}
                </p>
              </Reveal>
            </div>
          </div>

          <div className="lg:pt-2">
            <h3 className="text-eyebrow mb-8">{about.timelineLabel}</h3>
            <ol className="relative flex flex-col">
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
                  <p
                    className={cn(
                      "mt-2 text-xs leading-relaxed text-ink-faint text-pretty",
                      !bio.offen && "hidden",
                    )}
                  >
                    {entry.body}
                  </p>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={0.1} className="mt-10 border-t border-line pt-8">
              <p className="mb-4 max-w-[62ch] text-sm leading-relaxed text-ink-dim text-pretty">
                {about.disclosure.certificates.teaser}
              </p>
              <DisclosureButton
                offen={zertifikate.offen}
                expandLabel={about.disclosure.certificates.expand}
                hideLabel={about.disclosure.certificates.hide}
                ariaControls={ZERTIFIKATE_REGION}
                onToggle={zertifikate.umschalten}
              />
              <div
                id={ZERTIFIKATE_REGION}
                className={cn("mt-5", !zertifikate.offen && "hidden")}
              >
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
                                  className="-my-1 py-1 underline decoration-ink-faint/60 underline-offset-4 transition-colors hover:text-ink hover:decoration-acid"
                                >
                                  {item.name}
                                </a>
                              ) : (
                                item.name
                              )}
                              {item.date ? (
                                <>
                                  {" "}
                                  <time
                                    dateTime={item.date}
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
                        className="-my-1 py-1 underline decoration-ink-faint/60 underline-offset-4 transition-colors hover:text-ink hover:decoration-acid"
                      >
                        {about.certificates.noteHref.label}
                      </a>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 border-t border-line pt-14">
          <h3 className="text-eyebrow mb-3">{about.openSource.label}</h3>
          <p className="mb-4 max-w-[68ch] text-sm leading-relaxed text-ink-dim text-pretty">
            {about.disclosure.openSource.teaser}
          </p>
          <DisclosureButton
            offen={oss.offen}
            expandLabel={about.disclosure.openSource.expand}
            hideLabel={about.disclosure.openSource.hide}
            ariaControls={OSS_REGION}
            onToggle={oss.umschalten}
            className="mb-8"
          />
          <div id={OSS_REGION} className={cn(!oss.offen && "hidden")}>
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
                    aria-labelledby={`paket-${item.name}`}
                    className="lit group flex h-full flex-col rounded-xl border border-line bg-surface/40 p-5 transition-colors hover:border-acid/40"
                  >
                    <span
                      id={`paket-${item.name}`}
                      className="flex items-center gap-1.5 font-mono text-sm text-acid"
                    >
                      {item.name}
                      <ArrowUpRight
                        className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-2.5 block text-sm leading-relaxed text-ink-dim text-pretty">
                      {item.body}
                    </span>
                    <span className="mt-auto block pt-4 font-mono text-[10px] text-ink-faint">
                      {item.meta}
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
