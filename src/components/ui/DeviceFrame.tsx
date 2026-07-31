import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Wraps a product screenshot in a browser or phone chrome.
 *
 * The frame does real work: a raw screenshot of a website pasted onto another
 * website reads as a stray image, while the same shot inside a browser bar
 * reads immediately as "this is a running product". The frame is pure CSS —
 * no image assets beyond the screenshot itself.
 */

type Props = {
  src: string;
  alt: string;
  /** Intrinsic size of the screenshot, for correct aspect ratio and no CLS. */
  width: number;
  height: number;
  /** Shown in the fake address bar. */
  label?: string;
  variant?: "browser" | "phone";
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
