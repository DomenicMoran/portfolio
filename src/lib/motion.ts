/**
 * Gemeinsame Beschleunigungskurven. `expo` ist die Handschrift dieser Seite:
 * schneller Start, langes Ausgleiten. Jeder Übergang nimmt eine dieser drei,
 * damit die Seite wie ein Gegenstand wirkt und nicht wie eine Sammlung einzeln
 * eingestellter Bauteile.
 */
export const ease = {
  expo: [0.16, 1, 0.3, 1],
  quint: [0.83, 0, 0.17, 1],
  soft: [0.25, 0.4, 0.25, 1],
} as const;

/*
   Hier standen einmal vier weitere Werte: `springSoft`, `riseIn`, `stagger`
   und `maskWord`. Keiner davon wurde je benutzt, die Bauteile setzen ihre
   Übergänge selbst und nehmen von hier nur die Kurve. Vier dokumentierte
   Varianten, die nichts tun, sind für den, der die Datei liest, vier Fragen
   ohne Antwort.
*/

/** Überall dieselbe Sichtbereichs-Einstellung, damit die Einblendungen im Takt bleiben. */
export const viewportOnce = { once: true, amount: 0.25 } as const;
