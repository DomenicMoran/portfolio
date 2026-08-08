#!/usr/bin/env node
/**
 * Prüft, dass das ausgelieferte Kurzprofil zum aktuellen Inhalt passt.
 *
 * Jede andere Datei dieser Seite entsteht beim Bau. Die beiden PDFs nicht:
 * Sie werden gedruckt, und Drucken braucht einen Browser, den es auf Vercel
 * nicht gibt. `npm run onepager:pdf` läuft deshalb von Hand — und ein Schritt,
 * der von Hand läuft, wird irgendwann vergessen.
 *
 * Das Blatt ist ausgerechnet die Datei, die weitergereicht wird. Ein
 * Recruiter, der das PDF an die fachliche Führung schickt, verschickt dann
 * einen Stand, den es auf der Seite nicht mehr gibt.
 *
 * Verglichen wird die Prüfsumme über die Quellen: Der Druck schreibt sie als
 * `/Quellstand` in die Dokumenteigenschaften, dieser Lauf rechnet sie neu.
 * Gelesen wird mit `pdf-lib` und nicht mit einer Textsuche — die Eigenschaften
 * landen beim Speichern in einem Objektstrom, im Rohtext steht dort nichts.
 *
 *   npm run check:onepager
 */

import { existsSync, readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join } from "node:path";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { QUELLEN, quellstand } from "./lib/onepager-source-state.mjs";

/** Welches gebaute Blatt zu welcher PDF gehört. */
const SEITEN = {
  "public/domenic-moran-kurzprofil.pdf": join(".next", "server", "app", "onepager.html"),
  "public/domenic-moran-one-pager.pdf": join(".next", "server", "app", "en", "onepager.html"),
};

const BLAETTER = [
  "public/domenic-moran-kurzprofil.pdf",
  "public/domenic-moran-one-pager.pdf",
];

const erwartet = quellstand();
/**
 * Wie viele Pixel Kantenlänge ein Bild auf dem Blatt mindestens hat.
 *
 * Das Porträt steht auf 22,7 mm. 256 px sind darauf 287 dpi und damit im
 * Bereich, in dem ein Druck nicht mehr weich wirkt; 128 px waren 143.
 */
const DRUCKKANTE = 256;

const funde = [];
let geprueft = 0;

