"use client";

import { ArrowUpRight, FileDown, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { useContent } from "@/content/ContentProvider";
import { SOCIALS } from "@/content/types";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function RecruiterHub() {
  const { recruiter, site } = useContent();

  const links = [
    SOCIALS.linkedin
      ? { label: "LinkedIn", href: SOCIALS.linkedin, icon: LinkedinIcon }
      : null,
    SOCIALS.github
      ? { label: "GitHub", href: SOCIALS.github, icon: GithubIcon }
      : null,
    { label: site.email, href: `mailto:${site.email}`, icon: Mail },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: (props: { className?: string }) => React.ReactElement;
  }[];

  return (
    // overflow-hidden clips the glow orb below. Without it the 34rem circle
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

        {/* Die drei Stärken zuerst über die volle Breite: neben dem Faktenblatt
            fiel ihr Zeilenmaß auf ~27 Zeichen, und der Text zerhackte sich in
            Silbentrennungen. Volle Breite bringt jede Karte auf ~48 Zeichen. */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Faktenblatt über die volle Breite, darunter die Aktionen.
            Vorher standen beide nebeneinander, und weil das Faktenblatt sieben
            Zeilen hat und die Aktionen nur zwei, wurde die Aktionskarte auf
            gemessene 500 px gestreckt und war zur Hälfte leer. Untereinander
            hat jeder Block die Höhe, die sein Inhalt braucht. */}
        <div className="mt-5 flex flex-col gap-5">
          <Reveal>
            <dl className="lit grid gap-x-8 gap-y-6 rounded-2xl border border-line bg-surface/50 p-7 sm:grid-cols-2 lg:grid-cols-4">
              {recruiter.facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1">
                  <dt className="text-eyebrow">{fact.label}</dt>
                  <dd className="text-sm leading-snug text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="lit flex flex-col gap-6 rounded-2xl border border-acid/25 bg-acid/[0.06] p-7 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic>
                  <a
                    href={recruiter.cta.pdf.href}
                    className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-acid px-5 py-3 text-sm font-medium text-void transition-colors hover:bg-ink"
                  >
                    <FileDown className="size-4" aria-hidden />
                    {recruiter.cta.pdf.label}
                  </a>
                </Magnetic>

                <Magnetic>
                  <a
                    href={`mailto:${site.email}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-line bg-base px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
                  >
                    <Mail className="size-4" aria-hidden />
                    {recruiter.cta.mail.label}
                  </a>
                </Magnetic>
              </div>

              {/* Die Trennlinie wandert mit der Anordnung: waagerecht, solange
                  gestapelt wird, senkrecht, sobald nebeneinander. */}
              <div className="flex flex-wrap gap-2 border-t border-acid/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
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
    </section>
  );
}
