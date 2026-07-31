"use client";

import { ArrowUpRight, CalendarClock, FileDown, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { recruiter, site } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function RecruiterHub() {
  const links = [
    site.socials.linkedin
      ? { label: "LinkedIn", href: site.socials.linkedin, icon: LinkedinIcon }
      : null,
    site.socials.github
      ? { label: "GitHub", href: site.socials.github, icon: GithubIcon }
      : null,
    { label: site.email, href: `mailto:${site.email}`, icon: Mail },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: (props: { className?: string }) => React.ReactElement;
  }[];

  return (
    // overflow-hidden clips the glow orb below — without it the 34rem circle
    // pushes the document wider than the viewport on phones.
    <section
      id="hire"
      className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb animate-float top-1/3 left-1/2 size-[34rem] -translate-x-1/2 bg-acid/8" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={recruiter.eyebrow}
          title={recruiter.title}
          lede={recruiter.lede}
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
          {/* Fact sheet */}
          <Reveal>
            <dl className="lit h-full rounded-2xl border border-line bg-surface/50 p-7">
              {recruiter.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-col gap-1 border-b border-line py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <dt className="text-eyebrow">{fact.label}</dt>
                  <dd className="text-sm text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Strengths + actions */}
          <div className="flex flex-col gap-5">
            {/* Erst ab xl dreispaltig: bei drei Spalten in dieser Breite fiel
                das Zeilenmaß auf ~30 Zeichen, und so kurze Zeilen zerhacken den
                Lesefluss genauso wie zu lange. */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recruiter.strengths.map((item, i) => (
                <Reveal key={item.title} delay={0.05 * i}>
                  <div className="lit h-full rounded-2xl border border-line bg-surface/50 p-6">
                    <h3 className="text-base leading-snug font-semibold tracking-tight text-ink text-balance">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-dim text-pretty">
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="lit flex flex-col gap-6 rounded-2xl border border-acid/25 bg-acid/[0.06] p-7 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Magnetic>
                    <a
                      href={recruiter.cta.pdf.href}
                      className="group inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-medium text-void transition-colors hover:bg-ink"
                    >
                      <FileDown className="size-4" aria-hidden />
                      {recruiter.cta.pdf.label}
                    </a>
                  </Magnetic>

                  {recruiter.cta.call.href ? (
                    <Magnetic>
                      <a
                        href={recruiter.cta.call.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 rounded-full border border-line bg-base px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
                      >
                        <CalendarClock className="size-4" aria-hidden />
                        {recruiter.cta.call.label}
                      </a>
                    </Magnetic>
                  ) : null}

                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-2 py-3 text-sm text-ink-dim underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    Oder direkt schreiben
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-acid/15 pt-6">
                  {links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full border border-line bg-base/60 px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                    >
                      <link.icon className="size-3.5" aria-hidden />
                      {link.label}
                      <ArrowUpRight
                        className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
