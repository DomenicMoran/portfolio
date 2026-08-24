import Image from "next/image";
import { mailAdresse } from "@/lib/mailto";
import { alsAnzeige } from "@/lib/url-display";
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
      `Kennzahl "${zahl}" lässt sich nicht auf Hunderter abrunden.`,
    );
  }
  return abgerundet(roh, sprache);
}

/*
   Abgerundet auf Hunderter, nicht auf Tausender.

   Die Zahl steht als Untergrenze auf dem Blatt, damit sie stimmt, solange sie
   wächst. Auf Tausender gerundet wurde daraus bei gemessenen 4.722 Commits
   „über 4.000", siebenhundert Belege weniger, als es gibt, und im Lebenslauf
   daneben stand „über 4.700". Hunderter sind genauso sicher und lesen sich
   nicht wie eine grobe Schätzung.
*/
function abgerundet(roh: number, sprache: "de" | "en"): string {
  const hunderter = Math.floor(roh / 100) * 100;
  return hunderter.toLocaleString(sprache === "de" ? "de-DE" : "en-GB");
}

/* Hier stand `firstSentence`, das den ersten Satz jeder „harten Stelle" für
   das Blatt abschnitt. Der Satz selbst ist mit den sieben Projekten
   weggefallen; die Begründung steht unten am Absatz. */

