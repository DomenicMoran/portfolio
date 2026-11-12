#!/usr/bin/env node
/**
 * Vordercover aus Druckumschlag-Quelle: volles Hochformat, Titel+Name lesbar,
 * WebP + PNG ≥800×1200, plus separates OG 1200×630.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const portfolio = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const author = resolve(portfolio, "../author-site");
const source = resolve(
  portfolio,
  "public/books/wie-ich-nach-26-jahren-frieden-fand-cover-source.png",
);

const meta = await sharp(source).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
const frontW = Math.round(h * (2 / 3));
const left = Math.max(0, w - frontW);

const frontNative = sharp(source).extract({
  left,
  top: 0,
  width: frontW,
  height: h,
});

const OUT_W = 1200;
const OUT_H = 1800;

const frontHi = await frontNative
  .clone()
  .resize(OUT_W, OUT_H, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .toBuffer();

const targets = [
  {
    webp: resolve(
      portfolio,
      "public/books/wie-ich-nach-26-jahren-frieden-fand-cover-front.webp",
    ),
    png: resolve(
      portfolio,
      "public/books/wie-ich-nach-26-jahren-frieden-fand-cover-front.png",
    ),
    og: resolve(
      portfolio,
      "public/books/wie-ich-nach-26-jahren-frieden-fand-og.webp",
    ),
  },
  {
    webp: resolve(author, "public/cover-front.webp"),
    png: resolve(author, "public/cover-front.png"),
    og: resolve(author, "public/og-cover.webp"),
  },
];

for (const t of targets) {
  mkdirSync(dirname(t.webp), { recursive: true });
  await sharp(frontHi).webp({ quality: 92 }).toFile(t.webp);
  await sharp(frontHi).png({ compressionLevel: 9 }).toFile(t.png);

  // OG 1200×630: dunkler Grund, Cover zentriert, ~420px breit.
  const coverForOg = await sharp(frontHi)
    .resize(420, 630, { fit: "contain", background: { r: 12, g: 12, b: 12, alpha: 1 } })
    .toBuffer();
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 12, g: 12, b: 12 },
    },
  })
    .composite([{ input: coverForOg, gravity: "centre" }])
    .webp({ quality: 90 })
    .toFile(t.og);

  const m = await sharp(t.webp).metadata();
  console.log(t.webp, `${m.width}x${m.height}`);
}

console.log("covers installed");
