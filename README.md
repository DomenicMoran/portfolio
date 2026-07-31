<div align="center">

# domenicmoran.dev

**Portfolio eines AI-Native Product Engineers — gebaut wie ein Produkt, nicht wie eine Visitenkarte.**

Dark-Mode-First · Bewegung mit Reduced-Motion-Ausstieg · Null Cookies · Null Tracker
Vier Fallstudien mit rekonstruierten Architekturdiagrammen · ⌘K-Befehlspalette · Druckfertiger One-Pager

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-087ea4?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Worum es geht

Die meisten Entwickler-Portfolios sind eine Liste von Technologien. Dieses hier
versucht etwas anderes: für jedes der vier Systeme in Produktion beantwortet es
drei Fragen, die ein CTO tatsächlich stellt — *Welches Problem?*, *Welche
Architektur?*, *Was war der schwierige Teil?*

Der Abschnitt **„Die harte Stelle"** ist der Kern jeder Fallstudie. Nicht die
Feature-Liste unterscheidet Entwickler voneinander, sondern das eine Problem,
an dem man nicht drumherum kam.

## Stack

| Bereich | Wahl | Warum |
|---|---|---|
| Framework | Next.js 16, App Router | Statische Auslieferung ohne Server-Kosten; Route Handler nur für das Formular |
| Sprache | TypeScript, strict | 0 Fehler ist Merge-Gate, nicht Zielvorgabe |
| Styling | Tailwind v4 | Design-Tokens leben in CSS (`@theme`), nicht in einer JS-Config |
| Animation | Framer Motion 12 | Deklarativ, respektiert `prefers-reduced-motion` |
| Scrolling | Lenis | Wird bei Reduced-Motion **gar nicht erst geladen** |
| Icons | lucide-react | Brand-Marken als eigenes Inline-SVG (v1 hat sie entfernt) |
| Drittanbieter | keine | Außer dem Hosting lädt diese Seite nichts von fremden Servern |

## Architektur-Entscheidungen

**Jede Route ist statisch.** Alle Seiten entstehen zur Build-Zeit und liegen
danach als fertige Dateien am CDN-Rand. Es gibt keinen Endpunkt, der Eingaben
entgegennimmt, keine Datenbank und keinen Serverprozess. Eine Seite, die keine
Laufzeit braucht, kann auch nicht zur Laufzeit ausfallen.

Der Kontakt läuft deshalb über eine Mailadresse statt über ein Formular. Ein
Formular hätte einen Versanddienst als Auftragsverarbeiter gebraucht, den die
Datenschutzerklärung ausweisen muss, plus einen Endpunkt mit Rate-Limit und
Fehlerpfad. Der Gegenwert wäre gewesen, dass der Absender ein Feld weniger
ausfüllt — und dabei die Kopie seiner eigenen Nachricht verliert.

**Inhalte liegen an einer Stelle.** [`src/content/site.ts`](src/content/site.ts)
ist die einzige Quelle für jeden Text und jede Zahl. Komponenten enthalten
keinerlei Copy. Ein leerer Wert lässt das jeweilige Element verschwinden statt
einen Platzhalter zu rendern — auf einer Seite, deren Zweck Glaubwürdigkeit ist,
darf eine unbeantwortete Frage nie als sichtbares „Lorem ipsum" enden.

**Architekturdiagramme sind Daten, kein Bild.** Die vier Diagramme in
[`ArchitectureDiagram.tsx`](src/components/ArchitectureDiagram.tsx) sind als
Knoten- und Kantenliste beschrieben und werden zu SVG gerendert — auflösungsfrei,
im DOM durchsuchbar, mit `aria-label` beschrieben und ohne einen einzigen
Bild-Request.

**Bewegung ist optional, nicht dekorativ erzwungen.** Bei
`prefers-reduced-motion: reduce` wird Lenis nicht initialisiert, der Custom-Cursor
nicht gemountet und jede Animation auf 0,01 ms verkürzt. Den Scroll von jemandem
mit vestibulärer Empfindlichkeit zu kapern, ist das Feindseligste, was eine
„Premium"-Seite tun kann.

