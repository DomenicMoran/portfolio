import Link from "next/link";

/**
 * Ein Satz für den, der aus der englischen Fassung hierherkommt.
 *
 * Die Fußzeile auf /en verlinkt diese Seiten als „Legal notice“ und „Privacy" —
 * richtig so, § 5 DDG verlangt, dass sie von jeder Seite aus unmittelbar
 * erreichbar sind. Wer dann aber auf einer deutschen Seite landet, sieht ohne
 * Erklärung eine Lücke statt einer Entscheidung.
 *
 * Übersetzt werden sie bewusst nicht: Sie erfüllen deutsches Recht und richten
 * sich an deutsche Stellen. Eine zweite Fassung hätte unklaren Stand, und bei
 * genau diesen beiden Texten ist das kein Detail.
 *
 * Steht unter der Überschrift und nicht mehr darüber. Im Rahmen der Seite
 * gerendert kam der Satz vor das `h1`: Ein deutscher Leser — und das sind fast
 * alle, die hier landen — bekam auf einer deutschen Rechtsseite zuerst zwei
 * Zeilen Englisch zu sehen, bevor überhaupt dastand, welche Seite das ist.
 * Jetzt nennt sich die Seite zuerst, und die Erklärung folgt für den, der sie
 * braucht.
 */
export function EnglishNote() {
  return (
    <p lang="en" className="-mt-4 mb-10 text-sm text-ink-faint">
      These two pages are German on purpose: they exist to satisfy German law
      and are addressed to German authorities, so a translation would have
      unclear standing.{" "}
      {/* `-my-1 py-1`: gemessen 174 x 18 px, unter den 24 px aus WCAG 2.5.8.
          Der Verweis steht am Ende eines Satzes, fällt also unter die Ausnahme
          für Verweise mitten im Text — die Ausnahme zu brauchen ist trotzdem
          schlechter, als sie nicht zu brauchen. */}
      {/* `hrefLang`, wie die Fußzeile es in der Gegenrichtung führt.

          Dort tragen die Verweise auf diese beiden Seiten `hrefLang="de"`,
          weil sie von der englischen Fassung aus die Sprache wechseln.
          Derselbe Wechsel findet hier statt, nur andersherum, und er stand
          ohne Angabe da — gemessen an den 22 gebauten Seiten der einzige
          Sprachwechsel ohne Kennzeichnung. Ein Vorleseprogramm entscheidet
          daran, in welcher Aussprache es das Ziel ankündigt. */}
      <Link
        href="/en"
        /* Kein Vorabladen.

           Dieser eine Verweis kostete die Rechtsseiten ihre halbe Ladung: Er
           zeigt auf die englische Startseite, und Next holt zu jedem
           sichtbaren Verweis die Skripte des Ziels mit. Gemessen am gebauten
           Stand brachte er 270 kB Animationsbibliothek auf zwei Seiten, auf
           denen sich nichts bewegt. Beim Zeigen mit der Maus lädt Next
           weiterhin vor. */
        prefetch={false}
        hrefLang="en"
        className="-my-1 py-1 text-acid underline underline-offset-4"
      >
        Back to the English version
      </Link>
      .
    </p>
  );
}
