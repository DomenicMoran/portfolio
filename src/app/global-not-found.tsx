import type { Metadata } from "next";
import { headers } from "next/headers";
import { schriftKlassen } from "@/lib/web-fonts";
import { NotFoundPage } from "@/components/NotFoundPage";
import { de } from "@/content/de";
import { en } from "@/content/en";
import { PFAD_KOPFZEILE, SPRACH_KOPFZEILE } from "@/lib/language-header";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const englisch = (await headers()).get(SPRACH_KOPFZEILE) === "en";
  const inhalt = englisch ? en : de;
  return {
    title: `${inhalt.notFound.title} – ${inhalt.site.name}`,
    /* `metadataBase`, obwohl diese Seite kein Bild deklariert: Sollte hier je
       eine relative Adresse in den Metadaten stehen, löst sie gegen die
       eigene Adresse auf statt gegen http://localhost:3000.

       Hier stand, die Zeile bringe die beiden Bauwarnungen zum Schweigen, die
       Next beim Erzeugen der statischen Seiten ausgibt. Nachgemessen stimmt
       das nicht: Mit und ohne diese Zeile meldet der Bau dieselben zwei
       Warnungen. Sie stammen aus Seiten, die Next selbst anlegt — die interne
       Not-found-Route und `_global-error` —, und die hängen an keinem der
       beiden Wurzel-Layouts, weil es hier bewusst kein gemeinsames
       `app/layout.tsx` gibt.

       Ausgeliefert wird davon nichts: Im ganzen Bauordner steht die
       Zeichenkette `localhost:3000` null mal, und die 404 der Live-Adresse
       trägt `og:image` mit vollständiger Adresse. */
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
  /* Der Proxy kürzt lange Pfade und setzt dafür `GEKUERZT` ans Ende — eine
     Marke aus Latin-1, weil eine Kopfzeile nichts anderes tragen darf. Gelesen
     wird sie hier, und hier steht auch das Zeichen, das ein Mensch erwartet. */
  const gemeldet = (await headers()).get(PFAD_KOPFZEILE) ?? undefined;
  const angefragt = gemeldet?.replace(/GEKUERZT$/, "…");
  const inhalt = englisch ? en : de;
  const zweitsprache = englisch ? de : en;

  return (
    <html lang={inhalt.lang} className={`${schriftKlassen} h-full antialiased`}>
      <body className="grain flex min-h-full flex-col">
        <NotFoundPage
          content={inhalt}
          base={englisch ? "/en" : ""}
          zweitsprache={zweitsprache}
          angefragt={angefragt}
        />
      </body>
    </html>
  );
}
