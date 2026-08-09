/**
 * Die Herkunftszeile am Ende jedes Ausdrucks.
 *
 * Ein ausgedrucktes Blatt verliert die Adresszeile des Browsers. Wer es
 * weitergereicht bekommt, hält Text ohne Absender und ohne Datum in der Hand:
 * ausgerechnet bei einer Seite, deren ganzes Argument „jede Zahl ist belegt“
 * lautet.
 *
 * Nur im Druck sichtbar: `.print-only` ist am Bildschirm `display: none` und
 * kehrt sich in `@media print` um. Die Seite selbst wird dadurch nicht länger,
 * nicht schwerer und nicht lauter.
 *
 * Das Datum kommt aus `verified.json` und nicht aus `new Date()`: Die Seiten
 * sind vorgerendert, ein Aufruf zur Laufzeit würde beim Bauen einfrieren und
 * beim Hydrieren abweichen. Der Stempel ist ohnehin die ehrlichere Angabe, er
 * sagt, wann zuletzt geprüft wurde, nicht wann jemand auf Drucken gedrückt hat.
 */
export function PrintNote({ text }: { text: string }) {
  return (
    <p className="print-only mt-10 border-t border-line pt-4 text-center font-mono text-[10px] leading-relaxed text-ink-faint">
      {text}
    </p>
  );
}
