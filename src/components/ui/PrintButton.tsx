"use client";

import { Download, Printer } from "lucide-react";

/**
 * Die Leiste über dem Kurzprofil: fertige Datei oder selbst drucken.
 *
 * Der Verweis auf das PDF steht zuerst und trägt die kräftige Farbe. Das ist
 * der Grund, aus dem es die Datei überhaupt gibt: Wer ein Profil an die
 * fachliche Führung weiterreicht, braucht eine Datei, keine Anleitung. Bis
 * hierher stand auf dieser Seite nur der Druckknopf — ausgerechnet dort, wo
 * jemand landet, der auf „One-Pager" geklickt hat, war die fertige Datei
 * nicht verlinkt. Sie hing nur im Recruiter-Bereich.
 *
 * Der Druckknopf bleibt daneben: „Als PDF sichern" ist wörtlich der
 * Druckdialog des Browsers, jedes Betriebssystem bringt einen PDF-Schreiber
 * mit, und die Druckregeln in globals.css sind auf A4 geschrieben. So muss
 * keine PDF-Bibliothek zum Besucher ausgeliefert werden.
 */
export function PrintButton({
  hinweis,
  beschriftung,
  datei,
}: {
  hinweis: string;
  beschriftung: string;
  /** Die fertige Datei: Adresse und Beschriftung, je Sprache. */
  datei: { href: string; label: string };
}) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-[#e4e4ea] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-8 py-3">
        <span className="text-sm text-[#4a4a55]">{hinweis}</span>
        <div className="flex shrink-0 items-center gap-2">
          {/* `download` und kein neuer Tab: Die Datei soll im Ordner landen,
              aus dem sie weitergereicht wird, nicht in einem Betrachter. */}
          <a
            href={datei.href}
            download
            className="inline-flex items-center gap-2 rounded-full bg-[#101014] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
          >
            <Download className="size-4" aria-hidden />
            {datei.label}
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-[#c9c9d2] px-4 py-2 text-sm font-medium text-[#101014] transition-colors hover:border-[#101014]"
          >
            <Printer className="size-4" aria-hidden />
            {beschriftung}
          </button>
        </div>
      </div>
    </div>
  );
}
