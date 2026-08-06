#!/usr/bin/env node
/**
 * Prüft die strukturierten Daten gegen die Seite, auf der sie stehen.
 *
 * Sie sind die einzige Stelle, an der die Kernangaben ein zweites Mal stehen:
 * Rolle, Adresse, Profile, die vier Systeme, das Porträt. Und sie sind die
 * einzige Stelle, die niemand sieht — nicht beim Ansehen der Seite, nicht im
 * Ausdruck, nicht beim Vorlesen. Wer eine Fallstudie umbenennt oder ein Bild
 * verschiebt, merkt hier nichts, und ab diesem Commit erzählt die Seite einer
 * Suchmaschine etwas anderes als ihrem Leser.
 *
 * Für den Recruiter-Bereich zählt das doppelt: Ein Treffer bei Google ist für
 * viele der erste Kontakt, und was dort erscheint, kommt aus genau diesen
 * Angaben.
 *
 * Geprüft wird, was auseinanderlaufen kann, nicht das Schema als solches:
 *
 * - Jeder Block parst. Ein ungültiger wird stillschweigend ignoriert.
 * - `jobTitle` und `email` stehen so auch sichtbar auf der Seite.
 * - `image` antwortet. Eine Umbenennung im Porträt-Lauf bricht sonst genau
 *   das Bild, das in einem Suchergebnis erscheint.
 * - Jede Adresse unter `sameAs` steht auch als Verweis im Dokument.
 * - `subjectOf` nennt dieselben Systeme wie die Fallstudien der Seite.
 * - `inLanguage` stimmt mit `<html lang>`.
 *
 * Aufruf nach `npm run build`:
 *
 *   npm run check:schema
 */

import { chromium } from "playwright";
import { starteServer } from "./lib/local-server.mjs";

/** Beide Sprachfassungen und je eine Artikelseite. */
const SEITEN = [
  "/",
  "/en",
  "/artikel/kassensichv-in-der-praxis",
  "/en/articles/german-till-law-in-practice",
];

const vorgegebeneBasis = process.argv[2];
let beenden = () => {};
let basis = vorgegebeneBasis;
if (!basis) ({ basis, beenden } = await starteServer());

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const funde = [];
let bloecke = 0;
let angaben = 0;

for (const pfad of SEITEN) {
  const antwort = await seite.goto(`${basis}${pfad}`, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) {
    funde.push(`${pfad}: HTTP ${antwort?.status()}`);
    continue;
  }

  // Die Fallstudien erscheinen erst beim Hineinscrollen.
  await seite.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await seite.waitForTimeout(500);

  const stand = await seite.evaluate(() => {
    const roh = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (e) => e.textContent,
    );
    const daten = [];
    const kaputt = [];
    for (const text of roh) {
      try {
        const geparst = JSON.parse(text);
        daten.push(...(Array.isArray(geparst) ? geparst : [geparst]));
      } catch (fehler) {
        kaputt.push(fehler.message);
      }
    }

    const person = daten.find((x) => x["@type"] === "ProfilePage")?.mainEntity;
    const artikel = daten.find((x) => x["@type"] === "TechArticle");

    /* Nur die Überschrift der Fallstudie selbst, nicht die der Demo darin:
       Beide sind `h3`, und eine Demo ist kein System. */
    const fallstudien = [...document.querySelectorAll("article[id^='case-']")]
      .map((a) => a.querySelector("h3")?.textContent.trim())
      .filter(Boolean);

    const verweise = new Set(
      [...document.querySelectorAll("a")].map((a) => a.href.replace(/\/$/, "")),
    );

    return {
      anzahl: roh.length,
      kaputt,
      sichtbar: document.body.innerText,
      htmlLang: document.documentElement.lang,
      person: person
        ? {
            jobTitle: person.jobTitle,
            email: person.email,
            image: person.image,
            sameAs: person.sameAs ?? [],
            subjectOf: (person.subjectOf ?? []).map((x) => x.name),
          }
        : null,
      artikel: artikel ? { inLanguage: artikel.inLanguage } : null,
      fallstudien,
      verweise: [...verweise],
    };
  });

  bloecke += stand.anzahl;
  for (const meldung of stand.kaputt) {
    funde.push(`${pfad}: ein Block ist kein gültiges JSON — ${meldung}`);
  }
  if (stand.anzahl === 0) {
    funde.push(`${pfad}: keine strukturierten Daten`);
    continue;
  }

  if (stand.person) {
    angaben += 5;
    const { jobTitle, email, image, sameAs, subjectOf } = stand.person;

    if (jobTitle && !stand.sichtbar.includes(jobTitle)) {
      funde.push(`${pfad}: jobTitle „${jobTitle}“ steht nirgends sichtbar auf der Seite`);
    }
    const adresse = (email ?? "").replace(/^mailto:/, "");
    if (adresse && !stand.sichtbar.includes(adresse)) {
      funde.push(`${pfad}: die Adresse „${adresse}" steht nirgends sichtbar auf der Seite`);
    }

    if (image) {
      const bild = await seite.request.get(image).catch(() => null);
      if (!bild || bild.status() !== 200) {
        funde.push(`${pfad}: image ${image} antwortet mit ${bild?.status() ?? "nichts"}`);
      }
    }

    for (const ziel of sameAs) {
      const gekuerzt = ziel.replace(/\/$/, "");
      if (!stand.verweise.includes(gekuerzt)) {
        funde.push(
          `${pfad}: sameAs nennt ${ziel}, aber die Seite verweist nirgends dorthin`,
        );
      }
    }

    if (stand.fallstudien.length > 0) {
      const fehlend = stand.fallstudien.filter((f) => !subjectOf.includes(f));
      const zuviel = subjectOf.filter((s) => !stand.fallstudien.includes(s));
      if (fehlend.length || zuviel.length) {
        funde.push(
          `${pfad}: subjectOf und die Fallstudien decken sich nicht — ` +
            `${fehlend.length ? `ohne Eintrag: ${fehlend.join(", ")}` : ""}` +
            `${fehlend.length && zuviel.length ? "; " : ""}` +
            `${zuviel.length ? `ohne Fallstudie: ${zuviel.join(", ")}` : ""}`,
        );
      }
    }
  }

  if (stand.artikel) {
    angaben++;
    if (stand.artikel.inLanguage !== stand.htmlLang) {
      funde.push(
        `${pfad}: inLanguage ist „${stand.artikel.inLanguage}", das Dokument ist „${stand.htmlLang}“`,
      );
    }
  }
}

await browser.close();
beenden();

if (funde.length > 0) {
  console.error(`${funde.length} Angabe stimmt nicht mit der Seite:\n`);
  for (const f of funde) console.error(`  ${f}`);
  console.error(
    `\nDiese Daten sieht niemand beim Ansehen der Seite — eine Suchmaschine ` +
      `\nschon. Wer sie stehen lässt, erzählt dort etwas anderes als hier.`,
  );
  process.exit(1);
}

console.log(
  `Die strukturierten Daten decken sich mit der Seite: ${bloecke} Blöcke auf ` +
    `${SEITEN.length} Seiten, ${angaben} Angaben gegengeprüft.`,
);
