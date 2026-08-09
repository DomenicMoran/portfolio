import { site } from "@/content/site";

/**
 * Die Sicherheitskontaktdatei nach RFC 9116.
 *
 * Vorher lag sie als statische Datei in `public/` mit einem fest
 * eingetragenen `Expires: 2027-07-31`. Ein Datum, das ein Jahr in der Zukunft
 * steht, fällt niemandem auf, bis es vorbei ist. Ab dann behandeln Scanner
 * die Datei als ungültig, und zwar stillschweigend: Es gibt keine Meldung,
 * keinen Fehler, nur eine Datei, der niemand mehr glaubt.
 *
 * Jetzt entsteht das Datum beim Bauen, sechs Monate voraus. Der Zahlen-Automat
 * baut und liefert täglich aus, also rückt es täglich mit, die Datei kann
 * nicht ablaufen, solange die Seite gepflegt wird. Und hört die Pflege auf,
 * läuft sie nach sechs Monaten aus, was genau die richtige Aussage ist.
 *
 * RFC 9116 verlangt einen Zeitpunkt weniger als ein Jahr in der Zukunft und
 * das Format nach RFC 3339. `toISOString()` liefert genau das, mitsamt
 * Millisekunden, und die stehen in einem Ablaufdatum wie eine Zahl, die
 * jemand vergessen hat abzuschneiden. RFC 3339 erlaubt sie, verlangt sie aber
 * nicht. Wer diese Datei liest, sucht nach Schlamperei; sie gehört weg.
 */
export const dynamic = "force-static";

const MONATE_GUELTIG = 6;

export function GET() {
  const gueltigBis = new Date();
  gueltigBis.setMonth(gueltigBis.getMonth() + MONATE_GUELTIG);

  const zeilen = [
    "# Sicherheitslücke gefunden? Bitte melden, ich reagiere schnell und danke es.",
    "# https://securitytxt.org",
    "",
    `Contact: mailto:${site.email}`,
    "Preferred-Languages: de, en",
    `Canonical: ${site.url}/.well-known/security.txt`,
    `Expires: ${gueltigBis.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "",
  ];

  return new Response(zeilen.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
