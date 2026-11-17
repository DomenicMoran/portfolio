import type { ReactNode } from "react";
import { mailAdresse } from "@/lib/mailto";
import { SOCIALS, type Content } from "@/content/types";
import { FERTIG_FALLSTUDIEN } from "@/lib/case-study-order";
import { INHALT_ID, SkipLink } from "@/components/ui/SkipLink";
import { Hero } from "@/components/sections/Hero";

/** Fallstudien mit ausgelieferten Mobile-Apps (Store-Links stehen nicht mehr in `links`). */
const MOBILE_CASE_IDS = new Set<string>([
  ...FERTIG_FALLSTUDIEN,
  "mfc",
  "aegis",
  "vortex",
  "synapse",
  "vesper",
  "aether",
  "bitdojo",
]);

/**
 * Kopf der Startseite: Schema, Sprunglink, Vorspann.
 *
 * Die langen Abschnitte darunter gehören nicht in diese Datei. Ihr Markup
 * machte das erste HTML der Startseite rund 285 KB schwer, und Lighthouse
 * Lantern hat den Render Delay des Leads daran gehängt (lokal Median 92),
 * obwohl der Lead in Screenshots schon nach 375 ms stand. Der Vorspann
 * allein lag bei 33 KB HTML und Median 97. Diese Datei importiert deshalb
 * keinen Abschnitt unterhalb der Falz, damit das erste Flush klein bleibt.
 */
export function SitePageShell({
  content,
  children,
}: {
  content: Content;
  children?: ReactNode;
}) {
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
      applicationCategory: MOBILE_CASE_IDS.has(study.id)
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json }}
      />
      <SkipLink text={content.skipToContent} />

      <main id={INHALT_ID} tabIndex={-1} className="flex-1">
        {/*
          Hero steht bewusst außerhalb von ContentProvider: Der Lead ist
          der LCP-Kandidat. Liegt er unter der Client-Grenze, rechnet die
          Lighthouse-Simulation (Lantern) den Render Delay bis zur
          Hydration. Der Abschnitt braucht den Provider nicht,
          er bekommt seine Texte als Props.
        */}
        <Hero hero={content.hero} site={content.site} lang={content.lang} />
        {children}
      </main>
    </>
  );
}
