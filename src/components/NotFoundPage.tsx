import Link from "next/link";
import { chromeIn } from "@/content/articles";
import { Marke } from "@/lib/mark";
import { mailAdresse } from "@/lib/mailto";
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
  angefragt,
}: {
  content: Content;
  base?: string;
  /**
   * Die Adresse, die ins Leere führte.
   *
   * Steht in der Meldung eines toten Verweises, damit der Empfänger nicht
   * raten muss. Kommt vom Proxy und nicht aus dem Browser: So steht sie auch
   * ohne JavaScript in der Mail.
   */
  angefragt?: string;
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

  /*
     Die Ziele der 404 sind die der Kopfleiste, mit einer Ausnahme.

     Unter „Artikel" führt die Kopfleiste auf `#writing`, den Anreißer auf der
     Startseite. Dort ist das richtig; hier nicht. Die wahrscheinlichste
     Adresse, die auf dieser Seite landet, ist ein falscher oder veralteter
     Artikel-Pfad: Fünf Artikel mit langen Slugs stehen im Profil-README, auf
     LinkedIn und in llms.txt. Wer sich dort vertippt, will die Liste der fünf
     und nicht einen Abschnitt mit drei Karten.

     Ersetzt statt ergänzt: Zwei Kacheln mit derselben Beschriftung und
     verschiedenen Zielen wären schlechter als die eine falsche.
  */
  const artikel = chromeIn(content.lang);
  const ziele = nav.map((item) =>
    item.href === "#writing"
      ? { href: artikel.base, label: artikel.allArticles }
      : { href: `${base}/${item.href}`, label: item.label },
  );

  return (
    /* Ein Rahmen ueber beidem, damit der Fussteil unten im Bild steht und
       nicht darunter. Vorher trug `main` selbst `min-h-svh`; als der Fussteil
       aus `main` herauswanderte, rutschte er damit unter die Falz, auf einer
       Seite, von der aus § 5 DDG das Impressum unmittelbar erreichbar
       verlangt. */
    <div className="flex min-h-svh flex-col">
      <main className="relative flex flex-1 items-center overflow-hidden px-6 py-14 sm:py-20">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_70%)]" />
          <div className="glow-orb top-1/4 left-1/2 size-[26rem] -translate-x-1/2 bg-violet/12" />
        </div>

        <div className="mx-auto w-full max-w-2xl">
          {/* Das Zeichen, wie in der Kopfleiste.

            Die 404 bringt ihr eigenes Dokument mit und hat deshalb keine
            Kopfleiste, gemessen an der ausgelieferten Seite stand hier kein
            einziges Element der Marke. Wer über einen kaputten fremden Verweis
            hier landet, sieht als Erstes eine Seite, die zu niemandem gehört.
            Ein Zeichen mit Namen, das zur Startseite führt, ist genug; mehr
            wäre eine zweite Kopfleiste für eine Seite, die man verlässt. */}
          <a
            href={base === "" ? "/" : base}
            className="group -my-1 mb-10 inline-flex items-center gap-2.5 py-1"
          >
            <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-md border border-acid/25 transition-colors group-hover:border-acid/60">
              <Marke size={28} radius={0} />
            </span>
            <span className="text-sm font-medium tracking-tight text-ink">
              {site.name}
            </span>
          </a>

          <p className="text-eyebrow mb-6">{notFound.eyebrow}</p>

          <h1 className="text-headline text-ink text-balance">
            {notFound.title}
          </h1>

          <p className="mt-6 max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
            {notFound.body}
          </p>

          <nav
            aria-label={notFound.onward}
            className="mt-10 flex flex-col gap-3"
          >
            <span className="text-eyebrow">{notFound.onward}</span>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={base === "" ? "/" : base}
                  /* Kein Vorabladen auf einer Seite ohne Client-Code.

                     Next holt zu jedem sichtbaren Verweis die Skripte des
                     Ziels mit. Gemessen an der ausgelieferten Fehlerseite auf
                     dem Telefon: 1.002 kB Skript und 205 kB vorab, doppelt so
                     viel wie das Impressum, auf einer Seite, die sich
                     ausdrücklich ohne Client-Code versteht. Wer sich vertippt
                     hat, klickt genau einen dieser Wege an. Beim Zeigen mit
                     der Maus lädt Next weiterhin vor. */
                  prefetch={false}
                  className="inline-flex rounded-full border border-transparent bg-acid px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-ink"
                >
                  {notFound.home}
                </Link>
              </li>
              {ziele.map((ziel) => (
                <li key={ziel.href}>
                  <Link
                    href={ziel.href}
                    prefetch={false}
                    className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    {ziel.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {zweitsprache ? (
            <p lang={zweitsprache.lang} className="mt-8 text-sm text-ink-faint">
              {zweitsprache.notFound.otherLanguage.text}{" "}
              {/* `hrefLang`, weil dieser Verweis die Sprache wechselt.

                  Der Absatz trägt schon `lang`, damit der Satz richtig
                  vorgelesen wird. Das Ziel ist damit noch nicht ausgezeichnet:
                  `lang` sagt, in welcher Sprache der Verweistext steht,
                  `hreflang`, was am anderen Ende wartet. Auf beiden
                  Fehlerseiten war es das Einzige, was fehlte. */}
              <Link
                href={zweitsprache.lang === "en" ? "/en" : "/"}
                prefetch={false}
                hrefLang={zweitsprache.lang}
                className="-my-1 py-1 text-acid underline underline-offset-4"
              >
                {zweitsprache.notFound.otherLanguage.link}
              </Link>
              .
            </p>
          ) : null}
        </div>
      </main>

      {/* Der Fussteil steht ausserhalb von `main`.

        Ein `footer` innerhalb von `main` ist im Barrierefreiheitsbaum keine
        Landmarke: `contentinfo` entsteht nur, wenn er nicht in `main`,
        `article` oder `section` steckt. Gemessen am Baum der ausgelieferten
        404: zwei Landmarken, `main` und die Weiter-zu-Navigation, kein
        `contentinfo`, als einzige Seite dieser Adresse. Die Zeilen darunter
        sind aber genau das, was ueberall sonst die Fusszeile ist. */}
      {/* Derselbe Aufbau wie `main`: aussen der Rand, innen die Spalte.
          Andersherum stand der Fussteil 23 px weiter rechts als der Text
          darueber, gemessen an der ausgelieferten Seite bei 1440 px. */}
      <footer className="relative px-6 pb-10">
        <div className="mx-auto w-full max-w-2xl">
          <p className="border-t border-line pt-6 text-sm text-ink-faint">
            {notFound.report}{" "}
            <a
              /* Eigener Betreff, nicht der allgemeine.

                 `site.mailSubject` lautet „Anfrage über domenicmoran.de“ und
                 ist für den gedacht, der wegen einer Stelle schreibt. Wer von
                 hier aus schreibt, meldet einen toten Verweis, und die
                 Meldung soll im Postfach als solche ankommen, ohne dass
                 jemand sie erst öffnet. */
              href={mailAdresse(
                site.email,
                notFound.reportSubject,
                angefragt
                  ? [`${notFound.reportPath}: ${angefragt}`]
                  : undefined,
              )}
              className="-my-1 py-1 text-acid underline underline-offset-4"
            >
              {site.email}
            </a>
          </p>

          {/* Auch eine 404 ist eine Seite des Angebots: § 5 DDG verlangt das
            Impressum von jeder aus unmittelbar erreichbar. Gemessen an elf
            ausgelieferten Adressen fehlte es hier, und diese Seite bekommt
            jeder zu sehen, der sich vertippt. */}
          {/* Unterstrichen, nicht nur eingefärbt. Gemessen an der
            ausgelieferten Seite trugen beide Verweise genau die Farbe
            ihres Umfelds, rgb(132,132,143) auf rgb(132,132,143), und
            keine Unterstreichung. Wer die Zeile liest, kann nicht
            erkennen, dass sie anklickbar ist. */}
          {/* Zwei Zeilen Platz, auch wenn eine reicht.

              Die Fußzeile schrumpfte beim Eintreffen der Schrift von 133 auf
              118 px, und weil der Inhalt darüber senkrecht zentriert steht,
              rutschte mit ihr die ganze Seite: gemessen in der CI CLS 0,1626
              bei einem Budget von 0,1, in allen drei Läufen gleich. Die 15 px
              sind eine Zeile dieser Zeile, 11 px Schrift, rund 15 px hoch:
              und nicht eine des Absatzes darüber, der mit 14 px auf 20 käme.
              In der Ersatzschrift des Linux-Läufers brechen die beiden
              Verweise um, mit Geist stehen sie nebeneinander.

              `min-h-[2lh]` hält beide Zustände auf derselben Höhe. */}
          <p className="mt-4 flex min-h-[2lh] flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] text-ink-faint">
            <Link
              href="/impressum"
              prefetch={false}
              hrefLang="de"
              className="-my-2 py-2 underline underline-offset-4 transition-colors hover:text-ink-dim"
            >
              {content.footer.impressum}
            </Link>
            <Link
              href="/datenschutz"
              prefetch={false}
              hrefLang="de"
              className="-my-2 py-2 underline underline-offset-4 transition-colors hover:text-ink-dim"
            >
              {content.footer.datenschutz}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
