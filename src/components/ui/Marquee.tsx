import { cn } from "@/lib/utils";

/**
 * Endlose Laufschrift. Die Liste steht zweimal im Baum und wird um genau
 * -50 % verschoben, damit die Naht auf ein identisches Bild fällt.
 *
 * Reines CSS: keine rAF-Schleife, kein JavaScript im Hauptthread, solange sie
 * läuft.
 *
 * Nicht im Ausdruck. Auf Papier steht nichts still und nichts scrollt: Von
 * 6.221 px Inhalt blieben gemessen 794 px übrig, der Rest fehlte ohne Hinweis.
 * Ein Verlust ist das nicht, die Leiste ist `aria-hidden`, und jeder Begriff
 * darauf steht an anderer Stelle noch einmal im Fließtext.
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
        "no-print relative flex overflow-hidden",
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
