import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Favicon.
 *
 * 64px statt 32: In der Tab-Leiste wird herunterskaliert, und ein von 64
 * verkleinertes Zeichen bleibt bei 2x-Displays scharf, während ein natives
 * 32er dort weich wird.
 *
 * Das Zeichen ist ein „D" mit abgeschnittener rechter Kante, dieselbe Geste
 * wie die Akzentfarbe der Seite: reduziert, aber nicht beliebig.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d4ff45",
          borderRadius: 14,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 700,
            color: "#08080a",
            letterSpacing: -2,
            lineHeight: 1,
            marginTop: -2,
          }}
        >
          D
        </div>
      </div>
    ),
    size,
  );
}
