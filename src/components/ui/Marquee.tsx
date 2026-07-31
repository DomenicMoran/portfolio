import { cn } from "@/lib/utils";

/**
 * Infinite horizontal ticker. The list is rendered twice and translated by
 * exactly -50%, so the seam lands on an identical frame.
 *
 * Pure CSS — no rAF loop, no JS on the main thread while it runs.
 */
export function Marquee({
  items,
  duration = 45,
  className,
}: {
  items: readonly string[];
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
      aria-hidden
    >
      <div
        className="flex shrink-0 animate-marquee items-center gap-10 pr-10"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-10 font-mono text-xs tracking-[0.2em] text-ink-faint uppercase"
          >
            {item}
            <span className="size-1 rounded-full bg-line" />
          </span>
        ))}
      </div>
    </div>
  );
}
