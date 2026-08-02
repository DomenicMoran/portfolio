"use client";

import { Printer } from "lucide-react";

/**
 * „Als PDF sichern" ist wörtlich der Druckdialog des Browsers: Jedes
 * Betriebssystem bringt einen PDF-Schreiber mit, und die Druckregeln in
 * globals.css sind auf A4 geschrieben. So muss keine PDF-Bibliothek zum
 * Besucher ausgeliefert werden.
 */
export function PrintButton() {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-[#e4e4ea] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-8 py-3">
        <span className="text-sm text-[#4a4a55]">
          Als PDF speichern: im Druckdialog „Als PDF sichern“ wählen.
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#101014] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
        >
          <Printer className="size-4" aria-hidden />
          Drucken / PDF
        </button>
      </div>
    </div>
  );
}
