/** Leerlauf mit Frist, Safari-Fallback per Timer. */
export function whenIdle(work: () => void, timeout = 4000) {
  const w = window as typeof window & {
    requestIdleCallback?: (
      cb: () => void,
      opts?: { timeout: number },
    ) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(work, { timeout });
  } else {
    window.setTimeout(work, Math.min(timeout, 2000));
  }
}