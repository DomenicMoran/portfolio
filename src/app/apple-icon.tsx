import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Dasselbe Zeichen für den Startbildschirm.
 *
 * Ohne eigene Rundung und ohne Rand: iOS rundet die Ecken selbst und legt
 * kein eigenes Hintergrundfeld an. Eine mitgelieferte Rundung ergäbe eine
 * zweite Kante innerhalb der ersten.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <rect width="64" height="64" fill="#0b0b0e" />
          <path
            d="M17.5 14h13.2C42.4 14 50 21.2 50 32s-7.6 18-19.3 18H17.5V14z
               M27 22.4v19.2h3.4c6.4 0 10.2-3.6 10.2-9.6s-3.8-9.6-10.2-9.6H27z"
            fill="#d4ff45"
          />
        </svg>
      </div>
    ),
    size,
  );
}
