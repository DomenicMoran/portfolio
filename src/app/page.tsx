import { SiteShell } from "@/components/SiteShell";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { About } from "@/components/sections/About";
import { AiWorkflow, DeliverySpeed } from "@/components/sections/AiWorkflow";
import { Skills } from "@/components/sections/Skills";
import { RecruiterHub } from "@/components/sections/RecruiterHub";
import { Contact } from "@/components/sections/Contact";
import { caseStudies, site } from "@/content/site";

/**
 * Structured data. Recruiters increasingly arrive via search and via LLM
 * answers — both read JSON-LD before they read the design.
 */
function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    description: site.meta.description,
    url: site.url,
    email: `mailto:${site.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Berlin",
      addressCountry: "DE",
    },
    sameAs: [site.socials.github, site.socials.linkedin].filter(Boolean),
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
    subjectOf: caseStudies.map((study) => ({
      "@type": "SoftwareApplication",
      name: study.name,
      description: study.tagline,
      applicationCategory: "WebApplication",
    })),
  };

  // The object above is built entirely from local constants — no user input
  // reaches it. `<` is still escaped so a future content edit containing
  // "</script>" cannot break out of the tag.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default function Home() {
  return (
    <>
      <StructuredData />
      <SiteShell />

      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10001] focus:rounded-full focus:bg-acid focus:px-4 focus:py-2 focus:text-sm focus:text-void"
      >
        Zum Inhalt springen
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
    </>
  );
}
