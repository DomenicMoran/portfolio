import Link from "next/link";
import { navItems, site } from "@/content/site";

export const metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

/**
 * Eigene 404-Seite.
 *
 * Next.js liefert sonst eine englische Standardmeldung aus — auf einer
 * deutschsprachigen Seite ein sichtbarer Bruch. Und eine Sackgasse ist der
 * schlechteste Ort, um einen Besucher stehen zu lassen: Hier steht deshalb,
 * wohin es weitergeht.
 *
 * Bewusst ohne Animation und ohne Client-Code: Wer hier landet, hat sich
 * verlaufen und will weiter, nicht unterhalten werden.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-svh items-center overflow-hidden px-6 py-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_70%)]" />
        <div className="glow-orb top-1/4 left-1/2 size-[26rem] -translate-x-1/2 bg-violet/12" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <p className="text-eyebrow mb-6">Fehler 404</p>

        <h1 className="text-headline text-ink text-balance">
          Diese Seite gibt es nicht.
        </h1>

        <p className="mt-6 max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
          Entweder hat sich ein Tippfehler in die Adresse geschlichen, oder ich
          habe die Seite verschoben, ohne eine Weiterleitung zu hinterlassen.
          Falls Letzteres: Sag mir Bescheid, dann korrigiere ich es.
        </p>

        <nav aria-label="Weiter zu" className="mt-10 flex flex-col gap-3">
          <span className="text-eyebrow">Weiter zu</span>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/"
                className="inline-flex rounded-full bg-acid px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-ink"
              >
                Startseite
              </Link>
            </li>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={`/${item.href}`}
                  className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 border-t border-line pt-6 text-sm text-ink-faint">
          Etwas kaputt gefunden?{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-acid underline underline-offset-4"
          >
            {site.email}
          </a>
        </p>
      </div>
    </main>
  );
}
