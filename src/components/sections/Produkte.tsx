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
                  className="lit group border-line bg-surface/40 hover:border-acid/40 flex flex-col gap-3 rounded-2xl border p-7 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-8"
                >
                  <div className="min-w-0">
                    <h4 className="text-title text-ink">{produkt.name}</h4>
                    {/* `sm:text-[1rem]` und nicht `sm:text-base`: In diesem
                        Farbsystem setzt `text-base` auch die Farbe
                        `--color-base`, den Hintergrund. Gemessen an 1440 px
                        stand die Beschreibung in rgb(11, 11, 14) auf
                        rgb(12, 12, 15), also 1:1. */}
                    <p className="text-ink-dim mt-2 max-w-2xl text-sm leading-relaxed text-pretty sm:text-[1rem]">
                      {produkt.beschreibung}
                    </p>
                  </div>
                  <span className="text-ink-dim group-hover:text-acid inline-flex shrink-0 items-center gap-2 font-mono text-xs transition-colors">
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

        <Reveal className="border-line mt-20 border-t pt-12">
          <h3 className="text-eyebrow">{produkte.prototypTitel}</h3>
          <p className="text-ink-dim mt-3 max-w-[68ch] text-sm leading-relaxed text-pretty">
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
          <div id={PROTOTYPEN_ID} className={cn("mt-8", !offen && "hidden")}>
            <p className="text-ink-dim max-w-[68ch] text-sm leading-relaxed text-pretty">
              {produkte.prototypLede}
            </p>

            <div className="border-line bg-surface/40 mt-8 rounded-2xl border p-7 sm:p-9">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-ink font-mono text-sm">
                      {produkte.mfc.name}
                    </h4>
                    <span className="border-line text-ink-dim rounded border px-1.5 py-0.5 text-[9px] tracking-wide uppercase">
                      {produkte.prototypBadge}
                    </span>
                  </div>
                  <p className="text-ink-dim mt-3 max-w-2xl text-sm leading-relaxed text-pretty">
                    {produkte.mfc.beschreibung}
                  </p>
                  <p className="text-ink-faint mt-4 font-mono text-sm">
                    {produkte.mfc.preis}
                  </p>
                </div>
                <a
                  href={produkte.mfc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border-line text-ink-dim hover:border-ink-faint hover:text-ink inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors"
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
            <p className="text-ink-dim mt-3 max-w-[68ch] text-sm leading-relaxed text-pretty">
              {produkte.proAppsLede}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {produkte.proApps.map((app) => (
                <li key={app.name}>
                  <a
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lit group border-line bg-surface/40 hover:border-acid/40 flex h-full flex-col rounded-xl border p-5 transition-colors"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-ink font-mono text-sm">
                        {app.name}
                      </span>
                      <span className="border-line text-ink-dim rounded border px-1.5 py-0.5 text-[9px] tracking-wide uppercase">
                        {produkte.prototypBadge}
                      </span>
                    </span>
                    <span className="text-ink-dim mt-2.5 block text-sm leading-relaxed text-pretty">
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
            className="group border-line text-ink-dim hover:border-ink-faint hover:text-ink inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors"
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
