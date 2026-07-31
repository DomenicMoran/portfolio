"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Media query as an external store.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the server
 * snapshot is explicit (`false`), so the markup React renders on the server and
 * the markup it hydrates with always agree. The effect-based version sets state
 * after mount, which both trips the set-state-in-effect rule and produces a
 * one-frame flash of the wrong branch.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // Nothing matches during server rendering: capabilities are client-only.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
