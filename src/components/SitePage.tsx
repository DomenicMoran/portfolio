import { ContentProvider } from "@/content/ContentProvider";
import { mailAdresse } from "@/lib/mailto";
import { SOCIALS, type Content } from "@/content/types";
import { ConsoleGreeting } from "@/components/ConsoleGreeting";
import { SiteShell } from "@/components/SiteShell";
import { Footer } from "@/components/Footer";
import { INHALT_ID, SkipLink } from "@/components/ui/SkipLink";
import { Hero } from "@/components/sections/Hero";
import { Produkte } from "@/components/sections/Produkte";
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
  /**
   * Die Person, verpackt in die Seite, die sie beschreibt.
   *
   * Bisher stand hier ein bloßes `Person`-Objekt. `ProfilePage` ist der Typ,
   * den Suchmaschinen für genau diesen Fall vorsehen, eine Seite, deren
   * Gegenstand ein Mensch ist, und Antwortmaschinen lesen daraus, dass die
   * Angaben zusammengehören statt zufällig nebeneinanderzustehen.
   */
  const person = {
    "@type": "Person",
    "@id": `${content.site.url}#person`,
    name: content.site.name,
    jobTitle: content.site.role,
    description: content.site.meta.description,
    url: content.site.url,
    /* Ohne Betreff: Eine Angabe fuer Maschinen nennt die Adresse, sie
       schreibt keine Nachricht vor. Ueber `mailAdresse` trotzdem, damit es
       genau eine Stelle gibt, an der ein Mailverweis entsteht. */
    email: mailAdresse(content.site.email),
    /* Das Porträt gehört in die Angabe, sobald es eines gibt.
       Suchmaschinen und Antwortmaschinen zeigen daraus das Bild neben dem
       Namen; ohne `image` steht dort der Platzhalter, den jede Person ohne
       Angabe bekommt. Die Bedingung bleibt, weil das Feld leer sein darf:
       ein Verweis auf eine Datei, die es nicht gibt, wäre schlechter als
       keine Angabe. */
    ...(content.about.portrait
      ? { image: `${content.site.url}${content.about.portrait}` }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Berlin",
      addressCountry: "DE",
    },
    /* Aus dem Inhalt statt fest verdrahtet, und ohne leere Einträge.
       LinkedIn fehlte hier: Genau dieser Verweis verbindet für eine Maschine
       das Profil mit der Seite, und ohne ihn bleiben es zwei Personen. */
    sameAs: [SOCIALS.github, SOCIALS.linkedin].filter(Boolean),
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
    /* Der Anwendungstyp kommt aus den Verweisen der Fallstudie, nicht aus
       einer Pauschale. Vorher stand an jedem Produkt "WebApplication", auch
       an denen, die in beiden Stores liegen, falsch für Salati und
       MenuCloud und damit genau die Sorte Angabe, die eine Maschine
       übernimmt und weiterreicht. */
    subjectOf: content.caseStudies.map((study) => ({
      "@type": "SoftwareApplication",
      name: study.name,
      description: study.tagline,
      /* Ein Store-Verweis heißt: Es gibt eine App. Mehr wird hier nicht
         behauptet, `operatingSystem` stand einen Bau lang mit drin und war
         unvollständig, weil je Fallstudie nur einer der beiden Stores
         verlinkt ist, obwohl Salati und MenuCloud in beiden liegen. Eine
         halbe Angabe wird von einer Maschine als ganze weitergereicht. */
      applicationCategory: study.links.some((l) => l.kind === "store" && l.href)
        ? "MobileApplication"
        : "WebApplication",
    })),
  };

  /* Die Seite nennt sich selbst, nicht nur ihren Gegenstand.

     Der `Blog` der Artikelübersicht trägt seit jeher `name`, `url` und
     `inLanguage`; die `ProfilePage` der Startseite trug keines davon.
     Gemessen an den ausgelieferten Seiten waren die beiden Sprachfassungen
     auf Schema-Ebene damit nicht zu unterscheiden: zweimal derselbe Block,
     zweimal dieselbe Person, kein Hinweis, welche Seite in welcher Sprache
     antwortet. Für die meistgelesene Seite der Site ist das die Angabe, die
     am ehesten fehlt.

     `url` zeigt auf die jeweilige Fassung, `mainEntity.url` weiterhin auf die
     Hauptfassung: Die Seiten sind zwei, die Person ist eine. */
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: content.site.meta.title,
    url: content.lang === "de" ? content.site.url : `${content.site.url}/en`,
    inLanguage: content.lang,
    mainEntity: person,
  };

  // Das Objekt oben besteht ausschließlich aus lokalen Konstanten. `<` wird
  // trotzdem maskiert, damit eine spätere Inhaltsänderung mit "</script>" den
  // Tag nicht verlassen kann.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");

  return (
    <ContentProvider content={content}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json }}
      />
      <ConsoleGreeting />

      <SkipLink text={content.skipToContent} />

      <SiteShell />

      <main id={INHALT_ID} tabIndex={-1} className="flex-1">
        <Hero />
        {/* Über mich direkt nach dem Kopf, vor den Produkten und Fallstudien.

            Nutzer-Feedback: Die Seite ist zuerst Bewerbung für die Person,
            erst danach Marketing für die Projekte, wie ein Lebenslauf. Vorher
            stand dieser Abschnitt hinter allen Produkten und Fallstudien,
            also am Ende der Seite, wo ihn kaum jemand erreicht. Dieselbe
            Reihenfolge tragen die Portfolios, an denen sich Entwickler-Seiten
            in der Branche orientieren: kurzer Vorspann, dann die Person, erst
            danach die ausgewählte Arbeit im Detail. */}
        <About />
        <Produkte produkte={content.produkte} />
        <CaseStudies />
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
