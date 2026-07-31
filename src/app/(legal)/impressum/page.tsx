import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false, follow: false },
};

/**
 * Ladungsfähige Anschrift nach § 5 DDG. Auf ausdrückliche Entscheidung des
 * Betreibers die Privatanschrift — sie ist damit öffentlich und wird indexiert.
 */
export default function Impressum() {
  return (
    <main>
      <h1 className="text-title mb-10 text-ink">Impressum</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Angaben gemäß § 5 DDG
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
            href={`mailto:${site.email}`}
            className="text-acid underline underline-offset-4"
          >
            {site.email}
          </a>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Eine Telefonnummer wird hier bewusst nicht veröffentlicht. § 5 DDG
          verlangt eine Angabe, die eine schnelle elektronische Kontaktaufnahme
          ermöglicht — die E-Mail-Adresse oben erfüllt das. Auf Anfrage nenne
          ich eine Rufnummer.
        </p>
      </section>

      {/*
        TODO(domenic): Falls eine Umsatzsteuer-Identifikationsnummer existiert,
        ist ihre Angabe nach § 5 Abs. 1 Nr. 6 DDG Pflicht — dann diesen
        Abschnitt wieder einsetzen:

          <section className="mb-10">
            <h2 …>Umsatzsteuer-Identifikationsnummer</h2>
            <p …>USt-IdNr. gemäß § 27 a UStG: DE…</p>
          </section>

        Ohne USt-IdNr. (Kleinunternehmerregelung nach § 19 UStG) entfällt die
        Angabe ersatzlos — ein leerer oder erfundener Eintrag wäre schlechter
        als keiner. Siehe USER-TODO A2.
      */}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
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
        <h2 className="mb-3 text-lg font-semibold text-ink">Haftung für Links</h2>
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
