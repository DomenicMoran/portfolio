import { de } from "@/content/de";
import { SitePageShell } from "@/components/SitePageShell";
import { HomeLateMountDe } from "@/components/HomeLateMountDe";
import { SiteShellDeferred } from "@/components/SiteShellDeferred";

/**
 * Die Startseite liefert zuerst nur den Vorspann. Die langen Abschnitte
 * kommen nach dem ersten Paint, damit das erste HTML klein bleibt.
 * Lighthouse Lantern hat den Lead sonst an 285 KB Markup gehängt.
 */
export default function Home() {
  return (
    <>
      <SitePageShell content={de}>
        <HomeLateMountDe part="sections" />
      </SitePageShell>
      <HomeLateMountDe part="footer" />
      <SiteShellDeferred lang="de" />
    </>
  );
}
