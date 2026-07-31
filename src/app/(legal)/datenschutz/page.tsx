import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Datenschutz",
  robots: { index: false, follow: false },
};

/**
 * TODO(domenic): Anschrift ergänzen (USER-TODO B1). Der Rest beschreibt exakt,
 * was diese Seite technisch tut — das ist bewusst wenig:
 * keine Cookies, kein Tracking-Pixel, keine Drittanbieter-Schriften,
 * keine Datenbank. Wenn du Vercel Analytics aktivierst (USER-TODO B3), ist der
 * entsprechende Abschnitt unten bereits vorbereitet.
 */
export default function Datenschutz() {
  return (
    <main>
      <h1 className="text-title mb-10 text-ink">Datenschutzerklärung</h1>

      <Section title="Verantwortlicher">
        Domenic Moran
        <br />
        Heidelberger Straße 36, 12059 Berlin, Deutschland
        <br />
        E-Mail:{" "}
        <a
          href={`mailto:${site.email}`}
          className="text-acid underline underline-offset-4"
        >
          {site.email}
        </a>
      </Section>

      <Section title="Hosting">
        Diese Website wird bei der Vercel Inc. gehostet. Beim Aufruf werden
        technisch notwendige Server-Logdaten verarbeitet (IP-Adresse,
        Zeitpunkt, aufgerufene Ressource, User-Agent, Referrer). Rechtsgrundlage
        ist Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse am sicheren und
        stabilen Betrieb. Die Übermittlung in die USA erfolgt auf Grundlage der
        EU-Standardvertragsklauseln.
      </Section>

      <Section title="Cookies und Tracking">
        Diese Website setzt keine Cookies, weder eigene noch fremde, und bindet
        keine Analyse- oder Werbedienste ein. Es gibt daher auch kein
        Cookie-Banner — nicht aus Nachlässigkeit, sondern weil es nichts gibt,
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
        nichts gespeichert, wenn du Kontakt aufnimmst — deine Nachricht geht
        direkt von deinem Mailprogramm an mein Postfach, ohne dass diese Seite
        daran beteiligt ist. Schreibst du mir, verarbeite ich deine Angaben
        ausschließlich zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b
        bzw. lit. f DSGVO) und lösche sie, sobald sie erledigt ist und keine
        gesetzliche Aufbewahrungsfrist entgegensteht.
      </Section>

      <Section title="Keine weiteren Datenempfänger">
        Außer dem Hosting gibt es keinen Auftragsverarbeiter. Diese Website
        lädt keine Skripte, Schriften, Karten, Videos oder Analysedienste von
        fremden Servern nach — weder beim Aufruf noch bei einer Interaktion.
        Sämtliche Seiten werden vorab erzeugt und als fertige Dateien
        ausgeliefert; es gibt keinen Endpunkt, der Eingaben entgegennimmt.
      </Section>

      <Section title="Deine Rechte">
        Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Eine
        formlose E-Mail an die oben genannte Adresse genügt. Außerdem steht dir
        ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, etwa bei
        der Berliner Beauftragten für Datenschutz und Informationsfreiheit.
      </Section>

      <Section title="Stand">
        {new Date().toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </Section>
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
