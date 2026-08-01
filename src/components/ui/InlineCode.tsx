/**
 * Setzt `so ausgezeichnete` Stellen im Fließtext als Code.
 *
 * Der Inhalt trug die Backticks schon, aber die Fallstudien gaben ihn als
 * reinen Text aus: Auf der Seite standen sichtbar zwei Akzente um
 * `tse_transactions`. Statt sie aus dem Inhalt zu entfernen, werden sie hier
 * ausgewertet, so wie in den Artikeln auch.
 *
 * Kein `dangerouslySetInnerHTML` und keine Markdown-Bibliothek: Ein Split am
 * Backtick reicht, und es gibt keinen Weg, über den Inhalt HTML in die Seite
 * käme.
 */
export function RichText({ text }: { text: string }) {
  const teile = text.split("`");

  return (
    <>
      {teile.map((teil, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-acid"
          >
            {teil}
          </code>
        ) : (
          <span key={i}>{teil}</span>
        ),
      )}
    </>
  );
}