for (const pfad of BLAETTER) {
  if (!existsSync(pfad)) {
    funde.push(`${pfad} fehlt`);
    continue;
  }

  const doc = await PDFDocument.load(readFileSync(pfad));
  const eintrag = doc.getInfoDict().get(PDFName.of("Quellstand"));
  const gefunden = eintrag instanceof PDFString ? eintrag.asString() : null;

  if (!gefunden) {
    funde.push(
      `${pfad} nennt keinen Quellstand — vor dem nächsten Vergleich einmal neu drucken`,
    );
    continue;
  }
  if (gefunden !== erwartet) {
    funde.push(
      `${pfad} stammt aus Quellstand ${gefunden}, aktuell ist ${erwartet}`,
    );
    continue;
  }

  /* Ein Kurzprofil ist eine Seite.
     ------------------------------
     Das steht als Regel in AGENTS.md und war der einzige Handgriff daran, den
     niemand nachgezählt hat: „nach Inhaltsänderungen die Druckansicht
     gegenprüfen". Wer eine Zeile ergänzt und neu druckt, bekommt ein zweites
     Blatt — und sieht es nur, wenn er die Datei öffnet.
     Die zweite Seite trüge dann drei Zeilen Rest, und genau so kommt sie beim
     Empfänger an. */
  const seiten = doc.getPageCount();
  if (seiten !== 1) {
    funde.push(
      `${pfad} hat ${seiten} Seiten. Ein Kurzprofil ist eine Seite: ` +
        `Inhalt kürzen, dann neu drucken.`,
    );
    continue;
  }

  /* Das Porträt trägt Druckauflösung.
     ---------------------------------
     Dieses Blatt wird gedruckt, und auf Papier zählt die Dichte und nicht die
     Bildschirmgröße. Gemessen am ausgelieferten PDF stand dort ein Bild mit
     128 × 128 Pixeln auf 22,7 mm Kantenlänge: 143 dpi, gut die Hälfte dessen,
     was ein Druck braucht. Auf dem Bildschirm sieht man das nicht, auf Papier
     sofort — und ausgerechnet an dem Blatt, das eine Bewerbung begleitet.

     Die Ursache lag in `sizes="110px"` an der Bildkomponente: Bei einfacher
     Pixeldichte, und mit der druckt Chromium immer, nimmt der Browser daraus
     die 128er-Fassung. Die Vorlage hat 1024 px, die Auflösung war da und
     wurde nur nicht abgerufen.

     Geprüft wird die Kantenlänge in Pixeln, nicht die dpi: Wie groß das Bild
     auf dem Blatt steht, weiß dieses Skript nicht, und die Kante ist die
     Größe, die sich beim nächsten Eingriff still ändert. 256 px sind auf
     22,7 mm 287 dpi. */
  {
    /* Die Bilder liegen in komprimierten Objektströmen.

       Zwei Anläufe gingen daneben, beide still: `seite.node.Resources()` fand
       nichts, und `doc.context.enumerateIndirectObjects()` sieht nur, was
       außerhalb der Ströme steht — gemessen `/Type3` und `/Link`, kein
       einziges Bild. Beide Male blieb der Lauf grün, weil er nichts zu
       melden hatte. Aufgefallen ist es erst, als die Schwelle testweise auf
       512 stand und der Lauf trotzdem durchging.

       Deshalb hier die Ströme selbst: entpacken, was sich entpacken lässt,
       und darin nach `/Subtype /Image` samt `/Width` suchen. */
    const bilder = [];
    {
      const roh = readFileSync(pfad);
      const teile = [roh];
      for (const treffer of roh.toString("latin1").matchAll(new RegExp("stream\r?\n", "g"))) {
        const von = treffer.index + treffer[0].length;
        const bis = roh.indexOf("endstream", von, "latin1");
        if (bis < 0) continue;
        try {
          teile.push(inflateSync(roh.subarray(von, bis)));
        } catch {
          // Kein zlib-Strom: Bilddaten, Schriftschnitte, alles Übrige.
        }
      }
      const alles = Buffer.concat(teile).toString("latin1");
      for (const treffer of alles.matchAll(
        /\/Subtype\s*\/Image[\s\S]{0,400}?\/Width\s+(\d+)/g,
      )) {
        bilder.push(Number(treffer[1]));
      }
    }

    const zuKlein = bilder.filter((b) => b > 0 && b < DRUCKKANTE);
    if (zuKlein.length) {
      funde.push(
        `${pfad}: ${zuKlein.length} Bild(er) mit nur ${zuKlein.join(", ")} px ` +
          `Kantenlänge. Auf dem Blatt sind das rund ${Math.round(zuKlein[0] / (22.7 / 25.4))} dpi; ` +
          `gedruckt sieht man das. Mindestens ${DRUCKKANTE} px über sizes anfordern.`,
      );
      continue;
    }
  }

  /* Das Blatt trägt eine Struktur, nicht nur Zeichen.
     -------------------------------------------------
     Ohne `tagged: true` druckt Chromium eine Fläche aus Textfragmenten:
     Überschrift, Absatz und Listeneintrag sind darin nicht unterscheidbar,
     und ein Screenreader liest sie in der Reihenfolge des Zeichenstroms vor
     statt in der des Dokuments. Der Katalog beider Dateien trug `/Lang`, aber
     kein `/MarkInfo` — die Sprache stand also fest, die Gliederung nicht.

     Die Option steht auf `false`, wenn niemand sie setzt. Sie fällt damit
     genau so weg, wie sie entstanden ist: unbemerkt beim nächsten Umbau des
     Druckskripts. Deshalb steht sie hier und nicht nur dort. */
  /* Die Verweise im Blatt zeigen dorthin, wo sie hingehören.
     -------------------------------------------------------
     Das Bau-Skript zählt sie und meldet „5 Verweis(e)". Eine Zahl sagt aber
     nichts darüber, wohin sie führen, und dieses Dokument ist die einzige
     Datei dieser Seite, die den Empfänger ohne Browser erreicht: Ist sie
     einmal verschickt, lässt sich ein falsches Ziel nicht mehr korrigieren.

     Zwei Fehler sind hier möglich, ohne dass jemand etwas Falsches tut. Das
     englische Blatt kann auf die deutsche Startseite zeigen — dieselbe
     Verwechslung, die es bei der Verknüpfung der beiden PDF schon einmal gab
     und die im Bau-Skript oben dokumentiert ist. Und die Mailadresse steht
     im Blatt als Verweisziel und nicht nur als Text, kann also von der
     Adresse der Seite abweichen, ohne dass es jemand sieht.

     Die Erreichbarkeit der fremden Ziele bleibt draußen: Die prüft
     `check-figures` gegen alle Adressen der Seite, und LinkedIn antwortet
     einem Prüflauf ohnehin mit 999 statt mit 200. */
  {
    const seiteEins = doc.getPage(0).node;
    const annots = seiteEins.get(PDFName.of("Annots"));
    const liste = annots ? doc.context.lookup(annots) : null;
    const ziele = [];
    if (liste?.asArray) {
      for (const eintrag of liste.asArray()) {
        const anmerkung = doc.context.lookup(eintrag);
        const aktion = anmerkung?.get && doc.context.lookup(anmerkung.get(PDFName.of("A")));
        const uri = aktion?.get && aktion.get(PDFName.of("URI"));
        if (uri) ziele.push(String(uri).replace(/^\(|\)$/g, ""));
      }
    }

    const englisch = pfad.includes("one-pager");
    /* Nur echte Seitenadressen: Die Mailadresse trägt „domenicmoran.de" im
       Betreff, und ein Filter über die Zeichenkette nimmt sie mit. */
    const eigene = ziele.filter(
      (z) => /^https?:\/\//.test(z) && z.includes("domenicmoran.de"),
    );
    if (eigene.length === 0) {
      funde.push(`${pfad}: kein Verweis auf die eigene Seite.`);
    } else {
      /* Das deutsche Blatt zeigt auf die Startseite, das englische auf /en.
         Geprüft wird der Pfad, nicht die Zeichenkette: „…de/en“ enthält
         „…de/“ als Teil. */
      const falsch = eigene.filter((z) => {
        const pfadTeil = new URL(z).pathname.replace(/\/$/, "");
        return englisch ? pfadTeil !== "/en" : pfadTeil !== "";
      });
      if (falsch.length) {
        funde.push(
          `${pfad}: verweist auf ${falsch.join(", ")}, erwartet wird die ` +
            `${englisch ? "englische" : "deutsche"} Fassung. Wer das Blatt ` +
            `weiterreicht, schickt den Empfänger in die falsche Sprache.`,
        );
      }
    }

    const post = ziele.find((z) => z.startsWith("mailto:"));
    if (!post) {
      funde.push(`${pfad}: keine Mailadresse als Verweis.`);
    } else if (!post.includes("domenicmoran@gmail.com")) {
      funde.push(
        `${pfad}: der Mailverweis geht an ${post.slice(0, 60)}, nicht an die ` +
          `Adresse der Seite.`,
      );
    }
  }

  const markInfo = doc.catalog.get(PDFName.of("MarkInfo"));
  const struktur = doc.catalog.get(PDFName.of("StructTreeRoot"));
  if (!markInfo || !struktur) {
    funde.push(
      `${pfad} ist nicht getaggt (MarkInfo ${markInfo ? "da" : "fehlt"}, ` +
        `StructTreeRoot ${struktur ? "da" : "fehlt"}). Ein Screenreader muss ` +
        `die Lesereihenfolge dann raten. In build-onepager-pdf.mjs gehört ` +
        `\`tagged: true\` in die pdf()-Optionen, danach neu drucken.`,
    );
    continue;
  }

  geprueft++;
}

