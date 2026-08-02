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

**Dateinamen, Ordner und JSON-Schlüssel sind englisch. Fließtext, Kommentare
und alles Sichtbare sind deutsch. Bezeichner im Code dürfen deutsch sein,
müssen dann aber ohne Umlaute auskommen.**

Das ist keine Geschmacksfrage, sondern folgt aus zwei harten Punkten: Umlaute
in Dateinamen brechen über Betriebssysteme hinweg, und die Ersatzschreibung
`ue/ae/oe` ist die Krücke, die man sich dafür einhandelt — sie stand einmal in
sechs Dateinamen neben sechzig englischen. Wer diese Datei liest, sieht sonst
zwei Sprachen und zwei Konventionen in einem Verzeichnis.

Bei **Bezeichnern im Code** gilt dieser Grund nicht: Sie verlassen das Repo
nie und kollidieren mit keinem Dateisystem. Hier stand trotzdem „englisch",
und der Code hielt sich nie daran — gezählt rund 1.400 deutsche gegen 2.500
englische Vorkommen, quer durch `src/` und `scripts/`. Eine Regel, die
niemand befolgt, macht das Dokument wertlos und nicht den Code besser: Die
Regel wandert dorthin, wo sie einen Grund hat. Deutsch ist erlaubt, wo die
Sache deutsch ist (`abweichungen`, `pruefe`, `bauOrdner`); englisch bleibt,
was das Framework vorgibt (`params`, `metadata`, `generateStaticParams`).
Umlaute bleiben auch dort draußen, weil sie sich über Tastaturen, Terminals
und `grep`-Aufrufe hinweg als Ärger erweisen.

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

Offene Datenpunkte werden als `TODO(domenic)` markiert. Was nur der Inhaber
liefern kann, steht gesammelt in `USER-TODO.md` — und diese Datei enthält
ausschließlich das.

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

## Das Zeichen

Die Form steht in `src/lib/mark.tsx` und **nur dort**. Kopfleiste, `icon.tsx`,
`apple-icon.tsx` und die Vorschaukarte lesen daraus; `favicon.ico` wird von
`npm run build:favicon` aus derselben Datei erzeugt, weil eine Binärdatei nicht
mitliest. Wer die Form ändert, ruft den Lauf hinterher auf.

Vorher gab es zwei Marken: dunkler Buchstabe auf grüner Fläche in der
Kopfleiste, grüner auf dunkler im Lesezeichen. So entsteht das — nicht durch
eine Entscheidung, sondern durch eine zweite Stelle.

## Das Porträt

Dasselbe in Grün, nur mit einem Foto: Es liegt an drei Stellen — groß auf der
Seite (`public/portrait-dark.jpg`), klein auf dem One-Pager
(`public/portrait.jpg`), eingebettet in der Vorschaukarte
(`src/lib/og-portrait.jpg`). Alle drei schreibt `npm run build:portrait` aus
den Originalen in `../assets/pb/`, die bewusst neben dem Repo liegen: 3,1 MB
verlustfreies PNG liefert niemand aus.

Wer das Foto tauscht, tauscht das Original und ruft den Lauf. Wer eine der
drei Dateien von Hand bearbeitet, hat wieder ein zweites Gesicht — und merkt
es erst, wenn jemand die Seite teilt.

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

## Tests

Die sieben Prüfläufe messen an der ausgelieferten Seite und sind der eigentliche
Beweis. Was sie **nicht** greifen, ist reine Rechenlogik ohne sichtbare
Ausgabe: `src/lib/zeitspanne.ts` entscheidet, ob dort „vier Monate" oder „fünf
Monate" steht, und ein Fehler um eins sieht auf der Seite völlig normal aus.
Solche Funktionen gehören in `src/lib/` mit einer `.test.ts` daneben.

Alles, was den Browser braucht, bleibt bei den Prüfläufen: Ein Bauteil mit
jsdom nachzustellen prüft die Nachstellung, nicht die Seite.

## Definition of Done

```bash
npx tsc --noEmit      # 0 Fehler
npx eslint .          # 0 Errors
npm test              # die reine Rechenlogik, ohne Browser
npm run build         # grün
npm run check:a11y    # jede gebaute Seite gegen WCAG 2.2 AA, zwei Breiten
npm run check:privacy # keine Seite baut eine Verbindung nach außen auf
npm run check:links   # kein Anker und keine interne Adresse zeigt ins Leere
npm run check:parity  # beide Sprachfassungen zeigen gleich viel
npm run check:headers # die ausgelieferte Seite trägt die Schutz-Kopfzeilen
npm run check:print   # jede gebaute Seite druckt lesbar und vollständig
npm run check:headings # keine abgeschnittene Unterlänge
npm run check:reading  # Lesezeiten stimmen mit dem Wortbestand
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
