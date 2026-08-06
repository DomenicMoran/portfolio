"use client";

import { schriftKlassen } from "@/lib/web-fonts";
import { Marke } from "@/lib/mark";
import { mailAdresse } from "@/lib/mailto";
import { de } from "@/content/de";
import "./globals.css";

/**
 * Die Seite, die erscheint, wenn im Browser etwas zerbricht.
 *
 * Ohne diese Datei zeigt Next seine eigene: „This page couldn't load — A
 * server error occurred. Reload to try again." Gemessen am gebauten
 * `_global-error.html`: englischer Text auf einer deutschsprachigen Seite,
 * **kein `lang` am Dokument** — also ein Verstoß gegen WCAG 3.1.1 auf der
 * einen Seite, die niemand vorher zu Gesicht bekommt —, keine Marke und kein
 * Weg zurück.
 *
 * Sie ist selten, aber nicht unmöglich: Alle Routen sind statisch, ein Fehler
 * kann hier also nur im Browser entstehen. Genau dann steht der Besucher aber
 * vor einer weißen Seite mit einer englischen Zeile, und die letzte
 * Erinnerung an diese Adresse ist ein Absturz ohne Absender.
 *
 * **Was diese Datei nicht ersetzt.** Der Bau legt weiterhin ein
 * `_global-error.html` an, und darin steht Nexts eigene Fassung: 10.286 Byte
 * ohne ein einziges Wort von hier, ohne `lang` am Dokument, Titel „500: This
 * page couldn't load". Nachgezählt an der gebauten Datei, nicht angenommen.
 * Das ist kein Versäumnis, sondern die Bauart: Eine Fehlergrenze ist eine
 * Client-Komponente und greift erst, wenn React läuft. Was davor
 * ausgeliefert würde, bestimmt das Framework.
 *
 * Erreichbar ist diese Fassung damit nur über den Weg, für den sie gebaut
 * ist. Wer den anderen abdecken will, braucht einen Serverfehler auf einer
 * Seite, die keinen Server hat — den gibt es hier nicht.
 *
 * Zwei Unterschiede zur 404, beide mit Grund:
 *
 * - **Deutsch, mit englischer Zeile darunter.** Eine Fehlergrenze läuft im
 *   Browser und kann die Kopfzeile nicht lesen, die der Proxy für `/en`
 *   setzt. Statt zu raten, steht beides da.
 * - **Ein Knopf statt eines Verweises.** `unstable_retry()` baut den Baum neu
 *   auf, ohne die Seite neu zu laden; gelingt das nicht, führt der Verweis
 *   daneben zur Startseite.
 */
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  /* In Next 16 heißt der Rückweg `unstable_retry`, nicht mehr `reset`.
     Mit dem alten Namen wäre der Knopf hier ein Knopf, der beim Drücken
     wirft — auf genau der Seite, die einen Fehler auffangen soll. Nachgelesen
     in `node_modules/next/dist/docs`, nicht geraten. */
  unstable_retry: () => void;
}) {
  return (
    <html lang="de" className={`${schriftKlassen} h-full antialiased`}>
      <body className="grain flex min-h-full flex-col">
        <main className="flex flex-1 items-center px-6 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-2xl">
            {/* Harte Navigation und kein `Link`: Der React-Baum ist hier
                gerade zerbrochen. Ein Routerwechsel würde denselben Baum neu
                zu betreten versuchen; ein voller Seitenaufruf holt einen
                frischen. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="group -my-1 mb-10 inline-flex items-center gap-2.5 py-1"
            >
              <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-md border border-acid/25 transition-colors group-hover:border-acid/60">
                <Marke size={28} radius={0} />
              </span>
              <span className="text-sm font-medium tracking-tight text-ink">
                {de.site.name}
              </span>
            </a>

            <p className="text-eyebrow mb-6">Fehler</p>

            <h1 className="text-headline text-ink text-balance">
              Da ist etwas zerbrochen.
            </h1>

            <p className="mt-6 max-w-[58ch] leading-relaxed text-ink-dim text-pretty">
              Diese Seite konnte nicht dargestellt werden. Ein neuer Versuch
              hilft meistens; wenn nicht, schreib mir kurz, was du aufgerufen
              hast.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="inline-flex rounded-full border border-transparent bg-acid px-5 py-2.5 text-sm font-medium text-void transition-colors hover:bg-ink"
              >
                Noch einmal versuchen
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
              >
                Zur Startseite
              </a>
            </div>

            <p lang="en" className="mt-8 text-sm text-ink-faint">
              Something broke while rendering this page.{" "}
              <a
                href="/en"
                className="-my-1 py-1 text-acid underline underline-offset-4"
              >
                Home
              </a>
            </p>
          </div>
        </main>

        <footer className="px-6 pb-10">
          <div className="mx-auto w-full max-w-2xl">
            <p className="border-t border-line pt-6 text-sm text-ink-faint">
              {de.notFound.report}{" "}
              <a
                href={mailAdresse(de.site.email, de.site.mailSubject)}
                className="-my-1 py-1 text-acid underline underline-offset-4"
              >
                {de.site.email}
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
