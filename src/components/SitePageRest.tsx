import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import type { Content } from "@/content/types";

const Produkte = dynamic(() =>
  import("@/components/sections/Produkte").then((m) => m.Produkte),
);
const CaseStudies = dynamic(() =>
  import("@/components/sections/CaseStudies").then((m) => m.CaseStudies),
);
const BookPublication = dynamic(() =>
  import("@/components/sections/BookPublication").then(
    (m) => m.BookPublication,
  ),
);

/**
 * Sieben Abschnitte, die unterhalb der Falz liegen und keinen Regler tragen,
 * jetzt per `next/dynamic` statt per statischem Import.
 *
 * Gemessen an der ausgelieferten Startseite auf einem vierfach gedrosselten
 * Telefon bei 1,6 Mbit/s: Nichts wurde gemalt, bevor nicht das gesamte
 * JavaScript der Seite geladen UND ausgeführt war, first paint fiel exakt auf
 * `domInteractive`. Grund: Der statische Import zog `About`, `AiWorkflow`,
 * `DeliverySpeed`, `Skills`, `Writing`, `RecruiterHub` und `Contact` in
 * denselben Bau- und Hydrationsschritt wie `Hero`. Der Absatz unter der
 * Überschrift stand serverseitig längst im HTML, durfte aber nicht gemalt
 * werden, bis all das ausgeführt war.
 *
 * `About` steht direkt hinter `Hero` im Text, aber `Hero` allein füllt schon
 * die volle Bildschirmhöhe (`min-h-svh`): `About` liegt damit unterhalb der
 * Falz, genau wie die anderen sechs. Ihr einziges interaktives Bauteil ist
 * ein Zähler ohne Regler und ohne Reiter, dasselbe Bild wie bei `Contact` &
 * Co.
 *
 * `CaseStudies` selbst bleibt ein statischer Import: Reiter und
 * Kartenrahmen sollen sofort bedienbar sein. Die drei Live-Vorführungen
 * darin (`adhan`, `darts-checkout`) tragen aber je einen eigenen Regler und
 * stehen ohne Umschalter im Baum, ein Nutzer kann sie treffen, bevor der
 * Rest der Seite fertig ist — sie sind deshalb einzeln, nicht über diese
 * Liste, nachgeladen, siehe `CaseStudies.tsx`. Ein erster Versuch, dafür
 * `CaseStudies` als Ganzes über diese Liste nachzuladen, ließ `check:vitals`
 * den INP-Wert reißen: 408 statt der erlaubten 200 ms bei einem
 * `pointerdown` auf einem der drei Regler, sechs Sekunden nach dem Laden
 * unter dieser Drosselung noch nicht hydriert. `Contact`, `Skills` & Co.
 * tragen keinen Regler und keinen Reiter, für sie kostet das Nachladen also
 * nichts an Bedienbarkeit.
 *
 * `ssr: true` (Vorgabe) bleibt für alle sieben: Jeder Abschnitt wird
 * weiterhin vollständig serverseitig gerendert, derselbe Text steht ohne
 * JavaScript weiterhin da. Es ändert sich nur, wann der zugehörige Code
 * geladen und ausgeführt wird — als eigene, später hydrierte Auslieferung
 * statt im ersten, alles blockierenden Bündel.
 */
const About = dynamic(() =>
  import("@/components/sections/About").then((m) => m.About),
);
const AiWorkflow = dynamic(() =>
  import("@/components/sections/AiWorkflow").then((m) => m.AiWorkflow),
);
const DeliverySpeed = dynamic(() =>
  import("@/components/sections/AiWorkflow").then((m) => m.DeliverySpeed),
);
const Skills = dynamic(() =>
  import("@/components/sections/Skills").then((m) => m.Skills),
);
const Writing = dynamic(() =>
  import("@/components/sections/Writing").then((m) => m.Writing),
);
const RecruiterHub = dynamic(() =>
  import("@/components/sections/RecruiterHub").then((m) => m.RecruiterHub),
);
const Contact = dynamic(() =>
  import("@/components/sections/Contact").then((m) => m.Contact),
);

export type SiteInhalt = ComponentType<{ children: ReactNode }>;

export function SitePageRest({
  content,
  Inhalt,
}: {
  content: Content;
  Inhalt: SiteInhalt;
}) {
  return (
    <Inhalt>
      {/* Über mich direkt nach dem Kopf, vor den Produkten und Fallstudien.

          Nutzer-Feedback: Die Seite ist zuerst Bewerbung für die Person,
          erst danach Marketing für die Projekte, wie ein Lebenslauf. Vorher
          stand dieser Abschnitt hinter allen Produkten und Fallstudien,
          also am Ende der Seite, wo ihn kaum jemand erreicht. Dieselbe
          Reihenfolge tragen die Portfolios, an denen sich Entwickler-Seiten
          in der Branche orientieren: kurzer Vorspann, dann die Person, erst
          danach die ausgewählte Arbeit im Detail. */}
      <About />
      <BookPublication />
      <Produkte produkte={content.produkte} />
      <CaseStudies />
      <AiWorkflow />
      <DeliverySpeed />
      <Skills />
      <Writing />
      <RecruiterHub />
      <Contact />
    </Inhalt>
  );
}
