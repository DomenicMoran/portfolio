import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";

/**
 * Startet den gebauten Stand auf einem freien Port und gibt ihn wieder frei.
 *
 * Drei Skripte brauchten das bisher und brachten es dreimal mit: der
 * One-Pager-Druck, die Druckprüfung und die Überschriftenprüfung. Dreimal
 * dieselbe Portsuche, dreimal dieselbe Warteschleife, dreimal derselbe
 * Aufräumhaken — und beim vierten Mal hätte jemand eine der drei Fassungen
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
  const port = await freierPort();
  const basis = `http://127.0.0.1:${port}`;

  const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    stdio: "ignore",
  });

  const beenden = () => {
    if (!server.killed) server.kill();
  };
  process.on("exit", beenden);
  process.on("SIGINT", () => {
    beenden();
    process.exit(130);
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

/** Wartet, bis die Adresse antwortet — oder gibt nach `versuche` auf. */
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
