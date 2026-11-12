#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = dirname(fileURLToPath(import.meta.url));
const outRoot = join(root, "after");
const base = process.env.AUDIT_BASE ?? "http://127.0.0.1:3000";

const shots = [
  { dir: "desktop-1440", w: 1440, h: 900, paths: ["/", "/en", "/onepager", "/en/onepager", "#publikation", "#work"] },
  { dir: "mobile-390", w: 390, h: 844, paths: ["/", "/en", "#publikation"] },
];

mkdirSync(join(outRoot, "desktop-1440"), { recursive: true });
mkdirSync(join(outRoot, "mobile-390"), { recursive: true });

const browser = await chromium.launch();
for (const group of shots) {
  const page = await browser.newPage({ viewport: { width: group.w, height: group.h } });
  await page.emulateMedia({ colorScheme: "dark" });
  for (const path of group.paths) {
    const url = path.startsWith("#") ? `${base}/${path}` : `${base}${path}`;
    if (path.startsWith("#")) {
      await page.goto(`${base}/`, { waitUntil: "networkidle" });
      await page.goto(`${base}/${path}`, { waitUntil: "networkidle" });
    } else {
      await page.goto(url, { waitUntil: "networkidle" });
    }
    const slug = path.replace(/^\//, "").replace(/#/g, "section-") || "home-de";
    const name = `${slug}-${group.dir}.png`;
    await page.screenshot({ path: join(outRoot, group.dir, name), fullPage: path.includes("#") });
    console.log(name);
  }
  await page.close();
}
await browser.close();
