/**
 * Die Kopfzeile, über die der Proxy der 404-Seite die Sprache mitteilt.
 *
 * Eigene Datei, weil `proxy.ts` in optimierten Fällen am CDN läuft und
 * ausdrücklich nichts mit der Anwendung teilen soll, ein Import aus der
 * Proxy-Datei zöge deren Modul in die Seite. Ein Name, der zweimal
 * ausgeschrieben wird, ist der Anfang zweier verschiedener Namen.
 */
export const SPRACH_KOPFZEILE = "x-sprache";

/**
 * Die Kopfzeile, über die der Proxy der 404-Seite die angefragte Adresse
 * mitteilt.
 *
 * Die Fehlerseite bietet an, einen toten Verweis zu melden. Der Mailverweis
 * trug bis zum 08.08.2026 nur einen Betreff, welche Adresse ins Leere führte,
 * musste der Absender selbst dazuschreiben. Eine Meldung ohne die Adresse ist
 * die Hälfte einer Meldung, und die fehlende Hälfte ist die, auf die es
 * ankommt.
 *
 * Der Pfad kommt über den Proxy und nicht aus dem Browser: So steht er auch
 * ohne JavaScript in der Mail, und die Fehlerseite bleibt eine Server-Seite.
 */
export const PFAD_KOPFZEILE = "x-pfad";
