import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PFAD_KOPFZEILE, SPRACH_KOPFZEILE } from "@/lib/language-header";

/**
 * Sagt der 404-Seite, dass die Anfrage unter `/en` kam.
 *
 * Hier stand „Reicht den angefragten Pfad an die 404-Seite weiter“. Gereicht
 * wird kein Pfad, sondern eine Kopfzeile mit dem Wert `en` — der Pfad selbst
 * steht nirgends, und der Filter unten lässt ohnehin nur `/en` durch.
 *
 * Diese Seite hat zwei Wurzel-Layouts, eines je Sprache. Für eine Adresse, die
 * zu gar keiner Route gehört, kann Next deshalb kein Layout wählen und liefert
 * `app/global-not-found.tsx` aus — eine Seite, die ihr eigenes Dokument
 * mitbringt und die als einzige nicht wissen kann, welche Sprache gemeint war.
 * Gemessen bekam ein englischer Besucher von `/en/does-not-exist` „Diese Seite
 * gibt es nicht." samt `lang="de"`, also deutschen Text, den ein
 * Vorleseprogramm auch als deutschen ansagt.
 *
 * Der Weg dorthin ist verbaut: `notFound()` rendert bei zwei Wurzel-Layouts
 * keine `not-found.tsx` mehr, sondern das leere Fehlerdokument — gemessen am
 * 02.08.2026 mit einem Fangsegment unter `/en` und einer Grenze auf beiden
 * Ebenen, mit und ohne `globalNotFound`: Status 404, aber kein `lang`, keine
 * Überschrift, nichts.
 *
 * Was bleibt, ist die Angabe von außen. Die 404-Seite darf `headers()` lesen
 * — nachgemessen, sie rendert dynamisch —, nur steht der Pfad in keiner davon.
 * Diese Datei trägt ihn nach.
 *
 * Der Filter lässt ausschließlich `/en` durch. Jede andere Adresse erreicht
 * diese Funktion nicht, und ohne die Kopfzeile bleibt die 404-Seite deutsch:
 * Das ist die richtige Voreinstellung für eine Seite, deren übrige Adressen
 * alle deutsch sind.
 */
/**
 * Methoden, die eine Seite ohne Formular beantworten kann.
 *
 * Alles andere schickt Daten. `OPTIONS` bleibt drin, weil ein Browser damit
 * fragt, bevor er etwas sendet — die Antwort darauf ist genau die Absage.
 */
const ERLAUBTE_METHODEN = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Anfragen, die etwas senden wollen, bekommen eine Absage.
 *
 * Die Datenschutzerklärung sagt: „Es gibt keinen Endpunkt, der Eingaben
 * entgegennimmt." Gemessen am 08.08.2026 stimmte das für den Inhalt und nicht
 * für die Antwort: `POST /` und `POST /impressum` gaben richtig 405, aber
 * `POST /api/kontakt` und jede andere unbekannte Adresse gaben **200** —
 * dieselbe Fehlerseite wie bei `GET`, nur mit dem Statuscode für Erfolg.
 *
 * Verarbeitet wurde dabei nichts. Gelesen wird es trotzdem falsch: Wer eine
 * Seite abklopft, sieht auf `POST /api/kontakt` eine 200 und schließt daraus,
 * dass dort etwas zuhört. Für eine Seite, die genau das Gegenteil zusagt, ist
 * das die unglücklichste Antwort von allen.
 *
 * Die Absage steht hier und nicht in der Fehlerseite: Bei zwei Wurzel-Layouts
 * rendert Next für eine unbekannte Adresse `global-not-found.tsx`, und deren
 * Statuscode hängt nicht an der Methode.
 */
export function proxy(request: NextRequest) {
  if (!ERLAUBTE_METHODEN.has(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: { allow: [...ERLAUBTE_METHODEN].join(", ") },
    });
  }

  /* Die Kopfzeile nur unter `/en`.

     Solange der Filter ausschließlich `/en` durchließ, war das dasselbe.
     Seit er alles durchlässt, ist es das nicht mehr: Gemessen am gebauten
     Stand kam `/gibt-es-nicht` als „This page does not exist" mit
     `lang="en"` heraus — die deutsche Fehlerseite auf Englisch, weil die
     Kopfzeile unbedingt gesetzt wurde. */
  /* Der angefragte Pfad, damit die Fehlerseite ihn nennen kann.

     Sie bietet an, einen toten Verweis zu melden, und der Mailverweis trug
     bis hierher nur einen Betreff. Welche Adresse ins Leere führte, musste
     der Absender dazuschreiben — die Hälfte, auf die es ankommt.

     Gesetzt wird nur der Pfad, nicht die ganze Adresse mit Abfrage: Was in
     einer Suchzeile stand, gehört nicht in eine fremde Mailvorlage. */
  const kopfzeilen = new Headers(request.headers);
  kopfzeilen.set(PFAD_KOPFZEILE, request.nextUrl.pathname);

  const unterEn =
    request.nextUrl.pathname === "/en" ||
    request.nextUrl.pathname.startsWith("/en/");
  if (unterEn) kopfzeilen.set(SPRACH_KOPFZEILE, "en");

  return NextResponse.next({ request: { headers: kopfzeilen } });
}

export const config = {
  /* Alles, nicht nur `/en`.

     Die Sprachkopfzeile braucht nur `/en`, die Absage oben jede Adresse. Der
     Filter lässt deshalb alles durch und setzt die Kopfzeile weiterhin nur
     dort, wo sie hingehört — sie steht als fester Wert `en` da und wäre auf
     einer deutschen Adresse schlicht falsch. */
  matcher: "/:path*",
};
