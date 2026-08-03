import { readFileSync } from "node:fs";
import { ogSchriften } from "@/lib/fonts";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { Marke } from "@/lib/mark";

/**
 * Die Social-Vorschaukarte, für beide Sprachfassungen dieselbe Gestaltung.
 *
 * Vorher gab es sie nur einmal, mit dem deutschen Inhalt fest verdrahtet, und
 * `buildMetadata` verwies aus beiden Sprachen darauf. Wer die englische Seite
 * teilte, bekam eine Karte mit "BERLIN, DEUTSCHLAND" und "Vier Plattformen in
 * Produktion" — die Sprache, die er gerade nicht liest.
 *
 * Der Text stand zusätzlich in der Komponente statt in `src/content/`, gegen
 * die Regel in AGENTS.md. Beides hängt zusammen: Solange die Zeile im Bauteil
 * steht, gibt es sie zwangsläufig nur einmal.
 *
 * Zur Bauzeit erzeugt, also ohne Laufzeitkosten und ohne Schriftabruf von
 * außen. Der OG-Renderer beherrscht nur einen Teil von CSS; die Karte bildet
 * das Aussehen der Seite deshalb nach, statt ihre Komponenten zu benutzen.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export type OgKarte = {
  name: string;
  role: string;
  location: string;
  /** Ein Satz unter der Rolle. Kommt aus `content.site.ogTagline`. */
  tagline: string;
};

const STACK = ["TypeScript", "React Native", "Next.js", "Postgres", "AI Engineering"];

/**
 * Das Porträt als Datenadresse.
 *
 * Der OG-Renderer läuft ohne Ursprung und kann `/portrait.jpg` nicht
 * auflösen; eine absolute Adresse wäre ein Abruf nach außen zur Bauzeit.
 * Die Datei wird deshalb eingelesen und eingebettet — 320 Pixel, 9 kB, mehr
 * braucht ein Kreis von 150 Pixeln nicht.
 *
 * Sie wird nicht von Hand gepflegt: `npm run build:portrait` schreibt sie aus
 * demselben Original wie die beiden Fassungen in `public/`.
 *
 * Warum überhaupt: Eine Vorschaukarte mit Gesicht wird auf LinkedIn anders
 * gelesen als eine mit Buchstaben. Der Anlass, sie zu teilen, ist eine
 * Bewerbung, und dort steht am anderen Ende ein Mensch.
 */
const PORTRAET = `data:image/jpeg;base64,${readFileSync(
  join(process.cwd(), "src", "lib", "og-portrait.jpg"),
).toString("base64")}`;

export function renderOgCard({ name, role, location, tagline }: OgKarte) {
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
          padding: "72px",
          position: "relative",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -120,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(124,92,255,0.30), transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -280,
            right: -140,
            width: 700,
            height: 700,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(212,255,69,0.18), transparent 65%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Dasselbe Zeichen wie in der Kopfleiste und im Lesezeichen. */}
          <div style={{ display: "flex" }}>
            <Marke size={44} radius={10} />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 21,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#8a8a95",
            }}
          >
            {location}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {/* Kein `next/image` und kein `alt`: Diese Baumstruktur wird nicht
              als HTML ausgeliefert, sondern von Satori zu einem PNG gerendert.
              Es gibt kein Vorleseprogramm, das ein `alt` lesen könnte, und
              keinen Bildoptimierer, der hier liefe. */}
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img
            src={PORTRAET}
            width={188}
            height={188}
            style={{ borderRadius: 9999, border: "3px solid #23232c" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: -4,
              color: "#f2f2f4",
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              lineHeight: 1.2,
              letterSpacing: -1,
              color: "#d4ff45",
            }}
          >
            {role}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              lineHeight: 1.45,
              color: "#a5a5b0",
              maxWidth: 720,
            }}
          >
            {tagline}
          </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            borderTop: "1px solid #23232c",
            paddingTop: 28,
          }}
        >
          {STACK.map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                border: "1px solid #23232c",
                borderRadius: 8,
                padding: "9px 16px",
                fontSize: 19,
                color: "#8a8a95",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...ogSize, fonts: ogSchriften },
  );
}
