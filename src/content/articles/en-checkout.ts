import type { Article } from "./types";

/**
 * Englische Fassung von `de-checkout`. Dieselben Zahlen, dieselben Belege.
 */
export const checkoutEn: Article = {
  slug: "eighteen-routes-over-the-bull",
  title: "Eighteen routes over the bull, and the test only saw the last dart",
  titleShort: "The test only saw the last dart",
  dek: "A rule sat in the code, written out and reasoned. It applied to the finishing dart and not to the two before it. No test noticed, because it looked at exactly the place the rule did.",
  date: "2026-08-16",
  minutes: 4,
  tags: ["Testing", "Property tests", "TypeScript", "Darts"],
  evidence: [
    "Dartile repo, packages/kern/src/checkout.ts: bullImAufbau and the sort in checkoutWege",
    "Test: packages/kern/src/checkout.test.ts, the property that no bull shows up among the setup darts",
    "Counted across every remainder from 2 to 170 in the double, master and straight modes",
    {
      text: "The table is public as darts-checkout",
      href: "https://github.com/DomenicMoran/darts-checkout",
    },
  ],
  blocks: [
    {
      kind: "p",
      text: "Nobody keeps a darts counting app for the addition. People keep it for the numbers next to it: average, checkout percentage, and the suggestion for how to finish the remainder. That suggestion is the most sensitive part of the product, because at the board it gets held against something most players already carry in their heads.",
    },
    {
      kind: "p",
      text: "On 40 points there are more than eighty arithmetically correct routes. Exactly one gets thrown. A search that returns the first hit returns nonsense: `S1 S1 D19` adds up to 40 just as well as `D20` does. So every route is scored, and the score models what matters at the board.",
    },
    { kind: "h2", text: "The rule was already there" },
    {
      kind: "p",
      text: "One of those scores concerns the bull. The double ring is a long, narrow band, the bullseye a tiny circle. That is why every printed table puts `D19` on 95 and not `T15 BULL`. You go for the bull when you have to, not when the arithmetic allows it.",
    },
    {
      kind: "p",
      text: "That is exactly what the code said, in the function for the finishing dart, with the reasoning in the comment above it. The bullseye costs 50 there, the most expensive double 18.",
    },
    { kind: "h2", text: "It did not apply to the two darts before" },
    {
      kind: "p",
      text: "The cost of the setup darts knew nothing about that statement. There a bull cost nine, about the same as a `T13`, which made it the cheapest path to a remainder of 40. You only see the result once you look at it:",
    },
    {
      kind: "table",
      head: ["Remainder", "Suggested", "Same length, no bull"],
      rows: [
        ["141", "T17 BULL D20", "T20 T19 D12"],
        ["90", "BULL D20", "T18 D18"],
        ["33", "25 D4", "S17 D8"],
      ],
      caption:
        "Three of the eighteen remainders where the suggestion ran over the bull although an equally long route avoided it.",
    },
    {
      kind: "p",
      text: "None of those routes appears in a printed table. Read `BULL D20` on 90 once and you will not believe the app’s next number either.",
    },
    { kind: "h2", text: "Why no test fired" },
    {
      kind: "p",
      text: "There was a test for this, and it was not a bad one. It ran across every remainder from 2 to 170, fetched all routes, and asked: does the suggestion end on the bull although an equally long route ends on a double? That is a property, not a case, and it still went green.",
    },
    {
      kind: "note",
      title: "The test had the same gap as the code",
      text: "It looked at `wuerfe[wuerfe.length - 1]`, the finishing dart, because that is where the rule lived. Both the code and the test were written out of the same picture: the bull is a question of how you finish. A test that grows out of the same assumption as the code does not test the assumption.",
    },
    {
      kind: "p",
      text: "It surfaced while reading through the table by hand, remainder by remainder. That is the uncomfortable answer: no tool found this, looking at the output did.",
    },
    { kind: "h2", text: "The fix is not a bigger penalty" },
    {
      kind: "p",
      text: "The obvious move is to make a bull in the setup more expensive. It is the wrong one. The value would have to exceed the largest gap between two double ranks, and it would have to grow every time the weights change. A number that depends on three other numbers is not a rule, it is a calibration, and it tips over again next time.",
    },
    {
      kind: "p",
      text: "So the statement belongs in the sort order, ahead of the costs: if an equally long route without a bull in the setup exists, it comes first. If none exists, the route over the bull stands, because a suggestion beats no suggestion. No weight can outvote it any more.",
    },
    {
      kind: "code",
      lang: "ts",
      code: `bewertet.sort((a, b) => {
  if (a.weg.length !== b.weg.length) return a.weg.length - b.weg.length;
  // Ahead of the costs, so that no weight can outvote this statement.
  if (a.bull !== b.bull) return a.bull - b.bull;
  if (a.kosten !== b.kosten) return a.kosten - b.kosten;
  return a.text.localeCompare(b.text);
});`,
      caption: "The ordering carries the rule, not the cost function.",
    },
    { kind: "h2", text: "What I take from it" },
    {
      kind: "p",
      text: "If a property concerns a sequence of steps, check it at every step and not at the last one. The new test does exactly that: it looks at `wuerfe.slice(0, -1)`, runs across all three out modes, and reports every remainder where a route without a bull would have the same length. Run against the old state, it reports the eighteen.",
    },
    {
      kind: "p",
      text: "The second lesson is the older one: a green test run is not evidence that the result is right. It is evidence that the assumptions in the test match the assumptions in the code.",
    },
    {
      kind: "p",
      text: "The table is now public as its own package, with both property tests: `darts-checkout`, TypeScript, no dependencies.",
    },
  ],
};
