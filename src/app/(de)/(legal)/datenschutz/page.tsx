import type { Metadata } from "next";
import { feedFuer, ogBildFuer } from "@/lib/metadata";
import { mailAdresse } from "@/lib/mailto";
import { EnglishNote } from "../EnglishNote";
import { site } from "@/content/site";
import { STAND } from "../stand";

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Was diese Seite technisch tut und welche Daten dabei anfallen. Keine Cookies, keine Analyse, keine Einbindung von Dritten.",
  robots: { index: false, follow: false },
  /* Auch eine Seite mit `noindex` bekommt eine Karte, sobald jemand ihre
     Adresse teilt. Ohne eigene Angabe trug sie den Titel der Startseite. */
  openGraph: {
    // Ohne dieses Feld kein Bild: Next ersetzt das geerbte openGraph,
    // statt es zu mischen.
    images: ogBildFuer("de"),
    title: "Datenschutz",
    locale: "de_DE",
  },
  // Ohne eigenen Eintrag erbt diese Seite den Canonical des
  // Wurzel-Layouts, und der zeigt auf die Startseite: Die Rechtsseite
  // erklärt sich damit selbst zum Duplikat einer ganz anderen Seite.
  alternates: {
    canonical: `${site.url}/datenschutz`,
    // Der Feed steht auf jeder Seite, auch hier: Next ersetzt das geerbte
    // `alternates` vollständig, statt es zu mischen.
    types: feedFuer("de"),
  },
};

/**
 * Beschreibt exakt, was diese Seite technisch tut, und das ist bewusst wenig:
 * keine Cookies, kein Zählpixel, keine Schriften von fremden Servern, keine
 * Datenbank, kein Endpunkt, der Eingaben entgegennimmt.
 *
 * Käme je ein Dienst dazu, der Daten verarbeitet — eine Analyse, ein
 * Formular, eine Einbindung —, gehört ein eigener Abschnitt hierher und der
 * Stand unten muss mitwandern. Der Stand nennt bewusst das Datum der letzten
 * inhaltlichen Änderung und nicht den heutigen Tag: Eine Erklärung, die sich
 * jeden Morgen selbst neu datiert, sagt nichts darüber aus, was sich geändert
 * hat.
 */
/* Das Datum steht in `stand.ts`, hier stand es ein zweites Mal.

   Beide Stellen hießen STAND, und die lokale gewann: `check:legal` prüfte
   den Wert aus `stand.ts` gegen den ausgelieferten Text, die Seite zeigte
   den anderen. Gemessen an der ausgelieferten Seite standen dort der
   3. August und in der Datei der 4. — der Lauf war grün, weil er die Zeile
   gar nicht ansah, die ein Leser vor sich hat.

   Eine Quelle: Wer den Text ändert, ändert Datum und Prüfsumme in
   `stand.ts`, und der Lauf hält beides gegen das Blatt. */

