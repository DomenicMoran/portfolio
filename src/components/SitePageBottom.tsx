import type { SiteInhalt } from "@/components/SitePageRest";
import { Footer } from "@/components/Footer";
import { SiteShellDeferred } from "@/components/SiteShellDeferred";

/** Fußzeile und nachgeladene Kopfleiste, klein genug für das erste HTML. */
export function SitePageBottom({ Inhalt }: { Inhalt: SiteInhalt }) {
  return (
    <Inhalt>
      <Footer />
      <SiteShellDeferred />
    </Inhalt>
  );
}
