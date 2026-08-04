import { chromium } from "playwright";
const browser = await chromium.launch();
for (const b of [390, 768, 1440]) {
  const seite = await browser.newPage({ viewport: { width: b, height: 900 }, isMobile: b === 390 });
  await seite.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  const h = await seite.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 600) { await seite.evaluate((y) => scrollTo(0, y), y); await seite.waitForTimeout(45); }
  await seite.waitForTimeout(400);
  await (await seite.$("#salati-tab-architecture")).click();
  await seite.waitForTimeout(400);
  const i = await seite.evaluate(() => {
    const p = document.getElementById("salati-panel");
    const svg = p.querySelector("svg");
    const kasten = svg.closest("[role=region]");
    const r = svg.getBoundingClientRect();
    const faktor = r.width / 920;
    const g = [...svg.querySelectorAll("text")].map((t) => parseFloat(getComputedStyle(t).fontSize) * faktor);
    return {
      breite: Math.round(r.width),
      kleinste: Math.min(...g).toFixed(1),
      unter9: g.filter((x) => x < 9).length,
      gesamt: g.length,
      scrollt: kasten.scrollWidth > kasten.clientWidth,
      dokBreite: document.documentElement.scrollWidth,
      fenster: document.documentElement.clientWidth,
    };
  });
  console.log(`${String(b).padStart(4)} px: SVG ${i.breite} px, kleinste Schrift ${i.kleinste} px, ${i.unter9}/${i.gesamt} unter 9 px, Kasten scrollt: ${i.scrollt}, Dokument ${i.dokBreite}/${i.fenster}`);
  await seite.close();
}
await browser.close();
