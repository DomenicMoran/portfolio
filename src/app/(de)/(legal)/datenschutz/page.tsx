import type { Metadata } from "next";
import { mailAdresse } from "@/lib/mailto";
import { EnglishNote } from "../EnglishNote";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Was diese Seite technisch tut und welche Daten dabei anfallen. Keine Cookies, keine Analyse, keine Einbindung von Dritten.",
  robots: { index: false, follow: false },
  // Ohne eigenen Eintrag erbt diese Seite den Canonical des
  // Wurzel-Layouts, und der zeigt auf die Startseite: Die Rechtsseite
  // erklärt sich damit selbst zum Duplikat einer ganz anderen Seite.
  alternates: { canonical: `${site.url}/datenschutz` },
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
/**
 * Das Datum der letzten inhaltlichen Änderung dieser Erklärung, von Hand
 * gepflegt.
 *
 * Hier stand `new Date()`. Damit trug die Erklärung das Datum des letzten
 * Bauvorgangs — und der läuft täglich, weil ein Automat die Commit-Zahlen
 * auffrischt. Die Seite datierte sich also jeden Morgen neu, ohne dass sich ein
 * Wort geändert hatte. Der Kommentar über dieser Datei hat das immer schon
 * ausgeschlossen; der Code tat das Gegenteil.
 *
 * Belegt: Der sichtbare Text wurde zuletzt am 01.08.2026 geändert, als die
 * Anschrift des Verantwortlichen dazukam (`git log -S "Heidelberger"`).
 *
 * Wer den Text ändert, ändert diese Zeile mit. Eine Erklärung, die sich selbst
 * neu datiert, sagt nichts darüber aus, was sich geändert hat.
 */
const STAND = "3. August 2026";

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

          Art. 13 Abs. 2 lit. a DSGVO verlangt die Dauer der Speicherung oder,
          wenn das nicht geht, die Kriterien dafür. Der Abschnitt nannte beides
          nicht: Er sagte, welche Logdaten anfallen und warum, und ließ offen,
          wie lange sie liegen — auf einer Seite, die sonst jede Angabe belegt.

          Die Stunde ist keine Schätzung: Vercel nennt in der eigenen
          Dokumentation zu den Laufzeitprotokollen je Tarif eine
          Aufbewahrungszeit, und für den hier genutzten Tarif steht dort eine
          Stunde. Wer den Tarif wechselt, muss diesen Satz nachziehen. */}
      <Section title="Hosting">
        Diese Website wird bei der Vercel Inc. gehostet. Beim Aufruf werden
        technisch notwendige Server-Logdaten verarbeitet (IP-Adresse, Zeitpunkt,
        aufgerufene Ressource, User-Agent, Referrer). Rechtsgrundlage ist Art. 6
        Abs. 1 lit. f DSGVO, also das berechtigte Interesse am sicheren und
        stabilen Betrieb. Der Hoster hält diese Protokolle eine Stunde lang vor
        und löscht sie danach automatisch; eine eigene Speicherung, Auswertung
        oder Weitergabe findet nicht statt. Die Übermittlung in die USA erfolgt
        auf Grundlage der EU-Standardvertragsklauseln.
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
        ausschließlich zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b bzw.
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
        Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Eine
        formlose E-Mail an die oben genannte Adresse genügt. Außerdem steht dir
        ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, etwa bei
        der Berliner Beauftragten für Datenschutz und Informationsfreiheit.
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
