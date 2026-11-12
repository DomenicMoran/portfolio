#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const source = resolve(
  root,
  "public/books/wie-ich-nach-26-jahren-frieden-fand-cover-source.png",
);
const outDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "crop-candidates");

mkdirSync(outDir, { recursive: true });

const meta = await sharp(source).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
// Front panel ≈ 2:3, full height of wrap (no vertical crop).
const frontW = Math.round(h * (2 / 3));
const left = Math.max(0, w - frontW);
console.log({ w, h, left, frontW, ratio: (frontW / h).toFixed(3) });

const front = sharp(source).extract({ left, top: 0, width: frontW, height: h });
await front.clone().webp({ quality: 95 }).toFile(resolve(outDir, "front-native.webp"));
await front
  .clone()
  .resize(1200, 1800, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .webp({ quality: 92 })
  .toFile(resolve(outDir, "front-1200x1800.webp"));
await front
  .clone()
  .resize(1200, 1800, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(resolve(outDir, "front-1200x1800.png"));
console.log("wrote candidates to", outDir);
