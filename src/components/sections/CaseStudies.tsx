"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  TafelAutomation,
  TafelHighlights,
  TafelStack,
} from "@/components/sections/case-study/Panels";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bot,
  Layers,
  Smartphone,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { artikelDe, artikelEn, chromeDe, chromeEn } from "@/content/articles";
import { useContent } from "@/content/ContentProvider";
import { PrayerTimesDemo } from "@/components/demo/PrayerTimes";
import { MacroDemo } from "@/components/demo/Macros";
import { CheckoutDemo } from "@/components/demo/Checkout";
import type { CaseStudy } from "@/content/types";
/* Das Architekturdiagramm kommt erst, wenn jemand den Reiter öffnet.

   Es ist mit Abstand das größte Bauteil dieser Seite und liegt in einem
   Reiter, der beim Laden nie offen ist – die Startseite beginnt auf
   „Was drinsteckt“. Statisch eingebunden wanderte es trotzdem ins erste
   Bündel und half mit, das Budget von 1200 KiB zu reißen.

   `ssr: false` kostet hier nichts: Ohne JavaScript blendet der
   `<noscript>`-Block unten die Reiterleiste ganz aus, sichtbar bleibt der
   erste Reiter. Das Diagramm war also noch nie ohne JavaScript zu
   erreichen; es wird jetzt nur nicht mehr im Voraus bezahlt. */
const ArchitectureDiagram = dynamic(
  () =>
    import("@/components/ArchitectureDiagram").then(
      (m) => m.ArchitectureDiagram,
    ),
  {
    /* Der Platzhalter hält die Höhe, bis das Diagramm da ist.

       Ohne ihn springt die Seite beim Öffnen des Reiters: erst eine
       Tafel von null Höhe, dann das volle Diagramm. Das ist genau der
       Sprung, den CLS misst – und `check:panels` lief deshalb in einen
       Zeitfehler, weil Playwright einen Reiter erst anklickt, wenn er
       stillsteht. Ein Bauteil nachzuladen heißt, seinen Platz vorher
       freizuhalten. */
    loading: () => <div className="min-h-[420px]" aria-hidden="true" />,
  },
);
import { Counter } from "@/components/ui/Counter";
import { DeviceFrame } from "@/components/ui/DeviceFrame";
import { RichText } from "@/components/ui/InlineCode";
import { ShotCarousel } from "@/components/ui/ShotCarousel";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ACCENT = {
  acid: {
    text: "text-acid",
    bg: "bg-acid",
    border: "border-acid/30",
    soft: "bg-acid/10",
  },
  violet: {
    text: "text-violet",
    bg: "bg-violet",
    border: "border-violet/30",
    soft: "bg-violet/10",
  },
  cyan: {
    text: "text-cyan",
    bg: "bg-cyan",
    border: "border-cyan/30",
    soft: "bg-cyan/10",
  },
} as const;

const TAB_IDS = ["highlights", "automation", "architecture", "stack"] as const;
const TAB_ICONS = {
  highlights: Layers,
  automation: Bot,
  architecture: Workflow,
  stack: Smartphone,
};

type TabId = (typeof TAB_IDS)[number];

/**
 * Nur die drei stärksten Fallstudien ausführlich, der Rest eingeklappt.
 *
 * Dreizehn volle Tafeln mit Bildschirmfotos, Reitern und Vorführungen sind
 * eine halbe Stunde Lesezeit, das war das gemessene Nutzer-Feedback zur
 * vorigen Fassung. `caseStudies` steht in der Reihenfolge der stärksten
 * Belege zuerst (MFC, Salati, MenuCloud), also sind es genau diese drei, die
 * ausführlich bleiben. Analog zu `Writing.tsx`: `slice` vorn, ein Umschalter
 * für den Rest statt einer zweiten Seite, weil es für Projekte anders als für
 * Artikel keine Übersichtsseite gibt.
 */
const AUSFUEHRLICH = 3;

