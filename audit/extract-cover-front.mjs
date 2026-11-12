#!/usr/bin/env node
/**
 * Vordercover aus dem Landscape-Umschlag (rechtes Drittel, ~2:3).
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";

const sources = [
  {
    in: resolve("../author-site/public/cover.webp"),
    out: resolve("../author-site/public/cover-front.webp"),
  },
  {
    in: resolve(
      "public/books/wie-ich-nach-26-jahren-frieden-fand-cover.webp",
    ),
    out: resolve(
      "public/books/wie-ich-nach-26-jahren-frieden-fand-cover-front.webp",
    ),
  },
];

async function extractFront(input, output) {
  if (!existsSync(input)) {
    console.error(`Fehlt: ${input}`);
    process.exit(1);
  }
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const cropW = Math.round(w / 3);
  const left = w - cropW;
  const targetH = Math.round(cropW * 1.5);
  const top = Math.max(0, Math.round((h - targetH) / 2));
  const height = Math.min(targetH, h - top);
  mkdirSync(dirname(output), { recursive: true });
  await sharp(input)
    .extract({ left, top, width: cropW, height })
    .webp({ quality: 90 })
    .toFile(output);
  const outMeta = await sharp(output).metadata();
  console.log(`${output}: ${outMeta.width}x${outMeta.height}`);
}

for (const { in: input, out: output } of sources) {
  await extractFront(input, output);
}
