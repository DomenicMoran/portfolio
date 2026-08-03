"use client";

import { ArrowUpRight, Copy, Check } from "lucide-react";
import { mailAdresse } from "@/lib/mailto";
import { useState } from "react";
import { useContent } from "@/content/ContentProvider";
import { SOCIALS } from "@/content/types";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";

/**
 * Kontakt ohne Formular.
 *
 * Ein Formular hätte einen Mailversand-Dienst als Drittanbieter gebraucht, den
 * die Datenschutzerklärung ausweisen muss, plus einen Endpunkt, der ausfallen
 * kann. Eine Mailadresse kann beides nicht. Sie hat außerdem einen Vorteil, den
 * kein Formular hat: Der Absender behält seine Nachricht im eigenen Postausgang.
 *
 * Damit lädt diese Seite nichts von Dritten nach, auch nicht beim Absenden.
 */
export function Contact() {
  const { contact, site } = useContent();
  const [kopiert, setKopiert] = useState(false);

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setKopiert(true);
      window.setTimeout(() => setKopiert(false), 2000);
    } catch {
      // Zwischenablage verweigert (unsicherer Kontext, Berechtigung), der
      // Mailto-Link daneben funktioniert weiterhin, also kein Fehlerzustand.
    }
  };

  const profile = [
    SOCIALS.linkedin
      ? { label: "LinkedIn", href: SOCIALS.linkedin, icon: LinkedinIcon }
      : null,
    SOCIALS.github
      ? { label: "GitHub", href: SOCIALS.github, icon: GithubIcon }
      : null,
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: (p: { className?: string }) => React.ReactElement;
  }[];

  return (
    <section
      id="contact"
      aria-labelledby="contact-titel"
      className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb bottom-0 left-1/2 size-[30rem] -translate-x-1/2 bg-acid/8" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="contact-titel"
          eyebrow={contact.eyebrow}
          title={contact.title}
          lede={contact.lede}
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-20">
          <Reveal>
            <div className="flex flex-col gap-8">
              {/* Die Mailadresse ist hier das Hauptelement, nicht eine Fußnote. */}
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic strength={0.15}>
                  <a
                    href={mailAdresse(site.email, site.mailSubject)}
                    className="group inline-flex max-w-full items-center gap-3 text-2xl font-semibold tracking-tight break-all text-ink transition-colors hover:text-acid sm:text-4xl"
                  >
                    {site.email}
                    <ArrowUpRight
                      className="hidden size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:block"
                      aria-hidden
                    />
                  </a>
                </Magnetic>

                <button
                  type="button"
                  onClick={kopieren}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  {kopiert ? (
                    <>
                      <Check className="size-3.5 text-acid" aria-hidden />
                      {contact.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden />
                      {contact.copy}
                    </>
                  )}
                </button>
              </div>

              <p className="max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
                {contact.hinweis}
              </p>

              {profile.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t border-line pt-8">
                  {profile.map((k) => (
                    <a
                      key={k.label}
                      href={k.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                    >
                      <k.icon className="size-3.5" />
                      {k.label}
                      <ArrowUpRight
                        className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>

          {/* Was in eine erste Mail gehört, spart beiden Seiten eine Runde. */}
          <Reveal delay={0.08}>
            <div className="lit rounded-2xl border border-line bg-surface/50 p-7">
              <h3 className="text-eyebrow mb-5">{contact.checkliste.titel}</h3>
              <ul className="flex flex-col gap-3">
                {contact.checkliste.punkte.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2.5 text-sm leading-relaxed text-ink-dim"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid"
                    />
                    {p}
                  </li>
                ))}
              </ul>

              <dl className="mt-7 flex flex-col gap-3.5 border-t border-line pt-6">
                {contact.fakten.map((f) => (
                  <div key={f.label} className="flex flex-col gap-0.5">
                    <dt className="text-eyebrow">{f.label}</dt>
                    <dd className="text-sm text-ink-dim">{f.wert}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
