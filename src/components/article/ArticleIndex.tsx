import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentProvider } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import type { Article, ArticleChrome } from "@/content/articles";
import { SiteShell } from "@/components/SiteShell";
import { INHALT_ID, SkipLink } from "@/components/ui/SkipLink";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

function datum(iso: string, lang: "de" | "en") {
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function ArticleIndex({
  content,
  chrome,
  articles,
}: {
  content: Content;
  chrome: ArticleChrome;
  articles: readonly Article[];
}) {
  const lang = content.lang;
  // Sprungmarken zeigen von hier aus auf die Startseite der Sprache.
  const heim = lang === "de" ? "/" : "/en";
  const otherHref = lang === "de" ? "/en/articles" : "/artikel";

  /*
    Die Übersicht ist eine Sammlung, kein Werk und keine Person.

    Artikel tragen `TechArticle`, die Startseite `Person` — nur diese Seite
    trug gar nichts, obwohl sie die einzige ist, die alle fünf Artikel
    zusammenfasst. `Blog` mit `blogPost` ist die Form, die eine Suchmaschine
    dafür kennt: Sie verbindet die Einzelseiten zu einer Reihe, statt sie als
    fünf unverbundene Seiten zu lesen.

    Nur Kopfdaten je Artikel, keine Zusammenfassung des Textes: Was auf der
    Einzelseite steht, gehört dorthin. Zweimal dieselbe Beschreibung wäre für
    eine Suchmaschine ein Duplikat.
  */
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: chrome.title,
    description: chrome.lede,
    url: `${content.site.url}${chrome.base}`,
    inLanguage: lang,
    author: { "@type": "Person", name: content.site.name, url: content.site.url },
    blogPost: articles.map((a) => ({
      "@type": "TechArticle",
      headline: a.title,
      description: a.dek,
      datePublished: a.date,
      url: `${content.site.url}${chrome.base}/${a.slug}`,
    })),
  };
  const json = JSON.stringify(schema).replace(/</g, "\u003c");

  return (
    <ContentProvider content={content}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <SkipLink text={content.skipToContent} />
      <SiteShell otherHref={otherHref} hashBase={heim} />

      <main id={INHALT_ID} tabIndex={-1} className="flex-1 px-6 pt-32 pb-24 sm:pt-40">
        <div className="mx-auto w-full max-w-5xl">
          {/* Die Uebersicht ist eine eigene Seite, ihre Ueberschrift ist
              deshalb die h1 und nicht wie in einer Sektion eine h2. */}
          <SectionHeading
            as="h1"
            css
            eyebrow={chrome.eyebrow}
            title={chrome.title}
            lede={chrome.lede}
          />

          <ul className="mt-16 flex flex-col gap-4">
            {articles.map((article, i) => {
              // Die ersten beiden Karten stehen auf einem Telefon über der
              // Falz. Als JS-Animation wären sie bis zur Hydration
              // unsichtbar; gemessen war die erste damit das LCP-Element und
              // erschien nach 3,4 s. Weiter unten bleibt die Bewegung an den
              // Sichtbarkeitsbeobachter gebunden, damit sie nicht schon
              // abgelaufen ist, bevor jemand hinsieht.
              const ueberDerFalz = i < 2;
              const Karte = ({ children }: { children: React.ReactNode }) =>
                ueberDerFalz ? (
                  <li
                    style={{ animationDelay: `${0.45 + i * 0.08}s` }}
                    className="animate-fade-rise"
                  >
                    {children}
                  </li>
                ) : (
                  <Reveal as="li" delay={i * 0.06}>
                    {children}
                  </Reveal>
                );

              return (
              <Karte key={article.slug}>
                <Link
                  href={`${chrome.base}/${article.slug}`}
                  className="group lit block rounded-2xl border border-line bg-surface/40 p-7 transition-colors hover:border-acid/40 sm:p-9"
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-faint">
                    <time dateTime={article.date}>{datum(article.date, lang)}</time>
                    <span aria-hidden>·</span>
                    <span>{chrome.readingTime(article.minutes)}</span>
                  </div>

                  <h2 className="mt-4 flex items-start gap-3 text-xl leading-snug font-semibold tracking-tight text-ink text-balance sm:text-2xl">
                    {article.title}
                    <ArrowUpRight
                      className="mt-1 size-4 shrink-0 text-ink-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-acid"
                      aria-hidden
                    />
                  </h2>

                  <p className="mt-3 max-w-[62ch] leading-relaxed text-ink-dim text-pretty">
                    {article.dek}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-md border border-line bg-base/60 px-2.5 py-1 font-mono text-[10px] tracking-wide text-ink-faint"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </Link>
              </Karte>
              );
            })}
          </ul>
        </div>
      </main>

      <Footer otherHref={otherHref} hashBase={heim} />
    </ContentProvider>
  );
}
