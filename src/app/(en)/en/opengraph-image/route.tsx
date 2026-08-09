import { en } from "@/content/en";
import { renderOgCard } from "@/lib/og-card";

/**
 * Die englische Vorschaukarte, als Route und nicht über die Dateikonvention.
 *
 * Als `opengraph-image.tsx` liefert Next sie unter einem Pfad mit angehängtem
 * Hash aus, gemessen `/en/opengraph-image-1nh35u`. Der Hash ändert sich mit
 * dem Inhalt, und `buildMetadata` müsste ihn kennen. Eine feste Adresse in den
 * Metadaten hätte auf ein 404 gezeigt, also auf gar kein Vorschaubild: genau
 * der Zustand, der hier schon einmal behoben wurde.
 *
 * Als Route Handler ist der Pfad exakt `/en/opengraph-image` und bleibt es.
 * Die deutsche Karte liegt weiterhin unter `/opengraph-image`; dort vergibt
 * Next keinen Hash, weil sie im Wurzelsegment liegt.
 */
export const dynamic = "force-static";

export function GET() {
  return renderOgCard({
    name: en.site.name,
    role: en.site.role,
    location: en.site.location,
    tagline: en.site.ogTagline,
  });
}
