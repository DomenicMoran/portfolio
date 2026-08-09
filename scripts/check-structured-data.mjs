#!/usr/bin/env node
/**
 * Prüft die strukturierten Daten gegen die Seite, auf der sie stehen.
 *
 * Sie sind die einzige Stelle, an der die Kernangaben ein zweites Mal stehen:
 * Rolle, Adresse, Profile, die vier Systeme, das Porträt. Und sie sind die
 * einzige Stelle, die niemand sieht, nicht beim Ansehen der Seite, nicht im
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
import { gebauteSeiten } from "./lib/built-pages.mjs";
import { starteServer } from "./lib/local-server.mjs";

/** Beide Sprachfassungen und je eine Artikelseite. */
/* Beide Startseiten und jeder Artikel.

   Hier standen vier Adressen: die zwei Startseiten und ein Artikelpaar. Von
   den zehn Artikelseiten war damit eine geprüft, und vom Artikel-Datensatz
   nur `inLanguage`. Genau dort steht aber, was eine Suchmaschine als
   Überschrift, Datum und Verfasser anzeigt. Angaben, die niemand beim
   Ansehen der Seite bemerkt, wenn sie auseinanderlaufen.

   Die Liste kommt aus den gebauten Seiten, damit ein neuer Artikel nicht
   nachgetragen werden muss. */
const SEITEN = [
  "/",
  "/en",
  ...gebauteSeiten().filter((p) => /^\/(artikel|en\/articles)\/[^/]+$/.test(p)),
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
      artikel: artikel
        ? {
            inLanguage: artikel.inLanguage,
            headline: artikel.headline,
            datePublished: artikel.datePublished,
            autor: artikel.author?.name,
            /* Die sichtbare Überschrift und das sichtbare Datum daneben,
               damit der Vergleich die Seite meint und nicht eine zweite
               Datenquelle. */
            h1: document.querySelector("h1")?.textContent.trim(),
            datum: document.querySelector("time")?.getAttribute("datetime"),
          }
        : null,
      /* Die Seite über sich selbst, nicht über ihren Gegenstand.

         `ProfilePage` trug lange weder Name noch Adresse noch Sprache: Auf
         beiden Startseiten stand derselbe Block, und welche Fassung in
         welcher Sprache antwortet, ging daraus nicht hervor. Der `Blog` der
         Artikelübersicht macht es seit jeher richtig. */
      profil: (() => {
        const p = daten.find((b) => b["@type"] === "ProfilePage");
        return p
          ? { name: p.name, url: p.url, inLanguage: p.inLanguage }
          : null;
      })(),
      fallstudien,
      verweise: [...verweise],
    };
  });

  bloecke += stand.anzahl;
  for (const meldung of stand.kaputt) {
    funde.push(`${pfad}: ein Block ist kein gültiges JSON, ${meldung}`);
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
          `${pfad}: subjectOf und die Fallstudien decken sich nicht, ` +
            `${fehlend.length ? `ohne Eintrag: ${fehlend.join(", ")}` : ""}` +
            `${fehlend.length && zuviel.length ? "; " : ""}` +
            `${zuviel.length ? `ohne Fallstudie: ${zuviel.join(", ")}` : ""}`,
        );
      }
    }
  }

  if (stand.profil) {
    angaben++;
    if (!stand.profil.name || !stand.profil.url || !stand.profil.inLanguage) {
      funde.push(
        `${pfad}: ProfilePage nennt sich nicht selbst, ` +
          `name ${stand.profil.name ? "ok" : "fehlt"}, ` +
          `url ${stand.profil.url ? "ok" : "fehlt"}, ` +
          `inLanguage ${stand.profil.inLanguage ? "ok" : "fehlt"}`,
      );
    } else if (stand.profil.inLanguage !== stand.htmlLang) {
      funde.push(
        `${pfad}: ProfilePage sagt „${stand.profil.inLanguage}", das Dokument ist „${stand.htmlLang}“`,
      );
    } else if (!stand.profil.url.endsWith(pfad === "/" ? ".de" : pfad)) {
      funde.push(
        `${pfad}: ProfilePage zeigt auf ${stand.profil.url}, nicht auf diese Seite`,
      );
    }
  }

  if (stand.artikel) {
    const a = stand.artikel;

    angaben++;
    if (a.headline !== a.h1) {
      funde.push(
        `${pfad}: headline ist „${a.headline}", die Überschrift der Seite ` +
          `„${a.h1}"`,
      );
    }

    angaben++;
    if ((a.datePublished ?? "").slice(0, 10) !== (a.datum ?? "").slice(0, 10)) {
      funde.push(
        `${pfad}: datePublished ist ${a.datePublished}, die Seite zeigt ${a.datum}`,
      );
    }

    angaben++;
    if (!a.autor) {
      funde.push(`${pfad}: Der Artikel nennt keinen Verfasser`);
    }

    angaben++;
    if (a.inLanguage !== stand.htmlLang) {
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
    `\nDiese Daten sieht niemand beim Ansehen der Seite, eine Suchmaschine ` +
      `\nschon. Wer sie stehen lässt, erzählt dort etwas anderes als hier.`,
  );
  process.exit(1);
}

console.log(
  `Die strukturierten Daten decken sich mit der Seite: ${bloecke} Blöcke auf ` +
    `${SEITEN.length} Seiten, ${angaben} Angaben gegengeprüft.`,
);
