"use client";

import { useEffect } from "react";

/**
 * Weiches Scrollen mit Lenis, angetrieben von `requestAnimationFrame`.
 *
 * Bewusst nicht geladen, wenn jemand weniger Bewegung eingestellt hat: Einem
 * Menschen mit Gleichgewichtsempfindlichkeit das Scrollen aus der Hand zu
 * nehmen, ist das Unfreundlichste, was eine „hochwertige" Seite tun kann. Dann
 * bleibt das Scrollen des Browsers unangetastet.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    /*
      Nachgeladen statt mitgeliefert.

      Der Kommentar oben und AGENTS.md sagen beide, Lenis werde bei
      eingestellter Bewegungsreduktion „gar nicht erst geladen". Gemessen an
      der ausgelieferten Seite stimmte nur die Hälfte davon: Die Bibliothek
      lag im gemeinsamen Bündel der Startseite und ging an jeden Besucher,
      auch an den, der sie nie benutzt. Nicht eingehängt zu werden ist etwas
      anderes als nicht geladen zu werden.

      Der dynamische Import steht deshalb hinter der Abfrage. Wer Bewegung
      reduziert hat, lädt kein Byte davon; alle anderen laden es, während die
      Seite schon steht.
    */
    let aufraeumen = () => {};
    let abgebrochen = false;

    void (async () => {
      const { default: Lenis } = await import("lenis");
      /* Zwischen Anfrage und Antwort kann die Komponente abgebaut worden
         sein. Ohne diese Abfrage liefe danach eine Animationsschleife auf
         einer Seite weiter, die es nicht mehr gibt. */
      if (abgebrochen) return;
      aufraeumen = starte(
        new Lenis({
          duration: 1.1,
          // Entspricht --ease-out-expo, damit Nachlauf und CSS-Übergänge zusammenpassen.
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.6,
        }),
      );
    })();

    return () => {
      abgebrochen = true;
      aufraeumen();
    };
  }, []);

  return null;
}

/**
 * Hängt eine Lenis-Instanz ein und liefert das Aufräumen zurück.
 *
 * Steht als eigene Funktion daneben, damit der Effekt oben nur noch aus der
 * Entscheidung besteht: laden oder nicht.
 */
function starte(lenis: import("lenis").default) {
  let frame = 0;
  const raf = (time: number) => {
    lenis.raf(time);
    frame = requestAnimationFrame(raf);
  };
  frame = requestAnimationFrame(raf);

  // Sprungmarken innerhalb der Seite müssen über Lenis laufen: Sonst kämpft
  // der Sprung des Browsers gegen die Animationsschleife und landet daneben.
  const onAnchorClick = (event: MouseEvent) => {
    const anchor = (event.target as HTMLElement | null)?.closest?.(
      'a[href^="#"]',
    ) as HTMLAnchorElement | null;
    if (!anchor) return;

    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    lenis.scrollTo(target as HTMLElement, { offset: -80 });
    history.replaceState(null, "", id);

    /*
        Den Fokus mitnehmen, nicht nur den Bildausschnitt.

        Ein Klick auf `#inhalt` löst normalerweise zwei Dinge aus: Der Browser
        scrollt hin und setzt den Fokus auf das Ziel. Hier wird das
        Standardverhalten unterbunden, damit Lenis scrollen kann — und damit
        blieb auch der Fokus stehen. Gemessen am 02.08.2026: Nach dem
        Sprunglink war `document.activeElement` weiterhin der Link selbst, der
        Lesepunkt einer Vorlesesoftware also unverändert in der Kopfleiste.
        Für den Sprunglink heißt das: Er tut sichtbar etwas und für den, der
        ihn am dringendsten braucht, nichts.

        `preventScroll` ist nötig, weil `focus()` sonst selbst springt und
        gegen die laufende Bewegung von Lenis arbeitet.
      */
    const ziel = target as HTMLElement;
    if (ziel.tabIndex < 0 && !ziel.hasAttribute("tabindex")) ziel.tabIndex = -1;
    ziel.focus({ preventScroll: true });
  };

  document.addEventListener("click", onAnchorClick);

  return () => {
    document.removeEventListener("click", onAnchorClick);
    cancelAnimationFrame(frame);
    lenis.destroy();
  };
}
