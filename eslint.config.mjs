import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Arbeitsbäume von Agenten liegen unter .claude/ und bringen einen
    // vollständigen Checkout samt Bau mit. Ohne diese Zeile liest der Linter
    // deren .next-Ordner mit und meldete 288 Fehler in erzeugtem Code.
    ".claude/**",
  ]),

  /*
    Mailverweise entstehen an einer Stelle.

    Neun Bauteile setzten `mailto:` von Hand zusammen. Als der vorbelegte
    Betreff dazukam, blieben zwei davon liegen — Impressum und
    Datenschutzerklärung —, und niemand sah es: Ein Verweis ohne Betreff
    funktioniert, er ist nur anders als die anderen acht. Genau solche
    Abweichungen findet kein Prüflauf, der die ausgelieferte Seite misst.

    `mailAdresse()` aus `@/lib/mailto` ist der Weg. Die Regel greift auf
    Vorlagen wie `mailto:${…}` ebenso wie auf feste Zeichenketten.
  */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/mailto.ts",
      "src/lib/mailto.test.ts",
      "src/app/.well-known/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TemplateElement[value.raw=/mailto:/]",
          message:
            "Mailverweise über mailAdresse() aus @/lib/mailto bauen, nicht von Hand.",
        },
        {
          /* Nur vollständige Adressen. `"mailto:"` allein steht in einem
             Vergleich (`href.startsWith("mailto:")`) und ist kein Verweis. */
          selector: "Literal[value=/^mailto:.+@/]",
          message:
            "Mailverweise über mailAdresse() aus @/lib/mailto bauen, nicht von Hand.",
        },
      ],
    },
  },
]);

export default eslintConfig;
