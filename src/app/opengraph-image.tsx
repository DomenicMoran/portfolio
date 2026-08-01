import { site } from "@/content/site";
import { ogContentType, ogSize, renderOgCard } from "@/lib/og-card";

export const alt = `${site.name} – ${site.role}`;
export const size = ogSize;
export const contentType = ogContentType;

/** Die deutsche Vorschaukarte. Die englische liegt unter (en)/en/. */
export default async function Image() {
  return renderOgCard({
    name: site.name,
    role: site.role,
    location: site.location,
    tagline: site.ogTagline,
  });
}
