"use client";

import { useEffect } from "react";
import verified from "@/content/verified.json";

/**
 * Eine Nachricht für den, der die Entwicklerkonsole öffnet.
 *
 * Wer diese Seite fachlich prüft, öffnet irgendwann die Konsole, um zu sehen,
 * ob dort Fehler stehen. Das ist der Moment, in dem man antworten kann, und es
 * ist die einzige Stelle der Seite, an der ausschließlich Fachleute lesen.
 *
 * Deshalb steht hier kein Gruß, sondern das, was diese Person als Nächstes
 * wissen will: wo der Quelltext liegt, wann die Zahlen zuletzt nachgezählt
 * wurden, und wie man es selbst nachprüft. Drei Zeilen, kein ASCII-Bild.
 *
 * Nur im Browser und nur einmal: In der Serverausgabe hätte es nichts zu
 * suchen, und eine Konsole, die bei jeder Navigation vollläuft, ist der
 * Gegenbeweis zur Aussage.
 */
export function ConsoleGreeting() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & { __gruss?: boolean };
    if (w.__gruss) return;
    w.__gruss = true;

    const kopf = "color:#d4ff45;font:600 13px ui-monospace,monospace";
    const text = "color:#a5a5b0;font:12px ui-monospace,monospace";

    console.log(
      `%cHallo.%c Wenn du hier bist, prüfst du gerade nach. Gut.

  Quelltext dieser Seite   github.com/DomenicMoran/portfolio
  Zahlen zuletzt geprüft   ${verified.date} · ${verified.commitsHead} Commits über ${verified.repos} Repos
  Selbst nachzählen        git rev-list --count HEAD

  Die Zahlen auf dieser Seite werden stündlich gegen die Repos
  nachgezählt. Weicht eine ab, wird sie korrigiert, nicht gerundet.

  domenicmoran@gmail.com`,
      kopf,
      text,
    );
  }, []);

  return null;
}
