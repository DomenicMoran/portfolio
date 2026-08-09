"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { Nav } from "@/components/Nav";
import { Cursor } from "@/components/ui/Cursor";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

/**
 * Hält den wenigen Zustand, der die ganze Seite betrifft (Befehlspalette offen)
 * und hängt die globalen Interaktionsebenen ein. Weil er hier liegt, bleibt
 * `page.tsx` eine Server Component und liefert die Abschnitte als statisches
 * HTML aus.
 */
export function SiteShell({
  otherHref,
  hashBase,
}: { otherHref?: string; hashBase?: string } = {}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  /**
   * Verzögert geladene Bilder nachholen, sobald der Browser Zeit hat.
   *
   * `next/image` setzt ohne `priority` ein `loading="lazy"`, und das ist am
   * Bildschirm richtig: Wer nie hinunterscrollt, lädt die Produktaufnahmen
   * auch nicht. Beim Drucken gibt es kein Scrollen, und was nie geladen
   * wurde, kommt auch nicht aufs Papier.
   *
   * Gemessen am 02.08.2026, Startseite frisch geladen und sofort gedruckt:
   * 17 Bildobjekte und 1.771 KB im PDF gegen 23 Objekte und 3.098 KB nach
   * vollständigem Durchfahren. Sechs von elf Produktaufnahmen fehlten also —
   * leere Rahmen genau dort, wo das Blatt zeigen soll, dass es die Produkte
   * gibt.
   *
   * Hier und nicht in der Bildstrecke: Drei der Aufnahmen stehen als einzelne
   * Rahmen außerhalb jeder Strecke, ein Nachladen im Karussell erwischte sie
   * nicht. Diese Insel gibt es genau einmal je Seite und sie sieht das ganze
   * Dokument.
   *
   * In der Leerlaufzeit, nicht mit `priority`: Der kritische Pfad bleibt
   * unberührt — gemessener LCP 232 und 240 ms, vorher wie nachher. Ohne
   * `requestIdleCallback`, das Safari bis heute nicht kennt, greift ein
   * Zeitgeber.
   */
  useEffect(() => {
    const nachladen = () => {
      for (const bild of document.querySelectorAll("img")) {
        if (bild.loading === "lazy") bild.loading = "eager";
      }
    };

    /* Nachgeladen wird bei der ersten Berührung, nicht nach fester Zeit.

       Vorher lief das unbedingt nach dem Leerlauf: Gemessen holte die
       Startseite dadurch auf dem Telefon 12 Bilder mit 255 kB, auch bei
       jemandem, der nie scrollt und nie druckt.

       Nur auf `beforeprint` zu warten, war die andere Übertreibung: Der
       Ausdruck kam dann auf 13 bis 20 von 23 Bildobjekten, je nachdem, wie
       schnell der Druckdialog aufging. Ein Blatt mit leeren Rahmen ist
       schlechter als 255 kB.

       Die erste Berührung trifft beides: Wer liest, löst sie in der ersten
       Sekunde aus, und bis zum Druckbefehl sind die Bilder da. Wer die Seite
       öffnet und wieder schließt, lädt nichts nach. `beforeprint` bleibt als
       letzter Halt für den, der ohne jede Bewegung druckt. */
    const ereignisse = [
      "scroll",
      "pointerdown",
      "pointermove",
      "keydown",
      "beforeprint",
    ] as const;
    const einmal = () => {
      nachladen();
      for (const e of ereignisse) window.removeEventListener(e, einmal);
    };
    for (const e of ereignisse)
      window.addEventListener(e, einmal, { passive: true });
    return () => {
      for (const e of ereignisse) window.removeEventListener(e, einmal);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      <Nav
        onOpenPalette={() => setPaletteOpen(true)}
        otherHref={otherHref}
        hashBase={hashBase}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}
