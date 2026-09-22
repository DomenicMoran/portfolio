"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, ChevronDown, Clock3, Mail, MoveUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { StackComparison } from "@/components/targeted/StackComparison";
import { Spotlight } from "@/components/ui/Spotlight";
import { Reveal, RevealWords } from "@/components/ui/Reveal";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { targetedPageCopy } from "@/content/targeted-page";
import type { TargetedCompany } from "@/lib/targeted-companies";

type Props = { company: TargetedCompany; mailto: string };

export function TargetedLanding({ company, mailto }: Props) {
  const officialLogoUrl = company.logo_url ?? (company.company_url ? `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(company.company_url)}` : null);
  const contextParts = company.pain_point_summary.split(";").map((part) => part.trim()).filter(Boolean);
  const contextLabel = targetedPageCopy.contextLabel;
  // Every page should offer more than one meaningful way to inspect the work.
  // The first card remains the hand-picked, company-specific reference from the CRM.
  // The second card is deliberately labelled as the broader portfolio, never as a direct match.
  const workSamples = company.matched_projects.length > 1 ? company.matched_projects : [
    ...company.matched_projects,
    {
      name: "Weitere Produktarbeit",
      description: "Weitere Live-Projekte, technische Entscheidungen und die ganze Bandbreite meiner Arbeit im Portfolio ansehen.",
      url: "/",
      tags: ["Portfolio", "Live-Projekte"],
    },
  ];

  return (
    <main className="relative flex-1 overflow-x-clip bg-void text-ink">
      <ScrollProgress />
      <section className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_68%)]" />
          <div className="glow-orb animate-float -top-28 left-[8%] size-[22rem] bg-violet/22 sm:size-[38rem]" />
          <div className="glow-orb animate-float right-[4%] top-[26%] hidden size-[28rem] bg-acid/10 sm:block" style={{ animationDelay: "-8s" }} />
        </div>

        <nav className="relative z-30 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border border-line bg-base/70 px-4 py-2.5 backdrop-blur-xl sm:w-[calc(100%-3rem)] sm:px-5" aria-label={targetedPageCopy.backToPortfolio}>
          <Link href="/" className="group inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-ink-dim uppercase transition-colors hover:text-ink">
            <span className="flex size-7 items-center justify-center rounded-full border border-line bg-surface text-acid transition-transform group-hover:-translate-x-0.5">D</span>
            {targetedPageCopy.backToPortfolio}
          </Link>
          <div className="hidden items-center gap-1 lg:flex" aria-label={targetedPageCopy.nav.label}>
            <a href="#perspektive" className="rounded-full px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-surface hover:text-ink">{targetedPageCopy.nav.perspective}</a>
            <a href="#work" className="rounded-full px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-surface hover:text-ink">{targetedPageCopy.nav.work}</a>
            <a href="https://github.com/DomenicMoran" target="_blank" rel="noreferrer" className="rounded-full px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-surface hover:text-ink">{targetedPageCopy.nav.github}</a>
            <a href="https://www.linkedin.com/in/domenicmoran" target="_blank" rel="noreferrer" className="rounded-full px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-surface hover:text-ink">{targetedPageCopy.nav.linkedin}</a>
            <a href="#contact" className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink">{targetedPageCopy.nav.contact}</a>
          </div>
        </nav>

        <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-14 sm:pb-28 sm:pt-20">
          <div style={{ animationDelay: "0.05s" }} className="animate-fade-rise flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 backdrop-blur">
              <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-acid" /></span>
              <span className="font-mono text-[11px] tracking-[0.14em] text-ink-dim uppercase">{targetedPageCopy.eyebrow}</span>
            </span>
            <span className="font-mono text-[11px] tracking-[0.12em] text-ink-faint uppercase">{targetedPageCopy.availability}</span>
          </div>

          <div className="mt-12 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <h1 className="animate-rise text-headline max-w-[17ch] text-balance text-ink">
                <span className="font-editorial text-acid">{targetedPageCopy.heroBeforeName} {company.founder_name},</span>{" "}{targetedPageCopy.heroAfterName}{" "}<span className="font-editorial text-acid">{company.company_name}</span>{" "}{targetedPageCopy.heroEnd}
              </h1>
              <p style={{ animationDelay: "0.22s" }} className="animate-rise mt-8 max-w-2xl text-lg leading-relaxed text-ink-dim sm:text-xl">
                {targetedPageCopy.heroPerspective}
              </p>
              <p style={{ animationDelay: "0.28s" }} className="animate-fade-rise mt-4 max-w-xl font-mono text-[11px] tracking-[0.1em] text-ink-faint uppercase">{contextLabel}: {company.pain_point_summary}</p>
              <div style={{ animationDelay: "0.32s" }} className="animate-fade-rise mt-9 flex flex-wrap items-center gap-3">
                <Magnetic><a href="#work" className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-acid px-6 py-3.5 font-medium text-void transition-colors hover:bg-ink hover:text-void">{targetedPageCopy.workAction} <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden /></a></Magnetic>
                <Magnetic><a href={mailto} className="group inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-medium text-ink transition-colors hover:border-ink-faint hover:bg-surface">{targetedPageCopy.contactAction} <Mail className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></a></Magnetic>
              </div>
              <div style={{ animationDelay: "0.42s" }} className="animate-fade-rise mt-10 grid max-w-2xl gap-2 sm:grid-cols-3">
                {targetedPageCopy.heroFacts.map((fact) => <div key={fact.label} className="rounded-2xl border border-line bg-surface/55 px-4 py-3 backdrop-blur"><span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">{fact.label}</span><span className="mt-1 block text-sm font-medium text-ink">{fact.value}</span></div>)}
              </div>
            </div>
            <div style={{ animationDelay: "0.28s" }} className="animate-fade-rise relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-acid/10 blur-3xl" aria-hidden />
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2.35rem] border border-line bg-surface/75 p-4 shadow-2xl backdrop-blur sm:p-5">
                <div aria-hidden className="absolute inset-[8%] animate-[spin_18s_linear_infinite] rounded-full border border-acid/20 border-t-acid/70" />
                <div aria-hidden className="absolute inset-[17%] animate-[spin_12s_linear_infinite_reverse] rounded-full border border-violet/30 border-b-violet" />
                {officialLogoUrl ? <div className="relative z-10 flex size-[92%] items-center justify-center rounded-[1.9rem] border border-ink/10 bg-base/90 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-3"><img src={officialLogoUrl} alt={`${company.company_name} logo`} className="max-h-full max-w-full object-contain" /><span className="sr-only">{targetedPageCopy.signalLabel}</span></div> : <div className="relative z-10 text-center"><span className="font-editorial text-7xl text-acid">{company.company_name.slice(0, 1)}</span><span className="mt-3 block font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">{targetedPageCopy.signalLabel}</span></div>}
                <span className="absolute bottom-4 z-20 rounded-full border border-line bg-void/80 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-ink-dim uppercase backdrop-blur">{company.company_name}</span>
              </div>
            </div>
          </div>
        </div>
        <a href="#perspektive" className="group absolute bottom-24 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-acid sm:inline-flex">{targetedPageCopy.scrollPrompt} <ChevronDown className="size-3 animate-bounce" aria-hidden /></a>
        <section className="border-t border-line" aria-label={targetedPageCopy.technologyLabel}>
          <Marquee items={targetedPageCopy.skills} duration={34} className="mx-auto max-w-6xl px-6 py-5" />
        </section>
      </section>

      <section id="perspektive" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32" aria-labelledby="stack-heading">
        <Reveal className="max-w-3xl">
          <p className="text-eyebrow">{targetedPageCopy.stackKicker}</p>
          <h2 id="stack-heading" className="text-title mt-5 text-balance"><RevealWords text={targetedPageCopy.stackHeading} /></h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-dim">{targetedPageCopy.stackIntro}</p>
        </Reveal>
        <Reveal delay={0.08} className="mt-10"><StackComparison skills={targetedPageCopy.skills} /></Reveal>
        <Reveal delay={0.12} className="mt-14 grid gap-6 rounded-[2rem] border border-line bg-surface/45 p-7 backdrop-blur sm:grid-cols-[1.2fr_0.8fr] sm:p-9">
          <div>
            <p className="text-eyebrow">{targetedPageCopy.about.kicker}</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{targetedPageCopy.about.heading}</h3>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-dim">{targetedPageCopy.about.body}</p>
          </div>
          <div className="flex flex-col justify-end gap-3 sm:items-start">
            <a href="https://github.com/DomenicMoran" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-dim transition-colors hover:text-acid"><span aria-hidden className="flex size-5 items-center justify-center rounded border border-line font-mono text-[9px]">GH</span>{targetedPageCopy.about.github} <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></a>
            <a href="https://www.linkedin.com/in/domenicmoran" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-dim transition-colors hover:text-acid"><span aria-hidden className="flex size-5 items-center justify-center rounded border border-line font-mono text-[9px]">in</span>{targetedPageCopy.about.linkedin} <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></a>
            <Link href="/" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-dim transition-colors hover:text-acid"><Sparkles className="size-4" aria-hidden />{targetedPageCopy.about.portfolio} <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></Link>
          </div>
        </Reveal>
      </section>

      <section id="work" className="relative overflow-hidden border-y border-line bg-base py-24 sm:py-32" aria-labelledby="work-heading">
        <div aria-hidden className="glow-orb -right-48 top-20 size-[28rem] bg-violet/12" />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <Reveal className="max-w-3xl">
            <p className="text-eyebrow">{targetedPageCopy.workKicker}</p>
            <h2 id="work-heading" className="text-title mt-5 text-balance"><RevealWords text={targetedPageCopy.workHeading} /></h2>
          </Reveal>
          <Spotlight className="mt-10 grid gap-4 md:grid-cols-2">
            {workSamples.map((project, index) => (
              <motion.a key={project.name} data-schein href={project.url} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.65, delay: index * 0.08 }} className="lit group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl border border-line bg-surface/80 p-7 transition-colors hover:border-ink-faint sm:p-8">
                <div className="relative z-10"><div className="flex items-start justify-between gap-5"><span className="text-eyebrow">0{index + 1}</span><MoveUpRight className="size-5 text-ink-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-acid" aria-hidden /></div><h3 className="mt-12 text-2xl font-semibold tracking-tight text-ink">{project.name}</h3><p className="mt-4 max-w-md leading-relaxed text-ink-dim">{targetedPageCopy.projectDescriptions[project.name as keyof typeof targetedPageCopy.projectDescriptions] ?? project.description}</p></div>
                <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5"><span className="text-sm font-medium text-acid">{targetedPageCopy.projectLabel}</span>{project.tags?.length ? <span className="font-mono text-[11px] tracking-wide text-ink-faint">{project.tags.join(" / ")}</span> : null}</div>
              </motion.a>
            ))}
          </Spotlight>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 sm:grid-cols-[0.8fr_1.2fr] sm:py-32" aria-labelledby="opportunity-heading">
        <Reveal><p className="text-eyebrow">{targetedPageCopy.challengeKicker}</p><p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-faint">{targetedPageCopy.challengeContext}</p><div className="mt-6 flex size-12 items-center justify-center rounded-2xl bg-violet/15 text-violet"><Check className="size-6" aria-hidden /></div></Reveal>
        <Reveal delay={0.08}><h2 id="opportunity-heading" className="text-title text-balance"><RevealWords text={targetedPageCopy.challengeHeading} /></h2><p className="mt-6 text-xl leading-relaxed text-ink-dim">{company.pain_point_summary}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{contextParts.map((part, index) => <div key={part} className="lit rounded-2xl border border-line bg-surface/70 p-4"><span className="font-mono text-[10px] tracking-[0.14em] text-acid uppercase">0{index + 1} / {targetedPageCopy.observationLabel}</span><p className="mt-2 text-sm leading-relaxed text-ink-dim">{part}</p></div>)}</div><p className="mt-6 leading-relaxed text-ink-faint">{targetedPageCopy.challengeBody}</p></Reveal>
      </section>

      <section id="contact" className="relative overflow-hidden px-6 pb-24 sm:pb-32" aria-labelledby="contact-heading">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-acid px-7 py-12 text-void sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full border-[30px] border-void/10" />
          <div className="relative max-w-4xl"><p className="font-mono text-[11px] tracking-[0.16em] text-void/65 uppercase">{targetedPageCopy.contactKicker}</p><h2 id="contact-heading" className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">{targetedPageCopy.contactHeading}</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-void/75">{targetedPageCopy.contactBody}</p><div className="mt-8 grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-2xl border border-void/15 bg-void/5 p-4"><Clock3 className="size-4 text-void/70" aria-hidden /><p className="mt-3 font-medium">{targetedPageCopy.contactCards[0].title}</p><p className="mt-1 text-void/65">{targetedPageCopy.contactCards[0].body}</p></div><div className="rounded-2xl border border-void/15 bg-void/5 p-4"><Sparkles className="size-4 text-void/70" aria-hidden /><p className="mt-3 font-medium">{targetedPageCopy.contactCards[1].title}</p><p className="mt-1 text-void/65">{targetedPageCopy.contactCards[1].body}</p></div><div className="rounded-2xl border border-void/15 bg-void/5 p-4"><Check className="size-4 text-void/70" aria-hidden /><p className="mt-3 font-medium">{targetedPageCopy.contactCards[2].title}</p><p className="mt-1 text-void/65">{targetedPageCopy.contactCards[2].body}</p></div></div><div className="mt-10 flex flex-wrap items-center gap-3"><a href={mailto} className="group inline-flex items-center gap-2 rounded-full bg-void px-6 py-3.5 font-medium text-ink transition-transform hover:-translate-y-0.5">{targetedPageCopy.contactAction}<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></a><CopyEmail email="kontakt@domenicmoran.de" {...targetedPageCopy.copyEmail} className="group inline-flex items-center gap-2 rounded-full border border-void bg-void px-4 py-2 text-sm text-acid transition-colors hover:bg-void/85 hover:text-acid" /><Link href="/" className="rounded-full border border-void/35 px-6 py-3.5 font-medium transition-colors hover:bg-void/10">{targetedPageCopy.portfolioAction}</Link></div></div>
        </Reveal>
      </section>
    </main>
  );
}




