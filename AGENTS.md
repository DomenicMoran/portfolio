<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Konventionen für dieses Repo

Gilt für Menschen und Agenten gleichermaßen. Diese Datei ist der Kontext, der
sonst in einem Chatverlauf verloren geht.

## Next.js 16: was hier konkret greift

- Turbopack ist Standard für `dev` **und** `build`
- `next lint` existiert nicht mehr: ESLint direkt aufrufen (`npx eslint .`)
- ESLint nutzt Flat Config
- `middleware` heißt jetzt `proxy`
- `params`/`searchParams` sind ausschließlich asynchron
- Ohne `data-scroll-behavior="smooth"` am `<html>` überschreibt Next das
  Scroll-Verhalten bei Navigation nicht mehr

## Aufbau

Zwei Wurzel-Layouts, eines je Sprache, unter `src/app/(de)` und `src/app/(en)`.
Nur so stimmt `<html lang>` je Fassung, ohne die deutschen URLs unter ein
`/de`-Präfix zu schieben. Der Preis: `app/layout.tsx` gibt es nicht, und eine
globale 404 kann Next dadurch nicht komponieren. Dafür ist
`app/global-not-found.tsx` da, das sein eigenes Dokument mitbringt.

## Benennung: englisch außen, deutsch innen

**Dateinamen, Ordner, Bezeichner und JSON-Schlüssel sind englisch. Fließtext,
Kommentare und alles Sichtbare sind deutsch.**

Das ist keine Geschmacksfrage, sondern folgt aus zwei harten Punkten: Umlaute
in Dateinamen brechen über Betriebssysteme hinweg, und die Ersatzschreibung
`ue/ae/oe` ist die Krücke, die man sich dafür einhandelt — sie stand einmal in
sechs Dateinamen neben sechzig englischen. Wer diese Datei liest, sieht sonst
zwei Sprachen und zwei Konventionen in einem Verzeichnis.

Ausgenommen sind **URL-Segmente**: `/artikel`, `/impressum`, `/datenschutz`
sind deutsch, weil sie der Leser sieht und weil sie stabil bleiben müssen.

```
scripts/check-figures.mjs        nicht  scripts/zaehle-belege.mjs
src/content/verified.json        nicht  src/content/geprueft.json
{ "date": …, "source": … }       nicht  { "datum": …, "quelle": … }
```

## Inhalte

**Copy gehört nie in eine Komponente.** Jeder Text und jede Zahl steht in
`src/content/`. Komponenten lesen daraus, sie definieren nichts.

`verified.json` ist der Prüfstempel und hat **genau einen Schreiber**: den
Workflow `refresh-figures.yml`. Kachel, Konsolenmeldung, humans.txt und das
LinkedIn-Titelbild lesen daraus. Wer eine zweite Schreibstelle einbaut, baut
zwei Zahlen für dieselbe Sache.

- `site.ts` ist die deutsche Quelle
- `de.ts` ist ein Adapter darauf plus die Beschriftungen, die erst durch die
  Zweisprachigkeit entstehen
- `en.ts` ist die englische Fassung, deklariert als `Content`
- `types.ts` ist die gemeinsame Form. Fehlt in `en.ts` ein Feld, schlägt der
  Typecheck fehl; eine Übersetzung kann nicht stillschweigend unvollständig
  werden
- `articles/` trägt die Fachartikel als getippte Blöcke, je Sprache eine Datei

Nichts wird fest in eine Komponente geschrieben, auch keine `aria-label`. Auf
der englischen Fassung las ein Screenreader sonst deutsche Ansagen vor.

Ein leerer Wert muss das zugehörige Element **entfernen**, nicht einen
Platzhalter rendern. Muster:

```tsx
{site.socials.linkedin ? <a href={site.socials.linkedin}>…</a> : null}
```

Grund: Diese Seite verkauft Glaubwürdigkeit. Ein sichtbares „Lorem ipsum" oder
ein toter Link kostet mehr, als das fehlende Element je gebracht hätte.

Offene Datenpunkte werden als `TODO(domenic)` markiert und verweisen auf den
Abschnitt in `USER-TODO.md`, der sie liefert.

## Bewegung

Drei Regeln, alle nicht verhandelbar:

1. **`prefers-reduced-motion` gilt für JS-Animationen genauso.** Die CSS-Regel
   in `globals.css` erreicht Framer Motion nicht: dafür ist `MotionProvider`
   (`MotionConfig reducedMotion="user"`) zuständig. Wer eine neue
   Animationsbibliothek einführt, muss denselben Ausstieg bauen.
2. **Lenis und der Custom-Cursor werden bei Reduced-Motion nicht gemountet.**
   Nicht „deaktiviert": gar nicht erst geladen.
