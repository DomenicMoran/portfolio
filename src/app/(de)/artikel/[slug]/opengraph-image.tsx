import { ImageResponse } from "next/og";
import { artikelDe, artikelNach } from "@/content/articles";
import { site } from "@/content/site";

export const alt = "Artikel von Domenic Moran";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Vorschaubild je Artikel.
 *
 * Ohne das zeigt jeder geteilte Artikel dieselbe allgemeine Karte, und wer
 * einen Link auf LinkedIn sieht, erfährt nur, dass es sich um dieses Portfolio
 * handelt, nicht worum es geht. Der Titel im Bild ist der Unterschied
 * zwischen einem Klick und keinem.
 *
 * Wird zur Bauzeit erzeugt, es entsteht also keine Laufzeit und kein
 * Schriftabruf von außen.
 */
/**
 * Kürzt den Anriss auf eine Länge, die ins Bild passt, und zwar am Satzende.
 *
 * Nach Zeichen zu schneiden ergibt Bruchstücke wie "Angekommen …", die im
 * Vorschaubild wie ein Fehler aussehen. Passt kein ganzer Satz, wird am
 * letzten Wort getrennt.
 */
function anriss(text: string, grenze = 155): string {
  if (text.length <= grenze) return text;

  const bisGrenze = text.slice(0, grenze);
  const satzende = Math.max(
    bisGrenze.lastIndexOf(". "),
    bisGrenze.lastIndexOf("? "),
    bisGrenze.lastIndexOf("! "),
  );
  if (satzende > grenze * 0.45) return bisGrenze.slice(0, satzende + 1);

  const wortende = bisGrenze.lastIndexOf(" ");
  return bisGrenze.slice(0, wortende > 0 ? wortende : grenze).trimEnd() + " …";
}

export function generateStaticParams() {
  return artikelDe.map((a) => ({ slug: a.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artikel = artikelNach("de", slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080a",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -240,
            right: -160,
            width: 700,
            height: 700,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(212,255,69,0.16), transparent 65%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              background: "#d4ff45",
              color: "#08080a",
              fontSize: 24,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            D
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 19,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#8a8a95",
            }}
          >
            {site.name} · Artikel
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: artikel && artikel.title.length > 52 ? 58 : 70,
              lineHeight: 1.08,
              fontWeight: 600,
              letterSpacing: -2.5,
              color: "#f2f2f4",
              maxWidth: 1000,
            }}
          >
            {artikel?.title ?? site.name}
          </div>
          {artikel ? (
            <div
              style={{
                display: "flex",
                fontSize: 25,
                lineHeight: 1.4,
                color: "#a5a5b0",
                maxWidth: 900,
              }}
            >
              {anriss(artikel.dek)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            borderTop: "1px solid #23232c",
            paddingTop: 26,
          }}
        >
          {(artikel?.tags ?? []).slice(0, 4).map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                border: "1px solid #23232c",
                borderRadius: 8,
                padding: "8px 15px",
                fontSize: 18,
                color: "#8a8a95",
              }}
            >
              {tag}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 19,
              color: "#d4ff45",
            }}
          >
            domenicmoran.de
          </div>
        </div>
      </div>
    ),
    size,
  );
}
