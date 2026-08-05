import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Der Alias `@/`, den auch der Bau kennt.
 *
 * Bis hierher gab es keine Konfiguration, und das ging gut, solange die Tests
 * neben reinen Rechenmodulen lagen: `src/lib/zeitspanne.test.ts` importiert
 * relativ. Ein Test an einer Inhaltsdatei scheitert dagegen sofort — `site.ts`
 * importiert `@/lib/zeitspanne`, und ohne diesen Eintrag meldet Vitest
 * „Cannot find package '@/lib/zeitspanne'".
 *
 * Damit ist nicht nur ein Test möglich, sondern die ganze Gattung: Zusagen,
 * die als Text in `src/content/` stehen und an mehreren Stellen dieselbe Zahl
 * nennen müssen.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
