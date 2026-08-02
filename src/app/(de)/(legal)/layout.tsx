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
      {/* Gemessen 11 px hoch. Die Trefferflaeche waechst auf 27 px, die
          optische Position bleibt. */}
      <Link
        href="/"
        className="text-eyebrow -my-2 w-fit py-2 transition-colors hover:text-ink-dim"
      >
        ← {site.name}
      </Link>


      <div className="prose-legal mt-10 flex-1">{children}</div>

      {/* Die jeweils andere Rechtsseite ist von hier aus erreichbar.

          § 5 DDG verlangt das Impressum von jeder Seite des Angebots aus
          unmittelbar erreichbar. Gemessen an elf ausgelieferten Adressen
          fehlte der Verweis ausgerechnet auf diesen beiden: Wer auf der
          Datenschutzerklärung stand, kam nur über den Umweg über die
          Startseite zum Impressum. */}
      <p className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6 font-mono text-[11px] text-ink-faint">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        {/* Unterstrichen: Die Verweise stehen in derselben Zeile wie die
            Copyright-Angabe und trugen gemessen deren Farbe. In einem
            Textblock muss ein Verweis mehr als Farbe zur Unterscheidung
            tragen — hier trug er nicht einmal die. */}
        <Link
          href="/impressum"
          className="-my-2 py-2 underline underline-offset-4 transition-colors hover:text-ink-dim"
        >
          {de.footer.impressum}
        </Link>
        <Link
          href="/datenschutz"
          className="-my-2 py-2 underline underline-offset-4 transition-colors hover:text-ink-dim"
        >
          {de.footer.datenschutz}
        </Link>
      </p>
    </div>
  );
}
