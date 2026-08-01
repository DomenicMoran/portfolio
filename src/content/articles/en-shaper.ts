import type { Article } from "./types";

export const shaperEn: Article = {
  slug: "the-dotted-circle-was-not-the-font",
  title: "The dotted circle was not the font's fault",
  dek: "Roughly every third verse carried a dot inside a dashed circle where none belongs. I suspected the typeface first. It was innocent.",
  date: "2026-07-31",
  minutes: 10,
  tags: ["Typography", "HarfBuzz", "Unicode", "React Native"],
  evidence: [
    "Salati repository, commit 427cd6c6, 31 July 2026",
    "New: apps/mobile/src/lib/arabicText.ts (normalisation, splitArabicWords, arabicClusters)",
    "Checker: scripts/pruefe-koran-fonts.mjs, reads every font file byte by byte",
    "Cross-checked live against the source text on quran.com, verses 2:2 and 2:5",
  ],
  blocks: [
    {
      kind: "p",
      text: "A Quran reader has one requirement no A/B test decides: the text must look exactly as it does in the printed edition. An extra character there is not a cosmetic flaw, it is an error in the text.",
    },
    {
      kind: "p",
      text: "The app was showing a dashed circle with a dot in it, in the middle of verses. Not everywhere, but often enough to be immediately obvious.",
    },
    { kind: "h2", text: "The obvious explanation, and the wrong one" },
    {
      kind: "p",
      text: "A character appearing where none should be looks like an incomplete typeface. When a font lacks a character it normally draws a substitute: an empty box.",
    },
    {
      kind: "p",
      text: "So I checked the font's character table. Every Arabic character of the Uthmani spelling was present, pause marks included. The explanation did not hold.",
    },
    {
      kind: "note",
      title: "A character table does not tell you everything",
      text: "A font can list a character and still draw nothing meaningful for it. In another font in this project, 171 characters were present in the table but all mapped to the same placeholder. Check only the table and that looks complete. It only becomes visible when you compare the outlines.",
    },
    { kind: "h2", text: "Where the circle actually comes from" },
    {
      kind: "p",
      text: "The character is U+25CC, the dotted circle. It is not a character of the font but a convention: it shows where a combining mark would sit if it had a letter to combine with.",
    },
    {
      kind: "p",
      text: "It is placed neither by the font nor by the app, but by the shaper that turns characters into glyphs. When a shaping run begins with a combining mark, the shaper inserts this circle in front of it as a carrier. From the shaper's point of view that is helpful: it signals a mark with nothing to attach to.",
    },
    { kind: "h2", text: "Why the run begins that way at all" },
    {
      kind: "p",
      text: "The text comes from a public source in the Uthmani spelling. There, the pause marks appear as separate, space-delimited tokens in the text. In verse 2:2, for instance, one such mark stands alone between two words.",
    },
    {
      kind: "p",
      text: "As long as the whole verse is typeset as one continuous run, nothing happens: the run starts with a letter, the pause mark sits inside, all is well.",
    },
    {
      kind: "p",
      text: "But the app splits the verse into individual words in three places: for word synchronisation while following along, for the Mushaf fallback rendering, and for the gap test in memorisation. Each word becomes its own text node, and therefore its own shaping run. One of them then begins with the standalone pause mark.",
    },
    {
      kind: "p",
      text: "So the circle was neither a data error nor a font error. It was the shaper reacting correctly to a split that handed it a run with no carrier.",
    },
    { kind: "h2", text: "The second damage from the same cause" },
    {
      kind: "p",
      text: "While hunting the circle, a second bug turned up that had been running unnoticed for far longer.",
    },
    {
      kind: "p",
      text: "The source text counts a word plus its following pause mark as one word. The word-level timestamps of the recitations are keyed to that count. My split simply broke on every space, and therefore produced one token too many.",
    },
    {
      kind: "p",
      text: "The consequence: from the first pause mark in a verse onward, the app highlighted the wrong word while following along, for the rest of that verse. An off-by-one that begins exactly where a rarely used character sits.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "arabicText.ts: mark tokens attach to the preceding word instead of becoming one.",
      code: `// A standalone pause mark is not a word of its own.
// It belongs to the word before it: where the source counts it too.
export function splitArabicWords(text: string): string[] {
  const words: string[] = [];

  for (const token of normalise(text).split(/\\s+/)) {
    if (!token) continue;
    if (isMarkOnly(token) && words.length > 0) {
      words[words.length - 1] += " " + token;
      continue;
    }
    words.push(token);
  }

  return words;
}`,
    },
    {
      kind: "p",
      text: "That removes both effects: no run begins with a combining mark any more, and the word count agrees with the timestamps again.",
    },
    {
      kind: "note",
      title: "Normalise once, at the source",
      text: "The normalisation sits at the data source, not in the components. Otherwise every view would carry its own version of the text, and the next new view would reintroduce the bug. That route is precisely what had produced it in three places at once.",
    },
    { kind: "h2", text: "What I did about fonts as a result" },
    {
      kind: "p",
      text: "Because the font was the prime suspect first, I built a hard criterion for admitting new ones: a script reads every font file byte by byte and checks whether it covers the complete character set of the Uthmani spelling.",
    },
    {
      kind: "p",
      text: "Five obvious candidates failed it, with 19 to 24 characters missing. The result is inconvenient and unambiguous: for the Uthmani spelling there is currently no free Nastaliq typeface that is complete. For South Asian readers, two other families remain.",
    },
    {
      kind: "p",
      text: "The line metrics are measured rather than assumed too: line height comes from the values Android uses for its own padding, not from the other obvious pair. In several fonts, stacked Arabic marks sit outside that second box, and a line set too tight clips them at the top.",
    },
    { kind: "h2", text: "What I take from this" },
    {
      kind: "list",
      ordered: true,
      items: [
        "When a character appears that nobody wrote, something placed it. Usually the layer between text and pixels, the one you think of last.",
        "A character table proves presence, not usability. To be sure, compare outlines.",
        "Splitting text on spaces is an assumption about the language, not a neutral operation. In this script it was wrong.",
        "Normalisation belongs at the data source. Attached to rendering, it repeats with every new view, and you will forget one.",
      ],
    },
  ],
};
