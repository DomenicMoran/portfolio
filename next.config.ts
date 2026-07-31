import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Barrel-Imports auflösen.
   *
   * `lucide-react` exportiert über 6.000 Symbole aus einer Index-Datei, und
   * `framer-motion` ist ebenfalls ein großes Barrel. Ohne diese Option landet
   * beim Bundler leicht deutlich mehr im Client-Chunk als die knapp zwanzig
   * Icons, die diese Seite tatsächlich benutzt. Next.js schreibt die Importe
   * damit auf die einzelnen Module um.
   */
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],

    /**
     * Die Seite hat zwei Wurzel-Layouts, eines je Sprache. Für eine Adresse,
     * die zu gar keiner Route gehört, kann Next deshalb nicht entscheiden, in
     * welchem Layout es eine 404 rendern soll, und liefert eine ungestylte
     * Standardseite ohne Stylesheet aus. `global-not-found.tsx` ist der dafür
     * vorgesehene Ausweg: eine 404-Seite, die ihr eigenes Dokument mitbringt.
     */
    globalNotFound: true,
  },

  images: {
    // Die Screenshots liegen lokal in /public; es gibt keine entfernten
    // Bildquellen. Kein remotePatterns-Eintrag ist hier die sichere Antwort.
    formats: ["image/avif", "image/webp"],
  },

  // Der `X-Powered-By`-Header verrät nur die Framework-Version und nützt
  // niemandem außer jemandem, der nach passenden Exploits sucht.
  poweredByHeader: false,
};

export default nextConfig;
