import { chromium } from "playwright";

const ZIEL = "https://domenicmoran.de/";
const b = await chromium.launch();

/* --- 1. Bewegung aus ------------------------------------------------- */
{
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  await p.goto(ZIEL, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);

  const r = await p.evaluate(() => {
    const woerter = [...document.querySelectorAll("h1 span span")];
    const versteckt = woerter.filter((w) => {
      const s = getComputedStyle(w);
      return s.transform !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(s.transform);
    });
    const absaetze = [...document.querySelectorAll("main p")].slice(0, 6);
    const unsichtbar = absaetze.filter((a) => parseFloat(getComputedStyle(a).opacity) < 0.9);
    return {
      headlineWoerter: woerter.length,
      davonVersteckt: versteckt.length,
      absaetzeGeprueft: absaetze.length,
      davonUnsichtbar: unsichtbar.length,
      lenisAmDokument: document.documentElement.className.includes("lenis"),
    };
  });
  console.log("Bewegung aus:", JSON.stringify(r));
  await ctx.close();
}

/* --- 2. Tastatur ------------------------------------------------------ */
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(ZIEL, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  const stationen = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press("Tab");
    const s = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 32),
        imBild: r.top >= -2 && r.bottom <= window.innerHeight + 2 && r.width > 0,
        ring:
          (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
          cs.boxShadow !== "none",
      };
    });
    if (s) stationen.push(s);
  }

  console.log("\nTastatur, " + stationen.length + " Stationen:");
  stationen.forEach((s, i) =>
    console.log(
      "  " +
        String(i + 1).padStart(2) +
        ". " +
        (s.imBild ? "im Bild   " : "AUSSERHALB") +
        " | Ring " +
        (s.ring ? "ja  " : "NEIN") +
        " | " +
        s.text,
    ),
  );
  await ctx.close();
}

/* --- 3. Erzwungene Farben, also der Windows-Kontrastmodus -------------- */
{
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    forcedColors: "active",
  });
  const p = await ctx.newPage();
  await p.goto(ZIEL, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  const r = await p.evaluate(() => {
    const lies = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const c = getComputedStyle(e);
      return { farbe: c.color, hintergrund: c.backgroundColor };
    };
    return { body: lies("body"), h1: lies("h1"), knopf: lies("main a[href='#work']") };
  });
  console.log("\nErzwungene Farben:", JSON.stringify(r));
  await p.screenshot({ path: "_kontrast.png", clip: { x: 0, y: 0, width: 1440, height: 860 } });
  await ctx.close();
}

await b.close();