/**
 * Commit-Zahlen auf dem gedruckten Blatt als Untergrenze, alles andere exakt.
 *
 * Dieselbe Regel wie beim LinkedIn-Titelbild und im Lebenslauf: Was der
 * stündliche Prüflauf nachzählen und neu ausliefern kann, bleibt exakt, die
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
  return `${mindestens.toLowerCase()} ${abgerundet(roh, sprache)}`;
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
    // beide Kurzprofile vorher genau eine Landmarke, auf dem Blatt, das ein
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
          {/* Kopf */}
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#101014] pb-6 print:pb-4">
            <div className="flex items-center gap-5">
              {/* Das Porträt kostet keine Zeile.
                Die Kontaktspalte rechts ist sechs Zeilen hoch, gemessen
                156 px; das Bild bleibt darunter, und das Blatt bleibt eine
                Seite. In Deutschland gehört ein Foto auf eine Bewerbung, und
                dieses Blatt geht als PDF an Firmen. */}
              {about.portraitPrint ? (
                <Image
                  src={about.portraitPrint}
                  /* Leerer Alternativtext, und das ist die Aussage.

                     Hier stand der Name, derselbe, der einen Zentimeter
                     weiter rechts als `h1` steht. Gemessen an der
                     ausgelieferten Seite las ein Vorleseprogramm damit
                     „Grafik Domenic Moran, Überschrift Ebene 1 Domenic
                     Moran“: zweimal dieselbe Auskunft, und die erste ohne
                     Zugewinn. Das Bild trägt auf diesem Blatt keine
                     Information, die nicht danebensteht; ein leerer
                     Alternativtext nimmt es aus der Ansage, statt es
                     unbeschriftet zu lassen.

                     Auf der Startseite bleibt der Name als Alternativtext:
                     Dort steht das Porträt unter „Vier Jahre gelernt“, und
                     wer nicht sieht, erfährt sonst nirgends, dass dort ein
                     Foto ist und wen es zeigt. */
                  alt=""
                  width={110}
                  height={110}
                  /* 256 px für 110 CSS-Pixel, und das ist kein Versehen.

                     Dieses Blatt wird gedruckt, und auf Papier zählt nicht die
                     Bildschirmgröße, sondern die Dichte. Gemessen am
                     ausgelieferten PDF: das einzige Bild darin war 128 × 128
                     und stand auf 22,7 mm, 143 dpi, also gut die Hälfte
                     dessen, was ein Druck braucht. Auf dem Bildschirm fällt
                     das nicht auf, auf Papier sieht man es sofort, und
                     ausgerechnet an dem Blatt, das eine Bewerbung begleitet.

                     `sizes` steuert die Auswahl aus dem srcset. Mit „110px"
                     nahm der Browser bei einfacher Pixeldichte die
                     128er-Fassung; der Druck läuft immer mit einfacher
                     Dichte. Die Vorlage liegt mit 1024 px vor, die Auflösung
                     war also da und wurde nur nicht abgerufen.

                     Hier standen 256 px mit „287 dpi auf 22,7 mm". Nachgemessen
                     am 07.08.2026 steht das Bild auf 24,7 mm, und 256 px sind
                     dort 263 dpi, unter den 300, die ein Druck braucht. Das
                     Blatt ist gewachsen, die Zahl blieb stehen.

                     384 px ergeben auf derselben Fläche 394 dpi. Im PDF sind
                     das 392 statt 278 KB; für ein Blatt, das als Anhang an
                     Firmen geht, ist das kein Preis, und die eingebettete
                     Fassung ist nachgezählt 384 × 384. */
                  sizes="384px"
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
              misst den freien Platz, nicht die Box, gemeldet blieben
              22,8 px. Erst mit einem Zeilenabstand von 26 px statt der 22,75
              aus `leading-relaxed` steht jede Zeile für sich.

              Die Zeile bleibt optisch stehen; das Blatt wächst um zwölf
              Pixel und bleibt eine Seite. */}
            {/* Rechtsbündig erst ab `sm`. Auf dem Blatt und am Desktop steht
                dieser Block rechts neben dem Namen, und der rechte Rand ist
                dort die gemeinsame Kante. Auf einem Telefon stapelt die Spalte
                unter den Namen, und rechtsbündiger Fließtext hat dann keine
                Kante mehr, an der er sich ausrichtet: „Gespräche jederzeit ·
                Eintritt nach bis zu drei Monaten" endete mit einem einzelnen
                Wort in der zweiten Zeile, rechts angeschlagen. */}
            <div className="text-left text-sm leading-[26px] text-[#4a4a55] sm:text-right [&_a]:-my-1 [&_a]:inline-block [&_a]:py-1 [&_a]:text-inherit [&_a]:break-all [&_a]:no-underline">
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
                nur dieses Blatt in die Hand bekommt, also genau den Fall, für
                den es gemacht ist. Drei Zeilen, das Blatt bleibt eine Seite. */}
              <p>{site.availability.detail}</p>
              <p>{site.availability.entry}</p>
              <p>{site.availability.languages}</p>
              {/* Vierte Zeile, aus demselben Grund wie die drei darüber: Das
                  Blatt soll die Rückfrage ersparen, und die nächste Rückfrage
                  ist die nach dem Rahmen. Neu veröffentlicht wird nichts, die
                  Spanne steht im Recruiter-Bereich der Seite. */}
              <p>{site.availability.salary}</p>
            </div>
          </header>

          {/* Wofür ich stehe */}
          <section className="mt-7 print:mt-4">
            <p className="text-[14px] leading-snug text-[#25252e]">
              {positionierung}
            </p>
          </section>

          {/* Die Projekte */}
          <section className="mt-8 print:mt-3">
            <h2 className="mb-3 border-b border-[#d4d4dc] pb-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
              {onepager.projects}
            </h2>

            {/* Auf dem Papier zwei Spalten, am Bildschirm eine.

                Mit vier Projekten stand die Liste untereinander und das Blatt
                hatte 44 px Reserve. Mit sieben waren es 121 Prozent der Seite,
                und nach dem Streichen der Stack-Zeile und drei engeren
                Abständen blieben 7 px von 1.040. Sieben Pixel sind keine
                Reserve: Der nächste Satz, der eine Zeile länger wird, kostet
                die Ein-Seiten-Zusage, und die ist der Zweck des Blattes.

                Zwei Spalten sind der strukturelle Ausweg statt des nächsten
                Zehntelpunkts Schriftgröße. Am Bildschirm bleibt es eine
                Spalte: Dort gibt es keine Seitenhöhe, und zwei schmale Spalten
                auf einem Telefon wären schlechter zu lesen. */}
            {/* Auf dem Blatt stehen die Systeme in Produktion, nicht alles,
                was gebaut ist.

                Das ist keine Schönung, sondern die Zusage des Blattes: eine
                Seite. Der Kommentar darüber nennt die Messung, mit sieben
                Projekten blieben 7 px von 1.040. Ein achtes Projekt kostet
                die Ein-Seiten-Zusage, und ein Kurzprofil, das auf zwei Seiten
                läuft, ist keins mehr. Wer wissen will, was daneben entsteht,
                findet es auf der Seite; sie hat keine Seitenhöhe. */}
            <div className="flex flex-col gap-5 print:gap-2">
              {caseStudies
                .filter((study) => !study.nochNichtAusgeliefert)
                .map((study) => (
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
                      also erbte die Überschrift das Weiß des dunklen Themas:
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
                        Store", die Namensberechnung verwirft einen
                        Textknoten, der nur aus Leerraum besteht. Deshalb
                        hängt das Leerzeichen jetzt am Namen selbst. */}
                        {`${study.name} `}
                        <span className="ml-1 text-[13px] font-normal text-[#5a5a66]">
                          {study.statusLabel} · {study.year}
                        </span>
                      </h3>
                      {/* `ml-auto`: Die Kennzahlen schließen rechts ab, auch
                        wenn sie in eine eigene Zeile rutschen.

                        Bei MenuCloud tun sie das, „1.276 API-Routen · 812
                        DB-Migrationen · 7.464 Testfälle · EU Hosting &
                        Datenhaltung" passt am Bildschirm nicht neben den
                        Titel. Ohne `ml-auto` beginnt die umbrochene Zeile
                        links, weil `justify-between` ein einzelnes Element an
                        den Anfang setzt: Gemessen bei 1440 px in beiden
                        Sprachen 258 beziehungsweise 246 px Abstand zum rechten
                        Rand, während die drei anderen Projekte bündig
                        abschlossen. Vier gleich gebaute Blöcke, einer davon
                        anders ausgerichtet, im Druck fällt es nicht auf, dort
                        passt die Zeile. */}
                      {/* 10 px bleibt, und das ist gemessen statt gesetzt.

                        Das Blatt trägt `zoom: 0.85`: Hier stehen auf dem Papier
                        8,5 px, also 6,4 pt, die kleinste Angabe des Blatts,
                        ausgerechnet bei den Zahlen, die überzeugen sollen.
                        11 px wären 9,35 px und 7 pt, deutlich angenehmer.

                        Gemessen kostet der eine Punkt 21 px Blatthöhe: 996
                        werden 1.017 von 1.040, die Reserve bis zur zweiten
                        Seite fällt von 44 auf 23. Die Ein-Blatt-Zusage ist mehr
                        wert als 0,6 pt, also bleibt es bei 10. `check:print`
                        hält die Untergrenze von 8 px auf dem Papier dagegen:
                        weiter schrumpfen darf hier nichts. */}
                      <span className="ml-auto font-mono text-[10px] text-[#6a6a76]">
                        {study.metrics
                          .map(
                            (m) =>
                              `${gedruckt(m, onepager.atLeast, sprache)} ${m.label}`,
                          )
                          .join("  ·  ")}
                      </span>
                    </div>
                    <p className="mt-1 text-[13.5px] leading-snug text-[#25252e]">
                      {study.tagline}.{" "}
                      {/* Doppelpunkt nur, wenn der Satz dahinter keinen eigenen
                      hat. Sonst stolpert die Zeile über zwei davon:
                      "Ein Agent, der nicht ungefragt handelt: Der Reiz eines
                      solchen Systems ist auch sein Risiko: ein Bot, der …".
                      Auf dem gedruckten Blatt betraf das zwei der vier
                      Projekte.

                      Der Ausweg war zuerst ein Gedankenstrich, und der war
                      falsch: Nach ihm folgte ein großgeschriebenes Wort, weil
                      dahinter ein vollständiger Satz steht, auf Papier las
                      sich das wie ein Tippfehler. Ein Punkt trennt dasselbe,
                      ohne etwas zu behaupten, das die Zeichensetzung nicht
                      hergibt. */}
                      {/* Nur die Überschrift der harten Stelle, nicht mehr ihr
                        erster Satz.

                        Der Satz stand hier, solange vier Projekte auf dem
                        Blatt standen. Mit sieben blieben nach dem Streichen
                        der Stack-Zeile und drei engeren Abständen 7 px von
                        1.040 übrig, und sieben Pixel sind keine Reserve: Der
                        nächste Satz, der eine Zeile länger wird, kostet die
                        Ein-Seiten-Zusage.

                        Zwei Druckspalten waren der erste Versuch und gemessen
                        der falsche: In der schmalen Spalte bricht jeder Satz
                        häufiger um, das Blatt wuchs auf 107 Prozent. Die
                        Überschrift allein trägt die Aussage ohnehin („Die
                        Kamera schlägt vor, sie behauptet nicht"), und der
                        ganze Absatz steht auf der Webseite, auf die die
                        Fußzeile zeigt. */}
                      <strong className="font-semibold">
                        {study.hardPart.title}
                      </strong>
                    </p>
                    {/* Die Stack-Zeile stand hier und ist am 16.08.2026 raus.

                      Mit vier Projekten passte das Blatt auf eine Seite, mit
                      sieben nicht mehr: gemessen 121 Prozent der Seitenhöhe,
                      also zwei Blatt, und die Ein-Seiten-Zusage ist der ganze
                      Zweck dieses Dokuments.

                      Gestrichen wurde die entbehrlichste Zeile und nicht ein
                      Projekt. Sieben mal sieben Techniknamen sind 49 Wörter,
                      die daneben schon einmal stehen: Der Bereich
                      „Schwerpunkte" nennt dieselben Namen nach Gebiet
                      geordnet, und die vollständigen Stacks stehen auf der
                      Webseite, auf die die Fußzeile zeigt. Ein Projekt
                      wegzulassen hätte dagegen eine Aussage verändert. */}
                  </div>
                ))}
            </div>
          </section>

          {/* Schwerpunkte und Werdegang nebeneinander. Beide sind kompakte Listen;
            untereinander kosten sie die zweite Seite, nebeneinander passen sie. */}
          {/* Zwei Spalten erst ab `sm`, gedruckt immer.

              Der Block stand fest auf `grid-cols-2`. Auf dem Papier ist das
              richtig, 794 px Blattbreite ergeben zwei Spalten von rund
              340 px. Am Telefon ergaben dieselben zwei Spalten 142 px, und
              darin zerfiel „React / Next.js App Router · React Native /
              Expo · TypeScript · Motion & Interaction“ in fünf Zeilen. Der
              Verweis darunter brach mitten im Wort um, mit einem einzelnen
              „n“ auf der letzten Zeile.

              Alles darüber auf dem Blatt läuft am Telefon über die volle
              Breite; nur dieser letzte Block tat es nicht. Gedruckt bleibt
              es bei zwei Spalten, weil die Druckdarstellung mit 794 px
              ohnehin über `sm` liegt. */}
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 break-inside-avoid sm:grid-cols-2 print:mt-3 print:gap-y-0">
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
                {/* Der Werdegang hat drei Stationen, auf dem Blatt stehen zwei.

                  Die dritte Station steht auf der Webseite und im
                  vollständigen Lebenslauf. Auf diesem Blatt ist die Zeile der
                  Preis für die Ein-Seiten-Zusage: ein dritter Eintrag schiebt
                  auf 106 Prozent der Seite, gemessen am 21.08.2026.
                  Schulstationen bleiben ohnehin dem vollständigen Lebenslauf
                  vorbehalten. */}
                {about.timeline.slice(0, 2).map((entry) => (
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
                `portfolio` fällt weg, die Seite selbst nennt die Fußzeile.

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
                    CI-Runner: 152 px nötig, 107 sichtbar, auf dem eigenen
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
                      "arabic-normalize : alle mit Tests", französische
                      Setzung in einem deutschen Dokument. */}
                  <span className="text-[#6a6a76]">
                    : {onepager.openSourceNote}
                    {/* Die Adresse stand hier als reiner Text, während dieselbe
                        Adresse im Kopf ein Verweis ist. Auf Papier ist das
                        gleich; im HTML und in der PDF war genau die Stelle
                        tot, an der jemand fragt „wo liegen die vier?". Die
                        Adresse kommt aus derselben Quelle wie oben, damit es
                        nicht zwei Schreibweisen gibt. */}
                    {SOCIALS.github ? (
                      <>
                        {" "}
                        {/* Unterstrichen, anders als die Verweise im Kopf:
                            Dieser steht mitten in einem Satz, und dort ist
                            Farbe allein kein Unterschied. Gemessen 2,1:1
                            gegenüber dem umgebenden Text, WCAG 1.4.1 verlangt
                            3:1, `check:a11y` meldete es auf beiden
                            Sprachfassungen und beiden Breiten. */}
                        <a
                          href={SOCIALS.github}
                          className="underline underline-offset-2"
                        >
                          {alsAnzeige(SOCIALS.github)}
                        </a>
                      </>
                    ) : null}
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

          <footer className="mt-9 flex flex-wrap print:mt-3 items-center justify-between gap-3 border-t border-[#d4d4dc] pt-4 text-[11.5px] text-[#6a6a76]">
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
            {/* Der Stand kommt aus der Uhr, und das hat eine Folge mit Datum.

                Die Seite ist statisch, `new Date()` friert also auf den
                Bauzeitpunkt ein, hier ist das richtig, denn gemeint ist der
                Stand des Blattes und nicht der Tag des Lesers.

                Beim ersten Bau in einem neuen Monat wandert die Angabe
                trotzdem: Das HTML sagt dann „September 2026", die beiden
                gedruckten PDF sagen weiter „August 2026“. Der Quellstand ist
                die Prüfsumme über genau diesen Text, also schlägt
                `check:onepager` fehl, ohne dass jemand etwas geändert hat.

                Das ist kein Fehler des Laufs, sondern seine Aufgabe: Das
                ausgelieferte Blatt trägt dann wirklich den falschen Monat.
                Fällig ist `npm run build && npm run onepager:pdf`, nicht eine
                Suche nach der Ursache. */}
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
            beide Verweise, und genau diese Adresse verschickt man an
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
