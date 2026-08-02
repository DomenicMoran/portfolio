"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Die Adresse in die Zwischenablage legen.
 *
 * Im Recruiter-Bereich stand sie zweimal, beide Male als `mailto:` — gemessen
 * am 02.08.2026 an der ausgelieferten Seite: zwei mailto-Verweise, kein
 * einziger Knopf. Auf einem Arbeitsrechner ohne eingerichtetes Mailprogramm
 * passiert bei einem Klick darauf nichts, und genau dort sitzt der Leser, den
 * diese Sektion adressiert. Wer die Adresse in Outlook oder ins
 * Bewerbermanagement einfügen will, musste sie markieren — an einem Element,
 * das auf Klick etwas anderes tut.
 *
 * Der Schreiben-Knopf daneben bleibt, weil er auf dem Telefon der kürzere Weg
 * ist. Die beiden Wege stehen nebeneinander, statt einer den anderen zu
 * ersetzen.
 *
 * Die Rückmeldung steht in einem Meldebereich, der von Anfang an im Baum
 * hängt: Ein Bereich, der erst mit seinem Inhalt erscheint, wird von den
 * meisten Vorleseprogrammen verschluckt.
 *
 * `navigator.clipboard` gibt es nur über HTTPS und nur mit Erlaubnis. Schlägt
 * es fehl, sagt der Knopf das und verweist auf die Adresse daneben, statt still
 * Erfolg zu melden.
 */
export function CopyEmail({
  email,
  label,
  done,
  failed,
}: {
  email: string;
  label: string;
  done: string;
  failed: string;
}) {
  const [stand, setStand] = useState<"ruhe" | "kopiert" | "fehler">("ruhe");
  const uhr = useRef<number | null>(null);

  useEffect(() => () => {
    if (uhr.current) window.clearTimeout(uhr.current);
  }, []);

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setStand("kopiert");
    } catch {
      setStand("fehler");
    }
    if (uhr.current) window.clearTimeout(uhr.current);
    uhr.current = window.setTimeout(() => setStand("ruhe"), 2600);
  };

  const meldung = stand === "kopiert" ? done : stand === "fehler" ? failed : "";

  return (
    <>
      <button
        type="button"
        onClick={kopieren}
        // Der Name nennt die Adresse mit, weil "Adresse kopieren" allein nicht
        // sagt, welche. Vorgelesen steht die Sektion sonst voller Verweise auf
        // ein "es", das nirgends benannt ist.
        aria-label={`${label}: ${email}`}
        className="group inline-flex items-center gap-2 rounded-full border border-line bg-base/60 px-4 py-2 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
      >
        {stand === "kopiert" ? (
          <Check className="size-3.5 text-acid" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
        {email}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {meldung}
      </span>

      {/* Sichtbar nur, solange etwas zu sagen ist. Der Knopf selbst wechselt
          nur sein Symbol; ohne diesen Text bliebe der Erfolg eine Vermutung. */}
      {meldung ? (
        <span
          aria-hidden
          className={`self-center font-mono text-[11px] ${
            stand === "fehler" ? "text-bad" : "text-acid"
          }`}
        >
          {meldung}
        </span>
      ) : null}
    </>
  );
}
