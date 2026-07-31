import type { ReactNode } from "react";
import { Reveal, RevealWords } from "./Reveal";
import { cn } from "@/lib/utils";

/**
 * Consistent section opener: mono eyebrow, masked headline, optional lede.
 * Every section uses this so vertical rhythm stays identical throughout.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <Reveal className="flex items-center gap-3" y={12}>
        <span className="size-1.5 rounded-full bg-acid" />
        <span className="text-eyebrow">{eyebrow}</span>
      </Reveal>

      <h2 className="text-headline max-w-4xl text-balance text-ink">
        <RevealWords text={title} />
      </h2>

      {lede ? (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "max-w-2xl text-lg leading-relaxed text-ink-dim text-pretty",
              align === "center" && "mx-auto",
            )}
          >
            {lede}
          </p>
        </Reveal>
      ) : null}

      {children}
    </div>
  );
}
