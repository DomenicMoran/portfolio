/**
 * Das Zeichen der Seite, an genau einer Stelle definiert.
 *
 * Vorher gab es zwei: Die Kopfleiste zeigte einen dunklen Buchstaben auf
 * grüner Fläche, das Lesezeichen einen grünen auf dunkler. Zwei Marken für
 * dieselbe Seite, und beide waren ein Buchstabe in einem Kasten — die
 * naheliegendste Lösung, die es gibt.
 *
 * Das D ist deshalb gebaut statt gesetzt: Stamm und Bogen sind zwei Teile mit
 * einer Fuge dazwischen. Das ist dieselbe Haltung wie im Rest der Seite —
 * sichtbare Konstruktion statt glatter Oberfläche — und es unterscheidet das
 * Zeichen von jedem D, das eine Schriftart hergibt.
 *
 * Die Maße stammen aus einem Vergleich in den Größen, in denen das Zeichen
 * wirklich vorkommt: 16 px in der Lesezeichenleiste, 28 px in der Kopfleiste,
 * 64 px als Datei, 180 px auf dem Startbildschirm. Vier Fugenbreiten
 * nebeneinander gestellt; bei 3 Einheiten auf dem 64er-Raster bleibt die Fuge
 * bei 64 px sichtbar, und der Bogen ist bei 16 px noch dick genug, dass das
 * Zeichen ein D bleibt und kein „I)“.
 *
 * Als Pfad und nicht als Schriftzeichen, weil eine Schriftart auf einem
 * anderen Rechner fehlen kann und ein Pfad überall derselbe ist.
 */

/** Die Farben stehen hier ausgeschrieben: Der Bildrenderer kennt keine CSS-Token. */
export const MARKE_GRUND = "#0b0b0e";
export const MARKE_ZEICHEN = "#d4ff45";

/** Der Stamm, links. */
export const MARKE_STAMM = { x: 15, y: 13, width: 11, height: 38, rx: 1.5 };

/** Der Bogen, rechts daneben, mit 3 Einheiten Fuge. */
export const MARKE_BOGEN =
  "M29 13h2.5c11 0 18.5 7.6 18.5 19s-7.5 19-18.5 19H29v-10.5h1.8c5.9 0 9.3-3.5 9.3-10s-3.4-10-9.3-10H29V13z";

/**
 * Das Zeichen als SVG.
 *
 * `grund` weglassen heißt: nur das Zeichen, ohne Fläche darunter. Das braucht
 * der Startbildschirm von iOS, der seine Ecken selbst rundet.
 */
export function Marke({
  size,
  grund = MARKE_GRUND,
  zeichen = MARKE_ZEICHEN,
  radius = 13,
}: {
  size: number;
  grund?: string | null;
  zeichen?: string;
  radius?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      {grund ? <rect width="64" height="64" rx={radius} fill={grund} /> : null}
      <rect {...MARKE_STAMM} fill={zeichen} />
      <path d={MARKE_BOGEN} fill={zeichen} />
    </svg>
  );
}
