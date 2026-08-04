import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Die Dateien, aus denen das Kurzprofil entsteht.
 *
 * Bleiben aufgelistet, weil der Wächter sie im Fehlerfall nennt: Wer hört,
 * dass ein Blatt veraltet ist, will wissen, wo er nachsehen soll.
 */
export const QUELLEN = [
  "src/components/OnePager.tsx",
  "src/content/site.ts",
  "src/content/en.ts",
  "src/content/de.ts",
  "src/app/globals.css",
];

/** Die beiden gebauten Blätter, aus denen die Kennung entsteht. */
const BLAETTER = [
  join(".next", "server", "app", "onepager.html"),
  join(".next", "server", "app", "en", "onepager.html"),
];

/**
 * Prüfsumme über das, was auf den Blättern steht.
 *
 * Gehasht wurden zuvor die fünf Quelldateien im Ganzen. Das war bewusst grob
 * — und die Grobheit hat zweimal in zwei Tagen einen Neudruck verlangt, ohne
 * dass sich am Blatt ein Zeichen geändert hatte: einmal für einen Kommentar
 * über der Anschrift in `site.ts`, einmal für einen Satz auf der Fehlerseite
 * in `de.ts` und `en.ts`. Ein Wächter, der regelmäßig ohne Grund anschlägt,
 * wird irgendwann übergangen.
 *
 * Gemessen wird deshalb der sichtbare Text der beiden gebauten Blätter. Das
 * ist genauer in beide Richtungen: Eine Änderung am Blatt fällt auf, auch
 * wenn sie aus einer Datei kommt, die hier nie gelistet war; eine Änderung
 * daneben nicht.
 *
 * Ohne Bau gibt es keine Kennung. Der Wächter sagt das und scheitert nicht:
 * Er läuft in derselben CI, die vorher baut, und örtlich vor jedem Druck.
 */
export function quellstand() {
  const hash = createHash("sha256");
  for (const datei of BLAETTER) {
    const html = readFileSync(datei, "utf8");
    const blatt = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const text = blatt
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    hash.update(text);
  }
  return hash.digest("hex").slice(0, 16);
}
