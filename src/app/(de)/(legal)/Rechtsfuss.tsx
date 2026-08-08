import Link from "next/link";

import { de } from "@/content/de";
import { site } from "@/content/site";

/**
 * Die Fußzeile der beiden Rechtsseiten.
 *
 * § 5 DDG verlangt das Impressum von jeder Seite des Angebots aus unmittelbar
 * erreichbar. Gemessen an elf ausgelieferten Adressen fehlte der Verweis
 * ausgerechnet auf diesen beiden: Wer auf der Datenschutzerklärung stand, kam
 * nur über den Umweg über die Startseite zum Impressum.
 *
 * Sie steht hier und nicht mehr im Layout, weil sie wissen muss, auf welcher
 * Seite sie sitzt. Ein Verweis auf die Seite, auf der man schon steht, ist für
 * das Auge harmlos — ein Vorleseprogramm sagt aber „Impressum, Link" und
 * verschweigt, dass es die aktuelle Seite ist. Die Kopfleiste der übrigen
 * Seiten führt `aria-current` für den aktiven Abschnitt seit ihrem Einbau;
 * hier fehlte es.
 *
 * Ein Layout kennt seinen Pfad nicht: `usePathname` gibt es nur im Client, und
 * diese beiden Seiten kommen bewusst ohne JavaScript aus. Also sagt jede
 * Seite selbst, wo sie ist. Wer eine dritte Rechtsseite anlegt und die
 * Fußzeile vergisst, fällt bei `check:landmarks` auf: Der Lauf verlangt
 * `contentinfo` auf jeder Seite.
 */
export function Rechtsfuss({ hier }: { hier: "impressum" | "datenschutz" }) {
  const seiten = [
    { schluessel: "impressum", pfad: "/impressum", text: de.footer.impressum },
    {
      schluessel: "datenschutz",
      pfad: "/datenschutz",
      text: de.footer.datenschutz,
    },
  ] as const;

  return (
    <footer className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6 font-mono text-[11px] text-ink-faint">
      <span>
        © {new Date().getFullYear()} {site.name}
      </span>
      {/* Unterstrichen: Die Verweise stehen in derselben Zeile wie die
          Copyright-Angabe und trugen gemessen deren Farbe. In einem Textblock
          muss ein Verweis mehr als Farbe zur Unterscheidung tragen — hier trug
          er nicht einmal die. */}
      {seiten.map((seite) => (
        <Link
          key={seite.pfad}
          href={seite.pfad}
          /* Kein Vorabladen, wie beim Rückweg im Rahmen darüber: Die andere
             Rechtsseite ist genauso still, und wer sie braucht, klickt. */
          prefetch={false}
          aria-current={seite.schluessel === hier ? "page" : undefined}
          className="-my-2 py-2 underline underline-offset-4 transition-colors hover:text-ink-dim"
        >
          {seite.text}
        </Link>
      ))}
    </footer>
  );
}
