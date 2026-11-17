"use client";

import { useEffect } from "react";

/**
 * Beim Drucken gibt es kein Scrollen. `next/image` setzt ohne `priority`
 * `loading="lazy"`, und was nie in den Sichtbereich kam, bleibt ein leerer
 * Rahmen auf dem Papier.
 *
 * Auf der Startseite hängen die Fallstudienbilder erst nach dem ersten
 * HTML. Wer sofort druckt, hat die Dateien sonst noch nicht angefordert.
 * `beforeprint` und ein Wechsel auf `print` holen sie nach, bevor der
 * Dialog öffnet.
 */
export function PreparePrintImages() {
  useEffect(() => {
    const laden = () => {
      for (const bild of document.querySelectorAll<HTMLImageElement>(
        'img[loading="lazy"]',
      )) {
        bild.loading = "eager";
      }
    };
    const media = window.matchMedia("print");
    const onMedia = (ereignis: MediaQueryListEvent) => {
      if (ereignis.matches) laden();
    };
    window.addEventListener("beforeprint", laden);
    media.addEventListener("change", onMedia);
    if (media.matches) laden();
    return () => {
      window.removeEventListener("beforeprint", laden);
      media.removeEventListener("change", onMedia);
    };
  }, []);
  return null;
}
