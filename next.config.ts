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
