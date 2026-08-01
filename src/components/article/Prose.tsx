import type { Block } from "@/content/articles";

/**
 * Setzt die Artikel-Bausteine.
 *
 * Kein `dangerouslySetInnerHTML` und keine Markdown-Bibliothek: Der einzige
 * Auszeichnungsbedarf im Fließtext ist `Code im Satz`, und den löst ein
 * Split am Backtick. Damit gibt es keinen Weg, über den Inhalt HTML in die
 * Seite käme.
 *
 * Die Spaltenbreite setzt die Artikelseite, nicht diese Datei. Vorher stand
 * hier `max-w-[68ch]`, und das war eine Falle: `ch` ist die Breite der Ziffer
 * Null, und die ist in Geist Sans deutlich breiter als der Durchschnitt der
 * Kleinbuchstaben. Gemessen kamen so 91 Zeichen pro Zeile heraus, im Maximum
 * 99. Lesbar sind 65 bis 75. Die Breite steht deshalb jetzt in rem und ist
 * an gezählten Zeichen ausgerichtet.
 */

function Satz({ text }: { text: string }) {
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

export function Prose({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="flex flex-col">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-14 mb-5 max-w-[24ch] text-2xl leading-tight font-semibold tracking-tight text-ink text-balance sm:text-3xl"
              >
                {block.text}
              </h2>
            );

          case "h3":
            return (
              <h3
                key={i}
                className="mt-10 mb-4 max-w-[30ch] text-lg font-semibold tracking-tight text-ink text-balance sm:text-xl"
              >
                {block.text}
              </h3>
            );

          case "p":
            return (
              <p
                key={i}
                className="mb-5 text-[1.0625rem] leading-[1.75] text-ink-dim text-pretty"
              >
                <Satz text={block.text} />
              </p>
            );

          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={i}
                className="mb-6 flex flex-col gap-3 pl-1"
              >
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-3.5 text-[1.0625rem] leading-[1.7] text-ink-dim text-pretty"
                  >
                    <span
                      aria-hidden
                      className={
                        block.ordered
                          ? "mt-px shrink-0 font-mono text-sm text-acid tabular-nums"
                          : "mt-[0.7em] size-1.5 shrink-0 rounded-full bg-acid/70"
                      }
                    >
                      {block.ordered ? String(j + 1).padStart(2, "0") : null}
                    </span>
                    <span>
                      <Satz text={item} />
                    </span>
                  </li>
                ))}
              </List>
            );
          }

          case "code":
            return (
              <figure key={i} className="mt-2 mb-7">
                {/* Der Kasten scrollt für sich. Ohne das schiebt eine lange
                    Zeile das ganze Dokument in die Breite. */}
                <pre className="lit overflow-x-auto rounded-xl border border-line bg-base p-5 text-[13px] leading-relaxed">
                  <code className={`language-${block.lang} font-mono text-ink-dim`}>
                    {block.code}
                  </code>
                </pre>
                {block.caption ? (
                  <figcaption className="mt-2.5 text-xs leading-relaxed text-ink-faint">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );

          case "note":
            return (
              <aside
                key={i}
                className="mt-2 mb-7 rounded-xl border border-acid/25 bg-acid/[0.05] p-5 sm:p-6"
              >
                <p className="text-eyebrow mb-2.5">{block.title}</p>
                <p className="text-[0.95rem] leading-[1.7] text-ink-dim text-pretty">
                  <Satz text={block.text} />
                </p>
              </aside>
            );

          case "table":
            return (
              <figure key={i} className="mt-2 mb-7">
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface/60">
                        {block.head.map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r} className="border-b border-line last:border-b-0">
                          {row.map((cell, c) => (
                            <td
                              key={c}
                              className={
                                c === 0
                                  ? "px-4 py-3 font-mono text-[12px] text-ink"
                                  : "px-4 py-3 text-ink-dim"
                              }
                            >
                              <Satz text={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {block.caption ? (
                  <figcaption className="mt-2.5 text-xs leading-relaxed text-ink-faint">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
        }
      })}
    </div>
  );
}
