import Link from "next/link";
import { site } from "@/content/site";

/**
 * Shared chrome for the legal pages. Deliberately plain: these pages exist to
 * be read and to satisfy § 5 DDG, not to impress anyone.
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

      {/*
        Ein Satz für den, der aus der englischen Fassung hierherkommt.

        Die Fußzeile auf /en verlinkt diese Seiten als "Legal notice" und
        "Privacy" — richtig so, § 5 DDG verlangt, dass sie von jeder Seite aus
        unmittelbar erreichbar sind. Wer dann aber auf einer deutschen Seite
        landet, sieht ohne Erklärung eine Lücke statt einer Entscheidung.

        Übersetzt werden sie bewusst nicht: Sie erfüllen deutsches Recht und
        richten sich an deutsche Stellen. Eine zweite Fassung hätte unklaren
        Stand, und bei genau diesen beiden Texten ist das kein Detail.
      */}
      <p lang="en" className="mt-8 text-sm text-ink-faint">
        These two pages are German on purpose: they exist to satisfy German law
        and are addressed to German authorities, so a translation would have
        unclear standing.{" "}
        <Link href="/en" className="text-acid underline underline-offset-4">
          Back to the English version
        </Link>
        .
      </p>

      <div className="prose-legal mt-10 flex-1">{children}</div>

      <p className="mt-16 border-t border-line pt-6 font-mono text-[11px] text-ink-faint">
        © {new Date().getFullYear()} {site.name}
      </p>
    </div>
  );
}
