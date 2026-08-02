import type { Transition, Variants } from "framer-motion";

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

export const springSoft: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.6,
};

/** Aufblenden und Aufsteigen. Der Regelauftritt für Fließtext und Karten. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: ease.expo },
  },
};

/** Elternteil, das `riseIn` seiner Kinder zeitlich versetzt. */
export const stagger = (delay = 0, gap = 0.07): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: delay, staggerChildren: gap },
  },
});

/**
 * Maskierter Auftritt für Wörter einer Überschrift. Die Hülle jedes Wortes
 * braucht `overflow: hidden`: Das Kind schiebt sich unter dem eigenen
 * Beschnittrechteck hervor.
 */
export const maskWord: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 1, ease: ease.expo },
  },
};

/** Überall dieselbe Sichtbereichs-Einstellung, damit die Einblendungen im Takt bleiben. */
export const viewportOnce = { once: true, amount: 0.25 } as const;
