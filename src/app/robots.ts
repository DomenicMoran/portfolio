import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Answer-engine crawlers are welcome: for a portfolio, being quotable in an
    // LLM answer is distribution, not a leak. /llms.txt gives them the facts in
    // a form they cannot misread.
    //
    // Nothing is disallowed. Bis eben stand hier `/api/` — die Route gibt es
    // nicht mehr, seit das Kontaktformular entfernt wurde. Eine Regel, die auf
    // nichts zeigt, sieht aus wie eine, die etwas verbirgt.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
