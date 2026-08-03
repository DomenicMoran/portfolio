#!/usr/bin/env node
/**
 * Erzeugt die ausgelieferten Produktaufnahmen aus den Originalen.
 *
 * Dieselbe Trennung wie beim Porträt: Die Originale liegen in `../assets/shots`
 * und damit außerhalb des öffentlichen Repos, ausgeliefert wird eine kleinere
 * Fassung unter `public/shots`.
 *
 * Der Grund ist gemessen. Die elf Aufnahmen lagen als PNG im Repo und wogen
 * zusammen 5,6 MB — jeder Klon zog sie mit, jede Prüfung, jeder Agent. Als
 * WebP bei Qualität 92 sind es 1,1 MB, also 82 Prozent weniger, ohne dass an
 * einer Oberfläche etwas zu sehen wäre: Es sind Bildschirmfotos, keine Fotos.
 *
 * Für den Besucher ändert sich nichts. `next/image` rechnet die Aufnahmen
 * ohnehin auf die angezeigte Größe herunter und liefert sie in einem modernen
 * Format aus; gemessen kamen auf der Startseite zwölf Bilder mit zusammen
 * 178 kB an. Der Gewinn liegt im Repo, nicht auf der Leitung.
 *
 * Umgewandelt wird mit Python und Pillow, wie beim Porträt auch — dieselbe
 * Werkzeugkette statt einer zweiten für dieselbe Aufgabe.
 *
 *   npm run build:shots
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const ORIGINALE = "../assets/shots";

if (!existsSync(ORIGINALE)) {
  console.error(
    `${ORIGINALE} gibt es nicht. Die Originale liegen bewusst außerhalb des ` +
      `Repos; ohne sie lässt sich hier nichts erzeugen.`,
  );
  process.exit(1);
}

const python = `
from PIL import Image
import glob, os

quelle, ziel = "../assets/shots", "public/shots"
alt = neu = 0

for pfad in sorted(glob.glob(quelle + "/**/*.png", recursive=True)):
    rel = os.path.relpath(pfad, quelle).replace("\\\\", "/")
    aus = os.path.join(ziel, rel[:-4] + ".webp")
    os.makedirs(os.path.dirname(aus), exist_ok=True)
    Image.open(pfad).convert("RGB").save(aus, "WEBP", quality=92, method=6)
    alt += os.path.getsize(pfad); neu += os.path.getsize(aus)
    print(f"  {rel:<28} {os.path.getsize(pfad)//1024:>5} KB -> {os.path.getsize(aus)//1024:>4} KB")

print(f"{alt//1024} KB Originale, {neu//1024} KB ausgeliefert")
`;

execFileSync("python", ["-c", python], { stdio: "inherit" });
