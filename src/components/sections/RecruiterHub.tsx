"use client";

import Link from "next/link";
import { mailAdresse } from "@/lib/mailto";
import { ArrowRight, ArrowUpRight, FileDown, Mail } from "lucide-react";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { useContent } from "@/content/ContentProvider";
import { SOCIALS } from "@/content/types";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Spotlight } from "@/components/ui/Spotlight";

export function RecruiterHub() {
  const { recruiter, site, hero, contact } = useContent();

  const links = [
    SOCIALS.linkedin
      ? { label: "LinkedIn", href: SOCIALS.linkedin, icon: LinkedinIcon }
      : null,
    SOCIALS.github
      ? { label: "GitHub", href: SOCIALS.github, icon: GithubIcon }
      : null,
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: (props: { className?: string }) => React.ReactElement;
  }[];

  return (
    // overflow-hidden beschneidet den Glühkreis darunter. Ohne das schiebt der
    // Kreis mit 34rem das Dokument auf Telefonen breiter als den Sichtbereich.
    <section
      id="hire"
      aria-labelledby="hire-titel"
      className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb animate-float top-1/3 left-1/2 size-[34rem] -translate-x-1/2 bg-acid/8" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="hire-titel"
          eyebrow={recruiter.eyebrow}
          title={recruiter.title}
          lede={recruiter.lede}
        />

        {/* Die drei Stärken zuerst über die volle Breite: neben dem Faktenblatt
            fiel ihr Zeilenmaß auf ~27 Zeichen, und der Text zerhackte sich in
            Silbentrennungen. Volle Breite bringt jede Karte auf ~48 Zeichen. */}
        <Spotlight className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recruiter.strengths.map((item, i) => (
            <Reveal key={item.title} delay={0.05 * i}>
              {/* `data-schein` meldet die Karte beim Lichtschein an: Sie
                  bekommt die Zeigerposition als CSS-Variable und damit den
                  weichen Schein plus den Bogen auf ihrer Kante. */}
              {/* Spalte statt Block, damit der Beleg unten steht.

                  Die Karten einer Reihe sind gleich hoch, ihre Texte nicht.
                  Der Verweis folgte dem Text und stand deshalb je Karte
                  woanders: gemessen bei 1440 px 24, 46 und 24 px über der
                  Unterkante in der ersten Reihe, 68, 24 und 24 in der zweiten.
                  Ein Recruiter überfliegt genau diese Zeile — sie gehört auf
                  eine Höhe. `mt-auto` schiebt den Verweis ans Ende, der Text
                  bleibt oben. */}
              <div
                data-schein
                className="lit flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-6"
              >
                {/* Zwei Zeilen Platz, auch wenn der Titel nur eine braucht.

                    Die Karten einer Reihe sind gleich hoch, ihre Überschriften
                    nicht: „Ich kenne den Weg durch die Stores" passt bei
                    1440 px in eine Zeile, „Ich behandle Regulierung als Teil
                    des Produkts" daneben braucht zwei. Der Fließtext begann
                    dadurch 22 px versetzt — gemessen bei 1280 und 1440 px auf
                    Deutsch, bei 768 und 1280 px auf Englisch.

                    `min-h-[2lh]` und nicht `min-h-[3rem]`: Die Einheit `lh`
                    ist die Zeilenhöhe dieses Elements. Ändert sich Schriftgrad
                    oder `leading`, stimmt der Wert weiter. Erst ab `sm`, weil
                    einspaltig keine Reihe existiert, die etwas ausrichten
                    müsste. */}
                <h3 className="text-base leading-snug font-semibold tracking-tight text-ink text-balance sm:min-h-[2lh]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-dim text-pretty">
                  {item.body}
                </p>

                {/* Der Beleg zur Behauptung, einen Klick entfernt.

                    Dieser Abschnitt ist eine Landeadresse: Kopfleiste,
                    404-Seite und jeder geteilte Verweis auf `#hire` setzen
                    jemanden mitten hinein. Von dort führten vier Verweise
                    nach draußen — PDF, Mail, LinkedIn, GitHub — und keiner in
                    die Fallstudien oder Artikel, die genau diese Sätze
                    belegen. Wer prüfen wollte, musste hochscrollen und raten.

                    Interne Ziele über `Link`, äußere als `a` mit `rel`: Ein
                    Anker im selben Dokument braucht keinen neuen Reiter. */}
                {item.proof && item.proofLabel ? (
                  item.proof.startsWith("http") ? (
                    <a
                      href={item.proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/beleg mt-auto -mb-1 inline-flex items-center gap-1.5 self-start pt-4 pb-1 font-mono text-[11px] text-ink-faint transition-colors hover:text-acid"
                    >
                      {item.proofLabel}
                      <ArrowUpRight
                        className="size-3 transition-transform duration-300 group-hover/beleg:translate-x-0.5 group-hover/beleg:-translate-y-0.5"
                        aria-hidden
                      />
                    </a>
                  ) : (
                    <Link
                      href={item.proof}
                      className="group/beleg mt-auto -mb-1 inline-flex items-center gap-1.5 self-start pt-4 pb-1 font-mono text-[11px] text-ink-faint transition-colors hover:text-acid"
                    >
                      {item.proofLabel}
                      <ArrowRight
                        className="size-3 transition-transform duration-300 group-hover/beleg:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  )
                ) : null}
              </div>
            </Reveal>
          ))}
        </Spotlight>

        {/* Der Hinweis auf die zwei Vorführungen, wörtlich derselbe wie im Kopf.

            Dieses Panel ist für den Blick von sechzig Sekunden geschrieben,
            und die beiden Kacheln sind das Einzige auf dieser Seite, das ein
            Recruiter anfassen kann. Sie standen hier nicht.

            `hero.tryIt` und keine zweite Formulierung: Zwei Sätze für
            dieselbe Sache sind die nächste Stelle, an der einer veraltet. */}
        <Reveal>
          <p className="mt-5 text-sm leading-snug text-ink-faint text-pretty">
            {hero.tryIt.before}{" "}
            <a
              href={hero.tryIt.href}
              className="-my-1 py-1 text-ink-dim underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-acid"
            >
              {hero.tryIt.label}
            </a>{" "}
            {hero.tryIt.after}
          </p>
        </Reveal>

        {/* Faktenblatt über die volle Breite, darunter die Aktionen.
            Vorher standen beide nebeneinander, und weil das Faktenblatt sieben
            Zeilen hat und die Aktionen nur zwei, wurde die Aktionskarte auf
            gemessene 500 px gestreckt und war zur Hälfte leer. Untereinander
            hat jeder Block die Höhe, die sein Inhalt braucht. */}
        <div className="mt-5 flex flex-col gap-5">
          <Reveal>
            <dl className="lit grid gap-x-8 gap-y-6 rounded-2xl border border-line bg-surface/50 p-7 sm:grid-cols-2 lg:grid-cols-4">
              {recruiter.facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1">
                  <dt className="text-eyebrow">{fact.label}</dt>
                  <dd className="text-sm leading-snug text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="lit flex flex-col gap-6 rounded-2xl border border-acid/25 bg-acid/[0.06] p-7 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="flex flex-wrap items-center gap-3">
                {/* `download`, wie auf der One-Pager-Seite: Die Datei gibt es,
                    damit sie weitergereicht wird. Ohne das Attribut öffnet sie
                    sich in einem Betrachter, und wer sie an die fachliche
                    Führung schicken will, muss sie von dort erst noch sichern.
                    Drei Stellen verweisen auf dasselbe Blatt; zwei taten es bis
                    heute anders als die dritte. */}
                <Magnetic>
                  <a
                    href={recruiter.cta.pdf.href}
                    download
                    className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-acid px-5 py-3 text-sm font-medium text-void transition-colors hover:bg-ink"
                  >
                    <FileDown className="size-4" aria-hidden />
                    {recruiter.cta.pdf.label}
                  </a>
                </Magnetic>

                <Magnetic>
                  <a
                    href={mailAdresse(
                      site.email,
                      site.mailSubject,
                      contact.checkliste.punkte,
                    )}
                    className="group inline-flex items-center gap-2 rounded-full border border-line bg-base px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink-faint"
                  >
                    <Mail className="size-4" aria-hidden />
                    {recruiter.cta.mail.label}
                  </a>
                </Magnetic>

                {/* Kein dritter Knopf, sondern ein Verweis: Der Weg zur
                    Kurzfassung ist der PDF-Knopf daneben, dies ist nur seine
                    Alternative für alle, die lieber lesen als herunterladen. */}
                <Link
                  href={recruiter.cta.web.href}
                  /* Die Fassung ohne Herunterladen, und sie war die blasseste
                     Angabe im ganzen Kasten: `ink-faint` neben zwei kräftigen
                     Knöpfen, 143 × 20 px. Wer auf einem Firmenrechner oder am
                     Telefon liest, will genau diese und nicht das PDF. Jetzt
                     `ink-dim` und über den Innenabstand 32 px hoch; die
                     negativen Außenabstände halten die optische Position. */
                  className="-my-1.5 self-center py-1.5 text-sm text-ink-dim underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-acid"
                >
                  {recruiter.cta.web.label}
                </Link>
              </div>

              {/* Die Trennlinie wandert mit der Anordnung: waagerecht, solange
                  gestapelt wird, senkrecht, sobald nebeneinander. */}
              <div className="flex flex-wrap gap-2 border-t border-acid/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={
                      link.href.startsWith("mailto:") ? undefined : "_blank"
                    }
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-line bg-base/60 px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    <link.icon className="size-3.5" aria-hidden />
                    {link.label}
                    <ArrowUpRight
                      className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </a>
                ))}

                {/* Die Adresse stand hier als zweiter mailto-Verweis, mit
                    demselben Pfeilsymbol wie LinkedIn und GitHub — also als
                    etwas, das anderswohin führt. Auf einem Arbeitsrechner ohne
                    eingerichtetes Mailprogramm führt sie nirgendwohin, und
                    kopieren liess sie sich nur mit der Maus. */}
                <CopyEmail
                  email={site.email}
                  label={recruiter.cta.copy.label}
                  done={recruiter.cta.copy.done}
                  failed={recruiter.cta.copy.failed}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
