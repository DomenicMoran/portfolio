/**
 * Die Kopfzeile, über die der Proxy der 404-Seite die Sprache mitteilt.
 *
 * Eigene Datei, weil `proxy.ts` in optimierten Fällen am CDN läuft und
 * ausdrücklich nichts mit der Anwendung teilen soll — ein Import aus der
 * Proxy-Datei zöge deren Modul in die Seite. Ein Name, der zweimal
 * ausgeschrieben wird, ist der Anfang zweier verschiedener Namen.
 */
export const SPRACH_KOPFZEILE = "x-sprache";
