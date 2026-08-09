"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Den Codeblock in die Zwischenablage legen.
 *
 * Die Kästen sind Auszüge aus dem Produktivcode, fünf bis sechzehn Zeilen, und
 * einer davon läuft seitlich über. Wer sie ausprobieren will, musste sie
 * markieren, in einem waagerecht scrollenden Kasten auf einem Telefon ist das
 * eine Geduldsprobe, und am Ende hat man die halbe Seite mit.
 *
 * Aufbau wie bei `CopyEmail`, aus denselben Gründen: Die Rückmeldung hängt von
 * Anfang an im Baum, weil ein Bereich, der erst mit seinem Inhalt erscheint,
 * von den meisten Vorleseprogrammen verschluckt wird. Schlägt das Kopieren
 * fehl, sagt der Knopf das, statt still Erfolg zu melden.
 *
 * Der Knopf steht über dem Kasten und nicht darin: In einem `pre` mit
 * `overflow-x: auto` würde er mitscrollen und beim breitesten Block aus dem
 * Bild wandern.
 */
export function CopyCode({
  code,
  label,
  done,
  failed,
}: {
  code: string;
  label: string;
  done: string;
  failed: string;
}) {
  const [stand, setStand] = useState<"ruhe" | "kopiert" | "fehler">("ruhe");
  const uhr = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (uhr.current) window.clearTimeout(uhr.current);
    },
    [],
  );

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStand("kopiert");
    } catch {
      setStand("fehler");
    }
    if (uhr.current) window.clearTimeout(uhr.current);
    uhr.current = window.setTimeout(() => setStand("ruhe"), 2600);
  };

  const meldung = stand === "kopiert" ? done : stand === "fehler" ? failed : "";

  return (
    /* `no-print`: Auf Papier ist der Knopf ein totes Bedienelement. Gemessen
       am gedruckten Kassen-Artikel standen drei „Kopieren" neben Kästen, die
       niemand anklicken kann. */
    <div className="no-print mb-2 flex items-center justify-end gap-3">
      {meldung ? (
        <span
          aria-hidden
          className={`font-mono text-[11px] ${stand === "fehler" ? "text-bad" : "text-acid"}`}
        >
          {meldung}
        </span>
      ) : null}

      {/* 32 px hoch, nicht 24: Die Untergrenze der Norm ist selbst mit Maus
          fummelig. Das Symbol bleibt klein, die Trefferfläche wächst. */}
      {/* Kein `aria-label`: Die Beschriftung steht sichtbar im Knopf und ist
          damit schon sein Name. Ein zweiter, gleichlautender Name wäre nur
          eine weitere Stelle, an der eine Übersetzung auseinanderlaufen kann. */}
      <button
        type="button"
        onClick={kopieren}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface/60 px-2.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
      >
        {stand === "kopiert" ? (
          <Check className="size-3 text-acid" aria-hidden />
        ) : (
          <Copy className="size-3" aria-hidden />
        )}
        {label}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {meldung}
      </span>
    </div>
  );
}
