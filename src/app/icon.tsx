import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Monogram favicon — same acid square as the nav mark. */
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
          color: "#08080a",
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        D
      </div>
    ),
    size,
  );
}
