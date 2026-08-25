"use client";

import { useEffect, type RefObject } from "react";

/**
 * Gibt einen reinen Mausrad-Impuls an die Seite zurück, statt ihn in einem
 * waagerecht scrollenden Kasten verschwinden zu lassen.
 *
 * Ein Element, das nur waagerecht scrollen kann (`overflow-x-auto` ohne
 * senkrechten Überlauf), dreht `deltaY` sonst selbst in `scrollLeft` um: Der
 * Browser sucht die scrollbare Achse des am Zeiger getroffenen Elements, und
 * hier gibt es nur die eine. Am Live-System nachgemessen: Sechs Rad-Ticks
 * über einer Bildstrecke ließen `window.scrollY` exakt auf 8282,7998046875
 * stehen, während die Strecke sichtbar weiterblätterte. Wer mit der Maus über
 * eine der sieben Bildstrecken, eines der sieben Architekturdiagramme oder
 * einen Codeblock in den Artikeln scrollt, kommt auf der Seite nicht weiter,
 * bis er den Zeiger von Hand wegbewegt.
 *
 * Betroffen sind nur reine Mausrad-Nutzer: Eine Zweifinger-Wischgeste auf dem
 * Trackpad liefert `deltaX` ungleich 0 und soll weiterhin den Kasten bewegen,
 * nicht die Seite. Touch-Wischen auf dem Telefon löst gar kein `wheel`-Ereignis
 * aus und bleibt unberührt.
 */
export function useHorizontalScrollWheel(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const radweiter = (event: WheelEvent) => {
      if (event.deltaX !== 0) return;
      event.preventDefault();
      window.scrollBy({ top: event.deltaY, left: 0, behavior: "auto" });
    };
    el.addEventListener("wheel", radweiter, { passive: false });
    return () => el.removeEventListener("wheel", radweiter);
  }, [ref]);
}
