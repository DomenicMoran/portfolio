import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Content } from "@/content/types";

/**
 * Der Produkt-Einstieg: eigene Systeme mit dem Kaufpfad.
 *
 * Steht direkt hinter dem Kopf, vor den Fallstudien. Der Kaufweg ist MFC —
 * das einzige Produkt mit Kaufknopf — plus die vier Pro-Apps, deren Landings
 * live sind. Der Verweis unten führt zur vollständigen Übersicht, den
 * Fallstudien, damit hier keine zweite Beschreibung derselben Produkte
 * entsteht. Die Person und der Bewerbungsweg stehen weiter unten.
 *
 * Bewusst eine Server Component: Der Inhalt steht im RSC-Baum und braucht
 * keinen eigenen JavaScript-Block. `check:bundle` misst die Startseite gegen
 * ein hartes Budget, und eine Client-Komponente hätte sie darüber gehoben.
 * Die Bewegung kommt weiterhin aus `Reveal`, das die anderen Sektionen ohnehin
 * laden.
 */
export function Produkte({ produkte }: { produkte: Content["produkte"] }) {
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

        {/* MFC: das Produkt mit Kaufknopf, breit und mit Preis. */}
        <Reveal className="mt-14">
          <div className="rounded-2xl border border-acid/30 bg-acid/10 p-7 sm:p-9">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <h3 className="text-title text-ink">{produkte.mfc.name}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-dim text-pretty">
                  {produkte.mfc.beschreibung}
                </p>
                <p className="mt-4 font-mono text-sm text-acid">
                  {produkte.mfc.preis}
                </p>
              </div>
              <a
                href={produkte.mfc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-acid px-6 py-3.5 font-medium text-void transition-colors hover:bg-ink"
              >
                {produkte.mfc.kaufen}
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            </div>
          </div>
        </Reveal>

        {/* Die vier Pro-Apps, je mit eigener Landing. */}
        <Reveal className="mt-14">
          <h3 className="text-eyebrow">{produkte.proAppsTitel}</h3>
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
                    <ArrowUpRight
                      className="size-3.5 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-acid"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-2.5 block text-sm leading-relaxed text-ink-dim text-pretty">
                    {app.beschreibung}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Der Weg in die vollständige Übersicht. */}
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
