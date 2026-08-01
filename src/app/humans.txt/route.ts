import geprueft from "@/content/geprueft.json";

/**
 * humans.txt als Route statt als Datei.
 *
 * Sie lag zuerst in `public/`, mit den Zahlen eingetippt. Damit war sie ab dem
 * ersten Lauf des Zahlen-Automaten überholt — und ausgerechnet die Datei, die
 * von den Belegen dieser Seite erzählt, wäre dann die einzige gewesen, die
 * niemand nachzieht.
 *
 * Als Route liest sie dieselbe Quelle wie alles andere.
 */
export const dynamic = "force-static";

export function GET() {
  const stand = geprueft.datum.split("-").reverse().join(".");

  const text = `/* WER */
  Name:     Domenic Moran
  Rolle:    AI Product Engineer
  Ort:      Berlin, Deutschland
  Kontakt:  domenicmoran@gmail.com
  Profil:   https://github.com/DomenicMoran

/* WOMIT */
  Next.js 16 (App Router, React Server Components)
  React 19, TypeScript, Tailwind CSS 4
  Framer Motion, Lenis
  Vercel, Playwright, Vitest

/* WIE */
  Zwei Wurzel-Layouts, eines je Sprache, damit <html lang> stimmt.
  Jeder Text und jede Zahl steht in src/content, nie in einer Komponente.
  Ueber der Falz nur CSS-Animationen: Eine JS-Animation mit opacity 0 waere
  bis zur Hydration unsichtbar und damit das spaete LCP-Element.
  prefers-reduced-motion schaltet Lenis und den Cursor gar nicht erst ein.

/* BELEGE */
  Ein Automat bei GitHub zaehlt taeglich die Commits ueber alle
  ${geprueft.repos} Repositories, schreibt sie in diese Seite und liefert aus.
  Stand ${stand}: ${geprueft.commitsHead} Commits, ueber die GitHub-API gezaehlt.
  Nur was auch bei GitHub liegt, zaehlt mit — lokale Staende nicht.
  Der Bau scheitert, wenn eine private Datei in public/ liegt.

/* DANKE */
  An alle, die ihre Fehler oeffentlich aufgeschrieben haben.
  Die Haelfte dieser Seite waere ohne sie nicht entstanden.
`;

  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
