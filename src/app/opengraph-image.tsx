import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social preview card. Generated at build time so there is no runtime cost and
 * no external font fetch — the OG renderer only supports a subset of CSS, so
 * this deliberately mirrors the site's look rather than reusing its components.
 */
export default async function Image() {
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
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#d4ff45",
              color: "#08080a",
              fontSize: 26,
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
              fontSize: 21,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#8a8a95",
            }}
          >
            {site.location}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: -4,
              color: "#f2f2f4",
            }}
          >
            {site.name}
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
            {site.role}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 25,
              lineHeight: 1.45,
              color: "#a5a5b0",
              maxWidth: 900,
            }}
          >
            Vier Plattformen in Produktion — Mobile, SaaS, Infrastruktur,
            Compliance. Alle allein gebaut.
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
          {["TypeScript", "React Native", "Next.js", "Postgres", "AI Engineering"].map(
            (item) => (
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
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
