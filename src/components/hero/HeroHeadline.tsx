import { cn } from "@/lib/utils";

type Word = { readonly text: string; readonly accent?: boolean };

type Props = {
  words: readonly Word[];
};

/** Stroke-Zeile per CSS; Fuellung per `HeroWowMount`. */
export function HeroHeadline({ words }: Props) {
  const line1 = words.slice(0, 2);
  const line2 = words.slice(2);

  return (
    <h1
      id="top-titel"
      className="hero-display text-ink max-w-[18ch] tracking-[-0.03em] text-balance uppercase"
    >
      <span className="block leading-[0.92]">
        {line1.map((word, i) => (
          <span key={i}>
            <span className={cn(word.accent && "text-acid")}>{word.text}</span>
            {i < line1.length - 1 ? " " : null}
          </span>
        ))}
      </span>
      <span className="hero-headline-stroke mt-1 block leading-[0.92]">
        {line2.map((word, i) => (
          <span key={i}>
            <span
              className={cn(
                word.accent && "text-acid hero-headline-stroke__accent",
              )}
            >
              {word.text}
            </span>
            {i < line2.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </h1>
  );
}
