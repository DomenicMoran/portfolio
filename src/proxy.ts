import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SPRACH_KOPFZEILE } from "@/lib/language-header";

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
export function proxy(request: NextRequest) {
  const kopfzeilen = new Headers(request.headers);
  kopfzeilen.set(SPRACH_KOPFZEILE, "en");
  return NextResponse.next({ request: { headers: kopfzeilen } });
}

export const config = {
  matcher: "/en/:path*",
};
