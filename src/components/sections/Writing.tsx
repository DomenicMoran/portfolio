"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import { artikelIn, chromeIn } from "@/content/articles";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Die Artikel auf der Startseite.
 *
 * Steht bewusst zwischen Fähigkeiten und Recruiter-Bereich: Wer bis hierher
 * gelesen hat, glaubt die Projekte. Die offene Frage ist dann, ob dahinter
 * jemand steht, der erklären kann, was er gebaut hat. Genau das beantworten
 * die Artikel, und deshalb stehen sie unmittelbar vor dem Teil, in dem es um
 * eine Zusammenarbeit geht.
 */
export function Writing() {
  const { lang } = useContent();
  // Nur die drei neuesten auf der Startseite. Bei fuenf Karten bricht das
  // Dreierraster in 3+2 um, und die zweite Reihe sieht aus wie ein Rest.
  // Die vollstaendige Liste liegt eine Ebene tiefer.
  const artikel = artikelIn(lang).slice(0, 3);
  const chrome = chromeIn(lang);

  return (
    <section
      id="writing"
      aria-labelledby="writing-titel"
      className="relative scroll-mt-24 overflow-hidden px-6 pb-28 sm:pb-40"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="writing-titel"
          eyebrow={chrome.home.eyebrow}
          title={chrome.home.title}
          lede={chrome.home.lede}
        />

        {/* Eine Spalte vor drei, keine Zwischenstufe mit zwei.

            Drei Vorschaukarten und ein Zweierraster vertragen sich nicht: Bei
            640-1023 px stand hier zwangsläufig 2 oben, 1 unten allein, ein
            Rest, der wie ein Fehler aussieht. Die frühere Zwischenstufe mit
            zwei Spalten löste ein anderes Problem — bei 768 px waren drei
            176-px-Karten zu schmal, rund 24 Zeichen je Zeile, Titel auf vier
            Zeilen umgebrochen, dieselbe Beobachtung wie im Recruiter-Bereich.
            Ohne Zwischenstufe bleibt die Karte bis 1024 px einspaltig und
            damit so breit wie der Inhalt, das Schmal-Problem entfällt von
            selbst. Ab 1024 px stehen alle drei Karten in einer Reihe, die
            Kartenzahl füllt die Spaltenzahl genau, kein Rest. */}
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {artikel.map((a, i) => (
            <Reveal as="li" key={a.slug} delay={i * 0.06}>
              {/* Wie in der Artikelübersicht: Der Name des Verweises ist der
                  Titel. Ohne `aria-labelledby` wurde die ganze Karte zum
                  Namen, gemessen „5 Min. Lesezeit Der gestrichelte Kreis kam
                  nicht aus der Schrift In etwa jedem dritten Vers …“. */}
              <Link
                href={`${chrome.base}/${a.slug}`}
                /* Kein Vorabladen im Anriss.

                   Next holt jede sichtbare Zielseite im Voraus. Gemessen an
                   der ausgelieferten Startseite auf dem Telefon: 36 Antworten
                   mit zusammen 625 kB, davon 443 kB für sechs vollständige
                   Artikelseiten, geholt, bevor jemand einen Titel gelesen
                   hat. Wer hier klickt, klickt einen davon an, nicht sechs.

                   Beim Zeigen mit der Maus lädt Next weiterhin vor, der Klick
                   bleibt also gleich schnell. `check:vitals` hält die Menge
                   offen. */
                prefetch={false}
                aria-labelledby={`schrift-${a.slug}`}
                className="group lit flex h-full flex-col rounded-2xl border border-line bg-surface/40 p-6 transition-colors hover:border-acid/40"
              >
                <span className="font-mono text-[11px] text-ink-faint">
                  {chrome.readingTime(a.minutes)}
                </span>

                {/* Zwei Zeilen Platz, auch wenn der Titel nur eine braucht:
                    Sonst beginnt der Anriss der Nachbarkarte 22 px höher und
                    die Reihe steht schief. Gemessen bei 768 px auf Deutsch,
                    bei 1280 und 1440 px auf Englisch. `check:cards` hält es
                    offen.

                    Drei Zeilen und nicht zwei, obwohl zwei örtlich reichten:
                    Auf dem Linux-Läufer der CI brechen dieselben Titel bei
                    1024 px anders um als unter Windows, dort meldete
                    `check:cards` 22 px Versatz, während hier alles bündig
                    stand. Ein Wert, der von den Schriftmetriken des
                    Betriebssystems abhängt, ist kein Wert. Drei Zeilen decken
                    beide Fälle; die Karten bekommen dafür gleichmäßig etwas
                    Luft, was niemand als Fehler sieht. */}
                <h3
                  id={`schrift-${a.slug}`}
                  className="mt-3 flex items-start gap-2 text-base leading-snug font-semibold tracking-tight text-ink text-balance sm:min-h-[3lh]"
                >
                  {a.title}
                  <ArrowUpRight
                    className="mt-0.5 size-3.5 shrink-0 text-ink-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-acid"
                    aria-hidden
                  />
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-ink-dim text-pretty">
                  {a.dek}
                </p>

                {/* mt-auto zieht die Marken auf eine Linie, auch wenn die
                    Anrisse unterschiedlich lang sind. Ohne das säßen sie in
                    jeder Karte auf einer anderen Höhe. */}
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {a.tags.slice(0, 2).map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md border border-line bg-base/60 px-2 py-0.5 font-mono text-[10px] text-ink-faint"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.12}>
          <Link
            href={chrome.base}
            /* Dieselbe Regel wie an den Karten darüber: Die Übersicht liegt
               eine Ebene tiefer, und niemand hat sie angefordert, bevor er
               den Knopf gelesen hat. `check:vitals` hält die Menge offen. */
            prefetch={false}
            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
          >
            {chrome.home.cta}
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
