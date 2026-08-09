import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Sammler von Antwortmaschinen sind willkommen: Für eine Bewerbungsseite
    // ist es Verbreitung und kein Abfluss, in einer KI-Antwort zitierbar zu
    // sein. /llms.txt gibt ihnen die Fakten in einer Form, die sich schwer
    // missverstehen lässt.
    //
    // Nichts ist gesperrt. Bis eben stand hier `/api/`, die Route gibt es
    // nicht mehr, seit das Kontaktformular entfernt wurde. Eine Regel, die auf
    // nichts zeigt, sieht aus wie eine, die etwas verbirgt.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
