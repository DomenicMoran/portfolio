import type { ComponentType, ReactNode } from "react";
import type { Content } from "@/content/types";
import { SitePageShell } from "@/components/SitePageShell";
import { SitePageRest } from "@/components/SitePageRest";
import { SitePageBottom } from "@/components/SitePageBottom";

type SitePageProps = {
  content: Content;
  Inhalt: ComponentType<{ children: ReactNode }>;
};

/**
 * Vollständige Seite in einem Stück, etwa für die gezielte Firmenseite.
 * Die Startseite setzt Schale und Rest getrennt, damit der Vorspann
 * zuerst gestreamt werden kann.
 */
export function SitePage({ content, Inhalt }: SitePageProps) {
  return (
    <>
      <SitePageShell content={content}>
        <SitePageRest content={content} Inhalt={Inhalt} />
      </SitePageShell>
      <SitePageBottom Inhalt={Inhalt} />
    </>
  );
}
