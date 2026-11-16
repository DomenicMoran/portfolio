"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { architekturText } from "@/content/architecture-en";
import { useContent } from "@/content/ContentProvider";
import { ease, viewportOnce } from "@/lib/motion";
import { useHorizontalScrollWheel } from "@/lib/useHorizontalScrollWheel";
import { cn } from "@/lib/utils";
import { ARCHITECTURES } from "./architectures";
import { NODE_H, TONE, type Node } from "./types";

function edgePath(from: Node, to: Node) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + (from.h ?? NODE_H);
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const mid = y1 + (y2 - y1) / 2;

  // Rechtwinklig mit gerundetem Knie, damit die Linien wie Verkabelung wirken
  // und nicht wie beliebige Kurven.
  if (Math.abs(x1 - x2) < 2) return `M ${x1} ${y1} L ${x2} ${y2}`;

  const r = Math.min(10, Math.abs(x2 - x1) / 2, Math.abs(mid - y1));
  const dir = x2 > x1 ? 1 : -1;

  return [
    `M ${x1} ${y1}`,
    `L ${x1} ${mid - r}`,
    `Q ${x1} ${mid} ${x1 + r * dir} ${mid}`,
    `L ${x2 - r * dir} ${mid}`,
    `Q ${x2} ${mid} ${x2} ${mid + r}`,
    `L ${x2} ${y2}`,
  ].join(" ");
}

