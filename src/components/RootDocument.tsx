import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Nicht vorgeladen: Geist Mono trägt nur Labels und Eyebrows, kein Element,
 * das für den Largest Contentful Paint zählt. Gemessen konkurrierten drei
 * gleichzeitig vorgeladene Schriften (68 KiB) im kritischen Pfad, diese hier
 * lädt jetzt nach und gibt die Bandbreite an die Headline-Schriften ab.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/** Used only for accent words. One weight, one style, nothing else needed. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
});

/**
 * Das Dokument-Gerüst, geteilt von beiden Wurzel-Layouts.
 *
 * Zwei Wurzel-Layouts statt eines: Nur so kann `<html lang>` je Sprache
 * stimmen, ohne die deutschen URLs unter ein `/de`-Präfix zu schieben. Der
 * Preis ist ein vollständiger Seitenwechsel beim Sprachwechsel. Bei zwei
 * Sprachen ist das ein Klick, den ohnehin niemand zweimal macht.
 */
export function RootDocument({
  lang,
  children,
}: {
  lang: "de" | "en";
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      // Next 16 no longer neutralises smooth scrolling during navigation unless
      // this attribute is present.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
