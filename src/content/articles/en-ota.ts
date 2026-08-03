import type { Article } from "./types";

export const otaEn: Article = {
  slug: "published-is-not-proof",
  title: "”Published” is not proof. My updates never arrived.",
  dek: "For months I believed I could ship content fixes without a store cycle. The tool reported success every time. Not a single user ever received anything.",
  date: "2026-07-30",
  minutes: 5,
  tags: ["Expo", "EAS Update", "React Native", "Verification"],
  evidence: [
    "Salati repository, commit 71bd8d2b, 30 July 2026",
    "The check that exposed it: update list of both EAS projects, production channel, zero entries",
    "Regression test: apps/mobile/src/__tests__/versionen-gleichlauf.test.ts",
    "After the fix: first update ever published, runtime 1.41.0, Android and iOS",
    {
      text: "verified-done — the rule from this article, as a tool",
      href: "https://github.com/DomenicMoran/verified-done",
    },
  ],
  blocks: [
    {
      kind: "p",
      text: "Over-the-air updates are the single most useful tool for an app carrying a lot of text. A typo in a translation, a wrong transliteration, an unfortunate phrasing: all of it can be corrected in minutes instead of waiting two days for a store review.",
    },
    {
      kind: "p",
      text: "My own project page listed ”over-the-air updates: content fixes without a store cycle” as a capability for months. I believed it. There was a comment in the codebase describing the route as established. There was configuration, there was a channel, and the command ran.",
    },
    {
      kind: "p",
      text: "It just never ran to the end, and nobody noticed, because what failed, failed silently.",
    },
    { kind: "h2", text: "How it surfaced" },
    {
      kind: "p",
      text: "I wanted to ship a transliteration fix while an Apple review was in progress. Exactly the case over-the-air updates exist for: you do not want to cancel a submission in flight to change one letter.",
    },
    {
      kind: "p",
      text: "The command failed. That was the first honest error in months, and it raised a question I had never asked: if this does not work now, how often did it work before?",
    },
    {
      kind: "note",
      title: "The check that answered everything",
      text: "Rather than trusting the comment in the code, I queried the update list of both EAS projects. Result: zero entries on the production channel. In both. None had ever been published. The query takes five seconds and had been available the whole time.",
    },
    { kind: "h2", text: "Failure one: a policy that does not exist here" },
    {
      kind: "p",
      text: "An over-the-air update may only run on installs whose native part matches it. Otherwise new JavaScript talks to old native modules and the app crashes. That pairing is what `runtimeVersion` establishes.",
    },
    {
      kind: "p",
      text: "It can be given as a policy, for instance ”take the fingerprint of the native dependencies”. That is the convenient route, and it works when the tool generates the native project itself.",
    },
    {
      kind: "p",
      text: "This project does not. The Android side lives as a hand-maintained directory in the repository, because it contains things no config plugin expresses. To the tool that is the bare workflow, and there a policy is not resolved. It simply stays a word nobody can do anything with.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "The number now sits as a constant in both places. Same value, only resolvable.",
      code: `const VERSION = "1.41.0";

export default {
  version: VERSION,
  runtimeVersion: VERSION,
  // previously: runtimeVersion: { policy: "fingerprint" }
};`,
    },
    { kind: "h2", text: "Failure two: two projects that knew nothing of each other" },
    {
      kind: "p",
      text: "The second failure was worse, because it would have kept working against me even after the first was fixed.",
    },
    {
      kind: "p",
      text: "The address an install fetches its updates from lives in the Android manifest. Normally the prebuild step generates that file from the configuration, so the two cannot disagree. Here Android is built locally, without prebuild. So two independent sources exist for the same value.",
    },
    {
      kind: "p",
      text: "They disagreed. The manifest pointed at one EAS project, the configuration at another. A published update would therefore always have reached only one of the two platforms, and which one depended on the project you published under.",
    },
    {
      kind: "note",
      title: "Why nobody notices this",
      text: "An update that does not reach a platform looks, on that platform, exactly like ”no update available”. No error, no warning, no log entry. The healthy state and the broken state are indistinguishable.",
    },
    { kind: "h2", text: "What now stops it from coming back" },
    {
      kind: "p",
      text: "Both were configuration failures, and configuration failures return the moment someone touches the file. So a test checks them now.",
    },
    {
      kind: "list",
      items: [
        "`runtimeVersion` must hold a value, never a policy.",
        "The update address in the Android manifest must carry the same project id as the configuration.",
        "The version name in the configuration and in the native build must agree.",
      ],
    },
    {
      kind: "p",
      text: "After the fix, the project's first update ever was published: runtime 1.41.0, both platforms. Because the manifest correction touches the native side, Android had to be rebuilt. That the address is now right I read out of the built artefact, not out of the source.",
    },
    { kind: "h2", text: "The actual lesson" },
    {
      kind: "p",
      text: "The technical part is explainable and fixed in two lines. The uncomfortable part is how long I treated something as a capability that had never worked.",
    },
    {
      kind: "p",
      text: "The cause is not carelessness but a confusion that is very easy to fall into: a tool reports success for its own part of the work. ”Published” means a bundle was built and uploaded. It does not mean a device ever asks for it, let alone that one receives it.",
    },
    {
      kind: "p",
      text: "The entire delivery chain sits between those two statements. Checking it costs one query.",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "A tool's success message is about the tool, not about the outcome.",
        "For anything that ships, the right question is not ”did the command run” but ”is something now where it belongs”. That question almost always has a query that answers it.",
        "A comment in the code describing a route as established is not evidence. It is the recollection of someone who tried it once.",
        "If a value exists in two places because a generation step is missing, the two will drift apart. Not perhaps, but eventually and certainly. That is what tests are for.",
      ],
    },
  ],
};
