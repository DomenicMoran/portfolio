import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Fasst eine Produktaufnahme in einen Browser- oder Telefonrahmen.
 *
 * Der Rahmen leistet etwas: Eine nackte Aufnahme einer Website, auf eine andere
 * Website geklebt, wirkt wie ein verirrtes Bild. Dieselbe Aufnahme in einer
 * Adressleiste liest sich sofort als „das läuft“. Der Rahmen ist reines CSS,
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
  /**
   * Wie breit der Rahmen im Layout wirklich wird.
   *
   * Der Wert entscheidet, welche Auflösung der Browser lädt, und er stand
   * hier fest verdrahtet auf `(max-width: 1024px) 100vw, 700px`, für jeden
   * Rahmen derselbe, obwohl die Rahmen verschieden breit sind. Gemessen an
   * der ausgelieferten Startseite bei 1.280, 1.440 und 1.920 px:
   *
   *     nouri-desktop      Kasten 1.150 px, geladen 700 px
   *     menucloud-desktop  Kasten   886 px, geladen 700 px
   *
   * Beide wurden also hochgerechnet dargestellt, um 64 % und um 27 %, auf
   * jedem Bildschirm ab 1.280 px. Es sind die beiden größten Bilder der
   * Seite, und sie sind der Beleg, für den die Fallstudien geschrieben sind.
   * Die Quelldateien liegen mit 1.440 px vor; es fehlte nur die Angabe.
   *
   * Wer einen neuen Rahmen einbaut, misst seine Kastenbreite und trägt sie
   * hier ein. `check:images` hält beides gegeneinander.
   */
  sizes?: string;
  className?: string;
};

/** Vorgaben je Rahmenart, gemessen an der ausgelieferten Seite. */
const SIZES = {
  /* Der Telefonrahmen ist bei 240 px gedeckelt (`max-w-[15rem]`). */
  phone: "(max-width: 640px) 60vw, 240px",
  /* Der Bildschirmrahmen steht in der Bilderstrecke und wächst bis 542 px. */
  screen: "(max-width: 767px) 80vw, 560px",
  /* Der Browserrahmen füllt die Spalte: bis 1.150 px, wenn er allein steht. */
  browser: "(max-width: 1279px) 95vw, 1160px",
} as const;

export function DeviceFrame({
  src,
  alt,
  width,
  height,
  label,
  variant = "browser",
  priority = false,
  sizes,
  className,
}: Props) {
  const groessen = sizes ?? SIZES[variant];

  if (variant === "phone") {
    /* Auch das Telefon bekommt seine Bildunterschrift.

       Bildschirm und Browserrahmen tragen eine, das Telefon nicht, und
       genau dort saß die Aufnahme, die es nötig hatte: Die Restaurantseite
       der MenuCloud-App zeigt „Trattoria San Marco", einen Demo-Eintrag aus
       den Seed-Daten. MenuCloud selbst hat ihn am 04.05.2026 aus dem
       Aktivitätsstrom genommen, weil er dort als echter Betrieb gelesen
       wurde. Im Bildschirmfoto einer Fallstudie liest er sich genauso, und
       ohne Unterschrift gab es keine Stelle, an der das dastehen konnte. */
    return (
      <figure
        className={cn(
          "relative mx-auto flex w-full max-w-[15rem] flex-col gap-2.5",
          className,
        )}
      >
        <div className="border-line bg-raised relative rounded-[2rem] border p-2 shadow-2xl shadow-black/50">
          <div className="bg-void relative overflow-hidden rounded-[1.5rem]">
            {/* Die Aussparung am oberen Rand */}
            <span
              aria-hidden
              className="bg-void absolute top-1.5 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-full"
            />
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              priority={priority}
              sizes={groessen}
              className="h-auto w-full"
            />
          </div>
        </div>
        {label ? (
          <figcaption className="text-ink-faint text-center font-mono text-[10px] tracking-[0.14em] uppercase">
            {label}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  // Ein Bildschirm ohne Browser-Chrome: Fernseher und Kioskgeräte haben keine
  // Adressleiste, und eine dazuzuerfinden wäre schlicht falsch.
  if (variant === "screen") {
    return (
      <figure className={cn("flex flex-col gap-2.5", className)}>
        <div className="border-line bg-void overflow-hidden rounded-lg border shadow-2xl shadow-black/50">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes={groessen}
            className="h-auto w-full"
          />
        </div>
        {label ? (
          <figcaption className="text-ink-faint text-center font-mono text-[10px] tracking-[0.14em] uppercase">
            {label}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure
      className={cn(
        "border-line bg-raised overflow-hidden rounded-xl border shadow-2xl shadow-black/50",
        className,
      )}
    >
      {/* Der Fensterrahmen */}
      <div className="border-line flex items-center gap-2 border-b px-3 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="bg-line size-2.5 rounded-full" />
          <span className="bg-line size-2.5 rounded-full" />
          <span className="bg-line size-2.5 rounded-full" />
        </span>
        {label ? (
          <span className="bg-base text-ink-faint mx-auto truncate rounded-md px-3 py-0.5 font-mono text-[10px]">
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
        sizes={groessen}
        className="h-auto w-full"
      />
    </figure>
  );
}