/* ---------------------------------------------------------------------------
   Der Text im Blatt ist maschinenlesbar

   Ein Kurzprofil wird nicht nur gelesen, es wird eingelesen: Wer sich bewirbt,
   lädt die Datei in ein Bewerbermanagementsystem, und das zieht den Text
   heraus, bevor ein Mensch sie sieht. Kommt dabei nichts an, ist die Bewerbung
   leer, ohne dass es jemand merkt.

   Chromium bettet die Schriften dieses Blattes als Type3 ein, also als
   Vektorzeichnungen statt als Schriftdatei — bei variablen Schriften der
   Normalfall. Lesbar bleibt der Text trotzdem, aber nur über die
   ToUnicode-Tabellen. Genau die benutzt dieser Lauf: Was er herausbekommt,
   bekommt ein Extraktor auch.

   Geprüft wird nicht die Zeichenzahl allein, sondern ob die Angaben ankommen,
   auf die es bei einer Bewerbung ankommt. Eine Datei mit 3.000 Zeichen
   Kauderwelsch sähe in einer reinen Mengenprüfung gesund aus. */
const KERNANGABEN = [
  "Domenic Moran",
  "AI Product Engineer",
  "Berlin",
  "gmail.com",
  "Salati",
  "MenuCloud",
];

/**
 * Welche Zeichen auf einem Blatt stehen — aus der gebauten Seite, nicht aus
 * dem PDF.
 *
 * Eine Schrift bettet nur ein, was gebraucht wird: Auf dem englischen Blatt
 * kommt kein „ß“ vor, also fehlt es dort zu Recht. Ein fester Katalog meldet
 * genau solche Zeichen als Lücke, die keine ist. Die Quelle ist deshalb das
 * ausgelieferte HTML desselben Blattes.
 */
