import type { Article } from "./types";

export const widgetEn: Article = {
  slug: "green-tests-empty-widget",
  title: "All tests green. Widget still empty on a real device.",
  dek: "The prayer times in the Android widget had stopped moving. Typecheck green, tests green, not reproducible in the emulator. The cause was one word in package.json.",
  date: "2026-07-30",
  minutes: 8,
  tags: ["React Native", "Android", "Metro", "Debugging"],
  evidence: [
    "Salati repository, commit bce08f5e, 23 July 2026",
    "File changed: apps/mobile/package.json, one field",
    "Prior history: commit 07d259e2 (config screen crash, unrelated cause)",
  ],
  blocks: [
    {
      kind: "p",
      text: "Salati shows the next prayer time in a home-screen widget. It is the feature most users see most often, and for weeks it was broken without anyone noticing.",
    },
    {
      kind: "p",
      text: "Broken here does not mean crashed. The widget was there, it looked right, it showed prayer times. They were simply stale. Open the app and you saw fresh times. Glance at the home screen and you saw whatever was current at the last app launch.",
    },
    { kind: "h2", text: "Why no test caught it" },
    {
      kind: "p",
      text: "The prayer-time calculation has tests, and they passed. The widget data preparation has tests, and they passed too. Both exercised functions that were correct. The bug was not inside a function; it was that one of them was never called on the device.",
    },
    {
      kind: "note",
      title: "This is the class of bug tests structurally cannot see",
      text: "A test calls the function itself. Whether the operating system also calls it in production is not covered by that. Everything that hangs off a registration with the system, a background service, or a bundler resolution step falls into this gap.",
    },
    {
      kind: "p",
      text: "It did not show up in the emulator either, for a mundane reason: when you develop in an emulator you open the app constantly. And opening the app refreshed the widgets through a different path than the background update. So the broken path was masked by the working one at every check.",
    },
    { kind: "h2", text: "Getting to the cause" },
    {
      kind: "p",
      text: "Android updates a widget through a background job the system triggers on a fixed cadence, in our case every 30 minutes. React Native registers a handler for it that runs without a visible app. Three questions had to be answered, in this order.",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Does the system trigger the job at all?",
        "If so, does it find a handler?",
        "If so, does the handler compute the right thing?",
      ],
    },
    {
      kind: "p",
      text: "The first was quick: the job ran, visible in the system log. The second was the right question. There was no handler. The registration had never executed.",
    },
    {
      kind: "p",
      text: "That registration lives in `index.android.js`, a file React Native loads on Android only. iOS and web get `index.js`. The entry point for both is one field in `package.json`.",
    },
    { kind: "h2", text: "One word too many" },
    {
      kind: "code",
      lang: "diff",
      caption: "Commit bce08f5e. The entire fix.",
      code: `{
   "name": "@salatibox/mobile",
-  "main": "index.js",
+  "main": "index",
   "version": "0.1.0",`,
    },
    {
      kind: "p",
      text: "Metro, the React Native bundler, resolves module paths per platform. On Android `index` becomes `index.android.js` if that file exists, otherwise `index.js`. But if the extension is already in the path, there is nothing left to resolve. `index.js` is `index.js`, on every platform.",
    },
    {
      kind: "p",
      text: "So Android loaded the iOS entry point. The application started normally, because that file registers the app just the same. Only the widget registration happened to be in the other file. There was no error, because from the system's point of view nothing failed: a background job with no handler simply does nothing.",
    },
    { kind: "h2", text: "Why it stayed hidden for so long" },
    {
      kind: "p",
      text: "Because a second, working path existed. Opening the app runs a refresh of all widgets that uses its own renderer and needs no handler. That makes sense on its own, but here it meant every manual check looked successful. The bug was only visible if you left the app alone for half an hour, which is exactly what nobody does while working on it.",
    },
    {
      kind: "p",
      text: "Shortly before, I had fixed a different bug in the same widget, a crash in its configuration screen. That one was loud and took minutes to find. This one was quiet and took weeks. How loud a bug is says nothing about how much it matters.",
    },
    { kind: "h2", text: "What changed afterwards" },
    {
      kind: "list",
      items: [
        "Widget changes are verified on a real device, with the app closed, across a full update cycle. Not in an emulator between two app launches.",
        "The handler now logs a line when it registers. A registration that never happens is visible instead of merely ineffective.",
        "For any bug that appears on one platform only, bundler resolution goes near the top of the list. Platform extensions are quiet machinery: either they engage or they do not, and both look the same.",
      ],
    },
    {
      kind: "p",
      text: "The general lesson is the uncomfortable one. A green test suite proves that the functions under test do what they should. It does not prove that they are called in production. Between those two sentences sits the class of bugs that reaches users. Which is why, since then, a change counts as finished when it has been demonstrated on the running system, not when the tests are green.",
    },
  ],
};
