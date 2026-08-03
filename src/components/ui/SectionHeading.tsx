import type { ReactNode } from "react";
import { Reveal, RevealWords } from "./Reveal";
import { cn } from "@/lib/utils";

/**
 * Consistent section opener: mono eyebrow, masked headline, optional lede.
 * Every section uses this so vertical rhythm stays identical throughout.
 *
 * `as` wählt die Überschriftenebene. Auf der Startseite sind alle Sektionen
 * gleichrangig unter der Hero-Überschrift, also h2. Auf einer eigenen Seite
 * ist dieselbe Überschrift die Hauptüberschrift: Die Artikelübersicht hatte
 * dadurch gar keine h1, gemessen über alle sechs Breiten in beiden Engines.
 */
export function SectionHeading({
  eyebrow,
  title,
  titleId,
  lede,
  align = "left",
  className,
  children,
  as: Überschrift = "h2",
  css = false,
}: {
  eyebrow: string;
  title: string;
  /**
   * Kennung der Ueberschrift, damit der Abschnitt sie als Namen fuehren kann.
   *
   * Ohne Namen ist ein `<section>` fuer einen Screenreader keine Landmarke,
   * sondern nichts: Gemessen im Baum der ausgelieferten Startseite gab es
   * genau drei Landmarken (Kopf, Inhalt, Fuss) und keine einzige fuer die
   * sieben Abschnitte, die in der Kopfleiste als Ziele stehen. Wer sieht,
   * springt ueber die Leiste; wer die Landmarkenliste benutzt, bekam die
   * ganze Startseite als einen Block.
   */
  titleId?: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
  as?: "h1" | "h2";
  /** Über der Falz: Bewegung als CSS statt als JS-Animation. */
  css?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {css ? (
        <div
          style={{ animationDelay: "0.02s" }}
          className="animate-fade-rise flex items-center gap-3"
        >
          <span className="size-1.5 rounded-full bg-acid" />
          <span className="text-eyebrow">{eyebrow}</span>
        </div>
      ) : (
        <Reveal className="flex items-center gap-3" y={12}>
          <span className="size-1.5 rounded-full bg-acid" />
          <span className="text-eyebrow">{eyebrow}</span>
        </Reveal>
      )}

      <Überschrift
        id={titleId}
        className="text-headline max-w-4xl text-balance text-ink"
      >
        <RevealWords text={title} css={css} />
      </Überschrift>

      {lede ? (
        css ? (
          <p
            style={{ animationDelay: "0.4s" }}
            className={cn(
              "animate-fade-rise max-w-2xl text-lg leading-relaxed text-ink-dim text-pretty",
              align === "center" && "mx-auto",
            )}
          >
            {lede}
          </p>
        ) : (
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
        )
      ) : null}

      {children}
    </div>
  );
}
