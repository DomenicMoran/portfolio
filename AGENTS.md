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
nie und kollidieren mit keinem Dateisystem. Hier stand trotzdem „englisch“,
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
- `salati.ts` hält die Zahlen der App, die in beiden Sprachfassungen und in der
  Recruiter-Kachel vorkommen. Sie standen dort dreimal, und als Salati auf 66
  ausgelieferte Versionen kam, nannte dieselbe Seite 66 und 65 nebeneinander
- `en.ts` ist die englische Fassung, deklariert als `Content`
- `types.ts` ist die gemeinsame Form. Fehlt in `en.ts` ein Feld, schlägt der
  Typecheck fehl; eine Übersetzung kann nicht stillschweigend unvollständig
  werden
- `articles/` trägt die Fachartikel als getippte Blöcke, je Sprache eine Datei

Ein neuer Artikel ist mehr als zwei Dateien. Gemessen am sechsten: Er braucht
beide Sprachfassungen, einen Eintrag in `articles/index.ts` samt Slug-Paar,
drei Weiterleitungen in `vercel.json` für die Slugs in der falschen Fassung,
die Zahl in den Überschriften der Übersicht, die Repo-Beschreibung auf GitHub
und eine Zeile in `VEROEFFENTLICHT` in `scripts/check-links.mjs`. Die letzte
ist die, die man vergisst — sie hält fest, welche Adresse einmal öffentlich
war, und ohne sie zählt der Feed einen Eintrag mehr, als die Liste kennt.
`node scripts/check-figures.mjs` nennt die übrigen Punkte von selbst.

Nichts wird fest in eine Komponente geschrieben, auch keine `aria-label`. Auf
der englischen Fassung las ein Screenreader sonst deutsche Ansagen vor.

Ein leerer Wert muss das zugehörige Element **entfernen**, nicht einen
Platzhalter rendern. Muster:

```tsx
{site.socials.linkedin ? <a href={site.socials.linkedin}>…</a> : null}
```

Grund: Diese Seite verkauft Glaubwürdigkeit. Ein sichtbares „Lorem ipsum“ oder
ein toter Link kostet mehr, als das fehlende Element je gebracht hätte.

Offene Datenpunkte werden als `TODO(domenic)` markiert.

Eine `USER-TODO.md` gibt es nicht mehr. Sie war die Stelle, an der Arbeit
liegen blieb: „Konventionsdatei für zwei Repos anlegen“ stand dort keine
Stunde, bevor die Dateien geschrieben waren, und „zwei Vercel-Projekte“
löste sich beim Nachmessen in einen Namensgleichklang auf. Was auffällt, wird
entschieden und umgesetzt; die Begründung steht dort, wo die Sache steht.
Nachlesbar bleibt sie in `../ENTSCHIEDEN.md`.

## Bewegung

Fünf Regeln, alle nicht verhandelbar:

1. **`prefers-reduced-motion` gilt für JS-Animationen genauso.** Die CSS-Regel
   in `globals.css` erreicht Framer Motion nicht: dafür ist `MotionProvider`
   (`MotionConfig reducedMotion="user"`) zuständig. Wer eine neue
   Animationsbibliothek einführt, muss denselben Ausstieg bauen.
2. **Lenis und der Custom-Cursor werden bei Reduced-Motion nicht gemountet.**
   Nicht „deaktiviert“: gar nicht erst geladen.
3. **Über der Falz nur CSS-Animationen.** Eine JS-Animation mit
   `initial opacity 0` ist bis zur Hydration unsichtbar. Steht das Element
   über der Falz, ist es damit das LCP-Element und erscheint erst nach der
   Hydration: gemessen 4,6 s auf einem gedrosselten Telefon, während die
   Überschrift daneben schon seit 1,35 s stand. `animate-fade-rise` und
   `animate-word-rise` sind die CSS-Entsprechungen; `SectionHeading` und
   `RevealWords` nehmen dafür ein `css`-Flag. Unterhalb der Falz bleibt die
   JS-Variante richtig, weil die Bewegung dort erst beim Hineinscrollen
   laufen soll.
4. **Das LCP-Element blendet nicht ein.** Auch nicht als CSS-Animation.
   Chrome zählt ein Element mit `opacity: 0` nicht als gemalt, also landet
   jede Verzögerung plus ein Teil der Dauer unmittelbar im Kernwert. Gemessen
   am Vorspann des Kopfes, dem größten Textstück über der Falz: mit
   `animate-fade-rise` 2.232 bis 2.496 ms, während der Absatz darunter schon
   bei 1.624 ms stand — 20 ms unter dem Budget von 2.500. Mit `animate-rise`,
   derselben Bewegung ohne Blende, sind es 1.656 ms. Wer im Kopf ein neues
   Textelement anlegt, prüft mit `npm run check:vitals`, ob es das
   LCP-Element geworden ist.
