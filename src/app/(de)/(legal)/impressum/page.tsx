import type { Metadata } from "next";
import { feedFuer, vorschaukarten, kartenTitel } from "@/lib/metadata";
import { mailAdresse } from "@/lib/mailto";
import { EnglishNote } from "../EnglishNote";
import { Rechtsfuss } from "../LegalFooter";
import { ANBIETER, ANSCHRIFT } from "../provider";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Impressum",
  // Ohne eigene Beschreibung erbt diese Seite die der Startseite. Zwei
  // Seiten mit derselben Beschreibung sind ein bekannter Mangel; hier ist
  // sie ausserdem inhaltlich falsch.
  description:
    "Anbieterkennzeichnung nach § 5 DDG für domenicmoran.de: Betreiber, ladungsfähige Anschrift und Kontakt.",
  /* noindex, aber follow, wie beim One-Pager und den beiden PDFs.

     Hier stand `follow: false`, und damit standen drei Entscheidungen
     zur selben Frage nebeneinander: /onepager und die PDFs auf
     `noindex, follow`, diese beiden Blätter auf `noindex, nofollow`.
     Der Unterschied war keiner, er ist entstanden, nicht entschieden.

     `noindex` ist hier Absicht: Die Pflichtangabe nach § 5 DDG soll
     erfüllt sein, ohne die Wohnanschrift in Suchergebnisse zu tragen.
     `nofollow` trägt dazu nichts bei. Es hält einen Crawler nur davon
     ab, den Verweisen dieser Seite zu folgen, und die zeigen auf die
     Startseite und auf /en, also genau dorthin, wo er hin soll. */
  robots: { index: false, follow: true },
  /* Auch eine Seite mit `noindex` bekommt eine Karte, sobald jemand ihre
     Adresse teilt. Ohne eigene Angabe trug sie den Titel der Startseite. */
  ...vorschaukarten({ titel: kartenTitel("Impressum"), lang: "de", pfad: "/impressum" }),
  // Ohne eigenen Eintrag erbt diese Seite den Canonical des
  // Wurzel-Layouts, und der zeigt auf die Startseite: Die Rechtsseite
  // erklärt sich damit selbst zum Duplikat einer ganz anderen Seite.
  alternates: {
    canonical: `${site.url}/impressum`,
    // Der Feed steht auf jeder Seite, auch hier: Next ersetzt das geerbte
    // `alternates` vollständig, statt es zu mischen.
    types: feedFuer("de"),
  },
};

/**
 * Ladungsfähige Anschrift nach § 5 DDG. Auf ausdrückliche Entscheidung des
 * Betreibers die Privatanschrift: Sie ist damit öffentlich, wird aber nicht
 * indexiert, die Seite trägt `noindex` und steht deshalb auch nicht in der
 * Sitemap. Erreichbar bleibt sie über die Fußzeile jeder Seite, was § 5 DDG
 * verlangt; über eine Suche nach der Anschrift findet man sie nicht.
 */
export default function Impressum() {
  return (
    <>
      <main>
        <h1 className="text-title mb-10 text-ink">Impressum</h1>

        <EnglishNote />

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            Angaben gemäß § 5 DDG
          </h2>
          <address className="text-sm leading-relaxed text-ink-dim not-italic">
            {ANBIETER}
            {ANSCHRIFT.map((zeile) => (
              <span key={zeile}>
                <br />
                {zeile}
              </span>
            ))}
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
        Kleinunternehmer nach § 19 UStG: Es wird keine Umsatzsteuer berechnet
        und keine ausgewiesen. Deshalb steht hier keine USt-IdNr. — die
        Kennung bleibt Datenbestand, wird aber nicht angezeigt. Die
        Einstufung ist abschließend vom Steuerberater zu bestätigen.
      */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            Umsatzsteuer
          </h2>
          <p className="text-sm leading-relaxed text-ink-dim">
            Kleinunternehmer nach § 19 UStG — es wird keine Umsatzsteuer berechnet.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
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
            jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung
            waren keine Rechtsverstöße erkennbar. Bei Bekanntwerden von
            Rechtsverstößen entferne ich entsprechende Links umgehend.
          </p>
        </section>
      </main>
      <Rechtsfuss hier="impressum" />
    </>
  );
}
