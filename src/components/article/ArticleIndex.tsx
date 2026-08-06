import Link from "next/link";
import { ArrowUpRight, Rss } from "lucide-react";
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
    author: {
      "@type": "Person",
      name: content.site.name,
      url: content.site.url,
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json }}
      />
      <SkipLink text={content.skipToContent} />
      <SiteShell otherHref={otherHref} hashBase={heim} />

      <main
        id={INHALT_ID}
        tabIndex={-1}
        className="flex-1 px-6 pt-32 pb-24 sm:pt-40"
      >
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

          {/* Die Liste ist der Zweck dieser Seite und deshalb eine benannte
              Navigation — dieselbe Auszeichnung wie die Liste am Fuß jedes
              Artikels. Gemessen am Barrierefreiheitsbaum der ausgelieferten
              Übersicht: zwei Navigationen (Kopfleiste, Fußzeile) und für die
              fünf Artikel keine. Wer die Landmarkenliste benutzt, bekam eine
              Seite, deren einziger Inhalt nicht auftaucht.

              `aria-label` und nicht `aria-labelledby`: Die Überschrift läuft
              als Masken-Animation durch `RevealWords`, und der Name folgte
              dann deren Wortstücken. */}
          <nav aria-label={chrome.allArticles}>
            <ul className="mt-16 flex flex-col gap-4">
              {articles.map((article, i) => {
                /* Das System, aus dem der Artikel stammt — abgeleitet aus der
                 Fallstudie, die ihn führt, und nicht am Artikel notiert.

                 Warum es in der Übersicht steht und nicht nur im Artikel:
                 Die Liste ist die Stelle, an der jemand entscheidet, ob er
                 überhaupt einen der fünf öffnet. Ohne die Angabe liest sie
                 sich wie fünf Blogeinträge; mit ihr sieht man in derselben
                 Zeile, dass vier aus einer App in zwei Stores kommen und
                 einer aus einer SaaS mit Fiskalisierung. */
                const system = content.caseStudies.find((studie) =>
                  studie.articles?.includes(article.slug),
                );

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
                    {/* Der Name des Verweises ist der Titel, nicht die ganze
                        Karte.

                        Die Karte ist als Ganzes anklickbar, und das soll sie
                        bleiben — aber damit wurde alles darin zum Namen des
                        Verweises. Gemessen im Barrierefreiheitsbaum der
                        ausgelieferten Seite: 44 bis 47 Wörter je Karte,
                        beginnend mit „31. Juli 2026 5 Min. Lesezeit Salati“.
                        In der Verweisliste eines Vorleseprogramms fingen alle
                        fünf Einträge gleich an, und das Unterscheidende kam
                        zuletzt.

                        `aria-labelledby` auf die Überschrift lässt die Fläche,
                        wie sie ist, und benennt den Verweis mit dem, was ein
                        Sehender als Titel liest. Datum, Lesezeit und Vorspann
                        bleiben im Lesemodus vollständig erreichbar. */}
                    <Link
                      href={`${chrome.base}/${article.slug}`}
                      aria-labelledby={`artikel-${article.slug}`}
                      className="group lit block rounded-2xl border border-line bg-surface/40 p-7 transition-colors hover:border-acid/40 sm:p-9 lg:grid lg:grid-cols-[9.5rem_1fr] lg:gap-x-10"
                    >
                      {/* Kopfdaten links, Text rechts — aber erst ab `lg`.

                          Vorher lief alles über die volle Kartenbreite: Die
                          Karte ist 1.024 px breit, der Vorspann auf 62 Zeichen
                          begrenzt und damit 658 px, und rechts standen auf
                          jeder der fünf Karten rund 300 px leer. Eine Fläche,
                          die auf jedem Desktop zu 30 Prozent ungenutzt ist,
                          sieht nicht ruhig aus, sondern unfertig.

                          Als Spalte gewinnt die Angabe zusätzlich einen
                          Zweck: Untereinander lassen sich fünf Daten und fünf
                          Systeme vergleichen, in einer Zeile hinter dem
                          Mittelpunkt liest man sie einzeln.

                          Darunter bleibt die Zeile, weil ein Telefon keine
                          zweite Spalte hat — und dort gehört jeder Trennpunkt
                          mit dem, was er einleitet, in dieselbe Einheit.
                          Standen die drei Angaben als fünf gleichrangige
                          Kästchen nebeneinander, brach die Zeile bei 390 px
                          hinter dem zweiten Punkt um: „31. Juli 2026 · 5 Min.
                          Lesezeit ·" und darunter allein „Salati“. Ein
                          Mittelpunkt am Zeilenende trennt nichts. */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-faint lg:flex-col lg:items-start lg:gap-y-2 lg:pt-1">
                        <time dateTime={article.date}>
                          {datum(article.date, lang)}
                        </time>
                        <span className="flex items-center gap-4 lg:gap-0">
                          <span aria-hidden className="lg:hidden">
                            ·
                          </span>
                          {chrome.readingTime(article.minutes)}
                        </span>
                        {system ? (
                          <span className="flex items-center gap-4 lg:gap-0">
                            <span aria-hidden className="lg:hidden">
                              ·
                            </span>
                            {/* Kein eigener Verweis: Die ganze Karte führt in den
                            Artikel, und ein Verweis in einem Verweis ist im
                            Barrierefreiheitsbaum zweimal dasselbe Ziel mit
                            zwei Namen. Der Weg ins System steht im Artikel. */}
                            <span className="text-ink-dim">{system.name}</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <h2
                          id={`artikel-${article.slug}`}
                          className="mt-4 flex items-start gap-3 text-xl leading-snug font-semibold tracking-tight text-ink text-balance sm:text-2xl lg:mt-0"
                        >
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
                      </div>
                    </Link>
                  </Karte>
                );
              })}
            </ul>
          </nav>

          {/* Der Feed, sichtbar.

              Es gibt ihn seit Langem, der Seitenkopf nennt ihn als
              `link rel="alternate"`, und beide Sprachfassungen haben einen
              eigenen. Sichtbar stand er nirgends: Wer den Texten folgen
              wollte, musste in den Quelltext sehen. Eine Zeile unter der
              Liste reicht — dort, wo jemand am Ende der fünf Artikel
              angekommen ist und wissen will, ob noch etwas kommt. */}
          <p className="mt-10 font-mono text-[11px] text-ink-faint">
            <a
              href={`${chrome.base}/feed.xml`}
              className="-my-2 inline-flex items-center gap-2 py-2 underline underline-offset-4 transition-colors hover:text-ink-dim"
            >
              <Rss className="size-3.5" aria-hidden />
              {chrome.feed}
            </a>
          </p>
        </div>
      </main>

      <Footer otherHref={otherHref} hashBase={heim} />
    </ContentProvider>
  );
}
