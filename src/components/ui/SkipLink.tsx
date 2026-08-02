/**
 * Der Sprunglink, der die Kopfleiste überspringt.
 *
 * Zwei Dinge waren daran falsch, beide am 02.08.2026 an der ausgelieferten
 * Seite gemessen.
 *
 * **Er zeigte auf `#work`.** Damit übersprang er nicht die Navigation, sondern
 * den ganzen Hero — also die h1, die Positionierung, den Verfügbarkeitshinweis
 * und den wichtigsten Knopf der Seite. Wer mit der Tastatur oder einer
 * Vorlesesoftware genau die Abkürzung nimmt, die für ihn gedacht ist, bekam
 * das Wichtigste nie zu hören. Gemessen sprang er auf 950 px Scrollhöhe.
 *
 * **Auf den Artikelseiten gab es ihn gar nicht.** Dort steht „Zum Inhalt
 * springen" nur in den serialisierten Daten, gerendert wurde nichts: Auf jeder
 * Artikelseite musste man sich zuerst durch sieben Navigationspunkte tabben.
 *
 * Deshalb ein Bauteil statt drei Fassungen. Das Ziel ist immer der Anfang des
 * Inhalts; `tabIndex={-1}` am Ziel ist nötig, weil Safari und Firefox den
 * Fokus sonst nicht mitnehmen und nur scrollen.
 *
 * Die Position ist gemessen: Die Kopfleiste ist fixiert und 70 px hoch. Bei
 * `top-4` legte sich der Link beim ersten Tabben quer über den Namen. Er sitzt
 * deshalb bei 84 px, das sind 14 px Luft.
 */
export const INHALT_ID = "inhalt";

export function SkipLink({ text }: { text: string }) {
  return (
    <a
      href={`#${INHALT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-[5.25rem] focus:left-4 focus:z-[10001] focus:rounded-full focus:bg-acid focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-void focus:shadow-lg focus:shadow-void/40"
    >
      {text}
    </a>
  );
}