**Der PDF-Download ist der Druckdialog.** `/onepager` ist eine A4-optimierte
Route mit eigenem Print-Stylesheet. Kein Headless-Chrome, keine PDF-Bibliothek —
dafür auswählbarer Text und funktionierende Links.

## Lokal starten

```bash
npm install
cp .env.example .env.local   # optional: nur fürs Kontaktformular
npm run dev                  # http://localhost:3000
```

```bash
npm run build      # Produktions-Build (Turbopack)
npx tsc --noEmit   # Typecheck
npx eslint .       # Lint
```

Voraussetzung: Node.js ≥ 20.9.

## Projektstruktur

```
src/
├─ app/
│  ├─ (legal)/          Impressum + Datenschutz (geteiltes Layout)
│  ├─ api/contact/      Der einzige dynamische Endpunkt
│  ├─ onepager/         A4-Route, wird zum PDF
│  ├─ opengraph-image   Social-Card, zur Build-Zeit erzeugt
│  ├─ icon.tsx          Favicon als Monogramm
│  └─ page.tsx          Startseite (Server Component)
├─ components/
│  ├─ sections/         Hero · CaseStudies · AiWorkflow · Skills · Hire · Contact
│  ├─ ui/               Reveal · Magnetic · Counter · Marquee · Cursor · …
│  ├─ ArchitectureDiagram.tsx
│  ├─ CommandPalette.tsx
│  └─ SiteShell.tsx     Client-Insel: hält den Palette-State
├─ content/site.ts      Alle Inhalte
└─ lib/                 cn() + geteilte Motion-Tokens
```

Die Startseite bleibt eine Server Component. `SiteShell` ist die einzige
Client-Insel auf oberster Ebene, damit das Sektions-Markup als statisches HTML
ausgeliefert wird und nicht erst nach der Hydration erscheint.

## Sicherheit & Datenschutz

- Keine Cookies, kein Analytics, kein Consent-Banner — es gibt nichts einzuwilligen
- Schriften werden selbst gehostet; beim Seitenaufruf entsteht keine Verbindung zu Google
- Keine Eingabeverarbeitung: Es existiert kein Endpunkt, an den etwas gesendet wird
- Vollständiger Header-Satz in [`vercel.json`](vercel.json): HSTS mit Preload,
  CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-DNS-Prefetch-Control`
- [`/.well-known/security.txt`](public/.well-known/security.txt) für Meldungen

### Zur CSP — eine bewusste Abwägung

Die Content-Security-Policy erlaubt `'unsafe-inline'` für `script-src`. Das ist
keine Nachlässigkeit, sondern die Folge einer Entscheidung:

Next.js schreibt die RSC-Payload als Inline-`<script>` in jede vorgerenderte
Seite. Um die ohne `'unsafe-inline'` zuzulassen, bräuchte es Nonces — die
entstehen erst zur Anfragezeit und zwingen damit **jede** Route in dynamisches
Rendering. Für eine Seite, deren wichtigste Metrik LCP ist, tauscht man damit
messbare Ladezeit gegen eine Absicherung, die hier wenig bringt: Die Seite hat
keine Nutzereingaben, die gerendert werden, keine Drittanbieter-Skripte und
keine Datenbank.

Was die Policy stattdessen tatsächlich absichert und was hier zählt:
`default-src 'self'`, `connect-src 'self'` (kein Datenabfluss), `object-src
'none'`, `base-uri 'self'` (kein Base-Tag-Hijacking), `frame-ancestors 'none'`
(kein Clickjacking) und `form-action 'self'`.

Sobald die Seite je Nutzerinhalte rendert, kippt diese Abwägung — dann kommen
Nonces und dynamisches Rendering.

## Deployment

Auf Vercel importieren, `RESEND_API_KEY` / `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL`
setzen, deployen. Serverfunktionen laufen in `fra1` (Frankfurt) — die Zielgruppe
sitzt in der EU, und der Rechtsweg damit auch.

## Lizenz

Code steht unter der MIT-Lizenz — nimm dir Muster, die dir nützen.
Inhalte, Texte und Fallstudien in `src/content/` sind © Domenic Moran und nicht
Teil der Lizenz.
