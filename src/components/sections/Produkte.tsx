"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { DisclosureButton } from "@/components/ui/DisclosureButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useDisclosureFlap } from "@/hooks/useDisclosureFlap";
import type { Content } from "@/content/types";
import { cn } from "@/lib/utils";

const PROTOTYPEN_ID = "produkte-prototypen";

/**
 * Der Produkt-Einstieg: die fünf fertigen Systeme zuerst, Prototypen kompakt.
 *
 * Steht nach Über-mich und Publikation, vor den Fallstudien. Der frühere
 * Schwerpunkt auf MFC als einzigem Kaufknopf widersprach der Reihenfolge in
 * `case-study-order.ts`: MenuCloud, Salati, NOURI, LexiPulse und Dartile sind
 * die ausgelieferten Produkte, MFC und der Rest stehen als Prototypen.
 */
export function Produkte({ produkte }: { produkte: Content["produkte"] }) {
  const { offen, umschalten } = useDisclosureFlap();

  return (
    <section
      id="produkte"
      aria-labelledby="produkte-titel"
      className="relative scroll-mt-24 px-6 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="produkte-titel"
          eyebrow={produkte.eyebrow}
          title={produkte.title}
          lede={produkte.lede}
        />

        <Reveal className="mt-14">
          <h3 className="text-eyebrow">{produkte.fertigTitel}</h3>
          <ul className="mt-6 flex flex-col gap-4">
            {produkte.fertig.map((produkt) => (
              <li key={produkt.name}>
                <a
                  href={produkt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lit group flex flex-col gap-3 rounded-2xl border border-line bg-surface/40 p-7 transition-colors hover:border-acid/40 sm:flex-row sm:items-center sm:justify-between sm:p-8"
                >
                  <div className="min-w-0">
                    <h4 className="text-title text-ink">{produkt.name}</h4>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-dim text-pretty sm:text-base">
                      {produkt.beschreibung}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 font-mono text-xs text-ink-dim transition-colors group-hover:text-acid">
                    {produkte.liveCta}
                    <ArrowUpRight
                      className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-20 border-t border-line pt-12">
          <h3 className="text-eyebrow">{produkte.prototypTitel}</h3>
          <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-ink-dim text-pretty">
            {produkte.disclosure.teaser}
          </p>
          <DisclosureButton
            offen={offen}
            expandLabel={produkte.disclosure.expand}
            hideLabel={produkte.disclosure.hide}
            ariaControls={PROTOTYPEN_ID}
            onToggle={umschalten}
            className="mt-4"
          />
          <div
            id={PROTOTYPEN_ID}
            className={cn("mt-8", !offen && "hidden")}
          >
            <p className="max-w-[68ch] text-sm leading-relaxed text-ink-dim text-pretty">
              {produkte.prototypLede}
            </p>

            <div className="mt-8 rounded-2xl border border-line bg-surface/40 p-7 sm:p-9">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-mono text-sm text-ink">
                      {produkte.mfc.name}
                    </h4>
                    <span className="rounded border border-line px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink-dim">
                      {produkte.prototypBadge}
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-dim text-pretty">
                    {produkte.mfc.beschreibung}
                  </p>
                  <p className="mt-4 font-mono text-sm text-ink-faint">
                    {produkte.mfc.preis}
                  </p>
                </div>
                <a
                  href={produkte.mfc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  {produkte.mfc.kaufen}
                  <ArrowUpRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            </div>

            <h4 className="text-eyebrow mt-12">{produkte.proAppsTitel}</h4>
            <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-ink-dim text-pretty">
              {produkte.proAppsLede}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {produkte.proApps.map((app) => (
                <li key={app.name}>
                  <a
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lit group flex h-full flex-col rounded-xl border border-line bg-surface/40 p-5 transition-colors hover:border-acid/40"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-ink">
                        {app.name}
                      </span>
                      <span className="rounded border border-line px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-ink-dim">
                        {produkte.prototypBadge}
                      </span>
                    </span>
                    <span className="mt-2.5 block text-sm leading-relaxed text-ink-dim text-pretty">
                      {app.beschreibung}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <a
            href={produkte.uebersicht.href}
            className="group inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
          >
            {produkte.uebersicht.label}
            <ArrowDown
              className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
              aria-hidden
            />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