5. **Performance schlägt Effekt.** Kein Canvas, kein WebGL, keine
   Scroll-Handler ohne `passive`. Glüh-Effekte sind geblurrte Divs, Grain ist
   ein Inline-SVG, der Marquee läuft als CSS-Animation ohne rAF-Schleife.

## Zwei Fallen, die hier schon zugeschnappt sind

**Wort-Abstände in Masken-Reveals brauchen `margin`, kein Leerzeichen.** Ein
Leerzeichen am Ende eines `inline-block` mit `overflow: hidden` wird
zusammengefaltet. Die Wörter kleben dann aneinander. Betrifft `Hero` und
`RevealWords`.

Der Hero löst es mit einem Leerzeichen **zwischen** den Masken, also außerhalb
des schneidenden Kastens — dasselbe Ergebnis, und gemessen am 07.08.2026 sind
es 24,8 px bei 129,6 px Schrift und 8,4 px bei 44 px, beide Male 19 Prozent.
`check:headings` verlangt seither 8 Prozent und meldet sonst Wortpaar,
Schriftgröße und Abstand. Gegengeprüft ohne das Leerzeichen: drei Paare mit
0 px.

**Dekorative Glüh-Kreise brauchen einen Clip.** Ein `glow-orb` ist breiter als
das Viewport und erzeugt sonst horizontales Scrollen auf Telefonen.

Hier stand, der Clip gehöre an die `absolute inset-0`-Hülle der Deko und nicht
an die Sektion, weil er am Sektions-Container auch den Inhalt abschneidet,
sobald eine Parallaxe ihn verschiebt. Der erste Teil ist gemessen falsch: Die
Kreise sind selbst absolut positioniert, und ein `overflow-x: clip` an der
Hülle hält sie nicht. Umgestellt und bei 390 px an der gebauten Seite
nachgesehen, wuchs das Dokument von 380 px auf 1488 px — genau das Scrollen,
das die Regel verhindern soll. Der Clip steht deshalb in allen fünf Sektionen
an der Sektion, und das bleibt so.

Der zweite Teil stimmt weiterhin und ist der Preis dafür: Was über die
Sektionskante hinausragen soll, wird abgeschnitten. Wer dort eine Parallaxe
einbaut, prüft das mit.

Was dabei sichtbar wurde: `overflow-hidden` macht die Sektion zum
Scrollcontainer. `#hire` meldet bei 390 px 504 px Inhaltsbreite auf 390 px
sichtbar, `#workflow` 467 und `#contact` 435; bei 320 px kommt `#about` mit
322 auf 320 dazu, ein einzelner Glüh-Kreis. Das Dokument scrollt nicht, alle
fokussierbaren Elemente liegen innerhalb, und der Überstand stammt
ausschließlich aus der Deko — heute also ohne Wirkung. Wer einen Verweis so
weit nach rechts setzt, dass er in diesen Bereich fällt, bekommt beim
Fokussieren einen Versatz, der nicht zurückspringt. Im Hero hat das bei 320 px die untere
Kennzahlenreihe waagerecht mitten durch die Ziffern getrennt. Zusätzlich
`overflow-x: clip` an `html`/`body` als Netz.

Der letzte Satz war bis zum 07.08.2026 ein Merksatz — also eine Regel, die
niemand prüft und die beim ersten Umbau still fällt. `check:focus` sieht sie
jetzt an jeder der 1.132 Stationen nach: Steht ein Vorfahr des fokussierten
Elements auf `scrollLeft > 1`, nennt der Lauf Seite, Breite, Element, Sektion
und Versatz. Gegengeprüft mit einem Verweis auf `left: 460px` in `#hire`:
gemeldet mit 161 px, und die Station danach gleich mit — weil die Sektion
verschoben bleibt, was der Satz oben behauptet.

## Das Zeichen

Die Form steht in `src/lib/mark.tsx` und **nur dort**. Kopfleiste, `icon.tsx`,
`apple-icon.tsx` und die Vorschaukarte lesen daraus; `favicon.ico` wird von
`npm run build:favicon` aus derselben Datei erzeugt, weil eine Binärdatei nicht
mitliest. Wer die Form ändert, ruft den Lauf hinterher auf.

Vorher gab es zwei Marken: dunkler Buchstabe auf grüner Fläche in der
Kopfleiste, grüner auf dunkler im Lesezeichen. So entsteht das — nicht durch
eine Entscheidung, sondern durch eine zweite Stelle.

