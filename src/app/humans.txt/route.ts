import { datumLang } from "@/lib/date-format";
import verified from "@/content/verified.json";

/**
 * humans.txt als Route statt als Datei.
 *
 * Sie lag zuerst in `public/`, mit den Zahlen eingetippt. Damit war sie ab dem
 * ersten Lauf des Zahlen-Automaten überholt, und ausgerechnet die Datei, die
 * von den Belegen dieser Seite erzählt, wäre dann die einzige gewesen, die
 * niemand nachzieht.
 *
 * Als Route liest sie dieselbe Quelle wie alles andere.
 */
export const dynamic = "force-static";

export function GET() {
  const stand = datumLang(verified.date);

  const text = `/* WER */
  Name:     Domenic Moran
  Rolle:    AI Product Engineer
  Ort:      Berlin, Deutschland
  Kontakt:  kontakt@domenicmoran.de
  Profil:   https://github.com/DomenicMoran

/* WOMIT */
  Next.js 16 (App Router, React Server Components)
  React 19, TypeScript, Tailwind CSS 4
  Framer Motion, Lenis
  Vercel, Playwright, Vitest

/* WIE */
  Zwei Wurzel-Layouts, eines je Sprache, damit <html lang> stimmt.
  Jeder Text und jede Zahl steht in src/content, nie in einer Komponente.
  Über der Falz nur CSS-Animationen: Eine JS-Animation mit opacity 0 wäre
  bis zur Hydration unsichtbar und damit das späte LCP-Element.
  prefers-reduced-motion schaltet Lenis und den Cursor gar nicht erst ein.

/* BELEGE */
  Die Commits über alle ${verified.repos} Repositories werden über die
  GitHub-API gezählt und von Hand in diese Seite geschrieben.
  Stand ${stand}: ${verified.commitsHead} Commits, über die GitHub-API gezählt.
  Nur was auch bei GitHub liegt, zählt mit, lokale Stände nicht.
  Der Bau scheitert, wenn eine private Datei in public/ liegt.

/* DANKE */
  An alle, die ihre Fehler öffentlich aufgeschrieben haben.
  Die Hälfte dieser Seite wäre ohne sie nicht entstanden.
`;

  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
