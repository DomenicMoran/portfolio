import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Fasst eine Produktaufnahme in einen Browser- oder Telefonrahmen.
 *
 * Der Rahmen leistet etwas: Eine nackte Aufnahme einer Website, auf eine andere
 * Website geklebt, wirkt wie ein verirrtes Bild. Dieselbe Aufnahme in einer
 * Adressleiste liest sich sofort als „das läuft". Der Rahmen ist reines CSS,
 * außer der Aufnahme selbst kommt keine Bilddatei dazu.
 */

type Props = {
  src: string;
  alt: string;
  /** Eigengröße der Aufnahme: für das richtige Seitenverhältnis und gegen Layout-Sprünge. */
  width: number;
  height: number;
  /** Steht in der nachgebildeten Adressleiste (Browser) oder als Bildunterschrift (Bildschirm). */
  label?: string;
  variant?: "browser" | "phone" | "screen";
  priority?: boolean;
  className?: string;
};

export function DeviceFrame({
  src,
  alt,
  width,
  height,
  label,
  variant = "browser",
  priority = false,
  className,
}: Props) {
  if (variant === "phone") {
    return (
      <div
        className={cn(
          "relative mx-auto w-full max-w-[15rem] rounded-[2rem] border border-line bg-raised p-2 shadow-2xl shadow-black/50",
          className,
        )}
      >
        <div className="relative overflow-hidden rounded-[1.5rem] bg-void">
          {/* Notch */}
          <span
            aria-hidden
            className="absolute top-1.5 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-void"
          />
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes="(max-width: 640px) 60vw, 240px"
            className="h-auto w-full"
          />
        </div>
      </div>
    );
  }

  // Ein Bildschirm ohne Browser-Chrome: Fernseher und Kioskgeräte haben keine
  // Adressleiste, und eine dazuzuerfinden wäre schlicht falsch.
  if (variant === "screen") {
    return (
      <figure className={cn("flex flex-col gap-2.5", className)}>
        <div className="overflow-hidden rounded-lg border border-line bg-void shadow-2xl shadow-black/50">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 700px"
            className="h-auto w-full"
          />
        </div>
        {label ? (
          <figcaption className="text-center font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
            {label}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-raised shadow-2xl shadow-black/50",
        className,
      )}
    >
      {/* Chrome */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
        </span>
        {label ? (
          <span className="mx-auto truncate rounded-md bg-base px-3 py-0.5 font-mono text-[10px] text-ink-faint">
            {label}
          </span>
        ) : null}
      </div>

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 700px"
        className="h-auto w-full"
      />
    </figure>
  );
}
