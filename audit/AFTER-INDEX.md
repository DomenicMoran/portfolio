# Audit After-Shots (2026-11-12)

Branch: `audit/website-2026-11-12` (portfolio + author-site)

Baseline (unverändert): `audit/baseline/`

## Portfolio — `audit/after/`

| Viewport | Datei | Seite |
|----------|-------|-------|
| desktop-1440 | `home-de-desktop-1440.png` | `/` |
| desktop-1440 | `en-desktop-1440.png` | `/en` |
| desktop-1440 | `onepager-desktop-1440.png` | `/onepager` |
| desktop-1440 | `en-onepager-desktop-1440.png` | `/en/onepager` |
| desktop-1440 | `section-publikation-desktop-1440.png` | `/#publikation` |
| desktop-1440 | `section-work-desktop-1440.png` | `/#work` |
| desktop-1440 | `author-desktop-1440-dark.png` | author-site (lokal `out/`) |
| mobile-390 | `home-de-mobile-390.png` | `/` |
| mobile-390 | `en-mobile-390.png` | `/en` |
| mobile-390 | `section-publikation-mobile-390.png` | `/#publikation` |

## Checks

- `npm run build` (portfolio, author-site): grün
- `npm test` (portfolio): 47/47 grün
- Amazon: `audit/baseline/amazon-check.md` — bestellbar, Buttons bleiben

## DNS / Vercel (manuell)

- `autor.domenicmoran.de` als Custom Domain am Vercel-Projekt `author-site` hinzufügen
- `author.domenicmoran.de` → Redirect über `vercel.json` (301 auf `autor`)
- `www.domenicmoran.de` → Apex-Redirect in portfolio `vercel.json`
