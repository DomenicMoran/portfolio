"use client";

import { useEffect } from "react";

/**
 * Sperrt das Scrollen der Seite, solange etwas darüberliegt.
 *
 * Gemessen an der ausgelieferten Seite am 03.08.2026: Bei offener
 * Befehlspalette wanderte die Seite dahinter beim Drehen am Rad von 0 auf
 * 754 px, beim Telefonmenü von 0 auf 650 px. Der Dialog blieb stehen, der
 * Hintergrund lief weg, sichtbar für jeden, der einmal scrollt, während
 * etwas offen ist.
 *
 * Gesperrt wird an `<html>` und nicht an `<body>`: Der Bildlauf gehört hier
 * dem Wurzelelement, `body` hat keinen eigenen.
 *
 * **Warum kein Ausgleich für die Bildlaufleiste?** Weil es keinen braucht:
 * `scrollbar-gutter: stable` in `globals.css` hält den Platz dauerhaft frei.
 * Ohne das verschwindet beim Sperren die Leiste, der Inhalt rückt um ihre
 * Breite nach rechts, und die feste Kopfleiste bleibt stehen, der Sprung
 * wäre auffälliger als das Problem, das die Sperre löst.
 *
 * Gezählt statt geschaltet: Palette und Telefonmenü können gleichzeitig offen
 * sein. Ein einfaches Setzen und Zurücknehmen gäbe die Sperre frei, sobald
 * das erste von beiden schließt.
 */
let offen = 0;

export function useScrollSperre(aktiv: boolean) {
  useEffect(() => {
    if (!aktiv) return;

    const wurzel = document.documentElement;
    offen += 1;
    if (offen === 1) wurzel.style.overflow = "hidden";

    return () => {
      offen -= 1;
      /* Der Stil wird entfernt und nicht auf einen Wert gesetzt: Was in
         `globals.css` steht, `overflow-x: clip`, gilt danach wieder von
         selbst. Ein zurückgeschriebener Wert wäre eine zweite Stelle, an der
         dieselbe Regel steht. */
      if (offen === 0) wurzel.style.removeProperty("overflow");
    };
  }, [aktiv]);
}
