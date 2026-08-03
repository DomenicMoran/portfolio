import type { Article } from "./types";

/**
 * Belege stammen aus dem MenuCloud-Repo. Kein Kundendatensatz, kein
 * Mandantenname und keine Zugangsdaten stehen hier; die gezeigten Ausschnitte
 * sind Struktur, nicht Inhalt.
 */
export const kassensichvDe: Article = {
  slug: "kassensichv-in-der-praxis",
  title: "KassenSichV in der Praxis: was die Dokumentation auslässt",
  dek: "Jede Kasse in Deutschland muss ihre Umsätze technisch signieren. Die Anbieter-Dokumentation erklärt den API-Aufruf. Die drei Dinge, die einen wirklich treffen, stehen dort nicht.",
  date: "2026-07-29",
  minutes: 5,
  tags: ["KassenSichV", "§ 146a AO", "Postgres", "Multi-Tenant"],
  evidence: [
    "src/lib/tse-chain.ts und supabase/migrations/20260413_tse_chain_atomic_append.sql (Sperre, Hash-Kette)",
    "src/lib/food-order-tse.ts (Signatur, Token-Zwischenspeicher)",
    "src/app/api/food-orders/route.ts, Zeile 473 ff. (fail-closed, HTTP 503)",
    "src/lib/fiskaly-provision.ts (Provisionierung je Mandant)",
  ],
  blocks: [
    {
      kind: "p",
      text: "Wer in Deutschland ein Kassensystem baut, kommt an § 146a AO und der Kassensicherungsverordnung nicht vorbei. Jeder Geschäftsvorfall muss von einer zertifizierten technischen Sicherheitseinrichtung signiert werden, die Signaturen müssen lückenlos und unveränderbar aufbewahrt werden, und bei einer Kassennachschau muss das alles exportierbar sein.",
    },
    {
      kind: "p",
      text: "Ich habe das für MenuCloud gebaut, eine mandantenfähige Plattform für Gastronomie. Der Anbieter, dessen Cloud-TSE ich nutze, hat eine ordentliche Dokumentation. Sie erklärt, wie man eine Transaktion signiert. Sie erklärt nicht die drei Dinge, an denen man tatsächlich hängenbleibt.",
    },
    {
      kind: "h2",
      text: "Erstens: Die Signatureinheit gehört dem Mandanten, nicht der Plattform",
    },
    {
      kind: "p",
      text: "Der naheliegende Bau ist eine TSE für die Plattform, durch die alle Mandanten laufen. Das ist bequem und rechtlich falsch. Die Aufzeichnungspflicht trifft den einzelnen Steuerpflichtigen. Bei einer Prüfung wird nach den Aufzeichnungen dieses einen Betriebs gefragt, nicht nach denen einer Plattform, in der er einer von vielen ist.",
    },
    {
      kind: "p",
      text: "Also bekommt jeder Mandant eine eigene, ihm zurechenbare Signatureinheit. Entweder bringt er eine mit, oder sie wird bei der Einrichtung unter dem Händlerkonto der Plattform für ihn angelegt. In beiden Fällen liegen `tss_id` und `client_id` am Mandanten und nicht in der Umgebung.",
    },
    {
      kind: "code",
      lang: "ts",
      caption:
        "food-order-tse.ts: Die Zuordnung je Mandant, mit Rückfall auf die Umgebung für Einzelbetriebs-Installationen.",
      code: `export interface TseOverride {
  tss_id?: string | null;
  client_id?: string | null;
  env?: 'test' | 'live' | null;
}`,
    },
    {
      kind: "p",
      text: "Das hat eine Folge, die man vorher bedenken sollte: Auch der Rückbau muss existieren. Kündigt ein Mandant, muss seine Signatureinheit sauber stillgelegt werden, und seine bisherigen Signaturen müssen trotzdem aufbewahrt bleiben. Zehn Jahre lang.",
    },
    {
      kind: "h2",
      text: "Zweitens: Zwei Bestellungen gleichzeitig zerreißen die Kette",
    },
    {
      kind: "p",
      text: "Die Signaturen hängen in einer Hash-Kette. Jede Zeile trägt den Hash ihrer Vorgängerin. Das ist der Teil, der eine nachträgliche Änderung sichtbar macht, und damit der eigentliche Kern des Beweiswerts.",
    },
    {
      kind: "p",
      text: "Meine erste Fassung berechnete das in der Anwendung: letzte Zeile lesen, Hash bilden, neue Zeile schreiben. Das funktioniert, solange nur eine Bestellung zur Zeit abgeschlossen wird. Im Abendgeschäft ist das nicht der Fall. Zwei gleichzeitige Abschlüsse lesen dieselbe Vorgängerzeile, berechnen denselben Vorgänger-Hash und schreiben beide. Die Kette gabelt sich.",
    },
    {
      kind: "note",
      title: "Eine gegabelte Kette ist schlimmer als gar keine",
      text: "Sie sieht auf den ersten Blick vollständig aus. Auffallen würde sie erst bei einer Prüfung, also genau dann, wenn eine Erklärung teuer wird. Der Fehler ist zeitabhängig und in einer Testsuite ohne Nebenläufigkeit unsichtbar.",
    },
    {
      kind: "p",
      text: "Die Lösung liegt nicht in der Anwendung, sondern in der Datenbank. Lesen, Rechnen und Schreiben passieren in einer Funktion, die vorher eine Sperre je Betrieb nimmt. Betriebe blockieren sich dadurch nicht gegenseitig, aber innerhalb eines Betriebs wächst die Kette streng linear.",
    },
    {
      kind: "code",
      lang: "sql",
      caption: "Der entscheidende Teil der Migration.",
      code: `-- Sperre je Restaurant, wird am Transaktionsende freigegeben.
PERFORM pg_advisory_xact_lock(
  hashtext('tse-chain:' || p_restaurant_id::text)
);

SELECT row_hash INTO v_prev_row_hash
FROM tse_transactions
WHERE restaurant_id = p_restaurant_id
ORDER BY created_at DESC
LIMIT 1;`,
    },
    {
      kind: "p",
      text: "`pg_advisory_xact_lock` nimmt eine Zahl, keine Zeichenkette, deshalb der Umweg über `hashtext`. Die Sperre endet mit der Transaktion, ganz gleich ob sie erfolgreich war. Es gibt keinen Pfad, auf dem sie hängenbleibt.",
    },
    {
      kind: "h2",
      text: "Drittens: Was passiert, wenn die Signatur ausfällt",
    },
    {
      kind: "p",
      text: "Das ist die Frage, die über die Qualität eines solchen Systems entscheidet, und die in keiner Anbieter-Dokumentation beantwortet wird. Die TSE ist ein fremder Dienst. Fremde Dienste fallen aus.",
    },
    {
      kind: "p",
      text: "Es gibt zwei Möglichkeiten. Die Bestellung wird trotzdem gebucht, dann entsteht stiller, unsignierter Umsatz. Oder die Bestellung wird nicht gebucht, dann sieht der Gast einen Fehler. Die erste Möglichkeit ist bequemer und für den Gastronomen die schlechtere: Bei einer Prüfung ist es sein Problem, nicht meins.",
    },
    {
      kind: "code",
      lang: "ts",
      caption: "food-orders/route.ts: Kein Abschluss ohne Signatur.",
      code: `if (needsTseRetry) {
  // Für den Nachsignatur-Lauf vormerken. NICHT als bezahlt markieren.
  await supabase.from('food_orders').update({
    needs_tse_signature: true,
    tse_last_error: tseFailureReason,
  }).eq('id', id).eq('restaurant_id', restaurant_id);

  return NextResponse.json(
    { error: 'tse_signature_required', reason: tseFailureReason },
    { status: 503 },
  );
}`,
    },
    {
      kind: "p",
      text: "503 statt 500, weil der Zustand vorübergehend ist. Die Bestellung ist nicht verloren, sie trägt eine Markierung, und ein Cron-Lauf holt die Signatur nach, sobald der Dienst wieder antwortet. Der Fehlergrund wird an der Bestellung gespeichert, damit hinterher nachvollziehbar ist, was los war.",
    },
    {
      kind: "h3",
      text: "Die Ausnahme, die man ehrlich benennen muss",
    },
    {
      kind: "p",
      text: "Fail-closed gilt, wenn für den Mandanten eine TSE eingerichtet ist. Ist gar keine hinterlegt, läuft die Bestellung durch und kann später nachsigniert werden. Das ist Absicht, damit ein Betrieb während der Einrichtung nicht stillsteht, und es ist die Stelle, an der ich mich beim nächsten Ausbau selbst prüfen würde: Der Übergang von „noch nicht eingerichtet“ zu „eingerichtet“ muss eindeutig sein, sonst wird aus einer Einrichtungshilfe eine dauerhafte Lücke.",
    },
    {
      kind: "h2",
      text: "Eine Kleinigkeit, die im Abendgeschäft groß wurde",
    },
    {
      kind: "p",
      text: "Jeder Signaturvorgang braucht ein Zugangstoken. In der ersten Fassung holte jeder Bestellabschluss ein frisches, rund 300 Millisekunden vor der eigentlichen Signatur. Bei einer Bestellung pro Minute fällt das nicht auf. Bei dreißig Bestellungen in fünf Minuten wird daraus eine Last auf dem Anmelde-Endpunkt des Anbieters, die niemand braucht.",
    },
    {
      kind: "p",
      text: "Der Anbieter gibt Token mit 60 Minuten Gültigkeit aus. Sie werden jetzt 50 Minuten lang wiederverwendet, mit 30 Sekunden Sicherheitsabstand vor dem Ablauf. Das ist eine der Änderungen, die man nicht plant, sondern misst.",
    },
    {
      kind: "h2",
      text: "Was ich einem Team raten würde, das damit anfängt",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        "Die Signatureinheit gehört dem Steuerpflichtigen. Wer das später umbaut, muss die Historie mit umziehen.",
        "Alles, was eine Kette fortschreibt, gehört in eine Datenbanktransaktion mit Sperre. Nicht in die Anwendung.",
        "Den Ausfallpfad zuerst entscheiden, nicht zuletzt. Er bestimmt, wem am Ende das Risiko gehört.",
        "Den Aufbewahrungszeitraum von Anfang an mitdenken. Zehn Jahre überleben mehrere Umbauten des Systems.",
      ],
    },
    {
      kind: "p",
      text: "Nichts davon ist besonders schwierig. Es steht nur in keiner Dokumentation, weil es Fragen des Entwurfs sind und nicht der Schnittstelle. Genau deshalb ist es der Teil, der am längsten dauert.",
    },
  ],
};