export default function Datenschutz() {
  return (
    <main>
      <h1 className="text-title mb-10 text-ink">Datenschutzerklärung</h1>

      <EnglishNote />

      <Section title="Verantwortlicher">
        Domenic Moran
        <br />
        Heidelberger Straße 36, 12059 Berlin, Deutschland
        <br />
        E-Mail:{" "}
        <a
          href={mailAdresse(site.email, site.mailSubject)}
          /* `-my-1 py-1`: Der Verweis maß 174 x 18 px und lag damit unter den
             24 px aus WCAG 2.5.8. Das Impressum nebenan hatte den Ausgleich
             schon, diese Stelle nicht — dieselbe Regel, zwei Fassungen.
             Optisch ändert sich nichts. */
          className="-my-1 py-1 text-acid underline underline-offset-4"
        >
          {site.email}
        </a>
      </Section>

      {/* Die Speicherdauer gehört hierher, nicht ins Ungefähre.

          Art. 13 Abs. 2 lit. a DSGVO verlangt die Dauer der Speicherung oder,
          wenn das nicht geht, die Kriterien dafür. Der Abschnitt nannte beides
          nicht: Er sagte, welche Logdaten anfallen und warum, und ließ offen,
          wie lange sie liegen — auf einer Seite, die sonst jede Angabe belegt.

          Die Stunde ist keine Schätzung: Vercel nennt in der eigenen
          Dokumentation zu den Laufzeitprotokollen je Tarif eine
          Aufbewahrungszeit, und für den hier genutzten Tarif steht dort eine
          Stunde. Wer den Tarif wechselt, muss diesen Satz nachziehen.

          Zur Rechtsgrundlage des Drittlandtransfers stand hier nur die
          Standardvertragsklausel. Das ist nicht falsch, aber es ist die
          nachrangige: Vercel erklärt in der eigenen Datenschutzerklärung,
          nach dem EU-US-Datenschutzrahmen zertifiziert zu sein, und für
          zertifizierte Empfänger ist seit dem 10. Juli 2023 der
          Angemessenheitsbeschluss nach Art. 45 DSGVO die vorrangige
          Grundlage. Beide zu nennen ist genauer als eine. */}
      <Section title="Hosting">
        Diese Website wird bei der Vercel Inc. gehostet. Beim Aufruf werden
        technisch notwendige Server-Logdaten verarbeitet (IP-Adresse, Zeitpunkt,
        aufgerufene Ressource, User-Agent, Referrer). Rechtsgrundlage ist Art. 6
        Abs. 1 lit. f DSGVO, also das berechtigte Interesse am sicheren und
        stabilen Betrieb. Der Hoster hält diese Protokolle eine Stunde lang vor
        und löscht sie danach automatisch; eine eigene Speicherung, Auswertung
        oder Weitergabe findet nicht statt. Vercel ist nach dem
        EU-US-Datenschutzrahmen zertifiziert; die Übermittlung in die USA stützt
        sich damit auf den Angemessenheitsbeschluss der Europäischen Kommission
        vom 10. Juli 2023 und ergänzend auf die EU-Standardvertragsklauseln.
      </Section>

      <Section title="Cookies und Tracking">
        Diese Website setzt keine Cookies, weder eigene noch fremde, und bindet
        keine Analyse- oder Werbedienste ein. Es gibt daher auch kein
        Cookie-Banner, nicht aus Nachlässigkeit, sondern weil es nichts gibt,
        worin man einwilligen könnte.
      </Section>

      <Section title="Schriftarten">
        Alle Schriftarten werden vom eigenen Server ausgeliefert. Beim Besuch
        dieser Seite wird keine Verbindung zu Google Fonts oder einem anderen
        Schriftanbieter aufgebaut.
      </Section>

      <Section title="Kontaktaufnahme">
        Diese Website hat kein Kontaktformular. Sie nennt lediglich eine
        E-Mail-Adresse. Es wird also nichts erhoben, nichts übertragen und
        nichts gespeichert, wenn du Kontakt aufnimmst. Deine Nachricht geht
        direkt von deinem Mailprogramm an mein Postfach, ohne dass diese Seite
        daran beteiligt ist. Schreibst du mir, verarbeite ich deine Angaben
        ausschließlich zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b bzw.
        lit. f DSGVO) und lösche sie, sobald sie erledigt ist und keine
        gesetzliche Aufbewahrungsfrist entgegensteht.
      </Section>

      <Section title="Keine weiteren Datenempfänger">
        Außer dem Hosting gibt es keinen Auftragsverarbeiter. Diese Website lädt
        keine Skripte, Schriften, Karten, Videos oder Analysedienste von fremden
        Servern nach, weder beim Aufruf noch bei einer Interaktion. Sämtliche
        Seiten werden vorab erzeugt und als fertige Dateien ausgeliefert; es
        gibt keinen Endpunkt, der Eingaben entgegennimmt.
      </Section>

      <Section title="Deine Rechte">
        Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und
        Datenübertragbarkeit (Art. 20 DSGVO). Eine formlose E-Mail an die oben
        genannte Adresse genügt. Außerdem steht dir nach Art. 77 DSGVO ein
        Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, etwa bei der
        Berliner Beauftragten für Datenschutz und Informationsfreiheit.
      </Section>

      {/* Das Widerspruchsrecht steht bewusst allein.

          Art. 21 Abs. 4 DSGVO verlangt den Hinweis darauf „ausdrücklich und
          in einer verständlichen und von anderen Informationen getrennten
          Form“. Vorher stand er als sechster Halbsatz in der Aufzählung der
          Rechte — inhaltlich vollständig, der Form nach aber nicht das, was
          die Vorschrift verlangt.

          Er greift hier auch wirklich: Die Server-Logdaten laufen über Art. 6
          Abs. 1 lit. f, und genau dieses berechtigte Interesse ist die
          Grundlage, gegen die sich ein Widerspruch richten kann. */}
      <Section title="Widerspruchsrecht">
        Soweit ich Daten auf Grundlage eines berechtigten Interesses verarbeite
        (Art. 6 Abs. 1 lit. f DSGVO), hast du das Recht, aus Gründen, die sich
        aus deiner besonderen Situation ergeben, jederzeit Widerspruch gegen
        diese Verarbeitung einzulegen (Art. 21 Abs. 1 DSGVO). Auf dieser Seite
        betrifft das die Server-Logdaten des Hosters. Eine formlose E-Mail an
        die oben genannte Adresse genügt; ich verarbeite die betroffenen Daten
        dann nicht mehr, es sei denn, ich kann zwingende schutzwürdige Gründe
        nachweisen, die deine Interessen überwiegen.
      </Section>

      <Section title="Stand">{STAND}</Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-ink-dim">{children}</p>
    </section>
  );
}
