import { MotionProvider } from "@/components/providers/MotionProvider";
import { de } from "@/content/de";
import { en } from "@/content/en";
import { schriftKlassen } from "@/lib/web-fonts";

/**
 * Das Dokument-Gerüst, geteilt von beiden Wurzel-Layouts.
 *
 * Zwei Wurzel-Layouts statt eines: Nur so kann `<html lang>` je Sprache
 * stimmen, ohne die deutschen URLs unter ein `/de`-Präfix zu schieben. Der
 * Preis ist ein vollständiger Seitenwechsel beim Sprachwechsel. Bei zwei
 * Sprachen ist das ein Klick, den ohnehin niemand zweimal macht.
 */
export function RootDocument({
  lang,
  children,
}: {
  lang: "de" | "en";
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      // Next 16 hebt weiches Scrollen bei der Navigation nur noch auf, wenn
      // dieses Attribut gesetzt ist.
      data-scroll-behavior="smooth"
      className={`${schriftKlassen} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        {/*
          humans.txt und llms.txt gab es schon, erreichbar waren sie aber nur,
          wenn man die Adresse errät. Zwei Zeilen machen sie auffindbar:
          `rel="author"` ist die überlieferte Angabe für humans.txt, und für
          llms.txt gibt es keine eigene, deshalb `alternate` mit Medientyp und
          einem Titel, den ein Werkzeug lesen kann.

          Ohne eigenes `<head>`: React hebt `<link>` von selbst dorthin, und ein
          handgeschriebenes head-Element ist im App Router die Pages-Router-
          Gewohnheit, vor der auch der Linter warnt.

          Der Titel kam aus dem Inhalt und nicht aus dieser Datei: Er stand
          hier fest als „Facts for language models" und damit auch im Kopf der
          deutschen Seite. Die Datei dahinter ist bewusst englisch, der Titel
          beschreibt sie aber für den, der die deutsche Seite liest — und der
          erfährt jetzt auch, dass ihn Englisch erwartet.
        */}
        <link rel="author" href="/humans.txt" type="text/plain" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title={(lang === "de" ? de : en).a11y.llmsTitel}
        />
        {/*
          Der Rückfall für Browser ohne JavaScript.

          Die Einblendungen unterhalb der Falz starten mit `opacity: 0` und
          werden von Framer Motion sichtbar gemacht, sobald der Abschnitt ins
          Bild kommt. Läuft kein JavaScript, passiert das nie: Gemessen an der
          gebauten Startseite blieben nach vollständigem Durchscrollen 160 von
          181 Überschriften und Faktenzeilen unsichtbar — mit JavaScript keine
          einzige.

          Der Text steht im HTML, er wird nur nicht gezeigt. Betroffen sind
          Firmennetze, die Skripte filtern, und alles, was eine Seite liest,
          ohne sie auszuführen. Für einen Recruiter, der die Seite im
          Unternehmensnetz öffnet, ist das der Unterschied zwischen einem
          Portfolio und einer fast leeren Seite.

          `noscript` im Body ist der einzige Weg, der ohne JavaScript wirkt und
          mit JavaScript nichts kostet: Der Browser wertet den Inhalt gar nicht
          erst aus, wenn Skripte laufen.
        */}
        <noscript>
          <style>{`[data-reveal],.animate-fade-rise,.animate-word-rise{opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
