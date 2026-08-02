import type { Article } from "./types";

export const whisperEn: Article = {
  slug: "a-smaller-whisper-model",
  title: "Why a smaller Whisper model beat my bigger one",
  dek: "Shipping a gigabyte of model inside a phone app was the obvious route to better speech recognition. It was the wrong one. The real lever was somewhere else, and it was free.",
  date: "2026-07-27",
  minutes: 5,
  tags: ["Whisper", "On-device AI", "React Native", "Arabic"],
  evidence: [
    "apps/mobile/src/features/hifz/whisperModel.ts (model choice, conversion, measurements)",
    "apps/mobile/src/features/hifz/similarity.ts (normalisation, Dice coefficient)",
    "apps/mobile/src/features/hifz/whisperCheck.ts, line 617 (prompt handover)",
    "docs/audit-2026-07-27/WHISPER-EIGENE-KONVERTIERUNG.md",
    {
      text: "whisper-ggml-header — read the header and check n_text_ctx yourself",
      href: "https://github.com/DomenicMoran/whisper-ggml-header",
    },
    {
      text: "arabic-normalize — the normalisation from similarity.ts as its own package",
      href: "https://github.com/DomenicMoran/arabic-normalize",
    },
  ],
  blocks: [
    {
      kind: "p",
      text: "Salati has a memorisation mode. You recite a verse from the Quran, the app listens, and it tells you whether you got it right. All of it runs on the phone, with no network, and no recording ever leaves the device. The first version was not good enough: too many correct recitations came back marked wrong.",
    },
    {
      kind: "p",
      text: "The obvious conclusion was that the model was too small, so I shipped a bigger one. Whisper large-v3, quantised, just under a gigabyte. The result was not better. It was slower, the first-run download became unreasonable for anyone on a weak connection, and accuracy on Quranic Arabic stayed roughly where it was.",
    },
    { kind: "h2", text: "Why a bigger model buys you nothing here" },
    {
      kind: "p",
      text: "Whisper is trained on general speech across many languages. The Arabic of the Quran is not the Arabic of news broadcasts or podcasts: classical grammar, a tightly bounded vocabulary, and a recitation style in which vowel length carries meaning. A larger general model is better at exactly what this task does not need, which is breadth. It is no better at what the task does need, which is depth in a very narrow slice.",
    },
    {
      kind: "p",
      text: "There is a second problem that has nothing to do with model size. A multilingual model sometimes writes Arabic sounds using Persian or Urdu letter forms. To the ear, `ی` and `ي` are the same letter. To a string comparison they are not.",
    },
    { kind: "h2", text: "Lever one: tell the model what it is about to hear" },
    {
      kind: "p",
      text: "In memorisation the expected text is known. The app knows which verse is being practised. Whisper accepts a `prompt` that goes into the decoder as prior context and shifts probabilities toward those words. It is one line of code.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "whisperCheck.ts: the expected verse rides along as prior context.",
      code: `const { promise } = ctx.transcribeData(pcm, {
  language: 'ar',
  ...(expectedText ? { prompt: expectedText } : {}),
});`,
    },
    {
      kind: "p",
      text: "Measured across eight real recitations by the reciter Alafasy: word error rate 9.2 per cent without the prompt, 7.9 per cent with it. That sounds small. In effect it is large, because the remaining errors move. Without the prompt the model invents words that are not in the verse at all. With it, almost all that is left are vowel-length errors, and those are exactly what the next step absorbs.",
    },
    { kind: "h2", text: "Lever two: compare things that are comparable" },
    {
      kind: "p",
      text: "Before recitation and source are compared, both pass through the same normalisation. It discards everything irrelevant to the question “was this the same verse?” and folds letter variants together. The order of those steps is not arbitrary.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "similarity.ts, abridged. The foreign letter forms have to go first.",
      code: `export function normalizeArabic(text: string): string {
  return text
    .replace(DIACRITICS, '')
    // Map Persian and Urdu forms to Arabic FIRST. Otherwise the
    // [^ء-ي] pass below turns them into spaces and splits words.
    .replace(/ک/g, 'ك')
    .replace(/[یۍ]/g, 'ي')
    .replace(/ے/g, 'ي')
    .replace(/ھ/g, 'ه')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^ء-ي\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}`,
    },
    {
      kind: "note",
      title: "The ordering was a real bug",
      text: "In the first version the strip-to-Arabic-range pass ran before the letter mapping. A Persian ک fell outside the range, became a space, and one word turned into two. The comparison scored that as two errors instead of none.",
    },
    {
      kind: "p",
      text: "The comparison itself is a Dice coefficient over words, not exact equality. A single misheard word in a twelve-word verse lowers the score without rejecting the recitation. That leniency is deliberate: someone practising should not be punished for the model's mistake.",
    },
    { kind: "h2", text: "The outcome: smaller is better" },
    {
      kind: "p",
      text: "With prompt conditioning and normalisation in place, model size stopped mattering. The default today is a base model fine-tuned on Tarteel, quantised to q5_0, 55 MB. Beside it, selectable, sits large-v3-turbo at 574 MB for stronger devices. The gigabyte-sized large-v3 is gone.",
    },
    {
      kind: "table",
      head: ["Model", "Size", "Role"],
      rows: [
        ["tarteel-ai/whisper-base-ar-quran, q5_0", "55 MB", "default, runs on any device"],
        ["Whisper large-v3-turbo, q5_0", "574 MB", "optional, generic, not Quran-tuned"],
        ["Whisper large-v3", "~1 GB", "removed, no measurable gain"],
      ],
    },
    {
      kind: "p",
      text: "The quantisation is measured too, not assumed. The same eight recitations produced byte-for-byte identical transcripts with the F16 file and with q5_0. Same accuracy, 63 per cent less to download.",
    },
    { kind: "h2", text: "The conversion trap that cost a week" },
    {
      kind: "p",
      text: "Tarteel publishes its model in Hugging Face format. For whisper.cpp it has to be converted to GGML. The conversion script reads `config.json` and writes one of its values into the GGML as `n_text_ctx`.",
    },
    {
      kind: "p",
      text: "Tarteel's `config.json` carries `max_length: 1024`. That is a generation parameter, not the context length of the text decoder, which Whisper fixes at 448. Take the wrong value and you get a file that looks like a model and that whisper.rn refuses to load. The error message only says the model is unavailable.",
    },
    {
      kind: "note",
      title: "Read the header before you ship it",
      text: "Many freely available conversions of Whisper models tuned for the Quran carry n_text_ctx = 1024 and are therefore unusable. The value sits in the GGML header and takes seconds to check. The right source field is max_target_positions = 448, not max_length.",
    },
    { kind: "h2", text: "Where the weights come from, and why that is provable" },
    {
      kind: "p",
      text: "The project originally carried a third-party conversion from Hugging Face with no documented provenance. For an app meant to help people memorise a sacred text, that is the wrong foundation. So I convert Tarteel's original myself and host the file on storage I control.",
    },
    {
      kind: "p",
      text: "That these are the same weights is not asserted, it is shown: my F16 conversion is byte-identical to the former third-party file, SHA-256 `aaebca10…50ead`. Here a hash is the entire proof, and it costs nothing.",
    },
    { kind: "h2", text: "What I take from this" },
    {
      kind: "list",
      ordered: true,
      items: [
        "Before reaching for a bigger model, ask whether the task needs breadth or depth. This one needed depth.",
        "If the application knows what is about to be said, that belongs in the model. Prompt conditioning is the cheapest accuracy available.",
        "The metric has to fit the task. Exact equality was the wrong question here.",
        "For anything that comes from elsewhere: document the provenance, hash the identity.",
      ],
    },
    {
      kind: "p",
      text: "The last point had a side effect beyond this project. The letter normalisation is now its own library, because the problem is not confined to Quran apps. Anyone comparing Arabic text out of a multilingual model against a reference source has it.",
    },
  ],
};
