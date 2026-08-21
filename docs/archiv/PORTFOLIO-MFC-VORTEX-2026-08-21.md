# Portfolio: MFC-Screenshot und Vortex-App-Aufnahmen · 2026-08-21

Zwei Qualitätsmängel im Bewerbungs-Portfolio behoben. Stand aller Angaben vor
dem Commit gegen die Repos und die Live-Systeme geprüft.

## 1. MFC — fehlendes Original, Alt-Text falsch

Die Fallstudie „Moran Fleet Control“ (index 00) war bereits vollständig
angelegt: Kurzbeschreibung, Live-URL `https://mfc.domenicmoran.de`, Preis
49,99 € einmalig, eine WebP-Aufnahme. Was fehlte, war das **Original-PNG**
zur ausgelieferten WebP: `check:shots` schlug mit
„mfc/dashboard.webp: kein Original unter ../assets/shots/mfc/dashboard.png“
fehl.

Behoben:

- Echte Aufnahme per Playwright auf `https://mfc.domenicmoran.de/dashboard`
  (1280 × 800), abgelegt als `../assets/shots/mfc/dashboard.png`, WebP über
  `npm run build:shots` neu erzeugt.
- Alt-Text und Beschriftung in `site.ts` und `en.ts` an die echte Web-Vorschau
  angepasst: Das Web-Dashboard zeigt einen Demo-Hinweis und Statuskarten
  (Core-Status, Router-Anbieter, Micro-SaaS-Module, offene Punkte), keine
  Seitenleiste. Label „Dashboard · Web-Vorschau“ statt „Dashboard · live“.

## 2. Vortex — Website-Bild ersetzt durch App-Aufnahmen

Die Fallstudie zeigte nur ein Website-Screenshot
(`aufnahme-02-ergebnis-web.webp`, 1265 × 2274). Ersetzt durch drei echte
App-Aufnahmen aus `Vortex/marke/laden/`:

| Datei | Inhalt | Maß |
|---|---|---|
| aufnahme-01-start.webp | Startbildschirm, Shop-Link-Eingabe | 1170 × 2340 |
| aufnahme-02-pruefung.webp | Prüfergebnis mit Punktzahl und Begründung | 1170 × 2340 |
| aufnahme-03-so-funktioniert-es.webp | „So funktioniert es“, drei Schritte | 1170 × 2340 |

Originale nach `../assets/shots/vortex/` kopiert, WebP erzeugt, in `site.ts`
und `en.ts` referenziert (DE + EN spiegelbildlich). Die alte Web-Aufnahme
und ihr Original wurden entfernt.

## 3. check:parity — Dezimaltrennzeichen

`check:parity` meldete eine Abweichung auf dem One-Pager: deutsch „49,99“,
englisch „49.99“ — dieselbe Zahl (MFC-Preis), nur lokalisiert gesetzt. Die
Zahlen-Normalisierung in `scripts/check-parity.mjs` hat nur Tausender-,
nicht Dezimaltrennzeichen vereinheitlicht. Ergänzt, sodass „49,99“ und
„49.99“ als dieselbe Zahl gelten. Kein weiterer Zahlenwert war betroffen.

## Belege

| Prüfung | Ergebnis |
|---|---|
| `npx tsc --noEmit` | 0 Fehler |
| `npx eslint src/content/site.ts src/content/en.ts` | 0 Errors |
| `npm test` | 8 Dateien, 44 Tests grün |
| `npm run build` | grün, 36 statische Seiten |
| `npm run check:shots` | 45 Bilder, 12 Gruppen einheitlich |
| `npm run check:parity` | 10 Seitenpaare, 121 Vergleiche ohne Abweichung |
| `npm run check:links` | 838 Verweise, kein toter Verweis |
| `npm run check:docs` | 469 Angaben stimmen |
| `npm run check:onepager` | beide Blätter aus aktuellem Inhalt |