export function CaseStudies() {
  const { work, caseStudies, werkbank } = useContent();
  const ausfuehrlich = caseStudies.slice(0, AUSFUEHRLICH);
  const weitere = caseStudies.slice(AUSFUEHRLICH);

  return (
    <section
      id="work"
      aria-labelledby="work-titel"
      className="relative scroll-mt-24 px-6 py-28 sm:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="work-titel"
          eyebrow={work.eyebrow}
          title={work.title}
          lede={work.lede}
        />

        <div className="mt-20 flex flex-col gap-24 sm:gap-36">
          {ausfuehrlich.map((study) => (
            <CaseStudyPanel key={study.id} study={study} />
          ))}
        </div>

        {/* NOURI und Dartile tragen je eine Rechen-Vorführung. Steht ihre
            Fallstudie nicht unter den ausführlichen, bleibt die Vorführung
            trotzdem ohne Klick erreichbar, siehe Begründung an
            `WeitereVorfuehrungen`. */}
        <WeitereVorfuehrungen
          fehlend={["nouri", "dartile"].filter(
            (id) => !ausfuehrlich.some((s) => s.id === id),
          )}
        />

        {weitere.length > 0 && <WeitereProjekte studies={weitere} />}

        {werkbank.items.length > 0 && <Werkbank />}
      </div>
    </section>
  );
}

/**
 * Die zwei Vorführungen, deren Fallstudie eingeklappt sein kann.
 *
 * Der Vorspann verspricht „Drei von über zehn Systemen in Produktion rechnen
 * hier im Browser mit: Gebetszeiten, Tagesbilanz und Checkout-Tafel
 * ausprobieren", und `check:demo` prüft das nach: Es rechnet dieselben
 * Aufgaben unabhängig nach und sucht die Vorführungen auf der ausgelieferten
 * Seite. Gebetszeiten stehen weiterhin in der Salati-Fallstudie, die zu den
 * drei ausführlichen zählt. Tagesbilanz (NOURI) und Checkout-Tafel (Dartile)
 * gehören zu Fallstudien, die jetzt hinter dem Umschalter stehen können.
 * Ohne diese eigene Stelle wäre das Versprechen aus dem Vorspann falsch,
 * sobald jemand die Liste nicht aufklappt.
 */
