import { chromium } from "playwright";
const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await seite.goto("https://domenicmoran.de/en", { waitUntil: "networkidle" });
const h = await seite.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 700) { await seite.evaluate((y) => scrollTo(0, y), y); await seite.waitForTimeout(45); }
await seite.waitForTimeout(500);
// Zahlen in der englischen Fassung gegen die deutsche
const en = await seite.evaluate(() => [...new Set((document.body.innerText.match(/\b\d[\d,.]*\b/g) ?? []))].filter((z) => z.length > 2));
await seite.goto("https://domenicmoran.de/", { waitUntil: "networkidle" });
const h2 = await seite.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h2; y += 700) { await seite.evaluate((y) => scrollTo(0, y), y); await seite.waitForTimeout(45); }
await seite.waitForTimeout(500);
const de = await seite.evaluate(() => [...new Set((document.body.innerText.match(/\b\d[\d,.]*\b/g) ?? []))].filter((z) => z.length > 2));
// auf Vergleichsform bringen: Trennzeichen weg
const form = (l) => new Set(l.map((z) => z.replace(/[.,](?=\d{3}\b)/g, "")));
const fe = form(en), fd = form(de);
const nurEn = [...fe].filter((z) => !fd.has(z));
const nurDe = [...fd].filter((z) => !fe.has(z));
console.log("Zahlen nur auf /en:", nurEn.join(" ") || "keine");
console.log("Zahlen nur auf / :", nurDe.join(" ") || "keine");
await browser.close();