## Die Schrift der Vorschaubilder

`next/og` bringt genau einen Schnitt mit: Geist Regular. Satori erfindet keine
Fettung — ein `fontWeight`, für den kein Schnitt registriert ist, rendert still
als 400. Kein Fehler, keine Warnung, und im Bild sieht man es erst im direkten
Vergleich. Gemessen an den ausgelieferten Karten verlangten alle drei Erzeuger
600 oder 700 und bekamen 400.

Wer ein neues Gewicht benutzt, legt den Schnitt nach `src/lib/fonts/` und
trägt ihn in `ogSchriften` ein. `src/lib/fonts/fonts.test.ts` hält beides
gegeneinander und schlägt sonst fehl.

## Die Produktaufnahmen

Dieselbe Trennung wie beim Porträt: Die Originale liegen in `../assets/shots`
außerhalb des Repos, ausgeliefert wird `public/shots/*.webp`, erzeugt von
`npm run build:shots`.

Gemessen: Die elf Aufnahmen lagen als PNG im Repo und wogen zusammen 5,6 MB —
jeder Klon zog sie mit. Als WebP bei Qualität 92 sind es 1,1 MB, ohne dass an
einer Oberfläche etwas zu sehen wäre; es sind Bildschirmfotos, keine Fotos.
Für den Besucher ändert sich nichts, `next/image` rechnet sie ohnehin herunter.

Wer eine Aufnahme tauscht, legt das PNG nach `../assets/shots` und ruft den
Lauf. Wer eine WebP-Datei von Hand bearbeitet, hat wieder zwei Fassungen.

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

## Die 77 Weiterleitungen

`vercel.json` ist mit 464 Zeilen die längste Datei ohne Prosa, und JSON lässt
keinen Kommentar zu. Deshalb steht hier, was dort steht und warum.

Jede Regel kommt aus derselben Beobachtung: Adressen entstehen nicht nur durch
Klicken, sondern durch Tippen, Kürzen und Raten. Wer `/artikel/feed.xml` kennt,
schreibt `/artikel/feed`. Wer die englische Fußzeile mit „Privacy“ gelesen hat,
tippt `/privacy`. Wer den deutschen Pfad `/artikel` kennt, schreibt `/en/article`
statt `/en/articles`. Keiner dieser Fälle taucht in einem Verweis auf, und keiner
fällt ohne Messung auf.

Sechs Gruppen, gemessen am 08.08.2026:

| Gruppe | Anzahl | Beispiel |
| --- | --- | --- |
| Abschnitt der Startseite | 20 | `/recruiter` → `/#hire` |
| Artikel in der falschen Sprachfassung | 18 | `/en/artikel/<slug>` → `/en/articles/<slug>` |
| Feed | 12 | `/rss`, `/artikel/feed` → `/artikel/feed.xml` |
| Rechtsseiten | 10 | `/imprint`, `/privacy` |
| Kurzprofil | 8 | `/cv`, `/lebenslauf`, `/resume` |
| Übersichten und Reste | 9 | `/blog` → `/artikel` |

Drei Regeln hält `check:links` dagegen. Jedes Ziel muss mit 200 antworten —
auch eines mit Platzhalter, das der Lauf dafür mit einem echten Slug einsetzt.
Jede Regel trägt `permanent: true`, sonst antwortet Vercel mit 307, und 307
sagt „vorübergehend“. Und kein Ziel ist selbst wieder eine Quelle: Eine Kette
kostet zwei Umläufe statt einem, und im Quelltext liegen die beiden Zeilen
dann zwanzig Einträge auseinander.

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
1024 px einzeilig“, nicht „Leiste war zweizeilig“. Kein Präfix, keine
Fehlernummer.

Der Rumpf nennt den Grund und die Messung, auf die sich die Änderung stützt.
Eine Zahl ohne Messmethode gehört nicht hinein. Was geprüft wurde und
unverändert blieb, darf mit — das ist der Teil, den man später sucht.

Automatische Commits kommen ausschließlich vom Zahlen-Automaten und tragen
„Commit-Zahlen aufgefrischt“.

## Tests

22 der Prüfläufe öffnen einen Browser und messen an der ausgelieferten
Seite: `check:a11y`, `check:cards`, `check:contrast`, `check:demo`, `check:focus`,
`check:images`, `check:spacing`,
`check:font-size`, `check:headings`, `check:language`, `check:lighthouse`,
`check:links`, `check:palette`, `check:panels`, `check:parity`,
`check:print`, `check:privacy`, `check:schema`, `check:separators` und
`check:vitals`. Sie sind der eigentliche Beweis.

