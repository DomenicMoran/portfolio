import { ContentProvider } from "@/content/ContentProvider";
import type { Content } from "@/content/types";
import { SiteShell } from "@/components/SiteShell";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { About } from "@/components/sections/About";
import { AiWorkflow, DeliverySpeed } from "@/components/sections/AiWorkflow";
import { Skills } from "@/components/sections/Skills";
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

      <SiteShell />

      {/* Der Header ist fixiert und 70 px hoch. Bei `top-4` legte sich dieser
          Link beim ersten Tabben quer über den Namen im Header. Er sitzt
          deshalb darunter: gemessen 84 px, das sind 14 px Luft. */}
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[5.25rem] focus:left-4 focus:z-[10001] focus:rounded-full focus:bg-acid focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-void focus:shadow-lg focus:shadow-void/40"
      >
        {content.skipToContent}
      </a>

      <main className="flex-1">
        <Hero />
        <CaseStudies />
        <About />
        <AiWorkflow />
        <DeliverySpeed />
        <Skills />
        <RecruiterHub />
        <Contact />
      </main>

      <Footer />
    </ContentProvider>
  );
}
