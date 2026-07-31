<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Konventionen für dieses Repo

Gilt für Menschen und Agenten gleichermaßen. Diese Datei ist der Kontext, der
sonst in einem Chatverlauf verloren geht.

## Next.js 16 — was hier konkret greift

- Turbopack ist Standard für `dev` **und** `build`
- `next lint` existiert nicht mehr — ESLint direkt aufrufen (`npx eslint .`)
- ESLint nutzt Flat Config
- `middleware` heißt jetzt `proxy`
- `params`/`searchParams` sind ausschließlich asynchron
- Ohne `data-scroll-behavior="smooth"` am `<html>` überschreibt Next das
  Scroll-Verhalten bei Navigation nicht mehr

## Inhalte

**Copy gehört nie in eine Komponente.** Jeder Text und jede Zahl steht in
`src/content/site.ts`. Komponenten lesen daraus, sie definieren nichts.

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
   in `globals.css` erreicht Framer Motion nicht — dafür ist `MotionProvider`
   (`MotionConfig reducedMotion="user"`) zuständig. Wer eine neue
   Animationsbibliothek einführt, muss denselben Ausstieg bauen.
2. **Lenis und der Custom-Cursor werden bei Reduced-Motion nicht gemountet.**
   Nicht „deaktiviert" — gar nicht erst geladen.
3. **Performance schlägt Effekt.** Kein Canvas, kein WebGL, keine
   Scroll-Handler ohne `passive`. Glüh-Effekte sind geblurrte Divs, Grain ist
   ein Inline-SVG, der Marquee läuft als CSS-Animation ohne rAF-Schleife.

## Zwei Fallen, die hier schon zugeschnappt sind

**Wort-Abstände in Masken-Reveals brauchen `margin`, kein Leerzeichen.** Ein
Leerzeichen am Ende eines `inline-block` mit `overflow: hidden` wird
zusammengefaltet — die Wörter kleben dann aneinander. Betrifft `Hero` und
`RevealWords`.

**Dekorative Glüh-Kreise brauchen einen Clip am Sektions-Container.** Ein
`glow-orb` ist breiter als das Viewport und erzeugt sonst horizontales Scrollen
auf Telefonen. `overflow-hidden` an die Sektion, zusätzlich `overflow-x: clip`
an `html`/`body` als Netz.

## Server/Client-Grenze

`page.tsx` bleibt Server Component. Seitenweiter Client-State lebt in
`SiteShell`. Wer eine neue interaktive Sektion baut, markiert die Sektion selbst
mit `"use client"` — nicht die Seite.

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

## Definition of Done

```bash
npx tsc --noEmit   # 0 Fehler
npx eslint .       # 0 Errors
npm run build      # grün
```

Dazu: sichtbare Änderungen im Browser prüfen, mindestens bei 390 px und
1440 px Breite, und einmal mit aktiviertem Reduced-Motion. Ein grüner Build ist
kein Beleg dafür, dass etwas gut aussieht.

Der One-Pager muss **eine** Seite bleiben: nach Inhaltsänderungen die
Druckansicht gegenprüfen (`.onepager`-Höhe < ~1040 px bei 794 px Breite).
