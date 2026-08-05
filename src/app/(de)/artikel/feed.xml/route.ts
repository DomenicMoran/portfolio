import { artikelDe, chromeDe } from "@/content/articles";
import { site } from "@/content/site";

/**
 * Atom-Feed der Artikel.
 *
 * Kostet dreißig Zeilen und ist für die Zielgruppe dieser Seite kein
 * Beiwerk: Wer Entwickler einstellt, liest häufig selbst über einen Leser.
 * Ein Feed ist außerdem der einzige Weg, auf dem jemand von einem neuen
 * Artikel erfährt, ohne die Seite erneut aufzurufen.
 *
 * Atom statt RSS, weil das Format Zeitangaben und Sprachen sauber definiert.
 */
export const dynamic = "force-static";

/** `<` und `&` müssen im XML maskiert sein, sonst ist der Feed ungültig. */
function xml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function GET() {
  const basis = site.url.replace(/\/$/, "");
  const neuestes = artikelDe[0]?.date ?? "2026-01-01";

  const eintraege = artikelDe
    .map((a) => {
      const url = `${basis}${chromeDe.base}/${a.slug}`;
      return `  <entry>
    <title>${xml(a.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${a.date}T12:00:00Z</updated>
    <summary>${xml(a.dek)}</summary>
${a.tags.map((t) => `    <category term="${xml(t)}"/>`).join("\n")}
  </entry>`;
    })
    .join("\n");

  /* `<icon>`: Ohne das Zeichen zeigt ein Feedleser die Einträge ohne
     Absender, und in einer Liste mit zwanzig Quellen ist genau das der
     Unterschied zwischen wiedererkannt und übersehen. Dieselbe Adresse
     wie im Dokumentkopf; die Begründung steht hier und nicht in der
     ausgelieferten Datei, die ein Leseprogramm auswertet. */
  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="de">
  <title>${xml(chromeDe.title)}</title>
  <subtitle>${xml(chromeDe.lede)}</subtitle>
  <link href="${basis}${chromeDe.base}/feed.xml" rel="self"/>
  <link href="${basis}${chromeDe.base}"/>
  <id>${basis}${chromeDe.base}</id>
  <updated>${neuestes}T12:00:00Z</updated>
  <icon>${basis}/icon</icon>
  <author><name>${xml(site.name)}</name></author>
${eintraege}
</feed>
`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