function WeitereVorfuehrungen({ fehlend }: { fehlend: readonly string[] }) {
  const inhalt = useContent();
  if (fehlend.length === 0) return null;

  return (
    <div className="mt-24 sm:mt-36">
      <h3 className="text-eyebrow mb-8">{inhalt.work.demosTitle}</h3>
      <div className="flex flex-col gap-16">
        {fehlend.includes("nouri") ? (
          <Reveal>
            <MacroDemo inhalt={inhalt} />
          </Reveal>
        ) : null}
        {fehlend.includes("dartile") ? (
          <Reveal delay={0.05}>
            <CheckoutDemo inhalt={inhalt} />
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}

const WEITERE_LISTE_ID = "weitere-projekte-liste";

/**
 * Ob der Seitenanker beim Laden auf eines der übergebenen Sprungziele zeigt,
 * und wenn ja, auf welches. Derselbe `useSyncExternalStore`-Griff wie in
 * `useMediaQuery.ts`: Der Serverwert ist "", nur der Browser kennt den Anker.
 */
function useMatchingHash(ids: readonly string[]) {
  const subscribe = useCallback((melde: () => void) => {
    window.addEventListener("hashchange", melde);
    return () => window.removeEventListener("hashchange", melde);
  }, []);

  const holen = useCallback(() => {
    const ziel = window.location.hash.replace("#", "");
    return ids.includes(ziel) ? ziel : "";
  }, [ids]);

  const serverHolen = useCallback(() => "", []);

  return useSyncExternalStore(subscribe, holen, serverHolen);
}

/**
 * Die restlichen Projekte, kompakt und eingeklappt.
 *
 * Eine Karte je Projekt statt einer vollen Tafel: Name, Anriss, Status und
 * der eine Verweis, der am ehesten zählt. Bewusst client-seitig ein- und
 * ausblendbar statt auf eine zweite Seite zu verweisen, weil es für Projekte
 * anders als für Artikel keine Übersichtsseite gibt, die eine zweite Adresse
 * rechtfertigen würde.
 */
function WeitereProjekte({ studies }: { studies: readonly CaseStudy[] }) {
  const { work } = useContent();
  const [manuellOffen, setManuellOffen] = useState(false);

  /* Die 91 Weiterleitungen zeigen auf genau diese Karten.
   *
   * `vercel.json` leitet `/wohnungsjaeger`, `/bitdojo` und sieben weitere
   * Namen auf `/#case-<id>`. Diese Adressen entstehen nicht durch Klicken auf
   * der Seite, sondern durch Tippen: `check:links` prüft, dass jedes Ziel im
   * gebauten Baum ein Element mit dieser Kennung findet. Ein eingeklapptes
   * Ziel wäre für einen getippten Verweis wieder eine Leerstelle, genau das,
   * was die Weiterleitungen verhindern sollen.
   *
   * `useSyncExternalStore` statt `useState`/`useEffect`, aus demselben Grund
   * wie in `useMediaQuery`: Der Serverwert ist ausdrücklich "", das Fenster
   * kennt nur der Browser, und ein Effekt, der hier direkt `setState` ruft,
   * verstößt gegen `react-hooks/set-state-in-effect`. */
  const passenderAnker = useMatchingHash(
    studies.map((study) => `case-${study.id}`),
  );
  const offen = manuellOffen || passenderAnker !== "";

  // Der native Sprung beim Laden traf ein noch verstecktes Ziel und lief ins
  // Leere. Sobald die Liste aufklappt, steht die Karte im Layout und kann
  // angefahren werden. Kein `setState` hier, nur ein DOM-Aufruf.
  useEffect(() => {
    if (!passenderAnker) return;
    requestAnimationFrame(() => {
      document.getElementById(passenderAnker)?.scrollIntoView({ block: "start" });
    });
  }, [passenderAnker]);

  return (
    <div className="mt-24 border-t border-line pt-12 sm:mt-36">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-eyebrow">{work.more.title}</h3>
        <button
          type="button"
          aria-expanded={offen}
          aria-controls={WEITERE_LISTE_ID}
          onClick={() => setManuellOffen((v) => !v)}
          /* `no-print`: Ein Umschalter tut auf Papier nichts, `check:print`
             hält das offen. Die eingeklappten Projekte bleiben auf dem
             Ausdruck ungedruckt, wie zuvor am Bildschirm ohne Klick. */
          className="no-print group inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
        >
          {offen ? work.more.hide : work.more.show}
          {offen ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown
              className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
              aria-hidden
            />
          )}
        </button>
      </div>

      <ul
        id={WEITERE_LISTE_ID}
        className={cn(
          "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
          !offen && "hidden",
        )}
      >
        {studies.map((study, i) => {
          const link = study.links.find((l) => l.href);
          const inhalt = (
            <>
              <h3
                id={`weiter-${study.id}`}
                className="flex items-center justify-between gap-2 font-mono text-sm font-normal text-ink"
              >
                {study.name}
                {link ? (
                  <ArrowUpRight
                    className="size-3.5 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-acid"
                    aria-hidden
                  />
                ) : null}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-dim text-pretty">
                {study.tagline}
              </p>
              <span className="mt-auto block pt-4 font-mono text-[10px] text-ink-faint">
                {study.statusLabel}
              </span>
            </>
          );

          return (
            <Reveal as="li" key={study.id} delay={i * 0.04}>
              {/* `article`, nicht `li`: `check:schema` und `check:landmarks`
                  suchen jede Fallstudie über `article[id^='case-']` mit genau
                  einer Überschrift der Ebene 3, dasselbe Muster wie an der
                  vollen Tafel. Der Anker bleibt damit derselbe, ob eine
                  Fallstudie ausführlich steht oder hier kompakt. */}
              <article
                id={`case-${study.id}`}
                className="h-full scroll-mt-24"
              >
                {link ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-labelledby={`weiter-${study.id}`}
                    className="lit group flex h-full flex-col rounded-xl border border-line bg-surface/40 p-5 transition-colors hover:border-acid/40"
                  >
                    {inhalt}
                  </a>
                ) : (
                  <div className="flex h-full flex-col rounded-xl border border-line bg-surface/40 p-5">
                    {inhalt}
                  </div>
                )}
              </article>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Drei Namen, die es gibt, und drei Fallstudien, die es noch nicht gibt.
 *
 * Bewusst keine Karte mit Verweis wie bei den Paketen im Über-mich-Bereich:
 * Die Repositories sind privat, und ein Verweis darauf antwortet einem
 * Besucher mit 404. Ein Kasten ohne Verweis sieht schwächer aus und ist die
 * einzige Fassung, die stimmt.
 */
function Werkbank() {
  const { werkbank } = useContent();

  return (
    <div className="mt-24 border-t border-line pt-12 sm:mt-36">
      <h3 className="text-eyebrow mb-3">{werkbank.title}</h3>
      <p className="mb-8 max-w-[68ch] text-sm leading-relaxed text-ink-dim text-pretty">
        {werkbank.lede}
      </p>

      <ul className="grid gap-4 sm:grid-cols-3">
        {werkbank.items.map((item, i) => (
          <Reveal as="li" key={item.name} delay={i * 0.05}>
            <div className="flex h-full flex-col rounded-xl border border-line bg-surface/40 p-5">
              <span className="font-mono text-sm text-ink">{item.name}</span>
              <span className="mt-2.5 block text-sm leading-relaxed text-ink-dim text-pretty">
                {item.body}
              </span>
              <span className="mt-auto block pt-4 font-mono text-[10px] text-ink-faint">
                {item.stand}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

function CaseStudyPanel({ study }: { study: CaseStudy }) {
  const inhalt = useContent();
  const { work, a11y, lang } = inhalt;
  /* Eine Tafel im Baum, nicht alle.
   *
   * Was das für den Ausdruck heißt, steht hier, weil es an keiner anderen
   * Stelle auffällt: Gedruckt wird, was im Baum steht, und das ist die
   * gewählte Tafel. Gemessen an der ausgelieferten Seite in der
   * Druckdarstellung trägt jede Fallstudie dort genau eine von drei bis vier
   * Tafeln, bei MenuCloud eine von vier, zwischen 303 und 710 Zeichen je
   * Studie. Architektur und Tech-Stack fehlen auf Papier.
   *
   * Das bleibt so. Alle Tafeln zu rendern und die inaktiven per CSS
   * auszublenden würde den Baum der Startseite um vier Architekturdiagramme
   * mit je 17 bis 30 Knoten vergrößern, dazu ihre Textfassungen, bezahlt von
   * jedem Besucher, damit ein Ausdruck vollständig ist, den die Seite gar
   * nicht als Weg anbietet. Wer die Arbeit auf Papier braucht, bekommt sie
   * über das Kurzprofil, und das ist dafür gebaut.
   *
   * `highlights` ist die Standardtafel und damit die, die gedruckt wird. Sie
   * beantwortet „Was drinsteckt", von den drei Fragen die, die ohne Bild
   * auskommt. */
  const [tab, setTab] = useState<TabId>("highlights");
  /* `MotionConfig reducedMotion="user"` nimmt die Bewegung heraus, nicht die
     Zeit. Für den Wechsel der Tafeln wird beides gebraucht. */
  const wenigerBewegung = useReducedMotion();
  const accent = ACCENT[study.accent];
  const visibleLinks = study.links.filter((link) => link.href);
  /* Titel und Adresse kommen aus derselben Liste, aus der die Artikelseite
     baut: Ein hier abgetippter Titel wäre die zweite Stelle, an der er steht. */
  const artikel = lang === "de" ? artikelDe : artikelEn;
  const chrome = lang === "de" ? chromeDe : chromeEn;
  const artikelDazu = (study.articles ?? [])
    .map((slug) => artikel.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  /* Ein Reiter erscheint nur, wo es etwas zu zeigen gibt.

     Für die Automatisierung galt das schon. Für die Architektur nicht, und
     das kostete: Fünf Fallstudien führen `architecture: ""` – MFC, Vortex,
     Synapse, Vesper und Aether. Ihr Reiter „Architektur“ stand trotzdem da
     und öffnete eine leere Tafel: null Zeichen, kein Diagramm, in beiden
     Sprachfassungen. `check:panels` hat dafür 20 Befunde gemeldet, gesehen
     hat sie niemand, weil die Kette davor bei `check:nbsp` abbrach.

     Ein Reiter ist ein Versprechen. Wer ihn anklickt und nichts bekommt,
     hält das für einen Fehler der Seite – zu Recht. Solange kein Diagramm
     hinterlegt ist, gibt es den Reiter nicht. */
  const sichtbareTabs = TAB_IDS.filter((id) => {
    if (id === "automation") return Boolean(study.automation);
    if (id === "architecture") return Boolean(study.architecture);
    return true;
  });

  /**
   * Pfeiltasten in der Reiterleiste, und nur ein Tabstopp je Fallstudie.
   *
   * Gemessen an der ausgelieferten Seite am 02.08.2026: Alle dreizehn Reiter
   * hatten `tabIndex` 0, und Pfeil rechts bewegte weder Fokus noch Auswahl.
   * Wer mit der Tastatur zum Inhalt einer Fallstudie will, musste sich durch
   * jeden einzelnen Reiter tabben, die Reiterleiste kostete mehr Stationen
   * als die Fallstudie Inhalte hat.
   *
   * Das ist das Muster, das eine Reiterleiste ausmacht: Tab springt in die
   * Leiste hinein und beim nächsten Druck wieder heraus, gewechselt wird mit
   * den Pfeilen. Deshalb bekommt nur der gewählte Reiter `tabIndex` 0.
   *
   * Auswahl folgt dem Fokus, weil die Tafel sofort daneben steht und nichts
   * nachlädt: Ein zusätzlicher Druck auf Enter wäre hier eine Station ohne
   * Gewinn. Pos1 und Ende gehören dazu, weil vier Reiter zwar wenige sind,
   * die Tasten aber nichts kosten.
   */
  const beiTaste = (event: KeyboardEvent<HTMLDivElement>) => {
    const richtung =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;

    let ziel: TabId | undefined;
    if (richtung !== 0) {
      const jetzt = sichtbareTabs.indexOf(tab);
      // Umlaufend: Vom letzten Reiter geht es auf den ersten. Eine Leiste, die
      // am Rand stumm bleibt, wirkt wie eine kaputte Taste.
      ziel =
        sichtbareTabs[
          (jetzt + richtung + sichtbareTabs.length) % sichtbareTabs.length
        ];
    } else if (event.key === "Home") {
      ziel = sichtbareTabs[0];
    } else if (event.key === "End") {
      ziel = sichtbareTabs[sichtbareTabs.length - 1];
    }
    if (!ziel) return;

    event.preventDefault();
    setTab(ziel);
    // Der Fokus muss mitgehen, sonst zeigt die Leiste etwas anderes an als die
    // Tastatur bedient. Alle Reiter stehen im Dokument, nur der `tabIndex`
    // wechselt, ein Element mit `tabIndex` -1 lässt sich so fokussieren.
    document.getElementById(`${study.id}-tab-${ziel}`)?.focus();
  };

  return (
    <article id={`case-${study.id}`} className="scroll-mt-28">
      {/* Kopf */}
      <Reveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-baseline gap-5">
            <span className={cn("font-mono text-sm", accent.text)}>
              {study.index}
            </span>
            <h3 className="text-title text-ink">{study.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase",
                accent.border,
                accent.text,
              )}
            >
              <span className={cn("size-1.5 rounded-full", accent.bg)} />
              {study.statusLabel}
            </span>
            <span className="font-mono text-[11px] text-ink-faint">
              {study.year}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <p className="mt-6 max-w-3xl text-xl leading-snug text-ink text-pretty sm:text-2xl">
          {study.tagline}
        </p>
        <p className="mt-3 font-mono text-xs text-ink-faint">{study.role}</p>
      </Reveal>

      {/* Die Bildschirmfotos zuerst: der Beleg vor dem Argument.
          Ab drei Bildern wird daraus eine blätterbare Strecke. Nebeneinander
          gelegt schrumpft bei acht Bildern jedes auf eine Breite, auf der man
          nichts mehr erkennt, und die Fallstudie wird doppelt so lang. */}
      {study.shots?.length ? (
        <Reveal delay={0.08}>
          {study.shots.length > 2 ? (
            <ShotCarousel
              shots={study.shots}
              label={a11y.shots.label}
              hinweis={a11y.shots}
            />
          ) : (
            <div
              className={cn(
                "mt-10 flex flex-col items-center gap-6",
                study.shots.length > 1 && "sm:flex-row sm:items-end",
              )}
            >
              {study.shots.map((shot) => (
                <DeviceFrame
                  key={shot.src}
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  label={shot.label}
                  variant={shot.variant}
                  /* Teilt sich der Rahmen die Zeile mit einem Telefon, bleibt
                     er schmaler als allein. Gemessen an der Fallstudie
                     MenuCloud: 316 px bei 640, 444 bei 768, 700 bei 1.024 und
                     886 ab 1.280, gegenüber 1.150, die NOURI allein bekommt.
                     `variant` steht bei dieser Aufnahme nicht im Inhalt: Der
                     Browserrahmen ist die Vorgabe des Bauteils. Ein Vergleich
                     gegen `"browser"` allein traf sie deshalb nie, und die
                     ausgelieferte Seite trug weiter den breiten Wert.
                     Ohne diese Angabe lädt der Browser für beide dasselbe. */
                  sizes={
                    (shot.variant ?? "browser") === "browser" &&
                    study.shots!.length > 1
                      ? "(max-width: 639px) 85vw, (max-width: 1279px) 70vw, 900px"
                      : undefined
                  }
                  /* `w-full` ist hier kein Beiwerk: Der Behälter ist eine
                     Spalte mit `items-center`, und darin bekommt ein Kind nur
                     die Breite, die es von sich aus mitbringt. Die kam bei
                     einer Aufnahme aus dem Bild selbst und stand erst nach dem
                     Laden fest: gemessen wuchs der Rahmen von 212 auf 340 px
                     und die Fallstudie damit um 141 px, mitten im Dokument.
                     Wer über `#hire` einstieg, bekam dadurch 0,17 bis 0,52
                     Layout-Verschiebung auf ein Budget von 0,1. */
                  className={
                    shot.variant === "phone"
                      ? "shrink-0"
                      : "w-full min-w-0 flex-1"
                  }
                />
              ))}
            </div>
          )}
        </Reveal>
      ) : null}

      {/* Begründete Leerstelle statt nachgestelltem Bild */}
      {study.keinScreenshot ? (
        <Reveal delay={0.08}>
          <p className="mt-10 max-w-[62ch] border-l-2 border-line pl-5 text-sm leading-relaxed text-ink-faint text-pretty">
            {study.keinScreenshot}
          </p>
        </Reveal>
      ) : null}

      {/* Problem und Lösung */}
      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-14">
        <Reveal>
          <h4 className="text-eyebrow mb-4">{work.labels.problem}</h4>
          <p className="leading-relaxed text-ink-dim text-pretty">
            {study.problem}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h4 className="text-eyebrow mb-4">{work.labels.solution}</h4>
          <p className="leading-relaxed text-ink-dim text-pretty">
            {study.solution}
          </p>
        </Reveal>
      </div>

      {/* Der schwierige Teil: der Abschnitt, der eine Bewerbungsseite von einem Lebenslauf trennt */}
      <Reveal delay={0.05}>
        <div
          className={cn(
            "lit relative mt-12 overflow-hidden rounded-2xl border p-7 sm:p-9",
            accent.border,
            accent.soft,
          )}
        >
          {/* Eine Stufe heller als die Etiketten daneben: Diese Tafel ist
              getönt, die anderen stehen auf einfarbigem Grund. Begründung
              samt Messung steht bei der Klasse in globals.css. */}
          <span className="text-eyebrow-strong">{work.labels.hardPart}</span>
          <h4
            className={cn(
              "mt-3 text-lg font-semibold tracking-tight sm:text-xl",
              accent.text,
            )}
          >
            {study.hardPart.title}
          </h4>
          {/* Zeilenmaß in ch statt rem: 68 Zeichen bleiben 68 Zeichen, egal
              welche Schriftgröße die Klasse gerade setzt. Gemessen lag dieser
              Absatz vorher bei 96 Zeichen pro Zeile, deutlich über dem, was
              sich noch flüssig liest. */}
          <p className="mt-4 max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
            <RichText text={study.hardPart.body} />
          </p>
        </div>
      </Reveal>

      {/* Die Rechnung aus der App, im Browser des Lesers.

          Nur bei Salati: Es ist das eine Stück der vier Systeme, das sich
          herauslösen lässt, ohne Kundendaten oder lizenzierte Inhalte
          mitzunehmen. Die anderen drei bleiben Fallstudien.

          Steht hinter der harten Stelle und vor den Reitern: Wer bis hierher
          gelesen hat, weiß, worum es geht, und die Reiter darunter sind der
          Beleg dazu.

          NOURI und Dartile tragen dieselbe Sorte Vorführung, ihre Fallstudien
          stehen aber nicht mehr zwingend hier: Seit dem Umbau auf drei
          ausführliche Fallstudien plus einen Umschalter für den Rest rendert
          `CaseStudies()` diese beiden Vorführungen gesondert, siehe
          `WeitereVorfuehrungen` unten. Nur so bleiben sie ohne Klick
          erreichbar, unabhängig davon, ob ihre Fallstudie gerade ausführlich
          oder eingeklappt ist. */}
      {study.id === "salati" ? (
        <Reveal delay={0.05}>
          <div className="mt-12">
            <PrayerTimesDemo inhalt={inhalt} />
          </div>
        </Reveal>
      ) : null}

      {/* Die Reiter */}
      <Reveal delay={0.05}>
        <div className="mt-12">
          {/* Ohne JavaScript gibt es die Reiterleiste nicht.

              Im Baum steht immer nur eine Tafel, die gewählte, das ist eine
              bewusste Entscheidung und oben begründet. Ohne Skript lässt sich
              die Wahl aber nicht ändern: Die drei anderen Reiter nehmen den
              Klick an und schweigen, und die Tafeln dahinter sind gar nicht
              da. Gemessen an der ausgelieferten Seite mit abgeschaltetem
              JavaScript: vier Reiter je Fallstudie, dreizehn insgesamt, alle
              ohne Wirkung.

              Sichtbar bleibt „Was drinsteckt" als Inhalt, nur ohne die
              Schalter, die nichts schalten. Wer ohne Skript liest, verliert
              damit nichts, was er vorher hatte, er sieht nur nicht mehr
              aus, als könne er es holen. */}
          <noscript>
            <style>{`.tafel-reiter{display:none}`}</style>
          </noscript>
          <div
            role="tablist"
            aria-label={study.name}
            onKeyDown={beiTaste}
            className="tafel-reiter flex flex-wrap gap-1.5 border-b border-line pb-3"
          >
            {sichtbareTabs.map((id) => {
              const Icon = TAB_ICONS[id];
              const selected = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  // Ein Reiter ohne Tafel ist ein halbes Muster.
                  //
                  // `role="tab"` und `aria-selected` standen hier, aber es gab
                  // keine `tabpanel` und kein `aria-controls`: gemessen 4
                  // Tab-Listen, 13 Reiter, null Tafeln. Ein Vorleseprogramm
                  // meldet dann "Registerkarte, ausgewählt" und kann von dort
                  // nirgendwohin, weil die Verbindung zum Inhalt fehlt.
                  id={`${study.id}-tab-${id}`}
                  // `aria-controls` nur am gewählten Reiter, und die Kennung
                  // gehört der Tafel, nicht dem Reiter.
                  //
                  // Gerendert wird immer nur die gewählte Tafel, AnimatePresence
                  // tauscht sie aus. An allen dreizehn Reitern gesetzt zeigten
                  // deshalb neun auf eine Kennung, die es im Dokument nicht
                  // gibt, gemessen an der ausgelieferten Seite. Ein Verweis
                  // ins Leere ist schlechter als keiner: Er behauptet ein Ziel.
                  //
                  // Die Kennung hieß danach `…-panel-architecture` und wechselte
                  // beim Umschalten mit. Zwischen dem Klick und dem Ende der
                  // Blende zeigte sie erneut ins Leere, gemessen am
                  // 02.08.2026 an der Live-Seite: bei 100 ms unauflösbar, bei
                  // 250 ms wieder da. Ein Zustand, den die statische Prüfung
                  // nicht sehen kann, weil er nur zwischen zwei Bildern
                  // besteht. Eine Tafel je Fallstudie, eine feste Kennung:
                  // Dann gibt es den Zustand nicht mehr.
                  aria-controls={selected ? `${study.id}-panel` : undefined}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                    // Die Farbfläche liegt als absolut positioniertes Geschwister
                    // darüber (für die Schiebe-Animation). Dieselbe Farbe hier
                    // zusätzlich als Hintergrund des Knopfes: Sollte das
                    // Motion-Element je nicht rendern, bliebe sonst dunkler Text
                    // auf dunklem Grund, unsichtbar statt nur unschön.
                    selected
                      ? cn("text-void", accent.bg)
                      : "text-ink-dim hover:text-ink",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId={`tab-${study.id}`}
                      className={cn("absolute inset-0 rounded-full", accent.bg)}
                      transition={{ duration: 0.35, ease: ease.expo }}
                    />
                  ) : null}
                  <Icon className="relative size-3.5" aria-hidden />
                  <span className="relative">{work.tabs[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-8">
            {/* `mode="wait"` blendet die alte Tafel erst aus und die neue dann
                ein. Das sieht ruhiger aus und kostet die Summe beider Zeiten.

                Bei `prefers-reduced-motion` ist genau das falsch: `MotionConfig`
                nimmt die Bewegung heraus, die Wartezeit bleibt. Gemessen an der
                gebauten Seite dauerte der Wechsel mit der Einstellung 452 ms und
                ohne sie 439, wer Bewegung abstellt, wartete also genauso lang
                auf eine Animation, die er gar nicht sieht.

                Mit Dauer null ist `wait` sofort durch, und die Reihenfolge
                bleibt dieselbe. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                role="tabpanel"
                id={`${study.id}-panel`}
                aria-labelledby={`${study.id}-tab-${tab}`}
                // Fokussierbar, weil die Tafel Text enthält, der selbst keine
                // Station in der Tabulator-Reihenfolge hat. Ohne das springt
                // die Tastatur vom Reiter direkt zum nächsten Reiter und
                // überspringt genau den Inhalt, den man gerade gewählt hat.
                tabIndex={0}
                data-reveal=""
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={
                  wenigerBewegung
                    ? { duration: 0 }
                    : { duration: 0.35, ease: ease.expo }
                }
              >
                {tab === "highlights" ? (
                  <TafelHighlights punkte={study.highlights} akzent={accent} />
                ) : null}

                {tab === "automation" && study.automation ? (
                  <TafelAutomation daten={study.automation} akzent={accent} />
                ) : null}

                {tab === "architecture" && study.architecture ? (
                  <ArchitectureDiagram name={study.architecture} />
                ) : null}

                {tab === "stack" ? <TafelStack gruppen={study.stack} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Reveal>

      {/* Metrics + links */}
      <div className="mt-12 flex flex-wrap items-end justify-between gap-8 border-t border-line pt-8">
        <motion.dl
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ staggerChildren: 0.08 }}
          className="flex flex-wrap gap-x-12 gap-y-6"
        >
          {study.metrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: ease.expo },
                },
              }}
              // Siehe Hero: Eine <dl> darf nur dt/dd-Paare enthalten, deshalb
              // steht die Beschriftung im <dt> und die sichtbare Reihenfolge
              // kommt von flex-col-reverse.
              data-reveal=""
              className="flex flex-col-reverse gap-1"
            >
              <dt className="text-xs text-ink-faint">{metric.label}</dt>
              <dd
                className={cn(
                  "text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
                  accent.text,
                )}
              >
                <Counter value={metric.value} />
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        {visibleLinks.length > 0 ? (
          <Reveal className="flex flex-wrap gap-2">
            {visibleLinks.map((link) => (
              /* Der Name trägt das Projekt, wo die Beschriftung allein nicht
                 trägt.

                 Die meisten Beschriftungen nennen ihr Ziel selbst
                 („salati.pro“, „Status-Page“, „Restaurant-App (Play)“). Zwei
                 tun das nicht: „Instagram“ steht bei Salati und bei MenuCloud,
                 „YouTube“ könnte morgen dazukommen. Gemessen an der
                 ausgelieferten Startseite: zwei Verweise mit dem Namen
                 „Instagram“, zwei verschiedene Konten.

                 Der sichtbare Text steht vorn, damit er im Namen enthalten
                 bleibt, sonst sagt jemand per Sprache etwas anderes, als er
                 liest. */
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label}: ${study.name}`}
                className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
              >
                {link.kind === "code" ? (
                  <GithubIcon className="size-3.5" />
                ) : null}
                {link.label}
                <ArrowUpRight
                  className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            ))}
          </Reveal>
        ) : null}

        {/* Der Weg von der Fallstudie in den Artikel.

            Sechs der sieben Fachartikel handeln von einem Fehler in genau
            diesen Systemen, der siebte von dieser Seite selbst, und aus dem
            Fallstudien-Bereich führte kein einziger Verweis dorthin, gezählt
            an der ausgelieferten Seite. Wer wissen will, wie tief das geht,
            musste weiterscrollen und dann raten, welcher Artikel zu welchem
            System gehört. */}
        {artikelDazu.length > 0 ? (
          <Reveal delay={0.04}>
            <div className="mt-8 border-t border-line pt-6">
              <h4 className="text-eyebrow mb-3">{work.labels.readOn}</h4>
              <ul className="flex flex-col gap-2">
                {artikelDazu.map((artikel) => (
                  <li key={artikel.slug}>
                    <Link
                      href={`${chrome.base}/${artikel.slug}`}
                      /* Kein Vorabladen, aus demselben Grund wie im
                         Artikel-Anriss: Diese Verweise stehen unter jeder
                         Fallstudie und zeigen zusammen auf jeden Artikel der
                         Seite. Beim Zeigen mit der Maus lädt Next weiter vor. */
                      prefetch={false}
                      /* `-my-0.5 py-0.5`: Ein einzeiliger Titel misst sonst
                         23 px hoch, gemessen bei 390 px, und liegt damit
                         unter den 24 px aus WCAG 2.5.8. Die Ausnahme für
                         Verweise mitten im Satz greift hier nicht: Jeder steht
                         allein in seiner Zeile. Optisch ändert sich nichts. */
                      className="group -my-0.5 inline-flex items-start gap-2 py-0.5 text-sm leading-relaxed text-ink-dim transition-colors hover:text-ink"
                    >
                      <ArrowUpRight
                        className="mt-1 size-3.5 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-acid"
                        aria-hidden
                      />
                      <span className="underline decoration-ink-faint/60 underline-offset-4 transition-colors group-hover:decoration-acid">
                        {artikel.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}
      </div>
    </article>
  );
}