function zeichenAufDemBlatt(html) {
  const nurInhalt = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const text = nurInhalt
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return new Set([...text].filter((z) => /[\p{L}\p{N}]/u.test(z)));
}

for (const pfad of BLAETTER) {
  if (!existsSync(pfad)) continue;
  const daten = readFileSync(pfad);
  const text = textAusPdf(daten);
  const fehlend = KERNANGABEN.filter((b) => !text.includes(b));
  if (fehlend.length) {
    funde.push(
      `${pfad}: aus ${text.length} lesbaren Zeichen fehlen ` +
        fehlend.map((f) => `„${f}“`).join(", "),
    );
  }

  /* Und was hier gerade nicht stehen darf.

     Die Privatanschrift steht auf zwei Blättern der Seite, beide mit
     `noindex` — die Pflichtangabe nach § 5 DDG soll erfüllt sein, ohne die
     Wohnanschrift in Suchergebnisse zu tragen. `check:legal` hält das über
     den ganzen Bau. Diese beiden Dateien fallen dort durch: Sie liegen unter
     `public/` und tragen ihren Text in komprimierten Strömen, sind also
     weder HTML noch durchsuchbar.

     Ausgerechnet sie sind der Weg, auf dem etwas herauskommt: Ein Kurzprofil
     wird weitergereicht, angehängt und in ein Bewerbermanagement geladen.
     Gemessen am 08.08.2026 führt keines der beiden die Anschrift. */
  const ANSCHRIFTSTEILE = ["Heidelberger", "12059"];
  const gefunden = ANSCHRIFTSTEILE.filter((teil) => text.includes(teil));
  if (gefunden.length) {
    funde.push(
      `${pfad}: nennt die Privatanschrift (${gefunden.join(", ")}). Sie ` +
        `gehört auf Impressum und Datenschutz, die dafür noindex tragen, ` +
        `und nicht auf ein Blatt, das weitergereicht wird.`,
    );
  }

  /* Jedes Zeichen des Blattes muss eine Zuordnung haben.

     Ohne ToUnicode-Eintrag kann kein Extraktor es lesen, egal wie gut er ist —
     und ein Kurzprofil wird eingelesen, bevor ein Mensch es sieht. Geprüft
     wird gegen das ausgelieferte HTML desselben Blattes, also gegen eine
     Quelle außerhalb des PDF. */
  const blatt = SEITEN[pfad];
  if (blatt && existsSync(blatt)) {
    const abgebildet = abgebildeteZeichen(daten);
    const ohne = [...zeichenAufDemBlatt(readFileSync(blatt, "utf8"))].filter(
      (z) => !abgebildet.has(z),
    );
    if (ohne.length) {
      funde.push(
        `${pfad}: ${ohne.length} Zeichen ohne Zuordnung — ` +
          `${ohne.map((z) => `„${z}“`).join(", ")}. Ohne ToUnicode-Eintrag ` +
          `kann kein Extraktor sie lesen.`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   Der Verweis auf der Seite führt zu genau diesem Blatt

   Geprüft war bisher die Datei im Repository — ihr Quellstand, ihre
   Seitenzahl, ihr lesbarer Text. Nicht geprüft war der Weg dorthin: Auf der
   Seite steht ein Verweis mit `download`, und wenn jemand die Datei umbenennt
   und den Verweis vergisst, bekommt ein Recruiter einen 404 an genau der
   Stelle, an der er das Blatt haben will. Umgekehrt genauso — ein Verweis auf
   eine Datei, die es nicht mehr gibt, sieht im Quelltext richtig aus.

   Gelesen wird das gebaute HTML, nicht die Komponente: Was ausgeliefert wird,
   entscheidet. */
const VERWEISE = {
  [join(".next", "server", "app", "onepager.html")]: "public/domenic-moran-kurzprofil.pdf",
  [join(".next", "server", "app", "en", "onepager.html")]: "public/domenic-moran-one-pager.pdf",
};

for (const [blatt, datei] of Object.entries(VERWEISE)) {
  if (!existsSync(blatt)) continue;
  const html = readFileSync(blatt, "utf8");
  const treffer = [...html.matchAll(/<a[^>]*href="([^"]+\.pdf)"[^>]*download/g)].map(
    (t) => t[1],
  );

  if (treffer.length === 0) {
    funde.push(`${blatt}: kein Verweis mit download auf ein PDF`);
    continue;
  }
  for (const adresse of new Set(treffer)) {
    const erwartet = `/${datei.replace(/^public\//, "")}`;
    if (adresse !== erwartet) {
      funde.push(
        `${blatt}: der Verweis zeigt auf ${adresse}, ausgeliefert wird ${erwartet}`,
      );
    } else if (!existsSync(join("public", adresse.replace(/^\//, "")))) {
      funde.push(`${blatt}: ${adresse} steht im Verweis, die Datei fehlt`);
    }
  }
}

/* Die beiden Blätter tragen nicht dieselben Angaben im Dokumentkopf.

   `/Subject` und `/Keywords` liest ein Bewerbermanagement-System aus, wenn die
   Datei dort abgelegt wird — es sind die einzigen Felder, in denen eine
   Sprachfassung stillschweigend die andere abschreiben kann. Genau das war der
   Fall: Beide trugen „AI Product Engineer, Fullstack, TypeScript, …", und
   „Fullstack" ohne Bindestrich steht auf keiner englischen Seite dieser Site.

   Gleiche Werte in beiden Dateien heißen deshalb: Eine der beiden ist nicht
   gepflegt. */
{
  const kopf = BLAETTER.filter((p) => existsSync(p)).map((p) => {
    /* Die Angaben liegen in einem komprimierten Objektstrom, nicht im
       Klartext — ein Suchlauf über die rohe Datei findet sie nicht. Deshalb
       jeden Strom aufblasen und dann suchen. */
    const daten = readFileSync(p);
    const teile = [daten.toString("latin1")];
    let i = 0;
    while (true) {
      const a = daten.indexOf("stream", i);
      if (a < 0) break;
      let anfang = a + 6;
      if (daten[anfang] === 0x0d) anfang++;
      if (daten[anfang] === 0x0a) anfang++;
      const ende = daten.indexOf("endstream", anfang);
      if (ende < 0) break;
      try {
        teile.push(inflateSync(daten.subarray(anfang, ende)).toString("latin1"));
      } catch {
        /* kein Deflate-Strom */
      }
      i = ende + 9;
    }
    const roh = teile.join(String.fromCharCode(10));
    /* Zwei Schreibweisen: Klartext in Klammern oder UTF-16 als Hex in spitzen
       Klammern. pdf-lib nimmt die zweite, sobald ein Zeichen außerhalb von
       Latin-1 vorkommt — und eine Meldung mit „<FEFF0041…“ liest niemand. */
    const MUSTER = {
      Subject: /\/Subject\s*(?:\(([^)]*)\)|<([0-9A-Fa-f]+)>)/,
      Keywords: /\/Keywords\s*(?:\(([^)]*)\)|<([0-9A-Fa-f]+)>)/,
    };
    const feld = (name) => {
      const treffer = MUSTER[name].exec(roh);
      if (!treffer) return "";
      if (treffer[1] !== undefined) return treffer[1];
      const hex = treffer[2].replace(/^FEFF/i, "");
      let raus = "";
      for (let k = 0; k + 3 < hex.length + 1; k += 4) {
        raus += String.fromCharCode(parseInt(hex.slice(k, k + 4), 16));
      }
      return raus;
    };
    return { betreff: feld("Subject"), schlagwoerter: feld("Keywords") };
  });

  if (kopf.length === 2) {
    for (const [feld, name] of [
      ["betreff", "/Subject"],
      ["schlagwoerter", "/Keywords"],
    ]) {
      if (kopf[0][feld] && kopf[0][feld] === kopf[1][feld]) {
        funde.push(
          `Beide Blätter tragen dasselbe ${name}: "${kopf[0][feld].slice(0, 60)}" — ` +
            "eine Sprachfassung schreibt die andere ab.",
        );
      }
    }
  }
}

if (funde.length > 0) {
  console.error(`${funde.length} Befund am ausgelieferten Blatt:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nEine der Quellen hat sich geändert:\n  ${QUELLEN.join("\n  ")}\n\n` +
      `Neu drucken mit:  npm run build && npm run onepager:pdf`,
  );
  process.exit(1);
}

console.log(
  `Beide Blätter stammen aus dem aktuellen Inhalt: ` +
    `${geprueft} PDF geprüft, Quellstand ${erwartet}.`,
);

/**
 * Den sichtbaren Text eines PDF über seine ToUnicode-Tabellen lesen.
 *
 * Kein Fremdpaket dafür: Die Aufgabe ist klein und der Weg gut dokumentiert.
 * Streams entpacken, die Zuordnungen aus `beginbfchar`/`beginbfrange` sammeln,
 * dann die Hex-Strings vor `Tj` abbilden. Chromium schreibt die Zeichen als
 * Hex, nicht in Klammern.
 */
/** Alle entpackten Ströme einer Datei als ein Text. */
function stroeme(daten) {
  const teile = [];
  let stelle = 0;
  while (true) {
    const anfang = daten.indexOf("stream", stelle);
    if (anfang < 0) break;
    /* "endstream" enthält "stream": Ohne diese Prüfung fängt die Suche mitten
       im Schlusswort an und gerät aus dem Tritt. */
    if (daten.subarray(anfang - 3, anfang).toString("latin1") === "end") {
      stelle = anfang + 6;
      continue;
    }
    const ende = daten.indexOf("endstream", anfang);
    if (ende < 0) break;
    let von = anfang + "stream".length;
    if (daten[von] === 0x0d) von++;
    if (daten[von] === 0x0a) von++;
    try {
      teile.push(inflateSync(daten.subarray(von, ende)));
    } catch {
      // Kein Flate-Stream: uebergehen.
    }
    stelle = ende + 1;
  }
  return Buffer.concat(teile).toString("latin1");
}

/**
 * Jedes Zeichen, für das die Datei eine Zuordnung mitbringt.
 *
 * Ohne ToUnicode-Eintrag kann kein Extraktor ein Zeichen lesen, egal wie gut
 * er ist. Diese Menge beantwortet damit die Frage, die für ein
 * Bewerbermanagementsystem zählt — und sie hängt nicht daran, ob die
 * Zusammensetzung unten die Schriften auseinanderhält.
 */
function abgebildeteZeichen(daten) {
  const alle = stroeme(daten);
  const zeichen = new Set();
  for (const abschnitt of alle.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const paar of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      zeichen.add(String.fromCharCode(parseInt(paar[2].slice(0, 4), 16)));
    }
  }
  for (const abschnitt of alle.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const reihe of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      const start = parseInt(reihe[1], 16);
      const schluss = Math.min(parseInt(reihe[2], 16), start + 400);
      const ziel = parseInt(reihe[3].slice(0, 4), 16);
      for (let i = start; i <= schluss; i++) {
        zeichen.add(String.fromCharCode(ziel + i - start));
      }
    }
  }
  return zeichen;
}

function textAusPdf(daten) {
  const alle = stroeme(daten);
  const zuordnung = new Map();

  for (const abschnitt of alle.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const paar of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      zuordnung.set(
        parseInt(paar[1], 16),
        String.fromCharCode(parseInt(paar[2].slice(0, 4), 16)),
      );
    }
  }
  for (const abschnitt of alle.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const reihe of abschnitt[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      const start = parseInt(reihe[1], 16);
      const schluss = Math.min(parseInt(reihe[2], 16), start + 400);
      const ziel = parseInt(reihe[3].slice(0, 4), 16);
      for (let i = start; i <= schluss; i++) {
        zuordnung.set(i, String.fromCharCode(ziel + i - start));
      }
    }
  }

  const heraus = [];
  for (const treffer of alle.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
    const hex = treffer[1];
    for (let i = 0; i + 1 < hex.length; i += 2) {
      heraus.push(zuordnung.get(parseInt(hex.slice(i, i + 2), 16)) ?? "?");
    }
  }
  return heraus.join("");
}
