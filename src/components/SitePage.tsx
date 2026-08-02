import { ContentProvider } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import { ConsoleGreeting } from "@/components/ConsoleGreeting";
import { SiteShell } from "@/components/SiteShell";
import { Footer } from "@/components/Footer";
import { INHALT_ID, SkipLink } from "@/components/ui/SkipLink";
import { Hero } from "@/components/sections/Hero";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { About } from "@/components/sections/About";
import { AiWorkflow, DeliverySpeed } from "@/components/sections/AiWorkflow";
import { Skills } from "@/components/sections/Skills";
import { Writing } from "@/components/sections/Writing";
import { RecruiterHub } from "@/components/sections/RecruiterHub";
import { Contact } from "@/components/sections/Contact";

/**
 * Die vollständige Seite, einmal je Sprache.
 *
 * Bleibt eine Server Component: Der Provider ist die einzige Client-Grenze und
 * bekommt den Inhalt als einfaches Objekt gereicht. Das Sektions-Markup wird
 * damit weiterhin als statisches HTML ausgeliefert und erscheint nicht erst
 * nach der Hydration.
 */
export function SitePage({ content }: { content: Content }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: content.site.name,
    jobTitle: content.site.role,
    description: content.site.meta.description,
    url: content.site.url,
    email: `mailto:${content.site.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Berlin",
      addressCountry: "DE",
    },
    sameAs: ["https://github.com/DomenicMoran"],
    knowsAbout: [
      "TypeScript",
      "React",
      "Next.js",
      "React Native",
      "PostgreSQL",
      "AI Engineering",
      "Stripe Connect",
      "KassenSichV",
    ],
    subjectOf: content.caseStudies.map((study) => ({
      "@type": "SoftwareApplication",
      name: study.name,
      description: study.tagline,
      applicationCategory: "WebApplication",
    })),
  };

  // Das Objekt oben besteht ausschließlich aus lokalen Konstanten. `<` wird
  // trotzdem maskiert, damit eine spätere Inhaltsänderung mit "</script>" den
  // Tag nicht verlassen kann.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");

  return (
    <ContentProvider content={content}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <ConsoleGreeting />

      <SkipLink text={content.skipToContent} />

      <SiteShell />

      <main id={INHALT_ID} tabIndex={-1} className="flex-1">
        <Hero />
        <CaseStudies />
        <About />
        <AiWorkflow />
        <DeliverySpeed />
        <Skills />
        <Writing />
        <RecruiterHub />
        <Contact />
      </main>

      <Footer />
    </ContentProvider>
  );
}
