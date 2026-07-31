import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Icon für „Zum Home-Bildschirm" auf iOS.
 *
 * iOS rundet die Ecken selbst und legt kein eigenes Hintergrundfeld an,
 * deshalb hier volle Fläche ohne eigenen Radius, sonst entsteht ein sichtbarer
 * Rahmen um das gerundete Ergebnis.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080a",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            color: "#d4ff45",
            letterSpacing: -5,
            lineHeight: 1,
          }}
        >
          DM
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: 15,
            letterSpacing: 3,
            color: "#84848f",
          }}
        >
          ENGINEER
        </div>
      </div>
    ),
    size,
  );
}
