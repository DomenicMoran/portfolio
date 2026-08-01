import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Das Zeichen für alles, was kein .ico nimmt.
 *
 * Dunkle Fläche, Buchstabe in der Akzentfarbe, nicht umgekehrt. Bei 16 px,
 * und das ist die Größe, die in einer Tab-Leiste ankommt, war die helle
 * Variante am schlechtesten lesbar: Die Fläche dominiert, der Buchstabe
 * verschwindet. Nachgemessen im Vergleich mehrerer Entwürfe.
 *
 * Derselbe Pfad wie in `favicon.ico`, damit beide Fassungen identisch
 * aussehen. Als Pfad und nicht als Schriftzeichen, weil eine Schriftart auf
 * einem anderen Rechner fehlen kann und ein Pfad überall derselbe ist.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg width="64" height="64" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="13" fill="#0b0b0e" />
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
