import { Fragment } from "react";
import { cn } from "@/lib/utils";

type Word = { readonly text: string; readonly accent?: boolean };

type Props = {
  words: readonly Word[];
};

/**
 * Ueberschrift mit CSS-Wortaufstieg, ohne JavaScript.
 *
 * Jedes Wort startet unter seiner Maske und steigt gestaffelt auf. Das ist
 * dieselbe Bewegung wie vor dem Redesign, also der Eindruck, den Besucher als
 * getippte oder aufsteigende Ueberschrift wahrnehmen. Als CSS-Animation laeuft
 * sie ab dem ersten Paint und haelt den Largest Contentful Paint nicht bis
 * zur Hydration fest. `both` behaelt den Endzustand, damit die
 * Reduced-Motion-Regel (Dauer 0,01 ms) die Woerter sichtbar stehen laesst.
 */
export function HeroHeadline({ words }: Props) {
  const line1 = words.slice(0, 2);
  const line2 = words.slice(2);

  const renderLine = (line: readonly Word[], offset: number) =>
    line.map((word, i) => (
      <Fragment key={i}>
        {/* Das Polster ist die Maske, nicht Zierde.

            Jedes Wort sitzt in einem inline-block mit overflow:hidden,
            aus dem es beim Auftritt hervorkommt. Die untere Kante dieses
            Kastens schneidet damit auch die Unterlaengen ab. 0,2 em Polster
            und ein negativer Aussenabstand halten die Zeile an ihrem Ort. */}
        <span className="-mb-[0.14em] inline-block max-w-full overflow-hidden pb-[0.2em] align-bottom break-words hyphens-auto">
          <span
            className={cn(
              "animate-word-rise inline-block",
              word.accent && "text-acid",
            )}
            style={{ animationDelay: `${0.05 + (offset + i) * 0.025}s` }}
          >
            {word.text}
          </span>
        </span>
        {i < line.length - 1 ? " " : null}
      </Fragment>
    ));

  return (
    <h1
      id="top-titel"
      className="hero-display text-ink max-w-[18ch] tracking-[-0.03em] text-balance uppercase"
    >
      <span className="block leading-[0.92]">{renderLine(line1, 0)}</span>{" "}
      <span className="mt-1 block leading-[0.92]">
        {renderLine(line2, line1.length)}
      </span>
    </h1>
  );
}
