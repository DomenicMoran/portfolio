"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";
import { useContent } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import { DisclosureButton } from "@/components/ui/DisclosureButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useDisclosureFlap } from "@/hooks/useDisclosureFlap";
import { cn } from "@/lib/utils";

function reducedMotionAbonniert(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function reducedMotionAktiv() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotion() {
  return useSyncExternalStore(
    reducedMotionAbonniert,
    reducedMotionAktiv,
    () => false,
  );
}

export function AiWorkflow() {
  const { workflow } = useContent();

  return (
    <section
      id="workflow"
      aria-labelledby="workflow-titel"
      className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:py-40"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="glow-orb animate-float bg-acid/10 top-1/4 -left-20 size-[32rem]" />
        <div
          className="glow-orb animate-float bg-ink/5 right-0 bottom-0 size-[28rem]"
          style={{ animationDelay: "-7s" }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          titleId="workflow-titel"
          eyebrow={workflow.eyebrow}
          title={workflow.title}
          lede={workflow.lede}
        />

        <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
          {/* Die Grundsätze */}
          <ol className="flex flex-col">
            {workflow.principles.map((principle, i) => (
              <PrincipleRow
                key={principle.n}
                principle={principle}
                delay={i * 0.04}
                hideLabel={workflow.disclosure.principleHide}
              />
            ))}
          </ol>

          {/* Das Terminalfenster */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <AgentTerminal />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrincipleRow({
  principle,
  delay,
  hideLabel,
}: {
  principle: Content["workflow"]["principles"][number];
  delay: number;
  hideLabel: string;
}) {
  const { lang } = useContent();
  const regionId = `workflow-grundsatz-${principle.n}`;
  const { offen, umschalten } = useDisclosureFlap();
  const teaserEnd = principle.body.search(/[.!?](\s|$)/);
  const teaser =
    teaserEnd === -1 ? principle.body : principle.body.slice(0, teaserEnd + 1);
  const expandLabel =
    lang === "de"
      ? `Mehr zu „${principle.title}"`
      : `More on “${principle.title}"`;

  return (
    <Reveal
      as="li"
      delay={delay}
      className="group border-line border-t py-8 first:border-t-0 first:pt-0"
    >
      <div className="flex gap-5 sm:gap-8">
        <span className="text-ink-faint group-hover:text-acid shrink-0 pt-1 font-mono text-xs transition-colors">
          {principle.n}
        </span>
        <div className="min-w-0">
          <h3 className="text-ink text-lg font-semibold tracking-tight sm:text-xl">
            {principle.title}
          </h3>
          <p className="text-ink-faint mt-3 text-sm leading-relaxed text-pretty">
            {teaser}
            {teaser.length < principle.body.length ? "…" : ""}
          </p>
          <DisclosureButton
            offen={offen}
            expandLabel={expandLabel}
            hideLabel={hideLabel}
            ariaControls={regionId}
            onToggle={umschalten}
            className="mt-4"
          />
          <div id={regionId} className={cn(!offen && "hidden")}>
            <p className="text-ink-dim mt-4 leading-relaxed text-pretty">
              {principle.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {principle.artifacts.map((artifact) => (
                <li
                  key={artifact}
                  className="border-line bg-surface/60 text-ink-faint rounded-md border px-2.5 py-1 font-mono text-[10px] tracking-wide"
                >
                  {artifact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

const LINE_STYLE = {
  prompt: { prefix: "›", className: "text-ink" },
  think: { prefix: "·", className: "text-ink-faint" },
  run: { prefix: "→", className: "text-acid" },
  warn: { prefix: "!", className: "text-acid" },
  ok: { prefix: "✓", className: "text-acid" },
} as const;

/**
 * Spielt einen aufgezeichneten Agentendurchlauf ab.
 *
 * Mit Absicht eine *Aufzeichnung* und keine vorgetäuschte Sitzung: Sie ist als
 * Nachzeichnung ausgewiesen, und die Schaltfläche „Nochmal“ macht deutlich,
 * dass hier etwas abgespielt wird. Eine Bewerbungsseite, die ein Terminal live
 * vortäuscht, tut genau das, wogegen der Text daneben argumentiert.
 */
function AgentTerminal() {
  const { workflow, a11y } = useContent();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [shown, setShown] = useState(0);
  const [runId, setRunId] = useState(0);

  const lines = workflow.demo.lines;

  // Zurückspulen während des Renderns, wenn die Schaltfläche runId erhöht:
  // dasselbe Muster wie bei der Palette: kein Effekt, kein Nachziehen-Rendern,
  // kein Aufblitzen der alten Zeilen.
  const [playedRun, setPlayedRun] = useState(runId);
  if (runId !== playedRun) {
    setPlayedRun(runId);
    setShown(0);
  }

  /**
   * Bei reduzierter Bewegung steht die Aufzeichnung sofort vollständig da.
   *
   * Der Kasten füllt sich Zeile für Zeile, alle 620 ms eine. Gemessen an der
   * ausgelieferten Seite braucht er damit 6,6 Sekunden bis zum Endstand, und
   * zwar genauso lange, wenn jemand Bewegung abgeschaltet hat. Die Einstellung
   * heißt aber nicht „langsamer", sondern „zeig mir das Ergebnis, nicht den
   * Weg dorthin". Wer sie setzt, tut das oft nicht aus Geschmack: Bewegung
   * kann Schwindel und Übelkeit auslösen, und eine Zeile, die alle 620 ms
   * nachrückt, verschiebt den Text darunter 51-mal.
   *
   * Der Wiederholen-Knopf bleibt, er ist eine bewusste Handlung.
   */
  const wenigerBewegung = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (wenigerBewegung) return;

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setShown(index);
      if (index >= lines.length) window.clearInterval(timer);
    }, 620);

    return () => window.clearInterval(timer);
  }, [inView, lines.length, runId, wenigerBewegung]);

  /**
   * Im Ausdruck stehen alle Zeilen sofort da.
   *
   * Die Aufzeichnung läuft erst los, wenn der Kasten in den Sichtbereich
   * kommt. Beim Drucken kommt er das nie: `shown` bleibt auf 0, und auf dem
   * Papier steht ein leerer Terminalrahmen mit Überschrift, die Stelle, an
   * der die Seite ihre Arbeitsweise zeigt, ausgerechnet leer.
   */
  /* Abgeleitet statt im Effekt gesetzt: Ein `setShown` direkt im Effekt
     stößt einen zweiten Renderdurchgang an, und React beanstandet das zu
     Recht. Der Endstand ist hier keine Zustandsänderung, sondern eine
     Rechnung aus zwei Angaben. */
  const sichtbar = wenigerBewegung && inView ? lines.length : shown;

  useEffect(() => {
    const druck = window.matchMedia("print");
    const alleZeigen = () => setShown(lines.length);
    const beiDruck = () => {
      if (druck.matches) alleZeigen();
    };

    beiDruck();
    window.addEventListener("beforeprint", alleZeigen);
    druck.addEventListener("change", beiDruck);

    return () => {
      window.removeEventListener("beforeprint", alleZeigen);
      druck.removeEventListener("change", beiDruck);
    };
  }, [lines.length]);

  return (
    <div
      ref={ref}
      className="lit border-line bg-base overflow-hidden rounded-2xl border"
    >
      <div className="border-line flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="bg-line size-2.5 rounded-full" />
          <span className="bg-line size-2.5 rounded-full" />
          <span className="bg-line size-2.5 rounded-full" />
        </div>
        <span className="text-ink-faint font-mono text-[10px] tracking-[0.14em] uppercase">
          agent-session
        </span>
        {/* 32px statt 24: 24×24 ist exakt die WCAG-Untergrenze und selbst mit
            Maus fummelig. Das Symbol bleibt klein, die Trefferfläche wächst. */}
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="no-print text-ink-faint hover:bg-raised hover:text-ink -mr-1.5 grid size-8 place-items-center rounded-md transition-colors"
          aria-label={a11y.replay}
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* `data-agent-session`: die Kennung, an der `check:print` erkennt, ob
          dieser Kasten schon läuft. Er ist die einzige Stelle der Startseite,
          deren Inhalt erst nach der Hydration entsteht, im Druck vollständig,
          am Bildschirm Zeile für Zeile. Ohne ein Signal misst der Prüflauf die
          Serverfassung mit null Zeilen und meldet fehlenden Text, sobald die
          Maschine langsam genug ist. Eine Wartezeit dafür wäre eine Wette. */}
      <div
        data-agent-session=""
        className="min-h-[19rem] p-4 font-mono text-[12px] leading-relaxed sm:min-h-[21rem]"
      >
        {lines.slice(0, sichtbar).map((line, i) => {
          const style = LINE_STYLE[line.kind as keyof typeof LINE_STYLE];
          return (
            <p
              key={`${runId}-${i}`}
              data-reveal=""
              className={cn(
                "animate-fade-rise flex gap-2.5 py-1",
                style.className,
              )}
            >
              {/* `aria-hidden`, weil das Zeichen ein Aufzählungszeichen ist:
                  › für den Befehl, · für die Notiz, → für das Ergebnis. Ein
                  Vorleseprogramm sagte bisher „größer als" vor jeder
                  Befehlszeile. Sichtbar bleibt es und trägt auf 60 % Deckung
                  2,60:1, als Schmuck ist das die Ausnahme, die die WCAG
                  dafür vorsieht, und `check:contrast` nimmt es an derselben
                  Regel heraus wie den Trennpunkt im One-Pager. */}
              <span aria-hidden className="shrink-0 opacity-60">
                {style.prefix}
              </span>
              <span className="text-pretty">{line.text}</span>
            </p>
          );
        })}

        {sichtbar < lines.length ? (
          <span className="animate-caret bg-acid inline-block h-3.5 w-1.5 align-middle" />
        ) : null}
      </div>

      <p className="border-line text-ink-faint border-t px-4 py-3 text-[11px] leading-relaxed">
        {workflow.demo.label} {workflow.demo.note}
      </p>
    </div>
  );
}

/**
 * Der Geschwindigkeitsvergleich für sich. Steht zwischen Arbeitsweise und
 * Fähigkeiten.
 */
export function DeliverySpeed() {
  const { workflow } = useContent();
  const { speed } = workflow;

  return (
    <section className="px-6 pb-28 sm:pb-40">
      <div className="mx-auto max-w-6xl">
        <div className="lit border-line bg-surface/40 rounded-3xl border p-8 sm:p-12">
          <span className="text-eyebrow">{speed.eyebrow}</span>
          <h3 className="text-title text-ink mt-4 max-w-3xl text-balance">
            {speed.title}
          </h3>
          <p className="text-ink-dim mt-4 max-w-[62ch] leading-relaxed text-pretty">
            {speed.lede}
          </p>

          {/* Drei gezählte Werte statt zweier Balken ohne Skala.
              Balken brauchen eine gemeinsame Einheit; Tage, Versionen und
              Stunden je Version haben keine. Als Zahlen tragen dieselben
              Angaben mehr und behaupten weniger. */}
          <dl className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-3">
            {speed.facts.map((fakt, i) => (
              <Reveal
                key={fakt.label}
                delay={0.08 * i}
                className="flex flex-col-reverse gap-1.5"
              >
                <dt className="flex flex-col gap-1">
                  <span className="text-ink text-sm leading-snug">
                    {fakt.label}
                  </span>
                  <span className="text-ink-faint text-xs leading-relaxed text-pretty">
                    {fakt.note}
                  </span>
                </dt>
                <dd className="text-acid text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  {fakt.value}
                </dd>
              </Reveal>
            ))}
          </dl>

          {/* Zeilenmaß in ch: gemessen lief dieser Absatz vorher bei 112
              Zeichen pro Zeile, deutlich jenseits des Lesbaren. */}
          <p className="text-ink-faint mt-8 max-w-[58ch] text-xs leading-relaxed">
            {speed.note}
          </p>
        </div>
      </div>
    </section>
  );
}