Was sie **nicht** greifen, ist reine Rechenlogik ohne sichtbare Ausgabe:
`src/lib/duration.ts` entscheidet, ob dort „vier Monate“ oder „fünf Monate“
steht, und ein Fehler um eins sieht auf der Seite völlig normal aus. Solche
Funktionen gehören in `src/lib/` mit einer `.test.ts` daneben.

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
npm run check:stack   # jede genannte Technik steht wirklich im Produktivrepo
npm run check:onepager # das ausgelieferte PDF stammt aus dem aktuellen Inhalt
npm run check:typography # jede Sprachfassung setzt ihre eigenen Zeichen
npm run check:legal   # jede Zusage der Rechtsseiten gegen die Wirklichkeit
npm run check:exports # jede Ausfuhr aus src/ hat einen Abnehmer
npm run check:copy    # keine Beschriftung steht fest in einer Komponente
npm run check:headers # die ausgelieferte Seite trägt die Schutz-Kopfzeilen
npm run check:print   # jede Seite druckt lesbar, das Kurzprofil auf einem Blatt
npm run check:headings # keine abgeschnittene Unterlänge
npm run check:landmarks # jede Seite bietet ihre Landmarken an
npm run check:separators # kein Trennzeichen am Zeilenende
npm run check:nbsp     # keine Rechtsangabe bricht vor ihrer Ziffer um
npm run check:reading  # Lesezeiten stimmen mit dem Wortbestand
npm run check:vitals   # LCP, CLS und INP auf einem gedrosselten Telefon
npm run check:bundle   # JavaScript je Seite gegen Budgets
npm run check:cards    # Kartenreihen beginnen auf einer Höhe
npm run check:font-size # kein Text geht bei größerer Grundschrift verloren
npm run check:focus    # der Tastaturfokus bleibt sichtbar
npm run check:spacing  # größerer Textabstand kostet keinen Inhalt
npm run check:panels   # jede Tafel hinter einem Reiter zeigt ihren Inhalt
npm run check:language # beide Sprachfassungen hängen wechselseitig zusammen
npm run check:demo     # die Demo auf der Startseite rechnet nachprüfbar richtig
npm run check:code     # jeder Codeblock in den Artikeln geht syntaktisch auf
npm run check:contrast # der Kontrast dort, wo axe keine Antwort gibt
npm run check:images   # kein Bild wird größer gezeigt, als es geladen wurde
npm run check:chars    # kein Steuerzeichen im Quelltext
npm run check:schema   # die strukturierten Daten decken sich mit der Seite
npm run check:palette  # die Befehlspalette findet und führt hin
npm run check:lighthouse # die Zahl „Lighthouse 100" gegen einen echten Lauf
npm run check:docs     # die Zahlen in AGENTS.md und README.md stimmen noch
```

Vor jedem Schub die drei schnellen davon zusammen:

```bash
npm run preflight   # Steuerzeichen, Handbuch, Ausfuhren, Stand der Blätter
```

Drei Sekunden, und sie decken die vier Fehler ab, die zuletzt in der CI rot
wurden: ein Steuerzeichen aus einem Einfüge-Skript, eine Zahl im Handbuch, die
nicht mehr stimmte, zwei PDFs, die nach einer Inhaltsänderung nicht neu
gedruckt waren, und eine Ausfuhr, deren letzter Abnehmer weggefallen war.
Alle vier fallen hier auf, bevor sie jemand sieht.

Gestartet wird er nicht von Hand: `.githooks/pre-push` ruft ihn vor jedem Push
auf, und `prepare` hängt den Hook-Pfad nach `npm install` ein. Der Aufruf steht
in einem `try` — auf einem Bauserver ohne `.git` würde ein nacktes `git config`
die Installation abbrechen und damit den ganzen Bau.

Dazu, außerhalb der CI, weil er die Nachbar-Repos braucht:

```bash
node scripts/check-figures.mjs  # jede Zahl der Seite gegen die Repos, aus
                                # denen sie stammt — dazu Lebenslauf,
                                # Bewerbungsunterlagen, Lernplattform und
                                # jede Adresse, die nach außen zeigt
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

Und er muss **neu gedruckt** werden: `npm run build && npm run onepager:pdf`.
Die beiden PDFs entstehen nicht beim Bau — dafür bräuchte Vercel ein Chromium.
Sie sind damit die einzigen ausgelieferten Dateien, die veralten können, und
ausgerechnet die, die weitergereicht werden. `npm run check:onepager` hält den
Quellstand im Dokument gegen die Quellen und scheitert sonst.
