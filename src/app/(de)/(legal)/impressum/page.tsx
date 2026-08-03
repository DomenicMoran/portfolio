import type { Metadata } from "next";
import { mailAdresse } from "@/lib/mailto";
import { EnglishNote } from "../EnglishNote";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Impressum",
  // Ohne eigene Beschreibung erbt diese Seite die der Startseite. Zwei
  // Seiten mit derselben Beschreibung sind ein bekannter Mangel; hier ist
  // sie ausserdem inhaltlich falsch.
  description:
    "Anbieterkennzeichnung nach § 5 DDG für domenicmoran.de: Betreiber, ladungsfähige Anschrift und Kontakt.",
  robots: { index: false, follow: false },
  /* Auch eine Seite mit `noindex` bekommt eine Karte, sobald jemand ihre
     Adresse teilt. Ohne eigene Angabe trug sie den Titel der Startseite. */
  openGraph: {
    title: "Impressum",
    locale: "de_DE",
  },
  // Ohne eigenen Eintrag erbt diese Seite den Canonical des
  // Wurzel-Layouts, und der zeigt auf die Startseite: Die Rechtsseite
  // erklärt sich damit selbst zum Duplikat einer ganz anderen Seite.
  alternates: { canonical: `${site.url}/impressum` },
};

/**
 * Ladungsfähige Anschrift nach § 5 DDG. Auf ausdrückliche Entscheidung des
 * Betreibers die Privatanschrift: Sie ist damit öffentlich, wird aber nicht
 * indexiert — die Seite trägt `noindex` und steht deshalb auch nicht in der
 * Sitemap. Erreichbar bleibt sie über die Fußzeile jeder Seite, was § 5 DDG
 * verlangt; über eine Suche nach der Anschrift findet man sie nicht.
 */
export default function Impressum() {
  return (
    <main>
      <h1 className="text-title mb-10 text-ink">Impressum</h1>

      <EnglishNote />

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Angaben gemäß § 5 DDG
        </h2>
        <address className="text-sm leading-relaxed text-ink-dim not-italic">
          Domenic Moran
          <br />
          Heidelberger Straße 36
          <br />
          12059 Berlin
          <br />
          Deutschland
        </address>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">Kontakt</h2>
        <p className="text-sm leading-relaxed text-ink-dim">
          E-Mail:{" "}
          <a
            href={mailAdresse(site.email, site.mailSubject)}
            className="-my-1 py-1 text-acid underline underline-offset-4"
          >
            {site.email}
          </a>
        </p>
      </section>

      {/*
        TODO(domenic): Falls eine Umsatzsteuer-Identifikationsnummer existiert,
        ist ihre Angabe nach § 5 Abs. 1 Nr. 6 DDG Pflicht. Dann diesen
        Abschnitt wieder einsetzen:

          <section className="mb-10">
            <h2 …>Umsatzsteuer-Identifikationsnummer</h2>
            <p …>USt-IdNr. gemäß § 27 a UStG: DE…</p>
          </section>

        Ohne USt-IdNr. (Kleinunternehmerregelung nach § 19 UStG) entfällt die
        Angabe ersatzlos. Ein leerer oder erfundener Eintrag wäre schlechter als
        keiner.
      */}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="text-sm leading-relaxed text-ink-dim">
          {site.name}, Anschrift wie oben.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Streitschlichtung
        </h2>
        <p className="text-sm leading-relaxed text-ink-dim">
          Ich bin nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Haftung für Links
        </h2>
        <p className="text-sm leading-relaxed text-ink-dim">
          Diese Seite verlinkt auf externe Websites, auf deren Inhalte ich
          keinen Einfluss habe. Für diese fremden Inhalte ist stets der
          jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren
          keine Rechtsverstöße erkennbar. Bei Bekanntwerden von Rechtsverstößen
          entferne ich entsprechende Links umgehend.
        </p>
      </section>
    </main>
  );
}
