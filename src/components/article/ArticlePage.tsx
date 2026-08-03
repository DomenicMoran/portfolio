import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ContentProvider } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import {
  andereSprache,
  type Article,
  type ArticleChrome,
} from "@/content/articles";
import { ConsoleGreeting } from "@/components/ConsoleGreeting";
import { SiteShell } from "@/components/SiteShell";
import { INHALT_ID, SkipLink } from "@/components/ui/SkipLink";
import { Footer } from "@/components/Footer";
import { Prose } from "@/components/article/Prose";
import { Reveal } from "@/components/ui/Reveal";

/** Aus "2026-07-27" wird "27. Juli 2026" bzw. "27 July 2026". */
function datum(iso: string, lang: "de" | "en") {
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function ArticlePage({
  content,
  chrome,
  article,
  weitere,
}: {
  content: Content;
  chrome: ArticleChrome;
  article: Article;
  /** Die anderen Artikel derselben Sprache, für den Ausgang am Fuß. */
  weitere: readonly Article[];
}) {
  const lang = content.lang;
  // Sprungmarken zeigen von hier aus auf die Startseite der Sprache.
  const heim = lang === "de" ? "/" : "/en";

  // Der Sprachwechsel soll denselben Artikel in der anderen Sprache öffnen,
  // nicht die Startseite. Gibt es kein Gegenstück, bleibt der Standard.
  const anderer = andereSprache(lang, article.slug);
  const otherHref = anderer
    ? lang === "de"
      ? `/en/articles/${anderer}`
      : `/artikel/${anderer}`
    : undefined;

  /**
   * Das System, aus dem der Artikel stammt.
   *
   * Abgeleitet und nicht am Artikel notiert: Die Zuordnung steht bereits in
   * der Fallstudie, weil die dort ihre Artikel auflistet. Eine zweite Stelle
   * wäre die Stelle, an der beide Listen auseinanderlaufen.
   *
   * Warum es den Rückweg überhaupt gibt: Ein geteilter Artikel ist für viele
   * Leser die erste Seite. Gezählt an der ausgelieferten Seite führte aus
   * jedem der fünf Artikel kein einziger Verweis in den Fallstudienbereich —
   * wer über eine Suchmaschine im Whisper-Text landete, las von Salati, ohne
   * zu erfahren, dass es die App in zwei Stores gibt.
   */
  const system = content.caseStudies.find((study) =>
    study.articles?.includes(article.slug),
  );

  // Ein Artikel ist ein Werk, kein Personenprofil. Schema.org unterscheidet
  // das, und Suchmaschinen wie Antwortmaschinen lesen es aus.
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.dek,
    datePublished: article.date,
    inLanguage: lang,
    keywords: article.tags.join(", "),
    author: {
      "@type": "Person",
      name: content.site.name,
      url: content.site.url,
    },
    publisher: { "@type": "Person", name: content.site.name },
    mainEntityOfPage: `${content.site.url}${chrome.base}/${article.slug}`,
    /* Wovon der Text handelt, als Angabe und nicht nur als Wort im Fließtext.
       Antwortmaschinen verbinden darüber den Artikel mit dem Produkt; ohne
       das steht hier ein Text über Whisper und daneben, unverbunden, eine App
       in zwei Stores. Nur gesetzt, wo die Zuordnung existiert. */
    ...(system
      ? { about: { "@type": "SoftwareApplication", name: system.name } }
      : {}),
  };
  /**
   * Der Weg zur Seite, maschinenlesbar.
   *
   * Der Artikel wusste bisher nichts über seinen Ort: kein Verweis auf die
   * Übersicht, keiner auf die Startseite. Suchmaschinen zeigen daraus die
   * Pfadzeile unter dem Treffer, und Antwortmaschinen erkennen, dass hier eine
   * Reihe von fünf Texten steht und kein einzelner Fund. Sichtbar gab es den
   * Weg längst — der Zurück-Verweis oben trägt ihn —, nur nicht als Angabe.
   */
  const brotkrumen = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: content.site.name,
        item: `${content.site.url}${heim}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: chrome.title,
        item: `${content.site.url}${chrome.base}`,
      },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  const json = JSON.stringify([schema, brotkrumen]).replace(/</g, "\\u003c");

  return (
    <ContentProvider content={content}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json }}
      />
      <ConsoleGreeting />

      <SkipLink text={content.skipToContent} />
      <SiteShell otherHref={otherHref} hashBase={heim} />

      <main
        id={INHALT_ID}
        tabIndex={-1}
        className="flex-1 px-6 pt-32 pb-24 sm:pt-40"
      >
        {/* 38,5 rem sind 616 px. Gemessen ergibt das im Fließtext 73 Zeichen
              pro Zeile; bei den vorherigen 768 px waren es 91. */}
        <article className="mx-auto w-full max-w-[38.5rem]">
          {/* Der Kopf läuft als CSS-Animation, nicht über Reveal: Er steht
              über der Falz, und als JS-Animation wäre die Überschrift bis
              zur Hydration unsichtbar und damit das späte LCP-Element. */}
          <div className="animate-fade-rise">
            <Link
              href={chrome.base}
              className="group -my-2 mb-8 inline-flex items-center gap-2 py-2 font-mono text-[11px] tracking-wide text-ink-faint transition-colors hover:text-ink-dim"
            >
              <ArrowLeft
                className="size-3 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden
              />
              {chrome.backToIndex}
            </Link>

            <h1 className="text-[clamp(2rem,5.5vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-ink text-balance">
              {article.title}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-ink-dim text-pretty sm:text-xl">
              {article.dek}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6 font-mono text-[11px] text-ink-faint">
              <time dateTime={article.date}>{datum(article.date, lang)}</time>
              <span aria-hidden>·</span>
              <span>{chrome.readingTime(article.minutes)}</span>
              <span aria-hidden>·</span>
              <ul className="flex flex-wrap gap-x-3">
                {article.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>

            {/* Kein zweiter Zurück-Verweis, sondern ein Schild: Der Rahmen und
                die Beschriftung davor sagen, dass hier ein Produkt steht und
                keine Navigation. */}
            {system ? (
              <Link
                href={`${heim}#case-${system.id}`}
                className="group mt-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/40 py-2 pr-4 pl-3.5 text-[13px] transition-colors hover:border-acid/40"
              >
                <span className="font-mono text-[11px] tracking-wide text-ink-faint">
                  {chrome.fromSystem}
                </span>
                <span className="font-medium text-ink">{system.name}</span>
                <ArrowRight
                  className="size-3.5 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-acid"
                  aria-hidden
                />
              </Link>
            ) : null}
          </div>

          <div className="mt-12">
            <Prose
              blocks={article.blocks}
              codeLabel={chrome.codeLabel}
              tabelleLabel={chrome.tableLabel}
            />
          </div>

          {/* Die Belege stehen im Artikel, nicht in einer Fußnote irgendwo
              anders. Eine Behauptung ohne prüfbare Quelle hat auf dieser
              Seite keinen Platz. */}
          <Reveal>
            <section className="mt-16 rounded-2xl border border-line bg-surface/40 p-6 sm:p-7">
              <h2 className="text-eyebrow mb-4">{chrome.evidenceLabel}</h2>
              {/* `evidence-list` hängt nur für den Druck daran: Dort steht die
                  Adresse hinter dem Linktext, weil ein unterstrichenes Wort auf
                  Papier nirgendwohin führt. Nur hier und nicht an allen Links —
                  ausgeschriebene Adressen im Fließtext wären Lärm. */}
              <ul className="evidence-list flex flex-col gap-2.5">
                {article.evidence.map((item) => {
                  const text = typeof item === "string" ? item : item.text;
                  return (
                    <li
                      key={text}
                      className="flex gap-2.5 font-mono text-[12px] leading-relaxed text-ink-faint"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.6em] size-1 shrink-0 rounded-full bg-acid/60"
                      />
                      {typeof item === "string" ? (
                        text
                      ) : (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-acid underline decoration-acid/30 underline-offset-4 transition-colors hover:decoration-acid"
                        >
                          {text}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </Reveal>

          {weitere.length > 0 ? (
            <Reveal delay={0.06}>
              {/* Die Überschrift benennt auch die Landmarke.

                  Gemessen im Barrierefreiheitsbaum der ausgelieferten Seite:
                  drei Navigationen, zwei mit Namen ("Hauptnavigation",
                  "Navigation in der Fußzeile") und diese ohne. Wer die
                  Landmarkenliste aufruft, sieht dann dreimal "Navigation" und
                  weiß bei einer davon nicht, wohin sie führt. */}
              {/* `aria-label` und nicht `aria-labelledby`: Die Überschrift
                  trägt `text-transform: uppercase`, und der Name folgt dem
                  gerenderten Text — gemessen kam "ARTIKEL" heraus. Manche
                  Vorleseprogramme buchstabieren Grossbuchstaben. */}
              <nav
                aria-label={chrome.allArticles}
                className="mt-14 border-t border-line pt-10"
              >
                <h2 className="text-eyebrow mb-6">{chrome.allArticles}</h2>
                <ul className="flex flex-col gap-3">
                  {weitere.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`${chrome.base}/${a.slug}`}
                        className="group flex items-start justify-between gap-6 rounded-xl border border-line bg-surface/40 p-5 transition-colors hover:border-acid/40"
                      >
                        <span>
                          <span className="block font-semibold tracking-tight text-ink">
                            {a.title}
                          </span>
                          <span className="mt-1.5 block max-w-[52ch] text-sm leading-relaxed text-ink-faint text-pretty">
                            {a.dek}
                          </span>
                        </span>
                        <ArrowRight
                          className="mt-1 size-4 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-acid"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Reveal>
          ) : null}
        </article>
      </main>

      <Footer otherHref={otherHref} hashBase={heim} />
    </ContentProvider>
  );
}
