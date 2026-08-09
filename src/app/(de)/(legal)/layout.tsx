import Link from "next/link";
import { site } from "@/content/site";
import { de } from "@/content/de";

/**
 * Gemeinsamer Rahmen der Rechtsseiten. Bewusst schlicht: Diese Seiten sind zum
 * Lesen da und um § 5 DDG zu genügen, nicht um jemanden zu beeindrucken.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-6 py-16">
      {/* Der Rückweg ist eine Navigation, kein loser Verweis.

          Die beiden Rechtsseiten hatten im Barrierefreiheitsbaum genau eine
          Landmarke: den Hauptbereich. Wer die Landmarkenliste benutzt, fand
          weder den Weg zurück noch die Fußzeile, auf jeder anderen Seite
          dieser Webseite gibt es beide, und ausgerechnet hier landet jemand,
          der eine Anschrift oder eine Rechtsgrundlage sucht.

          Gemessen 11 px hoch. Die Trefferflaeche waechst auf 27 px, die
          optische Position bleibt. */}
      <nav aria-label={de.a11y.legalNav}>
        <Link
          href="/"
          /* Kein Vorabladen.

             Next holt zu jedem sichtbaren Verweis auch die Skripte der
             Zielseite. Gemessen am gebauten Stand lud /impressum dadurch
             989 kB Skript, davon 269 kB Animationsbibliothek, für eine
             Textseite, auf der sich nichts bewegt, geholt für einen Klick,
             den die wenigsten tun. Beim Zeigen mit der Maus lädt Next
             weiterhin vor, der Rückweg bleibt also gleich schnell. */
          prefetch={false}
          className="text-eyebrow -my-2 w-fit py-2 transition-colors hover:text-ink-dim"
        >
          ← {site.name}
        </Link>
      </nav>

      <div className="prose-legal mt-10 flex-1">{children}</div>
    </div>
  );
}
