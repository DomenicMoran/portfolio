/**
 * Verifizierte Buchdaten (Stand 2026-11-12).
 *
 * Nur URLs setzen, die live geprüft wurden. Fehlende E-Book-URL bleibt leer.
 */

export const bookPublication = {
  title: "Wie ich nach 26 Jahren Frieden fand",
  author: "Domenic Moran",
  isbn: "978-3-6967-5429-7",
  isbnCompact: "9783696754297",
  publisher: "BoD – Books on Demand",
  format: "Taschenbuch",
  pages: 48,
  published: "2026-11-11",
  pricePrint: "8,99 €",
  priceEbook: "2,99 €",
  cover: "/books/wie-ich-nach-26-jahren-frieden-fand-cover-front.webp",
  coverWrap: "/books/wie-ich-nach-26-jahren-frieden-fand-cover.webp",
  links: {
    bodPrint:
      "https://buchshop.bod.de/wie-ich-nach-26-jahren-frieden-fand-domenic-moran-9783696754297",
    amazonPrint: "https://www.amazon.de/dp/3696754293",
    ebook: "" as string,
  },
  summaryDe:
    "Persönlicher Bericht über meinen Weg zum Islam: von der Suche nach Frieden bis zur Shahada am 18. Oktober 2025. Selbstverlegt über BoD.",
  summaryEn:
    "A personal account of my path to Islam: from searching for peace to taking the shahada on 18 October 2025. Self-published through BoD.",
  authorPage: "https://autor.domenicmoran.de",
} as const;
