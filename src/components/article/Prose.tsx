import type { Block } from "@/content/articles";
import { RichText } from "@/components/ui/InlineCode";
import { CopyCode } from "@/components/ui/CopyCode";
import { alsSprungmarke } from "@/lib/slug";

/**
 * Setzt die Artikel-Bausteine.
 *
 * Die Auszeichnung von `Code im Satz` liegt in `RichText`, damit die
 * Fallstudien sie mitbenutzen können.
 *
 * Die Spaltenbreite setzt die Artikelseite, nicht diese Datei. Vorher stand
 * hier `max-w-[68ch]`, und das war eine Falle: `ch` ist die Breite der Ziffer
 * Null, und die ist in Geist Sans deutlich breiter als der Durchschnitt der
 * Kleinbuchstaben. Gemessen kamen so 91 Zeichen pro Zeile heraus, im Maximum
 * 99. Lesbar sind 65 bis 75. Die Breite steht deshalb jetzt in rem und ist
 * an gezählten Zeichen ausgerichtet.
 */

export function Prose({
  blocks,
  codeLabel,
  tabelleLabel,
  sprungmarkeLabel,
  kopieren,
}: {
  blocks: readonly Block[];
  codeLabel: string;
  tabelleLabel: string;
  sprungmarkeLabel: string;
  kopieren: { label: string; done: string; failed: string };
}) {
  return (
    <div className="flex flex-col">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            /* Jede Zwischenüberschrift bekommt eine Adresse.

               Die Artikel haben fünf bis sieben davon und bis hierher keine
               Sprungmarke: Wer einen Absatz weitergeben wollte, konnte nur
               den ganzen Text schicken. Bei Texten, deren Zweck es ist, eine
               bestimmte Stelle zu belegen, ist das die falsche kleinste
               Einheit.

               Das Doppelkreuz steht **außerhalb des Textflusses** im linken
               Rand. Der erste Anlauf setzte es inline hinter die Überschrift,
               unsichtbar bis zum Überfahren, und genau das war der Fehler:
               `text-balance` rechnet das Zeichen mit, auch wenn es niemand
               sieht. Gemessen brachen dadurch 13 von 232 Überschriften anders
               um. Ein unsichtbares Element, das die Typografie verschiebt,
               ist schlimmer als kein Element.

               Erst ab `lg` sichtbar, weil es davor keinen Rand gibt, in den
               es passen würde. Die `id` trägt jede Breite: Ein geteilter
               Verweis springt auch auf dem Telefon an die richtige Stelle. */
            return (
              <div key={i} className="group relative mt-14 mb-5">
                <h2
                  id={alsSprungmarke(block.text)}
                  className="max-w-[24ch] scroll-mt-28 text-2xl leading-tight font-semibold tracking-tight text-ink text-balance sm:text-3xl"
                >
                  {block.text}
                </h2>
                {/* Das Doppelkreuz gehört nicht zur Überschrift.

                    Es stand als Text im `h2` und damit im Textinhalt: Der
                    Name der Überschrift im Barrierefreiheitsbaum lautete
                    „Warum ein größeres Modell hier nichts bringt#“, und wer
                    eine Überschrift markierte und kopierte, nahm es mit.
                    Gemessen an der ausgelieferten Seite an allen sieben
                    Überschriften des Artikels.

                    `aria-hidden` nimmt es aus dem Namen, der Verweis behält
                    seinen eigenen über `aria-label`. `select-none` hält es aus
                    der Zwischenablage.

                    Nachtrag vom 06.08.2026: Der eigene Name war das nächste
                    Problem. Ein beschrifteter Verweis als Kind des `h2` geht
                    in dessen Namen ein, der Name einer Überschrift entsteht
                    aus ihren Kindern. Im Barrierefreiheitsbaum stand bei
                    1440 px „Der erste Hebel: dem Modell sagen, was es hören
                    wird Verweis auf diesen Abschnitt: Der erste Hebel: dem
                    Modell sagen, was es hören wird“: jede Überschrift
                    doppelt, sieben mal je Artikel. Bei 390 px trat es nicht
                    auf, weil der Verweis dort `display: none` trägt.

                    Der Verweis steht deshalb jetzt neben der Überschrift und
                    nicht mehr darin. `group` und `relative` wandern an die
                    Hülle, die `id` bleibt an der Überschrift, und die Maße
                    stehen in `rem` statt in `em`: An der Hülle rechnete `em`
                    gegen die Grundschrift statt gegen 1,5 beziehungsweise
                    1,875 rem. Eingesetzt sind die ausgerechneten alten
                    Werte; gemessen liegt das Zeichen danach an derselben
                    Stelle, 28 px links der Überschrift. */}
                <a
                  href={`#${alsSprungmarke(block.text)}`}
                  aria-label={`${sprungmarkeLabel}: ${block.text}`}
                  className="absolute top-[0.225rem] -left-7 hidden text-[0.93rem] text-ink-faint opacity-0 transition-opacity select-none group-hover:opacity-100 focus-visible:opacity-100 sm:top-[0.28rem] sm:text-[1.16rem] lg:block"
                >
                  <span aria-hidden>#</span>
                </a>
              </div>
            );

          case "h3":
            /* Dieselbe Adresse und derselbe Weg dorthin wie bei `h2`.

               Die `id` stand hier von Anfang an, die Sprungmarke nicht.
               Gemessen an den ausgelieferten Artikeln: sechs Überschriften mit
               Adresse, fünf Marken, die Ausnahme unter „Drittens" im
               Kassenartikel ließ sich verlinken, nur nicht von der Seite aus.
               Eine Adresse, die niemand kopieren kann, ist keine.

               Aufbau wie oben, einschließlich der beiden Lehren, die dort
               teuer waren: Die Marke steht neben der Überschrift statt in ihr,
               sonst wächst ihr Name im Barrierefreiheitsbaum um den Namen des
               Verweises; und das Doppelkreuz trägt `aria-hidden` und
               `select-none`, damit es weder vorgelesen noch mitkopiert wird.
               Die Maße sind auf die kleinere Schrift gerechnet: 1,125 rem
               gegen 1,5 rem bei `h2`. */
            return (
              <div key={i} className="group relative mt-10 mb-4">
                <h3
                  id={alsSprungmarke(block.text)}
                  className="max-w-[30ch] scroll-mt-28 text-lg font-semibold tracking-tight text-ink text-balance sm:text-xl"
                >
                  {block.text}
                </h3>
                <a
                  href={`#${alsSprungmarke(block.text)}`}
                  aria-label={`${sprungmarkeLabel}: ${block.text}`}
                  className="absolute top-[0.12rem] -left-7 hidden text-[0.8rem] text-ink-faint opacity-0 transition-opacity select-none group-hover:opacity-100 focus-visible:opacity-100 sm:top-[0.16rem] sm:text-[0.9rem] lg:block"
                >
                  <span aria-hidden>#</span>
                </a>
              </div>
            );

          case "p":
            return (
              <p
                key={i}
                className="mb-5 text-[1.0625rem] leading-[1.75] text-ink-dim text-pretty"
              >
                <RichText text={block.text} />
              </p>
            );

          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i} className="mb-6 flex flex-col gap-3 pl-1">
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
                      <RichText text={item} />
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
                    Zeile das ganze Dokument in die Breite.

                    Und er ist fokussierbar, weil ein Bereich, der scrollt, mit
                    der Tastatur erreichbar sein muss. Gemessen bei 390 px an
                    der ausgelieferten Seite: zwei der drei Kästen liefen
                    seitlich über, keiner war anspringbar, wer keine Maus
                    benutzt, kam an die rechte Hälfte des Codes nicht heran.

                    Der Rahmen trägt einen Namen, weil ein anspringbarer
                    Bereich ohne Namen nur als "Bereich" angesagt wird. Die
                    Bildunterschrift ist der bessere Name, wo es eine gibt. */}
                <CopyCode
                  code={block.code}
                  label={kopieren.label}
                  done={kopieren.done}
                  failed={kopieren.failed}
                />
                <pre
                  tabIndex={0}
                  role="region"
                  aria-label={block.caption ?? codeLabel}
                  className="lit scroll-hint overflow-x-auto rounded-xl border border-line bg-base p-5 text-[13px] leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
                >
                  <code
                    className={`language-${block.lang} font-mono text-ink-dim`}
                  >
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
            /* Der Merkkasten trägt seine Überschrift als Namen.

               `aside` ist eine Landmarke, und eine Landmarke ohne Namen steht
               in der Liste als „Ergänzung", zweimal auf einer Seite also
               zweimal derselbe Eintrag. Gemessen an sechs Artikelseiten war
               genau das der Fall. Die Überschrift steht ohnehin darüber; sie
               wird über `aria-labelledby` verknüpft, statt den Text ein
               zweites Mal als `aria-label` zu schreiben. */
            return (
              <aside
                key={i}
                aria-labelledby={`merk-${i}`}
                className="mt-2 mb-7 rounded-xl border border-acid/25 bg-acid/[0.05] p-5 sm:p-6"
              >
                <p id={`merk-${i}`} className="text-eyebrow mb-2.5">
                  {block.title}
                </p>
                <p className="text-[0.95rem] leading-[1.7] text-ink-dim text-pretty">
                  <RichText text={block.text} />
                </p>
              </aside>
            );

          case "table":
            return (
              <figure key={i} className="mt-2 mb-7">
                {/* Wie beim Codekasten: Was scrollt, muss anspringbar sein.
                    Heute passt die eine Tabelle in beide Breiten, aber eine
                    Spalte mehr, und die rechte Haelfte waere ohne Maus nicht
                    erreichbar, lautlos, weil nichts danach aussieht. */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label={block.caption ?? tabelleLabel}
                  className="overflow-x-auto rounded-xl border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
                >
                  {/* Die Tabelle trägt ihren eigenen Namen, nicht nur ihr
                      Rahmen.

                      Der Rahmen ist beschriftet, weil er scrollt. Der Name
                      der Tabelle blieb davon leer: Eine `figcaption`
                      benennt die Abbildung, nicht die Tabelle darin.
                      Gemessen im Barrierefreiheitsbaum stand dort `""`, und
                      in der Tabellenliste eines Vorleseprogramms erscheint
                      sie damit ohne Titel, neben Codekästen und
                      Abbildungen, die alle einen haben.

                      `aria-labelledby` auf die sichtbare Unterschrift statt
                      einer eigenen `caption`: Sonst stünde derselbe Satz
                      zweimal auf der Seite. */}
                  <table
                    aria-labelledby={block.caption ? `tabelle-${i}` : undefined}
                    className="w-full border-collapse text-left text-sm"
                  >
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
                        <tr
                          key={r}
                          className="border-b border-line last:border-b-0"
                        >
                          {row.map((cell, c) => (
                            <td
                              key={c}
                              className={
                                c === 0
                                  ? "px-4 py-3 font-mono text-[12px] text-ink"
                                  : "px-4 py-3 text-ink-dim"
                              }
                            >
                              <RichText text={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {block.caption ? (
                  <figcaption
                    id={`tabelle-${i}`}
                    className="mt-2.5 text-xs leading-relaxed text-ink-faint"
                  >
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
