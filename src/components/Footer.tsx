"use client";

import Link from "next/link";
import verified from "@/content/verified.json";
import { mailAdresse } from "@/lib/mailto";
import { ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { PrintNote } from "@/components/ui/PrintNote";
import { useContent } from "@/content/ContentProvider";
import { SOCIALS } from "@/content/types";

/**
 * Die Fußzeile als zweiter Wegweiser.
 *
 * Vorher lagen hier alle Links in einer Reihe nebeneinander: Navigation,
 * Profile und Rechtliches sahen gleich aus und standen gleichrangig. Wer unten
 * ankommt, sucht aber gezielt eines von dreien. Deshalb jetzt drei benannte
 * Spalten statt einer Sammlung.
 */
export function Footer({
  otherHref,
  hashBase = "",
}: { otherHref?: string; hashBase?: string } = {}) {
  const {
    nav: navItems,
    site,
    footer,
    a11y,
    recruiter,
    languageSwitch,
    lang,
  } = useContent();
  /* Das Jahr im Copyright kommt aus dem Prüfstempel, nicht aus der Uhr.

     Die Fußzeile ist ein Client-Bauteil auf vorab erzeugten Seiten. `new
     Date()` im Render heißt: Der Server schreibt das Jahr des Bautags, der
     Browser rechnet beim Laden — und am 1. Januar liefen beide auseinander,
     mit demselben React-Fehler 418, den die Gebetszeiten-Demo einen Tag nach
     jedem Bau erzeugte. Der Stempel wird täglich nachgeführt und steht als
     Zeichenkette im Bündel, ist also auf beiden Seiten derselbe Wert. */
  const year = Number(verified.date.slice(0, 4));
  const sprachZiel = otherHref ?? (lang === "de" ? "/en" : "/");

  const socials = [
    SOCIALS.github
      ? { label: "GitHub", href: SOCIALS.github, icon: GithubIcon }
      : null,
    SOCIALS.linkedin
      ? { label: "LinkedIn", href: SOCIALS.linkedin, icon: LinkedinIcon }
      : null,
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: typeof GithubIcon;
  }[];

  return (
    <footer className="relative overflow-hidden border-t border-line px-6 pt-20 pb-10">
      <div className="mx-auto max-w-6xl">
        {/* Der Schriftzug als Schlussakkord.
            `whitespace-nowrap` plus kleinerer Maximalwert: Bei 15vw brach der
            Name auf 1440 px in zwei Zeilen um, und weil der Verlauf nach unten
            ausblendet, sah die zweite Zeile abgeschnitten aus statt
            ausgeblendet. Einzeilig liest sich derselbe Verlauf als Absicht. */}
        <p
          aria-hidden
          className="mb-14 bg-gradient-to-b from-ink/14 to-transparent bg-clip-text text-[clamp(2rem,9.5vw,8rem)] leading-[0.9] font-semibold tracking-[-0.05em] whitespace-nowrap text-transparent select-none"
        >
          {site.name}
        </p>

        <div className="grid gap-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Wer, wo, wie erreichbar */}
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink">{site.role}</p>
            <p className="text-sm text-ink-dim">{site.location}</p>
            <a
              href={mailAdresse(site.email, site.mailSubject)}
              className="-my-1 w-fit py-1 text-sm break-all text-ink-dim transition-colors hover:text-acid"
            >
              {site.email}
            </a>
          </div>

          {/* Seite */}
          <div className="flex flex-col gap-3">
            <h2 className="text-eyebrow">{footer.navLabel}</h2>
            {/* Gemessen: ohne die vertikale Polsterung waren diese Links 20 px
                hoch und lagen damit unter der WCAG-Mindestgröße von 24 px für
                Zeigeflächen. Der negative Rand hält die optische Ausrichtung. */}
            <nav aria-label={a11y.footerNav} className="-my-2 flex flex-col">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={`${hashBase}${item.href}`}
                  className="w-fit max-w-full py-2 text-sm text-ink-dim transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Kontakt und Profile */}
          <div className="flex flex-col gap-3">
            <h2 className="text-eyebrow">{footer.contactLabel}</h2>
            <div className="-my-2 flex flex-col">
              <a
                href={recruiter.cta.pdf.href}
                download
                className="group flex w-fit max-w-full items-center gap-1.5 py-2 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {footer.onepager}
                <ArrowUpRight
                  className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </a>
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-fit items-center gap-2 py-2 text-sm text-ink-dim transition-colors hover:text-ink"
                >
                  <social.icon className="size-3.5" aria-hidden />
                  {social.label}
                  <ArrowUpRight
                    className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </a>
              ))}
              <Link
                href={sprachZiel}
                prefetch={false}
                hrefLang={languageSwitch.to}
                lang={languageSwitch.to}
                className="w-fit max-w-full py-2 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {languageSwitch.label}
              </Link>
            </div>
          </div>

          {/* Rechtliches und Quellcode */}
          <div className="flex flex-col gap-3">
            <h2 className="text-eyebrow">{footer.legalLabel}</h2>
            <div className="-my-2 flex flex-col">
              {/* `hreflang` an beiden Rechtsverweisen: Die Seiten dahinter gibt es
                  nur auf Deutsch. Das Impressum nach § 5 DDG ist ein deutsches
                  Rechtsdokument, und eine Übersetzung wäre nicht dieselbe
                  Erklärung. Wer von der englischen Fassung dorthin klickt,
                  landet also in einer anderen Sprache — die Angabe sagt das
                  vorher, und ein Vorleseprogramm wechselt die Aussprache. */}
              <Link
                href="/impressum"
                prefetch={false}
                hrefLang="de"
                className="w-fit max-w-full py-2 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {footer.impressum}
              </Link>
              <Link
                href="/datenschutz"
                prefetch={false}
                hrefLang="de"
                className="w-fit max-w-full py-2 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {footer.datenschutz}
              </Link>
              <a
                href={footer.sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-fit max-w-full items-center gap-1.5 py-2 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {footer.sourceLabel}
                <ArrowUpRight
                  className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </a>
            </div>
            {/* Nur die englische Fassung trägt hier einen Hinweis: Die
                Rechtstexte bleiben deutsch, und das soll ein englischer Leser
                erfahren, bevor er klickt. */}
            {footer.legalNote ? (
              <p className="mt-1 max-w-[36ch] text-[11px] leading-relaxed text-ink-faint">
                {footer.legalNote}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="font-mono text-[11px] text-ink-faint">
            © {year} {site.name}
          </p>
        </div>

        <PrintNote text={footer.printNote} />
      </div>
    </footer>
  );
}
