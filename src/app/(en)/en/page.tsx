import { en } from "@/content/en";
import { SitePageShell } from "@/components/SitePageShell";
import { HomeLateMountEn } from "@/components/HomeLateMountEn";
import { SiteShellDeferred } from "@/components/SiteShellDeferred";

/** Wie die deutsche Startseite: Vorspann zuerst, Abschnitte nach dem ersten Paint. */
export default function HomeEn() {
  return (
    <>
      <SitePageShell content={en}>
        <HomeLateMountEn part="sections" />
      </SitePageShell>
      <HomeLateMountEn part="footer" />
      <SiteShellDeferred lang="en" />
    </>
  );
}
