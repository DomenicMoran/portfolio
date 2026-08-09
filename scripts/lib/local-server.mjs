import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";

import { pruefeBaustand } from "./built-pages.mjs";

/**
 * Startet den gebauten Stand auf einem freien Port und gibt ihn wieder frei.
 *
 * Drei Skripte brauchten das bisher und brachten es dreimal mit: der
 * One-Pager-Druck, die Druckprüfung und die Überschriftenprüfung. Dreimal
 * dieselbe Portsuche, dreimal dieselbe Warteschleife, dreimal derselbe
 * Aufräumhaken, und beim vierten Mal hätte jemand eine der drei Fassungen
 * erwischt und die anderen übersehen.
 *
 * Next wird direkt mit Node gestartet, nicht über npx: Mit `shell: true` warnt
 * Node zu Recht, dass Argumente nur verkettet und nicht maskiert werden, und
 * ohne Shell lässt sich `npx.cmd` unter Windows seit Node 20 gar nicht mehr
 * starten.
 *
 * Der Einstiegspunkt wird aufgelöst und nicht zusammengesetzt: In einem
 * git-Arbeitsbaum liegt kein eigenes `node_modules`, Node findet die Pakete
 * über die Elternordner. Ein zusammengesetzter Pfad `node_modules/next/...`
 * zeigt dort ins Leere, und der Server kommt nicht hoch.
 */
export async function starteServer() {
  pruefeBaustand();
  const port = await freierPort();
  const basis = `http://127.0.0.1:${port}`;

  const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    stdio: "ignore",
  });

  /**
   * Den ganzen Baum beenden, nicht nur den Anfang.
   *
   * `server.kill()` trifft unter Windows genau den Prozess, den `spawn`
   * gestartet hat. Next startet darunter eigene Arbeiter, und die bleiben
   * stehen. Gezählt am 07.08.2026, mitten in einer Prüfrunde: 113 Node-
   * Prozesse, davon über fünfzig Serverpaare aus abgebrochenen Läufen. Der
   * Speicher reichte danach nicht mehr für einen weiteren Browser, und
   * `check:a11y` brach mit „Target crashed" ab, ein Fehlerbild, das nach
   * einem Fehler in der Prüfung aussieht und keiner war.
   *
   * `taskkill /T` nimmt die Kinder mit. Auf allen anderen Systemen bleibt es
   * beim regulären Signal.
   */
  const beenden = () => {
    if (server.killed || server.exitCode !== null) return;
    if (process.platform === "win32" && server.pid) {
      try {
        spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } catch {
        server.kill();
      }
      return;
    }
    server.kill();
  };

  /* Auch bei einem Abbruch von außen und bei einem Fehler, den niemand fängt.
     Nur `exit` und `SIGINT` abzudecken hieß: Wer den Lauf über die
     Prozessverwaltung stoppt oder wer über eine Ausnahme herausfliegt, lässt
     den Server stehen. Genau daraus wurden die fünfzig. */
  process.on("exit", beenden);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
    process.on(signal, () => {
      beenden();
      process.exit(130);
    });
  }
  process.on("uncaughtException", (fehler) => {
    beenden();
    console.error(fehler);
    process.exit(1);
  });

  if (!(await warteAufAntwort(`${basis}/`))) {
    beenden();
    throw new Error(`Der eigene Server auf ${basis} kam nicht hoch.`);
  }

  return { basis, beenden };
}

/** Einen Port suchen, den gerade niemand hält. */
async function freierPort() {
  return new Promise((fertig, scheitern) => {
    const horcher = createServer();
    horcher.unref();
    horcher.on("error", scheitern);
    horcher.listen(0, "127.0.0.1", () => {
      const { port } = horcher.address();
      horcher.close(() => fertig(port));
    });
  });
}

/** Wartet, bis die Adresse antwortet, oder gibt nach `versuche` auf. */
async function warteAufAntwort(adresse, versuche = 60) {
  for (let i = 0; i < versuche; i++) {
    try {
      const antwort = await fetch(adresse, { signal: AbortSignal.timeout(1000) });
      if (antwort.ok) return true;
    } catch {
      // Noch nicht oben. Nächster Versuch.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
