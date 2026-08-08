import type { Article } from "./types";

/** Englische Fassung des Kontrast-Artikels. Dieselben Messungen, dieselben Commits. */
export const kontrastEn: Article = {
  slug: "green-locally-red-in-ci",
  title: "The check was green locally and red in CI. Both were right.",
  dek: "A check reported 4.58:1 on my machine and 4.50:1 on the build server, for the same spot and with no change in between. The fault was not in the code it checked, but in the way it measured.",
  date: "2026-08-08",
  minutes: 5,
  tags: ["Accessibility", "WCAG", "CI", "Measurement"],
  evidence: [
    "Portfolio repo, commit 60a46b9 of 8 August 2026 (the red CI run)",
    "Portfolio repo, commit d0efe33 of 8 August 2026 (the rewritten method)",
    "scripts/check-contrast.mjs, measures 1,302 text positions across two widths",
    "Counter-check: three consecutive runs before and after the rewrite",
    "Comparison value from the CI log of the same run under Linux",
  ],
  blocks: [
    {
      kind: "p",
      text: "I have a check that measures colour contrast where a standard tool stays silent. Tools like axe need a solid background colour; if the text sits on a gradient, a translucent tint or an image, they report “unknown” and skip the position. On a dark site with glow effects and tinted cards, those are not edge cases. They are half the surface.",
    },
    {
      kind: "p",
      text: "The check solves it by capturing every text position twice: once with the text, once without. The per-pixel difference tells it where a letter sits and what colour really lies behind it. That has worked for months. Until CI turned red.",
    },
    { kind: "h2", text: "Four point five zero against four point five" },
    {
      kind: "p",
      text: "The message read `4.50:1 statt 4.5:1`. So 4.4999-something, rounded to two places, on a comment inside a code block. The same check on my machine, same file, same commit: 4.58:1. No difference in the code, none in the content, none in the font size.",
    },
    {
      kind: "p",
      text: "The first reflex is to touch the threshold. Four hundredths below the requirement smells like rounding, and a two-percent allowance would have turned the run green again immediately. That would have been the actual mistake: a check whose threshold you move as soon as it gets in the way only checks itself from then on.",
    },
    {
      kind: "note",
      title: "Two runs, same machine, two answers",
      text: "What confirmed the suspicion was a repeat with nothing changed: for the same ten-pixel axis label, the run reported 4.13:1 once and nothing at all the next time. A measurement that jumps by four tenths between two invocations is not a measurement.",
    },
    { kind: "h2", text: "Anti-aliasing had a vote" },
    {
      kind: "p",
      text: "The check looked for the worst value across the pixels a letter fully covers. That sounds right, because the text colour is purest there. But what counts as “fully covered” is decided by anti-aliasing, and that differs per renderer. Windows and Linux set the same font at the same size with different coverage values.",
    },
    {
      kind: "p",
      text: "On a solid background it makes no difference: the same colour lies behind every pixel, so which one you hit changes nothing. On a gradient, a different colour lies behind each. The reported value became a sample, and which sample it was got decided by a detail of font rendering.",
    },
    { kind: "h2", text: "Coverage now answers only the first question" },
    {
      kind: "p",
      text: "The measurement holds two questions, and I had answered both in the same loop. First: is there text here at all, and at what opacity? Second: how dark is the background in the worst case? Only the first one needs anti-aliasing.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "check-contrast.mjs: the worst value comes from the background, not from the letter.",
      code: `// First question: is there text? That is what covered pixels are for.
for (const pixel of pixelsInBox) {
  if (coverage[pixel] >= threshold) corePixels++;
}

// Second question: how bad does it get? Every background pixel in the
// text’s line boxes counts, whether or not a letter happens to hit it.
// This depends on no anti-aliasing at all.
if (corePixels) {
  for (const pixel of pixelsInBox) {
    const behind = backgroundAt(pixel);
    const expected = blend(textColour, behind, opacity);
    worst = Math.min(worst, contrast(expected, behind));
  }
}`,
    },
    {
      kind: "p",
      text: "The second pass walks every pixel in the text’s line boxes and computes the nominal colour against the background that actually lies there. Whether a letter hits that pixel no longer matters. The check now measures the worst case instead of a random one.",
    },
    { kind: "h2", text: "What became visible afterwards" },
    {
      kind: "p",
      text: "Three consecutive runs reported the same value three times, where 4.58, 4.61 and 4.59 had stood before. And two real violations stepped out of the noise:",
    },
    {
      kind: "list",
      items: [
        "Code blocks that scroll sideways carry a brightening strip at their edges as a hint. It sits exactly where text sits. At 20 percent white, an axis label in an architecture diagram fell to 4.10:1, well below the 4.5:1 of WCAG 1.4.3. At 12 percent the hint stays visible and the contrast stays in range.",
        "One label was the only one of its kind sitting on a tinted panel, and it landed at 4.54:1, four hundredths above the requirement. It now has its own class, one step brighter; the fifteen labels on solid backgrounds stay as they were.",
      ],
    },
    {
      kind: "p",
      text: "The weakest spot on the whole site has since been 4.80:1 under Windows and 4.76:1 under Linux. The remaining difference comes from line breaking, no longer from font rendering.",
    },
    { kind: "h2", text: "What I took away" },
    {
      kind: "p",
      text: "A check is code too, and it can be wrong itself. Suspicion almost never falls on it: when it is green you believe it, and when it is red you go looking in the code it checked. That both answers were correct and still different left only one explanation: the question was badly put.",
    },
    {
      kind: "note",
      title: "The difference was the most valuable part of the find",
      text: "A check that is green locally and red on the build server is the most expensive outcome of all: after that you stop trusting your own machine and start re-running red builds until they pass. That is exactly why a deviation of eight hundredths was not an edge case but the reason to open up the method.",
    },
    {
      kind: "p",
      text: "The practical rule I have applied since: if a measurement moves between two environments, the threshold is not too tight. The quantity is badly defined. Fix the definition first, then talk about thresholds.",
    },
  ],
};
