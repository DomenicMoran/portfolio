import Link from "next/link";
import type { Content } from "@/content/types";

/**
 * Eigene 404-Seite, in beiden Sprachfassungen dieselbe.
 *
 * Next.js liefert sonst eine englische Standardmeldung aus, auf einer
 * deutschsprachigen Seite ein sichtbarer Bruch. Und eine Sackgasse ist der
 * schlechteste Ort, um einen Besucher stehen zu lassen: Hier steht deshalb,
 * wohin es weitergeht.
 *
 * Bewusst ohne Animation und ohne Client-Code. Wer hier landet, hat sich
 * verlaufen und will weiter, nicht unterhalten werden.
 */
export function NotFoundPage({
  content,
  base = "",
  zweitsprache,
}: {
  content: Content;
  base?: string;
  /**
   * Ein kurzer Hinweis in der jeweils anderen Sprache.
   *
   * Nur die globale 404 setzt ihn. Sie beantwortet Adressen, die auf gar keine
   * Route passen, und weiß deshalb als einzige Seite nicht, welche Sprache
   * gemeint war: Gemessen bekam ein Besucher von `/en/irgendwas` die deutsche
   * Fassung samt `lang="de"`. Die Sprachfassungen selbst brauchen das nicht,
   * sie wissen es.
   */
  zweitsprache?: Content;
}) {
  const { notFound, nav, site } = content;

  return (
    <main className="relative flex min-h-svh items-center overflow-hidden px-6 py-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_70%)]" />
        <div className="glow-orb top-1/4 left-1/2 size-[26rem] -translate-x-1/2 bg-violet/12" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <p className="text-eyebrow mb-6">{notFound.eyebrow}</p>

        <h1 className="text-headline text-ink text-balance">{notFound.title}</h1>

        <p className="mt-6 max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
          {notFound.body}
        </p>

        <nav aria-label={notFound.onward} className="mt-10 flex flex-col gap-3">
          <span className="text-eyebrow">{notFound.onward}</span>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={base === "" ? "/" : base}
                className="inline-flex rounded-full border border-transparent bg-acid px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-ink"
              >
                {notFound.home}
              </Link>
            </li>
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={`${base}/${item.href}`}
                  className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {zweitsprache ? (
          <p lang={zweitsprache.lang} className="mt-8 text-sm text-ink-faint">
            {zweitsprache.notFound.title}{" "}
            <Link
              href={zweitsprache.lang === "en" ? "/en" : "/"}
              className="-my-1 py-1 text-acid underline underline-offset-4"
            >
              {zweitsprache.notFound.home}
            </Link>
          </p>
        ) : null}

        <p className="mt-10 border-t border-line pt-6 text-sm text-ink-faint">
          {notFound.report}{" "}
          <a
            href={`mailto:${site.email}`}
            className="-my-1 py-1 text-acid underline underline-offset-4"
          >
            {site.email}
          </a>
        </p>
      </div>
    </main>
  );
}
