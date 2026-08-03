import { ImageResponse } from "next/og";
import { MARKE_GRUND, Marke } from "@/lib/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Dasselbe Zeichen für den Startbildschirm.
 *
 * Ohne eigene Rundung: iOS rundet die Ecken selbst. Eine mitgelieferte Rundung
 * ergäbe eine zweite Kante innerhalb der ersten.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: MARKE_GRUND,
      }}
    >
      <Marke size={180} grund={null} />
    </div>,
    size,
  );
}
