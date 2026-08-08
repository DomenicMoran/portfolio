<div align="center">

# domenicmoran.de

**Portfolio eines AI Product Engineers: gebaut wie ein Produkt, nicht wie eine Visitenkarte.**

Dark-Mode-First · Bewegung mit Reduced-Motion-Ausstieg · Null Cookies · Null Tracker
Vier Fallstudien mit rekonstruierten Architekturdiagrammen · ⌘K-Befehlspalette · Druckfertiger One-Pager

[![Prüfen](https://github.com/DomenicMoran/portfolio/actions/workflows/check.yml/badge.svg)](https://github.com/DomenicMoran/portfolio/actions/workflows/check.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-087ea4?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Worum es geht

Die meisten Entwickler-Portfolios sind eine Liste von Technologien. Dieses hier
versucht etwas anderes: für jedes der vier Systeme in Produktion beantwortet es
drei Fragen, die ein CTO tatsächlich stellt: *Welches Problem?*, *Welche
Architektur?*, *Was war der schwierige Teil?*

Der Abschnitt **„Die harte Stelle“** ist der Kern jeder Fallstudie. Nicht die
Feature-Liste unterscheidet Entwickler voneinander, sondern das eine Problem,
an dem man nicht drumherum kam.

## Stack

| Bereich | Wahl | Warum |
|---|---|---|
| Framework | Next.js 16, App Router | Jede Seite mit Inhalt wird vorab erzeugt; kein Serverprozess, kein Endpunkt |
| Sprache | TypeScript, strict | 0 Fehler ist Merge-Gate, nicht Zielvorgabe |
| Styling | Tailwind v4 | Design-Tokens leben in CSS (`@theme`), nicht in einer JS-Config |
| Animation | Framer Motion 12 | Deklarativ, respektiert `prefers-reduced-motion` |
| Scrolling | Lenis | Wird bei Reduced-Motion **gar nicht erst geladen** |
| Icons | lucide-react | Brand-Marken als eigenes Inline-SVG (v1 hat sie entfernt) |
| Drittanbieter | keine | Außer dem Hosting lädt diese Seite nichts von fremden Servern |

## Architektur-Entscheidungen

**Jede Seite mit Inhalt ist statisch.** Sie alle entstehen zur Build-Zeit und
liegen danach als fertige Dateien am CDN-Rand. Es gibt keinen Endpunkt, der
Eingaben entgegennimmt, keine Datenbank und keinen Serverprozess. Eine Seite,
die keine Laufzeit braucht, kann auch nicht zur Laufzeit ausfallen.

Einzige Ausnahme ist die Fehlerseite. Sie wird bei der Anfrage zusammengesetzt,
weil sie in der Sprache antworten soll, unter der jemand gekommen ist, und
diese Sprache erst die Adresse verrät. Die Datenschutzerklärung nennt dieselbe
Ausnahme; wer hier etwas ändert, zieht sie dort nach.

Der Kontakt läuft deshalb über eine Mailadresse statt über ein Formular. Ein
Formular hätte einen Versanddienst als Auftragsverarbeiter gebraucht, den die
Datenschutzerklärung ausweisen muss, plus einen Endpunkt mit Rate-Limit und
Fehlerpfad. Der Gegenwert wäre gewesen, dass der Absender ein Feld weniger
ausfüllt, und dabei die Kopie seiner eigenen Nachricht verliert.

**Inhalte liegen an einer Stelle.** [`src/content/site.ts`](src/content/site.ts)
ist die einzige Quelle für jeden Text und jede Zahl. Komponenten enthalten
keinerlei Copy. Ein leerer Wert lässt das jeweilige Element verschwinden statt
einen Platzhalter zu rendern: auf einer Seite, deren Zweck Glaubwürdigkeit ist,
darf eine unbeantwortete Frage nie als sichtbares „Lorem ipsum“ enden.

**Architekturdiagramme sind Daten, kein Bild.** Die vier Diagramme in
[`ArchitectureDiagram.tsx`](src/components/ArchitectureDiagram.tsx) sind als
Knoten- und Kantenliste beschrieben und werden zu SVG gerendert: auflösungsfrei,
im DOM durchsuchbar, mit `aria-label` beschrieben und ohne einen einzigen
Bild-Request.

**Bewegung ist optional, nicht dekorativ erzwungen.** Bei
`prefers-reduced-motion: reduce` wird Lenis nicht initialisiert, der Custom-Cursor
nicht gemountet und jede Animation auf 0,01 ms verkürzt. Den Scroll von jemandem
mit vestibulärer Empfindlichkeit zu kapern, ist das Feindseligste, was eine
„Premium“-Seite tun kann.

**Der PDF-Download ist der Druckdialog.** `/onepager` und `/en/onepager` sind
A4-optimierte Routen mit eigenem Print-Stylesheet. Kein Headless-Chrome im
Betrieb, keine PDF-Bibliothek im Bündel – dafür auswählbarer Text und
funktionierende Links. Beide Sprachen rendern dasselbe Bauteil und ziehen ihre
Zahlen aus derselben Quelle wie die Startseite; ein englisches Blatt mit
abweichenden Zahlen ist damit nicht baubar.

## Lokal starten

```bash
npm install
npm run dev   # http://localhost:3000
```

```bash
npm run build      # Produktions-Build (Turbopack)
npx tsc --noEmit   # Typecheck
npx eslint .       # Lint
npm test           # die reine Rechenlogik, ohne Browser
```

Nach dem Bau laufen 34 Prüfungen, die den Bau nicht ersetzen. 22 davon
öffnen einen Browser und messen an der gebauten Seite statt am Quelltext;
`check:headers` misst an der Auslieferung, weil `vercel.json` vom Bau gar nicht
gelesen wird — und läuft deshalb auf Pull Requests nicht mit. Derselbe Workflow
führt sie bei jedem Push aus:

```bash
npm run check:a11y      # jede gebaute Seite gegen WCAG 2.2 AA, zwei Breiten
npm run check:privacy   # keine Seite baut eine Verbindung nach außen auf
npm run check:links     # kein Anker und keine interne Adresse zeigt ins Leere
npm run check:parity    # beide Sprachfassungen zeigen gleich viel
npm run check:stack     # jede genannte Technik steht wirklich im Produktivrepo
npm run check:onepager  # das ausgelieferte PDF stammt aus dem aktuellen Inhalt
npm run check:typography # jede Sprachfassung setzt ihre eigenen Zeichen
npm run check:legal     # jede Zusage der Rechtsseiten gegen die Wirklichkeit
npm run check:exports   # jede Ausfuhr aus src/ hat einen Abnehmer
npm run check:copy      # keine Beschriftung steht fest in einer Komponente
npm run check:headers   # die ausgelieferte Seite trägt die Schutz-Kopfzeilen
npm run check:print     # jede Seite druckt lesbar, das Kurzprofil auf einem Blatt
npm run check:headings  # keine Überschrift schneidet ihre Unterlängen ab
npm run check:landmarks # jede Seite bietet Hauptbereich, Navigation und Fußzeile
npm run check:separators # kein Trennzeichen bleibt beim Umbruch am Zeilenende
npm run check:nbsp      # keine Rechtsangabe bricht zwischen Kürzel und Ziffer um
npm run check:reading   # die Lesezeit jedes Artikels stimmt mit dem Wortbestand
npm run check:vitals    # LCP, CLS und INP auf einem gedrosselten Telefon, gegen Budgets
npm run check:bundle    # wie viel JavaScript jede Seite mitbringt, gegen Budgets
npm run check:cards     # in einer Kartenreihe beginnt der Text auf gleicher Höhe
npm run check:font-size # kein Text geht bei größerer Grundschrift verloren
npm run check:focus     # der Tastaturfokus bleibt sichtbar
npm run check:spacing   # größerer Textabstand kostet keinen Inhalt
npm run check:panels    # jede Tafel hinter einem Reiter zeigt ihren Inhalt
npm run check:language  # beide Sprachfassungen hängen wechselseitig zusammen
npm run check:demo      # die Demo auf der Startseite rechnet nachprüfbar richtig
npm run check:code      # jeder Codeblock in den Artikeln geht syntaktisch auf
npm run check:contrast  # der Kontrast dort, wo axe keine Antwort gibt
npm run check:images    # kein Bild wird größer gezeigt, als es geladen wurde
npm run check:chars     # kein Steuerzeichen im Quelltext
npm run check:schema    # die strukturierten Daten decken sich mit der Seite
npm run check:palette   # die Befehlspalette findet und führt hin
npm run check:lighthouse # die Zahl „Lighthouse 100" gegen einen echten Lauf
npm run check:docs      # die Zahlen in dieser Datei und in AGENTS.md stimmen noch
```

Der Druckpfad ist ein eigener Auslieferungsweg, den sonst niemand ansieht: Die
Startseite kam einmal als 15 fast leere Blätter aus dem Drucker, weil die
Einblendungen auf ein Hineinscrollen warten, das beim Drucken nie stattfindet.

Das Kurzprofil als PDF entsteht über den Druckweg des Browsers aus derselben
Seite, die unter `/onepager` liegt — keine zweite Quelle, kein zweites Layout:

```bash
npm run onepager:pdf    # beide Sprachfassungen nach public/
```

Zwei Binärdateien im Repo werden nicht von Hand gepflegt, weil eine Binärdatei
nicht mitliest, wenn sich ihre Quelle ändert:

```bash
npm run build:favicon   # favicon.ico aus derselben Form wie die Marke
npm run build:portrait  # alle drei Porträt-Fassungen aus einem Original
```

`scripts/check-figures.mjs` prüft zusätzlich jede Zahl auf der Seite gegen die
Repositories, aus denen sie stammt, und ruft jede Adresse ab, die nach außen
zeigt: Store-Seiten, Live-Systeme, Zertifikatsnachweise. Der Lauf braucht die
Nachbar-Repos und das Netz und läuft deshalb nicht in der CI, sondern beim
Zahlen-Automaten — eine Prüfung, die rot wird, weil ein Store gerade langsam
ist, würde abgeschaltet statt gelesen.

Voraussetzung: Node.js ≥ 20.9.

## Projektstruktur

```
src/
├─ app/
│  ├─ (de)/                  deutsche Fassung, eigenes Wurzel-Layout
│  │  ├─ (legal)/            Impressum + Datenschutz (geteiltes Layout)
│  │  ├─ artikel/            Übersicht, Einzelseiten, Atom-Feed, OG-Bilder
│  │  ├─ onepager/           A4-Route, wird zum PDF
│  │  └─ page.tsx            Startseite (Server Component)
│  ├─ (en)/en/               englische Fassung, zweites Wurzel-Layout
│  │  ├─ articles/           dieselben Artikel auf Englisch, eigener Feed
│  │  ├─ onepager/           dasselbe Blatt auf Englisch, eigenes PDF
│  │  └─ opengraph-image/    als Route, damit die Adresse ohne Hash feststeht
│  ├─ .well-known/           security.txt nach RFC 9116, Datum aus dem Bau
│  ├─ global-not-found.tsx   404 ohne Layout — bei zwei Wurzel-Layouts nötig
│  ├─ humans.txt/route.ts    liest denselben Prüfstempel wie die Seite
│  ├─ llms.txt/route.ts      dieselbe Seite als Text für Sprachmodelle
│  ├─ icon.tsx · apple-icon.tsx   Symbole aus derselben Form wie die Marke
│  ├─ opengraph-image.tsx    Social-Card, zur Bauzeit erzeugt
│  ├─ robots.ts · sitemap.ts
│  └─ globals.css
├─ components/
│  ├─ sections/              Hero · CaseStudies · AiWorkflow · Skills ·
│  │                         RecruiterHub · About · Writing · Contact
│  ├─ ui/                    Reveal · Magnetic · Counter · Marquee · Cursor ·
│  │                         DeviceFrame · ShotCarousel · SectionHeading · …
│  ├─ article/               ArticleIndex · ArticlePage · Prose
│  ├─ providers/             MotionProvider · SmoothScroll
│  ├─ ArchitectureDiagram.tsx
│  ├─ RootDocument.tsx       das <html>-Gerüst, das sich beide Layouts teilen
│  ├─ SitePage.tsx           die Sektionsfolge, beide Sprachen rendern dieselbe
│  ├─ OnePager.tsx           das A4-Blatt, beide Sprachen rendern dasselbe
│  ├─ Nav.tsx · Footer.tsx · NotFoundPage.tsx
│  ├─ CommandPalette.tsx
│  ├─ ConsoleGreeting.tsx    Nachricht für die Entwicklerkonsole
│  └─ SiteShell.tsx          Client-Insel: hält den Palette-State
├─ content/
│  ├─ site.ts                deutsche Quelle: jeder Text, jede Zahl
│  ├─ de.ts · en.ts          Adapter je Sprache, gegen types.ts deklariert
│  ├─ types.ts               gemeinsame Form — fehlt ein Feld, bricht der Bau
│  ├─ ContentProvider.tsx    reicht die Sprachfassung an die Client-Sektionen
│  ├─ articles/              fünf Fachartikel je Sprache, getippte Blöcke
│  └─ verified.json          Prüfstempel, nur vom Workflow geschrieben
└─ lib/                      cn() · Metadaten · Motion-Tokens · Hooks · Marke · OG-Karte

scripts/
│  Am Browser gemessen — diese sieben laden die gebaute Seite wirklich:
├─ check-a11y.mjs                 axe-core gegen jede gebaute Seite, zwei Breiten
├─ check-headings.mjs             keine Überschrift schneidet ihre Unterlängen ab
├─ check-landmarks.mjs            jede Seite bietet Hauptbereich, Navigation und Fußzeile
├─ check-links.mjs                kein Anker und keine interne Adresse zeigt ins Leere
├─ check-nbsp.mjs                 keine Rechtsangabe bricht zwischen Kürzel und Ziffer um
├─ check-parity.mjs               beide Sprachfassungen zeigen gleich viel
├─ check-print.mjs                prüft jede gebaute Seite in der Druckansicht
├─ check-privacy.mjs              keine Seite baut eine Verbindung nach außen auf
├─ check-separators.mjs           kein Trennzeichen bleibt beim Umbruch am Zeilenende
│
│  An Dateien gemessen:
├─ check-docs.mjs                 die Zahlen in README.md und AGENTS.md stimmen noch
├─ check-exports.mjs              jede Ausfuhr aus src/ hat einen Abnehmer
├─ check-hardcoded-copy.mjs       keine Beschriftung steht fest in einer Komponente
├─ check-legal-date.mjs           das Datum der Datenschutzerklärung passt zu ihrem Text
├─ check-onepager-pdf.mjs         das ausgelieferte PDF stammt aus dem aktuellen Inhalt
├─ check-public-dir.mjs           läuft als prebuild: nichts Privates in public/
├─ check-reading-time.mjs         Lesezeiten aus dem Wortbestand statt von Hand
├─ check-stack.mjs                jede genannte Technik steht wirklich im Produktivrepo
├─ check-typography.mjs           jede Sprachfassung setzt ihre eigenen Zeichen
├─ check-bundle.mjs               wie viel JavaScript jede Seite mitbringt
├─ check-cards.mjs                in einer Kartenreihe beginnt der Text auf gleicher Höhe
├─ check-font-size.mjs            kein Text geht bei größerer Grundschrift verloren
├─ check-focus.mjs                der Tastaturfokus bleibt sichtbar
├─ check-text-spacing.mjs         größerer Textabstand kostet keinen Inhalt
├─ check-panels.mjs               jede Tafel hinter einem Reiter zeigt ihren Inhalt
├─ check-language.mjs             beide Sprachfassungen hängen wechselseitig zusammen
├─ check-demo-math.mjs            die Demo auf der Startseite rechnet nachprüfbar richtig
├─ check-code-blocks.mjs          jeder Codeblock in den Artikeln geht syntaktisch auf
├─ check-contrast.mjs             der Kontrast dort, wo axe keine Antwort gibt
├─ check-images.mjs               kein Bild wird größer gezeigt, als es geladen wurde
├─ check-control-chars.mjs        kein Steuerzeichen im Quelltext
├─ check-structured-data.mjs      die strukturierten Daten decken sich mit der Seite
├─ check-palette.mjs              die Befehlspalette findet und führt hin
├─ check-lighthouse.mjs           die Zahl „Lighthouse 100" gegen einen echten Lauf
├─ check-vitals.mjs               LCP und CLS auf einem gedrosselten Telefon
│
│  An der Auslieferung und an den Nachbar-Repos:
├─ check-headers.mjs              die ausgelieferte Seite trägt die Schutz-Kopfzeilen
├─ check-figures.mjs              zählt die Zahlen der Seite gegen die Repos nach
├─ fetch-figures-from-github.mjs  zählt Commits über die GitHub-API
│
│  Erzeugen statt prüfen:
├─ build-favicon.mjs              erzeugt favicon.ico aus derselben Form wie die Marke
├─ build-linkedin-images.mjs      Titelbild und Im-Fokus-Kachel aus denselben Zahlen wie die Seite
├─ build-onepager-pdf.mjs         druckt beide Kurzprofile auf je eine A4-Seite
├─ build-portrait.mjs             erzeugt alle drei Porträt-Fassungen aus einem Original
├─ build-shots.mjs                erzeugt public/shots/*.webp aus den Originalen daneben
└─ lib/local-server.mjs           startet den gebauten Stand auf einem freien Port

.github/workflows/
├─ check.yml                      Typen, Linter, Bau und jede Prüfung, die ohne
│                                 die Nachbar-Repos auskommt
└─ refresh-figures.yml            zählt täglich nach und liefert aus
```

Die Startseite bleibt eine Server Component. `SiteShell` ist die einzige
Client-Insel auf oberster Ebene, damit das Sektions-Markup als statisches HTML
ausgeliefert wird und nicht erst nach der Hydration erscheint.

## Sicherheit & Datenschutz

- Keine Cookies, kein Analytics, kein Consent-Banner: es gibt nichts einzuwilligen
- Schriften werden selbst gehostet; beim Seitenaufruf entsteht keine Verbindung zu Google
- Keine Eingabeverarbeitung: Es existiert kein Endpunkt, an den etwas gesendet wird
- Vollständiger Header-Satz in [`vercel.json`](vercel.json): HSTS mit Preload,
  CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-DNS-Prefetch-Control`
- [`/.well-known/security.txt`](https://domenicmoran.de/.well-known/security.txt) für Meldungen

### Zur CSP: eine bewusste Abwägung

Die Content-Security-Policy erlaubt `'unsafe-inline'` für `script-src`. Das ist
keine Nachlässigkeit, sondern die Folge einer Entscheidung:

Next.js schreibt die RSC-Payload als Inline-`<script>` in jede vorgerenderte
Seite. Um die ohne `'unsafe-inline'` zuzulassen, bräuchte es Nonces: die
entstehen erst zur Anfragezeit und zwingen damit **jede** Route in dynamisches
Rendering. Für eine Seite, deren wichtigste Metrik LCP ist, tauscht man damit
messbare Ladezeit gegen eine Absicherung, die hier wenig bringt: Die Seite hat
keine Nutzereingaben, die gerendert werden, keine Drittanbieter-Skripte und
keine Datenbank.

Was die Policy stattdessen tatsächlich absichert und was hier zählt:
`default-src 'self'`, `connect-src 'self'` (kein Datenabfluss), `object-src
'none'`, `base-uri 'self'` (kein Base-Tag-Hijacking), `frame-ancestors 'none'`
(kein Clickjacking) und `form-action 'self'`.

`img-src` erlaubt `'self'` und `data:`, nicht mehr `blob:`. Gemessen an den
zwanzig gebauten Seiten trägt kein einziger der 26 Bildknoten eine
`blob:`-Adresse; die einzige Fundstelle im Bündel ist eine Hülle um
`URL.createObjectURL` aus einem Polyfill. Eine Erlaubnis, die niemand braucht,
ist eine Erlaubnis zu viel. Wer hier je ein Bild aus einem Canvas erzeugt,
holt sie zurück.

Sobald die Seite je Nutzerinhalte rendert, kippt diese Abwägung. Dann kommen
Nonces und dynamisches Rendering.

## Deployment

Auf Vercel importieren und deployen. Es gibt keine Umgebungsvariablen zu setzen:
Die Seite hat keine Secrets, weil sie keinen Dienst anspricht. Jede Route wird
vorab erzeugt und vom CDN-Rand ausgeliefert.

## Lizenz

Der Code steht unter der MIT-Lizenz — nimm dir Muster, die dir nützen.

Nicht Teil der Lizenz sind die Inhalte: Texte, Fallstudien und Fachartikel
unter `src/content/` sowie die Bilder unter `public/` sind © Domenic Moran,
alle Rechte vorbehalten. Die MIT-Lizenz bezieht sich auf „the Software“, also
auf den Quellcode; diese Zeile stellt nur klar, wo dessen Grenze verläuft.
