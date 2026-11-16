#!/usr/bin/env node
/**
 * Vollstaendig gescrollte Screenshots fuer Redesign-Vorher/Nachher.
 * Nutzung: node scripts/capture-redesign-baseline.mjs <basis-url> <zielordner>
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const basis = process.argv[2]?.replace(/\/$/, "");
const ziel = process.argv[3];
if (!basis || !ziel) {
  console.error(
    "Aufruf: node scripts/capture-redesign-baseline.mjs <basis-url> <zielordner>",
  );
  process.exit(1);
}

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .replace("T", "-");

const seiten = [
  { slug: "start-de", path: "/" },
  { slug: "start-en", path: "/en" },
  {
    slug: "artikel-de",
    path: "/artikel/gestrichelter-kreis-kam-nicht-aus-der-schrift",
  },
  {
    slug: "artikel-en",
    path: "/en/articles/the-dotted-circle-was-not-the-font",
  },
  { slug: "impressum", path: "/impressum" },
  { slug: "datenschutz", path: "/datenschutz" },
  { slug: "for-beispiel", path: "/for/placeholder-co" },
];

const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

await mkdir(ziel, { recursive: true });
const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
  });
  for (const s of seiten) {
    const url = `${basis}${s.path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    }
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          const max = document.documentElement.scrollHeight;
          y += Math.max(window.innerHeight * 0.85, 400);
          window.scrollTo(0, Math.min(y, max));
          if (y >= max) {
            window.scrollTo(0, 0);
            resolve();
            return;
          }
          requestAnimationFrame(step);
        };
        step();
      });
    });
    const out = join(ziel, `${s.slug}_${vp.name}_${stamp}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(out);
  }
  await page.close();
}
await browser.close();
