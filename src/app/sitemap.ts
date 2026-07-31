import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: site.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    {
      url: `${site.url}/onepager`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${site.url}/impressum`, lastModified: now, priority: 0.2 },
    { url: `${site.url}/datenschutz`, lastModified: now, priority: 0.2 },
  ];
}
