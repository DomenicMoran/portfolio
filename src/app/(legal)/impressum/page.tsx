import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false, follow: false },
};

/**
 * ⚠️ ENTSCHEIDUNG OFFEN — siehe USER-TODO Block E.
 *
 * § 5 DDG verlangt eine ladungsfähige Anschrift, sobald die Seite
 * geschäftsmäßig betrieben wird. Diese Seite akquiriert Aufträge und
 * Anstellungen, ist also geschäftsmäßig. Ein Postfach genügt nicht.
 *
 * ABER: Domenic hat ein berechtigtes Schutzinteresse. Die Privatanschrift öffentlich mit dem
 * Klarnamen zu verknüpfen, ist für Vollzugsbeamte ein reales Sicherheitsrisiko
 * — deshalb existiert die Auskunftssperre nach § 51 BMG überhaupt. Die Adresse
 * bleibt hier bewusst als Platzhalter stehen, bis er zwischen Privatanschrift
 * und angemieteter Geschäftsadresse entschieden hat.
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
          {site.name}
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ] [Ort]
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
          <br />
          Telefon: [optional]
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Umsatzsteuer-Identifikationsnummer
        </h2>
        <p className="text-sm leading-relaxed text-ink-dim">
          [USt-IdNr. gemäß § 27 a UStG — oder streichen, falls Kleinunternehmer
          nach § 19 UStG]
        </p>
      </section>

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
