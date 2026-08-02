import { ImageResponse } from "next/og";
import { Marke } from "@/lib/mark";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Das Zeichen für alles, was kein .ico nimmt.
 *
 * Dunkle Fläche, Zeichen in der Akzentfarbe, nicht umgekehrt. Bei 16 px, und
 * das ist die Größe, die in einer Tab-Leiste ankommt, war die helle Variante
 * am schlechtesten lesbar: Die Fläche dominiert, der Buchstabe verschwindet.
 * Nachgemessen im Vergleich mehrerer Entwürfe.
 *
 * Die Form steht in `@/lib/mark` und wird von der Kopfleiste, der
 * Vorschaukarte und dem Startbildschirm-Symbol mitbenutzt. Vorher hatte jede
 * dieser Stellen ihre eigene.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <Marke size={64} />
      </div>
    ),
    size,
  );
}
