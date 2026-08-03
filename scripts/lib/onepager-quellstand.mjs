import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Die Dateien, aus denen das Kurzprofil entsteht.
 *
 * Nicht nur das Bauteil: Der Inhalt kommt aus `site.ts` und `en.ts`, und die
 * Regel, die das Blatt auf eine Seite zieht, steht im Druckteil von
 * `globals.css`. Ändert sich eine davon, kann das ausgelieferte PDF veraltet
 * sein.
 *
 * Bewusst grob: Eine Änderung an `site.ts`, die den One-Pager gar nicht
 * betrifft, verlangt hier ebenfalls einen neuen Druck. Das ist die richtige
 * Richtung — ein überflüssiger Lauf kostet zwanzig Sekunden, ein veraltetes
 * Blatt kostet die Bewerbung.
 */
export const QUELLEN = [
  "src/components/OnePager.tsx",
  "src/content/site.ts",
  "src/content/en.ts",
  "src/content/de.ts",
  "src/app/globals.css",
];

/** Prüfsumme über die Quellen, unabhängig von Zeilenenden. */
export function quellstand() {
  const hash = createHash("sha256");
  for (const pfad of QUELLEN) {
    /* Zeilenenden vereinheitlichen: Unter Windows checkt git mit CRLF aus,
       im Lauf auf Linux stehen LF. Ohne das wäre die Kennung auf jedem
       System eine andere, und der Wächter meldete überall einen Unterschied,
       den es nicht gibt. */
    hash.update(readFileSync(pfad, "utf8").replace(/\r\n/g, "\n"));
  }
  return hash.digest("hex").slice(0, 16);
}
