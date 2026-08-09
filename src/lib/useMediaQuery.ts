"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Eine Medienabfrage als externer Speicher.
 *
 * `useSyncExternalStore` statt `useState` und `useEffect`: Der Serverwert steht
 * ausdrücklich da (`false`), damit die Auszeichnung vom Server und die, mit der
 * React hydriert, immer übereinstimmen. Die Fassung über einen Effekt setzt den
 * Zustand erst nach dem Einhängen, das verstößt gegen die
 * set-state-in-effect-Regel und zeigt für ein Bild den falschen Zweig.
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

  // Auf dem Server trifft nichts zu: Gerätefähigkeiten kennt nur der Browser.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
