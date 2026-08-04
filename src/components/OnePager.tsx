import Image from "next/image";
import { mailAdresse } from "@/lib/mailto";
import { alsAnzeige } from "@/lib/adresse";
import Link from "next/link";
import type { Content } from "@/content/types";
import { SOCIALS } from "@/content/types";
import { PrintButton } from "@/components/ui/PrintButton";

/**
 * Eine Kennzahl aus dem Inhalt holen, statt sie hier hinzuschreiben.
 *
 * `about.stats` ist dieselbe Quelle, aus der die Startseite ihre Kacheln
 * baut. Damit kann der One-Pager nicht mehr eine andere Zahl zeigen als die
 * Seite, und genau das war er: 3.971 gegen 4.053.
 */
function kennzahl(about: Content["about"], anfang: string): string {
  // Ohne Rücksicht auf Groß- und Kleinschreibung: Die deutsche Beschriftung
  // beginnt mit "Commits seit …", die englische mit "commits since …".
  const treffer = about.stats.find((s) =>
    s.label.toLowerCase().startsWith(anfang.toLowerCase()),
  );
  if (!treffer) throw new Error(`Kennzahl "${anfang}" fehlt in about.stats.`);
  return treffer.value;
}

/**
 * Auf den nächsten runden Tausender abrunden.
 *
 * Das Kurzprofil geht als PDF an Firmen und liegt danach in einem Postfach,
 * das niemand mehr aktualisiert. Eine exakte Zahl darin ist ab dem nächsten
 * Commit überholt; eine Untergrenze bleibt wahr, solange die Zahl wächst.
 *
 * Auf der Webseite steht weiterhin der genaue Wert. Der Unterschied ist nicht
 * Genauigkeit, sondern Erreichbarkeit: Was der stündliche Prüflauf nachzählen
 * und neu ausliefern kann, darf exakt sein.
 */
function untergrenze(zahl: string, sprache: "de" | "en"): string {
  // Beide Trennzeichen entfernen: Deutsch schreibt 4.094, Englisch 4,094.
  const roh = Number(zahl.replace(/[.,]/g, ""));
  if (!Number.isFinite(roh) || roh < 1000) {
    throw new Error(
      `Kennzahl "${zahl}" lässt sich nicht auf Tausender abrunden.`,
    );
  }
  return `${Math.floor(roh / 1000)}${sprache === "de" ? ".000" : ",000"}`;
}

/**
 * Hält die PDF auf einer A4-Seite. Die vollständige Begründung steht auf der
 * Website; hier genügt der erste Satz jedes „schwierigen Teils".
 *
 * Getrennt wird an Satzzeichen, denen ein Leerzeichen und ein Großbuchstabe
 * folgt — so schneiden Abkürzungen und Kommazahlen („§ 146a AO", „1.44")
 * den Satz nicht vorzeitig ab.
 */
function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](?=\s+[A-ZÄÖÜ])/);
  return match ? match[0] : text;
}

/**
 * Commit-Zahlen auf dem gedruckten Blatt als Untergrenze, alles andere exakt.
 *
 * Dieselbe Regel wie beim LinkedIn-Titelbild und im Lebenslauf: Was der
 * stündliche Prüflauf nachzählen und neu ausliefern kann, bleibt exakt — die
 * Webseite. Was einmal verschickt wird und danach in einem Postfach liegt,
 * bekommt eine Grenze, die hält.
 *
 * Betroffen sind nur die Commits. Sie wachsen täglich, ohne dass jemand den
 * Inhalt anfasst. API-Routen, Migrationen, Testfälle oder Rezepte ändern sich
 * nur mit dem Code, und dann meldet es der Prüflauf und beide Stellen werden
 * zusammen nachgezogen.
 */
