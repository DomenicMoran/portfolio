"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { DisclosureButton } from "@/components/ui/DisclosureButton";
import { useContent } from "@/content/ContentProvider";
import type { CaseStudy } from "@/content/types";
import { useDisclosureFlap } from "@/hooks/useDisclosureFlap";
import { cn } from "@/lib/utils";

const WEITERE_LISTE_ID = "weitere-projekte-liste";

/**
 * Die restlichen Projekte, kompakt und eingeklappt.
 *
 * Eine Karte je Projekt statt einer vollen Tafel: Name, Anriss, Status und
 * der eine Verweis, der am ehesten zählt. Bewusst client-seitig ein- und
 * ausblendbar statt auf eine zweite Seite zu verweisen, weil es für Projekte
 * anders als für Artikel keine Übersichtsseite gibt, die eine zweite Adresse
 * rechtfertigen würde.
 */
function WeitereProjekte({ studies }: { studies: readonly CaseStudy[] }) {
  const { work } = useContent();
  const anker = studies.map((study) => `case-${study.id}`);
  const { offen, umschalten } = useDisclosureFlap(anker);

  return (
    <div className="border-line mt-24 border-t pt-12 sm:mt-36">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-eyebrow">{work.more.title}</h3>
        {/* Ohne JavaScript bleibt die Liste dauerhaft eingeklappt: `offen`
            hängt an `manuellOffen` (React-State, ohne Skript unerreichbar)
            und an `passenderAnker`, der über `useSyncExternalStore` erst
            nach der Hydration einen Wert bekommt, ohne Skript bleibt er "".
            Der Knopf schweigt also auf jeden Klick, derselbe Fall wie der
            Druckknopf in `PrintButton.tsx` und die Reiterleiste oben in
            dieser Datei: Wer ohne Skript liest, verliert nichts, was er
            vorher hatte, er sieht nur nicht mehr aus, als könne er es holen.
            Gefunden am 29.08.2026 an `check:a11y`: „Alle Projekte ansehen"
            stand sichtbar, ohne Wirkung. */}
        <noscript>
          <style>{`.weitere-schalter{display:none}`}</style>
        </noscript>
        <DisclosureButton
          offen={offen}
          expandLabel={work.more.show}
          hideLabel={work.more.hide}
          ariaControls={WEITERE_LISTE_ID}
          onToggle={umschalten}
          className="weitere-schalter"
        />
      </div>

      <ul
        id={WEITERE_LISTE_ID}
        className={cn(
          "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
          !offen && "hidden",
        )}
      >
        {studies.map((study, i) => {
          const link = study.links.find((l) => l.href);
          const inhalt = (
            <>
              <h3
                id={`weiter-${study.id}`}
                className="text-ink flex items-center justify-between gap-2 font-mono text-sm font-normal"
              >
                {study.name}
                {link ? (
                  <ArrowUpRight
                    className="text-ink-faint group-hover:text-acid size-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                ) : null}
              </h3>
              <p className="text-ink-dim mt-2.5 text-sm leading-relaxed text-pretty">
                {study.tagline}
              </p>
              {/* Die begründete Leerstelle gilt auch eingeklappt.
                  `keinScreenshot` stand bislang nur in der vollen Tafel:
                  Rutschte ein Projekt hinter den Umschalter, verschwand der
                  Satz von der ausgelieferten Seite, obwohl der Grund für das
                  fehlende Bild derselbe bleibt. */}
              {study.keinScreenshot ? (
                <p className="text-ink-faint mt-2.5 text-xs leading-relaxed text-pretty">
                  {study.keinScreenshot}
                </p>
              ) : null}
              <span className="text-ink-faint mt-auto flex flex-wrap items-center gap-2 pt-4 font-mono text-[10px]">
                {study.prototyp ? (
                  <span className="border-line text-ink-dim rounded border px-1.5 py-0.5 text-[9px] tracking-wide uppercase">
                    {work.prototypBadge}
                  </span>
                ) : null}
                {study.statusLabel}
              </span>
            </>
          );

          return (
            <Reveal as="li" key={study.id} delay={i * 0.04}>
              {/* `article`, nicht `li`: `check:schema` und `check:landmarks`
                  suchen jede Fallstudie über `article[id^='case-']` mit genau
                  einer Überschrift der Ebene 3, dasselbe Muster wie an der
                  vollen Tafel. Der Anker bleibt damit derselbe, ob eine
                  Fallstudie ausführlich steht oder hier kompakt. */}
              <article id={`case-${study.id}`} className="h-full scroll-mt-24">
                {link ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-labelledby={`weiter-${study.id}`}
                    className="lit group border-line bg-surface/40 hover:border-acid/40 flex h-full flex-col rounded-xl border p-5 transition-colors"
                  >
                    {inhalt}
                  </a>
                ) : (
                  <div className="border-line bg-surface/40 flex h-full flex-col rounded-xl border p-5">
                    {inhalt}
                  </div>
                )}
              </article>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}

export { WeitereProjekte };