3. **Über der Falz nur CSS-Animationen.** Eine JS-Animation mit
   `initial opacity 0` ist bis zur Hydration unsichtbar. Steht das Element
   über der Falz, ist es damit das LCP-Element und erscheint erst nach der
   Hydration: gemessen 4,6 s auf einem gedrosselten Telefon, während die
   Überschrift daneben schon seit 1,35 s stand. `animate-fade-rise` und
   `animate-word-rise` sind die CSS-Entsprechungen; `SectionHeading` und
   `RevealWords` nehmen dafür ein `css`-Flag. Unterhalb der Falz bleibt die
   JS-Variante richtig, weil die Bewegung dort erst beim Hineinscrollen
   laufen soll.
4. **Performance schlägt Effekt.** Kein Canvas, kein WebGL, keine
   Scroll-Handler ohne `passive`. Glüh-Effekte sind geblurrte Divs, Grain ist
   ein Inline-SVG, der Marquee läuft als CSS-Animation ohne rAF-Schleife.

## Zwei Fallen, die hier schon zugeschnappt sind

**Wort-Abstände in Masken-Reveals brauchen `margin`, kein Leerzeichen.** Ein
Leerzeichen am Ende eines `inline-block` mit `overflow: hidden` wird
zusammengefaltet. Die Wörter kleben dann aneinander. Betrifft `Hero` und
`RevealWords`.

**Dekorative Glüh-Kreise brauchen einen Clip, aber nicht am Sektions-Container.**
Ein `glow-orb` ist breiter als das Viewport und erzeugt sonst horizontales
Scrollen auf Telefonen. Der Clip gehört an die `absolute inset-0`-Hülle der
Deko, nicht an die Sektion: Am Sektions-Container schneidet er auch den Inhalt
ab, sobald eine Parallaxe ihn verschiebt. Im Hero hat das bei 320 px die untere
Kennzahlenreihe waagerecht mitten durch die Ziffern getrennt. Zusätzlich
`overflow-x: clip` an `html`/`body` als Netz.

## Server/Client-Grenze

`page.tsx` bleibt Server Component. Seitenweiter Client-State lebt in
`SiteShell`. Wer eine neue interaktive Sektion baut, markiert die Sektion selbst
mit `"use client"`, nicht die Seite.

Zustand beim Wechsel eines Props wird **während des Renderns** angepasst
(`if (open !== wasOpen) { … }`), nicht in einem `useEffect`. Die
`react-hooks/set-state-in-effect`-Regel ist scharf und hat recht.

## Sicherheit

- Kein `dangerouslySetInnerHTML` mit etwas anderem als lokalen Konstanten, und
  auch dort `<` escapen
- Jeder Wert, der in eine E-Mail wandert: Länge begrenzen, HTML escapen,
  CR/LF entfernen
- Fehler beim Mailversand liefern einen echten Statuscode. Eine falsche
  Erfolgsmeldung ist schlimmer als ein sichtbarer Fehler

## Commits

Deutsch, durchgängig. Der Betreff bleibt unter 72 Zeichen und beschreibt den
Stand **nach** der Änderung, nicht den Fehler davor: „Kopfleiste bleibt bei
1024 px einzeilig", nicht „Leiste war zweizeilig". Kein Präfix, keine
Fehlernummer.

Der Rumpf nennt den Grund und die Messung, auf die sich die Änderung stützt.
Eine Zahl ohne Messmethode gehört nicht hinein. Was geprüft wurde und
unverändert blieb, darf mit — das ist der Teil, den man später sucht.

Automatische Commits kommen ausschließlich vom Zahlen-Automaten und tragen
„Commit-Zahlen aufgefrischt".

## Definition of Done

```bash
npx tsc --noEmit    # 0 Fehler
npx eslint .        # 0 Errors
npm run build       # grün
npm run check:print # 17 Seiten drucken lesbar und vollständig
```

`check:print` gehört dazu, weil der Ausdruck ein eigener Auslieferungsweg ist,
den niemand ansieht. Gemessen: Die Startseite kam ohne vorheriges Scrollen als
15 fast leere Seiten aus dem Drucker, weil die Einblendungen auf ein
Hineinscrollen warten, das beim Drucken nie stattfindet — und die Kennzahlen
standen auf eingefrorenen Zwischenwerten statt auf ihren belegten Zahlen.

Dazu: sichtbare Änderungen im Browser prüfen, mindestens bei 390 px und
1440 px Breite, und einmal mit aktiviertem Reduced-Motion. Ein grüner Build ist
kein Beleg dafür, dass etwas gut aussieht.

Der One-Pager muss **eine** Seite bleiben: nach Inhaltsänderungen die
Druckansicht gegenprüfen (`.onepager`-Höhe < ~1040 px bei 794 px Breite).