function gedruckt(
  metrik: { value: string; label: string },
  mindestens: string,
  sprache: "de" | "en",
) {
  if (!/commits/i.test(metrik.label)) return metrik.value;
  const roh = Number(metrik.value.replace(/[.,]/g, ""));
  if (!Number.isFinite(roh) || roh < 1000) return metrik.value;
  const tausender = Math.floor(roh / 1000).toLocaleString(
    sprache === "de" ? "de-DE" : "en-GB",
  );
  return `${mindestens.toLowerCase()} ${tausender}${sprache === "de" ? ".000" : ",000"}`;
}

export function OnePager({
  inhalt,
  sprache,
}: {
  inhalt: Content;
  sprache: "de" | "en";
}) {
  const { about, caseStudies, skills, site, onepager } = inhalt;
  /* Das englische Blatt zeigt und verlinkt `domenicmoran.de/en`. */
  const heimatAdresse = sprache === "de" ? site.url : `${site.url}/en`;
  // Die ersten vier je Bereich. Die Reihenfolge in der Inhaltsdatei ist
  // bewusst gewählt, es gibt keine Rangzahl mehr, nach der sortiert würde.
  /**
   * Die Untergrenze der Commits steht im Satz, nicht daneben.
   *
   * Der Platzhalter `{commits}` kommt aus der Inhaltsdatei, damit derselbe
   * Absatz in beiden Sprachen dieselbe Zahl trägt und die Zahl trotzdem
   * nirgends fest geschrieben steht. Fest geschrieben blieb sie beim
   * Nachzählen als einzige stehen und sagte 3.971, während die Seite daneben
   * 4.053 zeigte.
   */
  const positionierung = onepager.positioning.replace(
    "{commits}",
    `${onepager.atLeast} ${untergrenze(kennzahl(about, "Commits"), sprache)}`,
  );

  const topSkills = skills.domains.map((domain) => ({
    title: domain.title,
    items: domain.skills.slice(0, 4).map((s) => s.name),
  }));

  return (
    // `color-scheme: light` ist hier nicht kosmetisch, sondern der Fix gegen
    // Androids "Force Dark" und Samsung Internets Dunkelmodus: Ohne die Angabe
    // invertieren die den weissen Hintergrund, lassen den fest gesetzten
    // dunklen Text aber stehen. Ergebnis ist Schwarz auf Schwarz. Mit der
    // Angabe erklärt die Seite, dass sie ihr Farbschema selbst kennt, und
    // wird in Ruhe gelassen.
    //
    // print:min-h-0: min-h-svh loest auch auf Papier zur vollen Viewport-Höhe
    // auf und schiebt sonst eine leere zweite Seite an.
    //
    // Die Hülle trägt nur das Aussehen und ist deshalb ein `div`. Der
    // Hauptbereich umschließt allein das Blatt; Bedienleiste und
    // Rechtsverweise stehen daneben, weil `header` und `footer` innerhalb von
    // `main` ihre Rolle verlieren. Gemessen an der ausgelieferten Seite hatten
    // beide Kurzprofile vorher genau eine Landmarke — auf dem Blatt, das ein
    // Recruiter als Erstes bekommt.
    <div
      style={{ colorScheme: "light" }}
      className="min-h-svh bg-white text-[#101014] print:min-h-0 print:bg-white"
    >
      <PrintButton
        hinweis={onepager.printHint}
        beschriftung={onepager.printButton}
        datei={inhalt.recruiter.cta.pdf}
        navLabel={inhalt.a11y.onepagerNav}
        sprache={{
          href: sprache === "de" ? "/en/onepager" : "/onepager",
          label: inhalt.languageSwitch.label,
          aria: inhalt.languageSwitch.aria,
        }}
      />

      <main>
        <article className="onepager mx-auto max-w-[820px] px-8 py-14 print:px-0 print:py-0">
          {/* Header */}
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#101014] pb-6">
            <div className="flex items-center gap-5">
              {/* Das Porträt kostet keine Zeile.
                Die Kontaktspalte rechts ist sechs Zeilen hoch, gemessen
                156 px; das Bild bleibt darunter, und das Blatt bleibt eine
                Seite. In Deutschland gehört ein Foto auf eine Bewerbung, und
                dieses Blatt geht als PDF an Firmen. */}
              {about.portraitPrint ? (
                <Image
                  src={about.portraitPrint}
                  alt={site.name}
                  width={110}
                  height={110}
                  sizes="110px"
                  /* Ohne `priority` setzt next/image `loading="lazy"`, und ein
                   Bild, das nie geladen wurde, druckt als leerer Rahmen.
                   Genau darauf prueft scripts/check-print.mjs. Hier steht es
                   ohnehin ganz oben: verzoegern gibt es nichts zu. */
                  priority
                  className="size-[6.875rem] shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  {site.name}
                </h1>
                <p className="mt-1.5 text-lg text-[#3a3a44]">{site.role}</p>
              </div>
            </div>
            {/* Die Adressen sind Verweise, keine abgetippten Zeichenketten.

              Die Begründung über dieser Datei nennt „funktionierende Links"
              als Grund, die PDF über den Druckweg zu erzeugen statt über eine
              Bibliothek. Gemessen enthielten beide Blätter null
              Link-Anmerkungen: Wer das Blatt bekommt, musste die Adresse
              abtippen. Chromium macht aus jedem `a href` beim Drucken eine
              Anmerkung, also braucht es nur ein echtes Element.

              `text-inherit` und keine Unterstreichung: Am Bildschirm und auf
              Papier sieht die Zeile aus wie vorher, sie lässt sich nur
              zusätzlich anklicken. */}
            {/* Die Trefferfläche der Kontaktzeilen.

              axe meldete sie mit 174 x 18 px als zu klein: WCAG 2.2 AA
              verlangt 24 x 24 px, und jede dieser Zeilen steht allein in
              ihrem Absatz, fällt also nicht unter die Ausnahme für Verweise
              mitten im Satz.

              `py-1` mit gleich großem `-my-1` allein reichte nicht: Die
              Flächen benachbarter Zeilen ueberlappten sich dann, und axe
              misst den freien Platz, nicht die Box — gemeldet blieben
              22,8 px. Erst mit einem Zeilenabstand von 26 px statt der 22,75
              aus `leading-relaxed` steht jede Zeile für sich.

              Die Zeile bleibt optisch stehen; das Blatt wächst um zwölf
              Pixel und bleibt eine Seite. */}
            <div className="text-right text-sm leading-[26px] text-[#4a4a55] [&_a]:-my-1 [&_a]:inline-block [&_a]:py-1 [&_a]:text-inherit [&_a]:no-underline">
              <p>{site.location}</p>
              <p>
                <a href={mailAdresse(site.email, site.mailSubject)}>
                  {site.email}
                </a>
              </p>
              {SOCIALS.github ? (
                <p>
                  <a href={SOCIALS.github}>{alsAnzeige(SOCIALS.github)}</a>
                </p>
              ) : null}
              {SOCIALS.linkedin ? (
                <p>
                  <a href={SOCIALS.linkedin}>{alsAnzeige(SOCIALS.linkedin)}</a>
                </p>
              ) : null}
              <p className="mt-1 font-medium text-[#101014]">
                {site.availability.label}
              </p>
              {/* Die Bedingungen unter der Zusage: wo, ab wann, in welcher
                Sprache. `detail` stand im Inhalt und wurde von nichts
                gerendert; Eintritt und Sprachen standen ausschließlich im
                Faktenblatt der Startseite und erreichten damit niemanden, der
                nur dieses Blatt in die Hand bekommt — also genau den Fall, für
                den es gemacht ist. Drei Zeilen, das Blatt bleibt eine Seite. */}
              <p>{site.availability.detail}</p>
              <p>{site.availability.entry}</p>
              <p>{site.availability.languages}</p>
            </div>
          </header>

          {/* Positioning */}
          <section className="mt-7 print:mt-4">
            <p className="text-[14px] leading-snug text-[#25252e]">
              {positionierung}
            </p>
          </section>

          {/* Projects */}
          <section className="mt-8 print:mt-4">
            <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
              {onepager.projects}
            </h2>

            <div className="flex flex-col gap-5 print:gap-3">
              {caseStudies.map((study) => (
                <div key={study.id} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    {/* Größe und Farbe stehen hier beide ausdrücklich, und das
                      hat einen gemessenen Grund.

                      `text-base` ist auf dieser Seite keine Schriftgröße. Das
                      Theme definiert eine Farbe namens "base", und Tailwind
                      macht daraus eine Farbklasse, die die eingebaute
                      Größenklasse gleichen Namens verdrängt: gesetzt wurde
                      color, nicht font-size.

                      Auf der hellen Druckseite setzte sonst nichts die Farbe,
                      also erbte die Überschrift das Weiß des dunklen Themas —
                      die vier Projektnamen standen weiß auf weiß. */}
                    <h3 className="text-[16px] font-semibold text-[#101014]">
                      {/* Das Leerzeichen gehört in denselben Textknoten wie der
                        Unterschied zwischen „Salati Live im App Store" und
                        „SalatiLive im App Store". Optisch trennt der
                        Außenabstand, im Text stand nichts: Ein Screenreader
                        las die beiden Wörter zusammen, und dasselbe zog ein
                        Bewerbermanagementsystem aus der PDF.

                        Als eigener Knoten hinter diesem Kommentar reichte es
                        nicht: Im DOM stand „Salati Live im App Store", der
                        zugängliche Name aber weiterhin „SalatiLive im App
                        Store" — die Namensberechnung verwirft einen
                        Textknoten, der nur aus Leerraum besteht. Deshalb
                        hängt das Leerzeichen jetzt am Namen selbst. */}
                      {`${study.name} `}
                      <span className="ml-1 text-[13px] font-normal text-[#5a5a66]">
                        {study.statusLabel} · {study.year}
                      </span>
                    </h3>
                    <span className="font-mono text-[10px] text-[#6a6a76]">
                      {study.metrics
                        .map(
                          (m) =>
                            `${gedruckt(m, onepager.atLeast, sprache)} ${m.label}`,
                        )
                        .join("  ·  ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#25252e]">
                    {study.tagline}.{" "}
                    {/* Doppelpunkt nur, wenn der Satz dahinter keinen eigenen
                      hat. Sonst stolpert die Zeile über zwei davon:
                      "Ein Agent, der nicht ungefragt handelt: Der Reiz eines
                      solchen Systems ist auch sein Risiko: ein Bot, der …".
                      Auf dem gedruckten Blatt betraf das zwei der vier
                      Projekte.

                      Der Ausweg war zuerst ein Gedankenstrich, und der war
                      falsch: Nach ihm folgte ein großgeschriebenes Wort, weil
                      dahinter ein vollständiger Satz steht — auf Papier las
                      sich das wie ein Tippfehler. Ein Punkt trennt dasselbe,
                      ohne etwas zu behaupten, das die Zeichensetzung nicht
                      hergibt. */}
                    <strong className="font-semibold">
                      {study.hardPart.title}
                      {firstSentence(study.hardPart.body).includes(":")
                        ? "."
                        : ":"}
                    </strong>{" "}
                    {firstSentence(study.hardPart.body)}
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] leading-snug text-[#6a6a76]">
                    {study.stack
                      .flatMap((g) => g.items)
                      .slice(0, 7)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Schwerpunkte und Werdegang nebeneinander. Beide sind kompakte Listen;
            untereinander kosten sie die zweite Seite, nebeneinander passen sie. */}
          <div className="mt-8 grid grid-cols-2 gap-x-8 break-inside-avoid print:mt-4">
            <section>
              <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
                {onepager.focus}
              </h2>
              <dl className="flex flex-col gap-1.5">
                {topSkills.map((group) => (
                  <div key={group.title}>
                    <dt className="text-[12.5px] font-semibold">
                      {group.title}
                    </dt>
                    <dd className="text-[12.5px] leading-snug text-[#3a3a44]">
                      {group.items.join(" · ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
                {onepager.path}
              </h2>
              <dl className="flex flex-col gap-1.5">
                {/* Schulstationen bleiben dem vollständigen Lebenslauf vorbehalten,
                  auf einer Seite zählt, was die Projekte erklärt. */}
                {about.timeline.slice(0, 3).map((entry) => (
                  <div
                    key={entry.period}
                    className="text-[12.5px] leading-snug"
                  >
                    <dt className="font-mono text-[10.5px] text-[#5a5a66]">
                      {entry.period}
                    </dt>
                    <dd>
                      <span className="font-semibold">{entry.title}</span>
                      <span className="text-[#3a3a44]"> · {entry.org}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[11.5px] leading-snug text-[#3a3a44]">
                {onepager.pathNote}
              </p>

              {/* Die veröffentlichten Pakete.

                Auf dem Blatt stehen vier Produktivsysteme, und alle vier sind
                privat: Kundendaten und lizenzierte Inhalte. Wer es liest und
                nachsehen will, kann bis hierher genau nichts davon öffnen.
                Diese vier Namen sind der Teil, der offen liegt, und für eine
                fachliche Führung der einzige mit einer Adresse zum Anklicken.

                Die Namen kommen aus dem Inhalt, nicht aus dieser Datei: Ein
                fünftes Paket steht sonst auf der Seite und nicht auf dem Blatt.
                `portfolio` fällt weg — die Seite selbst nennt die Fußzeile.

                Platz war da: Das Blatt maß 854 px von 1.040 nutzbaren, und
                diese Spalte endete 54 px über der linken. */}
              <div className="mt-3">
                <h3 className="font-mono text-[10.5px] tracking-[0.16em] text-[#5a5a66] uppercase">
                  {onepager.openSource}
                </h3>
                {/* `overflow-wrap: anywhere`: Die Kette der Paketnamen ist bei
                    320 px breiter als ihre Spalte, und Namen wie
                    "whisper-ggml-header" bieten dem Browser keinen Punkt, an
                    dem er ohne diese Regel umbricht. Gemessen auf dem
                    CI-Runner: 152 px nötig, 107 sichtbar — auf dem eigenen
                    Rechner ging es knapp durch, weil die Schrift dort schmaler
                    rät. Das Blatt ist ein Druckdokument; am Bildschirm bei
                    320 px soll es trotzdem lesbar bleiben. */}
                <p className="mt-1 text-[11.5px] leading-snug [overflow-wrap:anywhere] text-[#3a3a44]">
                  {about.openSource.items
                    .filter((paket) => paket.name !== "portfolio")
                    .map((paket) => paket.name)
                    .join(" · ")}
                  {/* Der Doppelpunkt gehört an das Wort davor. Als eigenes
                      Textstück mit führendem Leerzeichen stand auf dem Blatt
                      "arabic-normalize : alle mit Tests" — französische
                      Setzung in einem deutschen Dokument. */}
                  <span className="text-[#6a6a76]">
                    : {onepager.openSourceNote}
                  </span>
                </p>
              </div>
            </section>
          </div>

          {/* Der Abschnitt "Arbeitsweise" stand hier und ist raus.

            Grund: Das eingecheckte PDF war einseitig, die Seite erzeugt aber
            seit einer Weile zwei. Gemessen 1.495 px roh, mit zoom 0,83 also
            1.241 px gegen 1.040 px nutzbare Hoehe. Das PDF war schlicht
            veraltet und passte nicht mehr zu der Seite, aus der es entsteht.

            Von allem, was auf dieser Seite steht, war dieser Block der
            entbehrlichste: Seine drei Punkte sagen dasselbe wie der letzte
            Satz des Einleitungsabsatzes, und vollstaendig stehen sie auf der
            Webseite. Die vier Projekte sind die eigentliche Aussage und
            bleiben. */}

          <footer className="mt-9 flex flex-wrap print:mt-4 items-center justify-between gap-3 border-t border-[#d4d4dc] pt-4 text-[11.5px] text-[#6a6a76]">
            <span>
              {onepager.fullCaseStudies}{" "}
              {/* Die Adresse fuehrt in die Sprache des Blattes.
                Auf dem englischen Blatt stand die Wurzel, und die ist
                deutsch: Wer das PDF an eine englischsprachige fachliche
                Fuehrung weiterreicht, schickt sie damit auf eine Seite, die
                sie nicht lesen kann. Es ist der einzige Verweis auf die Seite
                im ganzen Dokument. */}
              <a href={heimatAdresse} className="text-inherit no-underline">
                {alsAnzeige(heimatAdresse)}
              </a>
            </span>
            <span>
              {onepager.asOf}{" "}
              {new Date().toLocaleDateString(
                sprache === "de" ? "de-DE" : "en-GB",
                {
                  month: "long",
                  year: "numeric",
                },
              )}
            </span>
          </footer>
        </article>
      </main>

      {/* Die Rechtsverweise als Fußzeile.

          Als `div` waren sie keine Landmarke, und die beiden Kurzprofile
          hatten damit im Barrierefreiheitsbaum genau eine: den Hauptbereich.
          Ausgerechnet auf dem Blatt, das ein Recruiter zuerst bekommt, gab es
          weder einen Sprung zur Fußzeile noch zur Bedienleiste.

          `npm run check:landmarks` hält es offen. */}
      <footer className="no-print mx-auto max-w-[820px] px-8 pb-16">
        {/* -my-2/py-2 bringt die Trefferfläche von gemessenen 18 px auf
            34 px, ohne die Zeile optisch zu verschieben. Ein eigenstaendiger
            Link fällt nicht unter die Inline-Ausnahme von WCAG 2.5.8. */}
        <Link
          href={sprache === "de" ? "/" : "/en"}
          className="-my-2 inline-block py-2 text-sm text-[#4a4a55] underline underline-offset-4"
        >
          {onepager.back}
        </Link>

        {/* Impressum und Datenschutz, weil § 5 DDG sie von jeder Seite des
            Angebots aus unmittelbar erreichbar verlangt.

            Gemessen am 02.08.2026 an elf ausgelieferten Adressen: /onepager
            und /en/onepager waren die einzigen öffentlichen Seiten ohne
            beide Verweise — und genau diese Adresse verschickt man an
            Recruiter.

            Nur am Bildschirm: `no-print` sitzt schon am umgebenden Kasten.
            Auf dem Blatt selbst steht das Impressum nicht, dort trägt die
            Fußzeile die Adresse der Webseite. */}
        {/* `whitespace-nowrap` bindet den Punkt an den Verweis dahinter.
            Ohne das brach die Zeile bei 320, 430 und 768 px hinter dem Punkt
            um, und am Ende der ersten Zeile stand ein Trennzeichen, das
            nichts mehr trennte. */}
        <span className="whitespace-nowrap">
          <span aria-hidden className="px-2 text-sm text-[#9a9aa6]">
            &middot;
          </span>
          <Link
            href="/impressum"
            hrefLang="de"
            className="-my-2 inline-block py-2 text-sm text-[#4a4a55] underline underline-offset-4"
          >
            {inhalt.footer.impressum}
          </Link>
        </span>
        <span className="whitespace-nowrap">
          <span aria-hidden className="px-2 text-sm text-[#9a9aa6]">
            &middot;
          </span>
          <Link
            href="/datenschutz"
            hrefLang="de"
            className="-my-2 inline-block py-2 text-sm text-[#4a4a55] underline underline-offset-4"
          >
            {inhalt.footer.datenschutz}
          </Link>
        </span>
      </footer>
    </div>
  );
}
