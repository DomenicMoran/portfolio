import { Check } from "lucide-react";
import type { CaseStudy } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Die drei Tafeln hinter den Reitern einer Fallstudie.
 *
 * Sie standen als achtzig Zeilen JSX mitten in `CaseStudyPanel`, zwischen der
 * Reiterleiste und dem Bildstreifen. Der Rumpf dieser einen Funktion war damit
 * gut vierhundert Zeilen lang, und wer die Tastaturbedienung der Reiter suchte,
 * las erst durch drei Listen, die damit nichts zu tun haben.
 *
 * Hier stehen sie als das, was sie sind: drei Darstellungen ohne Zustand. Die
 * vierte Tafel ist das Architekturbild und hat längst eine eigene Datei.
 */

/** Die Akzentfarbe der Fallstudie, wie `CaseStudies` sie zusammenstellt. */
type Akzent = {
  text: string;
  bg: string;
  border: string;
  soft: string;
};

export function TafelHighlights({
  punkte,
  akzent,
}: {
  punkte: readonly string[];
  akzent: Akzent;
}) {
  return (
    <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
      {punkte.map((punkt) => (
        <li key={punkt} className="flex gap-3">
          <Check
            className={cn("mt-1 size-4 shrink-0", akzent.text)}
            aria-hidden
          />
          <span className="text-sm leading-relaxed text-ink-dim">{punkt}</span>
        </li>
      ))}
    </ul>
  );
}

export function TafelAutomation({
  daten,
  akzent,
}: {
  daten: NonNullable<CaseStudy["automation"]>;
  akzent: Akzent;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h5 className={cn("text-lg font-semibold tracking-tight", akzent.text)}>
          {daten.title}
        </h5>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim text-pretty">
          {daten.lede}
        </p>
      </div>
      <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {daten.groups.map((gruppe) => (
          <div key={gruppe.title}>
            <h6 className="text-eyebrow mb-3">{gruppe.title}</h6>
            <ul className="flex flex-col gap-2">
              {gruppe.items.map((punkt) => (
                <li key={punkt} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      akzent.bg,
                    )}
                  />
                  <span className="text-sm leading-relaxed text-ink-dim">
                    {punkt}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TafelStack({ gruppen }: { gruppen: CaseStudy["stack"] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {gruppen.map((gruppe) => (
        <div key={gruppe.group}>
          <h5 className="text-eyebrow mb-3">{gruppe.group}</h5>
          <ul className="flex flex-wrap gap-1.5">
            {gruppe.items.map((punkt) => (
              <li
                key={punkt}
                className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-dim"
              >
                {punkt}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
