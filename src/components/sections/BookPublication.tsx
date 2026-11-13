"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function BookPublication() {
  const content = useContent();
  const { publikation, lang, site } = content;
  const { book, labels } = publikation;
  const { links } = book;

  const kaufLinks = [
    links.bodPrint
      ? { href: links.bodPrint, label: labels.bod, primary: true }
      : null,
    links.ebook ? { href: links.ebook, label: labels.ebook, primary: false } : null,
    links.amazonPrint
      ? { href: links.amazonPrint, label: labels.amazon, primary: false }
      : null,
  ].filter(Boolean) as {
    href: string;
    label: string;
    primary: boolean;
  }[];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    isbn: book.isbn.replace(/-/g, ""),
    numberOfPages: book.pages,
    datePublished: book.published,
    publisher: {
      "@type": "Organization",
      name: book.publisher,
    },
    inLanguage: lang === "de" ? "de-DE" : "en-GB",
    description: book.summary,
    image: `${site.url}${book.coverSrc}`,
    offers: [
      links.bodPrint
        ? {
            "@type": "Offer",
            url: links.bodPrint,
            priceCurrency: "EUR",
            price: "8.99",
            availability: "https://schema.org/InStock",
          }
        : null,
      links.amazonPrint
        ? {
            "@type": "Offer",
            url: links.amazonPrint,
            priceCurrency: "EUR",
            price: "8.99",
            availability: "https://schema.org/InStock",
          }
        : null,
    ].filter(Boolean),
  };

  const json = JSON.stringify(schema).replace(/</g, "\\u003c");

  return (
    <section
      id="publikation"
      aria-labelledby="publikation-titel"
      className="relative scroll-mt-24 px-6 py-28 sm:py-32"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json }}
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="publikation-titel"
          eyebrow={publikation.eyebrow}
          title={publikation.title}
          lede={publikation.lede}
        />

        <Reveal className="mt-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-start">
            <div className="mx-auto w-full max-w-[220px] lg:mx-0">
              <Image
                src={book.coverSrc}
                alt={book.coverAlt}
                width={440}
                height={660}
                className="w-full rounded-lg border border-line shadow-lg"
              />
            </div>

            <BookFacts book={book} labels={labels} />

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:col-span-2">
              {kaufLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    link.primary
                      ? "inline-flex items-center justify-center gap-2 rounded-full border border-acid bg-acid/10 px-6 py-3 text-sm font-medium text-acid transition-colors hover:bg-acid/20"
                      : "inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm text-ink transition-colors hover:border-acid/40 hover:text-acid"
                  }
                >
                  {link.label}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              ))}
              {links.authorPage ? (
                <Link
                  href={links.authorPage}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  {labels.authorSite}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BookFacts({
  book,
  labels,
}: {
  book: Content["publikation"]["book"];
  labels: Content["publikation"]["labels"];
}) {
  return (
    <article className="min-w-0">
      <h3 className="font-serif text-2xl text-ink text-balance">{book.title}</h3>
      <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {book.summary}
      </p>
      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        <Fact label={labels.author} value={book.author} />
        <Fact label={labels.isbn} value={book.isbn} />
        <Fact label={labels.publisher} value={book.publisher} />
        <Fact label={labels.format} value={book.formatLine} />
        <Fact label={labels.published} value={book.publishedLabel} />
        <Fact label={labels.printPrice} value={book.pricePrint} />
        <Fact
          label={labels.ebookPrice}
          value={
            book.links.ebook
              ? book.priceEbook
              : `${book.priceEbook} (${labels.ebookSoon})`
          }
        />
      </dl>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}