export function ArchitectureDiagram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { lang } = useContent();
  const diagram = ARCHITECTURES[name];
  const kasten = useRef<HTMLDivElement>(null);
  useHorizontalScrollWheel(kasten);

  if (!diagram) return null;

  /* Die Geometrie ist in beiden Sprachen dieselbe, nur die Worte nicht.
     Uebersetzt wird deshalb beim Zeichnen und nicht in einer zweiten
     Datendatei mit denselben Koordinaten. */
  const t = (text: string) => architekturText(text, lang);

  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));

  return (
    <figure className={cn("w-full", className)}>
      {/* Bei 390 px ist das Diagramm 720 px breit: 354 px stehen rechts
          außerhalb des Bildes. Scrollen geht, nur sah man es nicht, dieselbe
          Lage wie bei den Codeblöcken in den Artikeln, und deshalb dieselbe
          Lösung. `scroll-hint` legt zwei Deckel und zwei Schatten übereinander;
          die Deckel wandern mit dem Inhalt, die Schatten bleiben stehen. Ist
          nichts zu scrollen, deckt der Deckel den Schatten zu, und der Hinweis
          erscheint genau dann, wenn er stimmt. */}
      {/* Und er ist anspringbar, weil ein Bereich, der scrollt, mit der
          Tastatur erreichbar sein muss. Gemessen bei 390 px an der
          ausgelieferten Seite: Der Kasten scrollte, `tabIndex` war -1, wer
          keine Maus benutzt, kam an die rechte Hälfte des Diagramms nicht
          heran. Der Name ist der Diagrammtitel, sonst wird der Bereich nur
          als "Bereich" angesagt. */}
      <div
        ref={kasten}
        tabIndex={0}
        role="region"
        aria-label={t(diagram.title)}
        className="scroll-hint focus-visible:outline-acid overflow-x-auto [--deckfarbe:var(--color-surface)] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {/* Mindestbreite 1150 statt 720, und das ist eine Lesbarkeitsfrage.

            Das Bild rechnet in einem 920 Einheiten breiten Koordinatensystem;
            die kleinste Beschriftung misst darin 10 Einheiten. Bei 720 px
            Mindestbreite ergibt das einen Faktor von 0,78, gemessen an der
            ausgelieferten Seite standen damit auf einem Telefon 16 der 29
            Beschriftungen unter 9 px, die kleinste bei 7,8. Am Desktop, wo das
            Bild 1152 px breit wird, sind es 12,5 px und keine darunter.

            Der Kasten scrollt ohnehin waagerecht, sobald das Bild breiter ist
            als das Fenster, bei 720 px tat er das auf einem Telefon bereits.
            Mehr Breite kostet also Scrollweg, den es schon gab, und bringt
            dieselbe Schrift wie am Desktop. */}
        <motion.svg
          viewBox={`0 0 920 ${diagram.height}`}
          className="h-auto w-full min-w-[1150px]"
          role="img"
          aria-label={`${t(diagram.title)}. ${t(diagram.caption)}`}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {/* Spurenüberschriften und Trennlinien */}
          {diagram.lanes.map((lane) => (
            <g key={lane.label}>
              <text
                x={20}
                y={lane.y}
                className="fill-[#5b5b66] font-mono text-[11px] tracking-[0.18em] uppercase"
              >
                {t(lane.label)}
              </text>
              <line
                x1={20}
                x2={900}
                y1={lane.y + 10}
                y2={lane.y + 10}
                stroke="#1c1c24"
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Die Verbinder zeichnen sich selbst */}
          {diagram.edges.map((edge, i) => {
            const from = byId.get(edge.from);
            const to = byId.get(edge.to);
            if (!from || !to) return null;

            return (
              <motion.path
                key={`${edge.from}-${edge.to}`}
                d={edgePath(from, to)}
                fill="none"
                stroke="#33333f"
                strokeWidth={1.25}
                strokeDasharray={edge.dashed ? "4 4" : undefined}
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  visible: {
                    pathLength: 1,
                    opacity: 1,
                    transition: {
                      duration: 0.7,
                      ease: ease.expo,
                      delay: 0.35 + i * 0.04,
                    },
                  },
                }}
              />
            );
          })}

          {/* Die Knoten */}
          {diagram.nodes.map((node, i) => {
            const tone = TONE[node.tone ?? "neutral"];
            const h = node.h ?? NODE_H;

            return (
              <motion.g
                key={node.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      ease: ease.expo,
                      delay: i * 0.03,
                    },
                  },
                }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={h}
                  rx={10}
                  fill={tone.fill}
                  stroke={tone.stroke}
                  strokeWidth={1}
                  strokeDasharray={node.external ? "3 3" : undefined}
                />
                <text
                  x={node.x + 14}
                  y={node.y + (node.sub ? 26 : h / 2 + 4)}
                  fill={tone.text}
                  className="text-[13px] font-medium"
                >
                  {t(node.label)}
                </text>
                {node.sub ? (
                  <text
                    x={node.x + 14}
                    y={node.y + 44}
                    fill="#75757f"
                    className="font-mono text-[10px]"
                  >
                    {node.sub ? t(node.sub) : null}
                  </text>
                ) : null}
              </motion.g>
            );
          })}
        </motion.svg>
      </div>

      {/* Das Diagramm als Text, für die, die es nicht sehen.

          Das `aria-label` am SVG fasst die Aussage in zwei Sätzen zusammen.
          Sichtbar stehen aber zwischen 17 und 30 Bausteine darin, iOS, Expo,
          Whisper, Postgres, TSE, und die sind der eigentliche Inhalt.
          Weil das SVG `role="img"` trägt, werden sie nicht vorgelesen: Ein
          Sehender liest den Stack je Ebene, ein Vorleseprogramm hört zwei
          Sätze. Eine Zusammenfassung ist keine Entsprechung.

          Die Liste entsteht aus denselben Daten wie die Zeichnung. Ein Knoten
          gehört zu der Bahn, deren Oberkante am nächsten über ihm liegt:
          dieselbe Zuordnung, die das Auge im Bild vornimmt. */}
      <div className="sr-only">
        <p>{`${t(diagram.title)}. ${t(diagram.caption)}`}</p>
        <dl>
          {diagram.lanes.map((bahn, i) => {
            const naechste = diagram.lanes[i + 1];
            const drin = diagram.nodes.filter(
              (k) => k.y >= bahn.y && (!naechste || k.y < naechste.y),
            );
            if (drin.length === 0) return null;
            /* Auch hier durch `t()`, wie überall sonst in dieser Datei.

               Die Zeichnung übersetzte ihre Beschriftungen, die Liste
               darunter nicht: Auf der englischen Seite zeigte das Diagramm
               „Surfaces / Persistence / 11,892 recipes", und vorgelesen wurde
               „Oberflächen / Persistenz / 11.892 Rezepte". Gemessen an der
               ausgelieferten Seite fehlten so in allen vier Fallstudien
               zwischen 8 und 17 der Beschriftungen in der Fassung, die ein
               Vorleseprogramm benutzt, bei NOURI 8 von 17, bei MenuCloud
               17 von 30.

               Wer sehen kann, merkt davon nichts: Beide Fassungen sind für
               sich vollständig, und die deutsche stimmt. Sichtbar wird es
               genau für den, für den die Liste überhaupt existiert. */
            return (
              <div key={bahn.label}>
                <dt>{t(bahn.label)}</dt>
                <dd>
                  {drin
                    .map((k) =>
                      k.sub ? `${t(k.label)} (${t(k.sub)})` : t(k.label),
                    )
                    .join(", ")}
                  .
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <figcaption className="border-line mt-5 flex flex-col gap-2 border-t pt-4">
        <span className="text-ink-faint font-mono text-[11px] tracking-[0.16em] uppercase">
          {t(diagram.title)}
        </span>
        <span className="text-ink-dim max-w-3xl text-sm leading-relaxed">
          {t(diagram.caption)}
        </span>
      </figcaption>
    </figure>
  );
}
