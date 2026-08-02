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
]);

export default eslintConfig;
