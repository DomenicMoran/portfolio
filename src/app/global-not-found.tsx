import type { Metadata } from "next";
import { headers } from "next/headers";
import { schriftKlassen } from "@/lib/web-fonts";
import { NotFoundPage } from "@/components/NotFoundPage";
import { de } from "@/content/de";
import { en } from "@/content/en";
import { SPRACH_KOPFZEILE } from "@/lib/language-header";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const englisch = (await headers()).get(SPRACH_KOPFZEILE) === "en";
  const inhalt = englisch ? en : de;
  return {
    title: `${inhalt.notFound.title} – ${inhalt.site.name}`,
    // `metadataBase`, obwohl diese Seite kein Bild deklariert.
    //
    // Ohne die Angabe löst Next relative Adressen in Metadaten gegen
    // http://localhost:3000 auf und warnt bei jedem Bau darauf hin — zweimal,
    // für diese Seite und für die interne Not-found-Route. Zwei Warnungen in
    // jedem grünen Lauf sind zwei, die man zu übersehen lernt.
    metadataBase: new URL(inhalt.site.url),
    robots: { index: false, follow: true },
  };
}

/**
 * Die 404-Seite für Adressen, die zu keiner Route gehören.
 *
 * Diese Datei umgeht bewusst beide Wurzel-Layouts und bringt ihr eigenes
 * Dokument mit: Stylesheet, Schriften, Body-Klassen. Ohne das käme eine
 * ungestylte Standardseite, weil Next bei zwei Wurzel-Layouts nicht wählen
 * kann, in welchem es rendern soll.
 *
 * Keine Bewegungs-Provider: Wer hier landet, hat sich verlaufen und soll
 * schnell weiterkommen. Die Schriften kommen aus `@/lib/web-fonts` — eine
 * eigene Deklaration erzeugte einen zweiten Satz Dateien, den der Browser
 * zusätzlich lud, auf jeder Seite.
 *
 * Diese Seite beantwortet jede Adresse, die auf gar keine Route passt — auch
 * `/en/irgendwas`. Welche Sprache gemeint war, weiß sie als einzige Seite
 * nicht von sich aus: `src/proxy.ts` sagt es ihr über eine Kopfzeile. Ohne
 * die Angabe bleibt es beim Deutschen, und der Hinweis in der jeweils anderen
 * Sprache steht in beiden Fällen darunter.
 *
 * Der Weg über `not-found.tsx` ist verbaut. Es gab einmal je Sprache eine,
 * beide wurden nie gerendert, weil eine Adresse ohne Route auch kein Layout
 * hat. Auch der Umbau dahin führt nicht hin: Ein Fangsegment unter `/en`, das
 * `notFound()` wirft, bekommt bei zwei Wurzel-Layouts keine Grenze mehr
 * gerendert, sondern das leere Fehlerdokument — gemessen am 02.08.2026 mit
 * der Grenze auf beiden Ebenen und mit wie ohne `globalNotFound`: Status 404,
 * aber kein `lang`, keine Überschrift, nichts. Dasselbe gilt für
 * `dynamicParams = true` auf den Artikelrouten.
 */
export default async function GlobalNotFound() {
  const englisch = (await headers()).get(SPRACH_KOPFZEILE) === "en";
  const inhalt = englisch ? en : de;
  const zweitsprache = englisch ? de : en;

  return (
    <html lang={inhalt.lang} className={`${schriftKlassen} h-full antialiased`}>
      <body className="grain flex min-h-full flex-col">
        <NotFoundPage
          content={inhalt}
          base={englisch ? "/en" : ""}
          zweitsprache={zweitsprache}
        />
      </body>
    </html>
  );
}
