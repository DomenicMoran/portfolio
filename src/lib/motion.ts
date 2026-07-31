import type { Transition, Variants } from "framer-motion";

/**
 * Shared easing. `expo` is the site's signature: fast start, long glide.
 * Every transition uses one of these three so the whole page feels like one
 * object rather than a collection of independently tuned widgets.
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

/** Fade + rise. The default entrance for prose and cards. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: ease.expo },
  },
};

/** Parent that staggers its children's `riseIn`. */
export const stagger = (delay = 0, gap = 0.07): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: delay, staggerChildren: gap },
  },
});

/**
 * Mask reveal for headline words. The parent needs `overflow: hidden` on each
 * word wrapper: the child slides out from under its own clip rectangle.
 */
export const maskWord: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 1, ease: ease.expo },
  },
};

/** Viewport config used everywhere so reveal timing is consistent. */
export const viewportOnce = { once: true, amount: 0.25 } as const;
