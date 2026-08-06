"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Läuft die Seite auf einem Apple-Gerät?
 *
 * Gebraucht für genau eine Sache: die Taste, die neben dem `K` steht. Der
 * Griff dazu ist auf dem Mac die Befehlstaste und überall sonst `Strg`. Der
 * Hinweis in der Kopfleiste zeigte bisher immer das ⌘-Zeichen — auf einem
 * Windows-Rechner ein Symbol, das auf keiner Tastatur liegt. Die Kombination
 * funktionierte dort trotzdem, weil `SiteShell` `metaKey` und `ctrlKey`
 * gleich behandelt; nur wusste es niemand.
 *
 * `useSyncExternalStore` und nicht `useEffect`: Der Serverwert steht
 * ausdrücklich da, und zwar auf `false`. Damit rendert der Server „Strg“ —
 * die Mehrheit der Besucher sieht sofort das Richtige, und nur auf einem Mac
 * tauscht die Hydration das Zeichen. Andersherum flackerte es für alle
 * anderen.
 *
 * Die Abfrage kennt keinen Wechsel: Ein Rechner wird zur Laufzeit kein Mac.
 * `subscribe` meldet sich deshalb nirgends an.
 */
export function useApplePlatform() {
  const subscribe = useCallback(() => () => {}, []);

  const getSnapshot = useCallback(() => {
    // `userAgentData.platform` ist der Nachfolger; `navigator.platform` ist
    // veraltet, aber in Safari und Firefox weiterhin die einzige Quelle.
    const plattform =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ??
      navigator.platform ??
      "";
    return /mac|iphone|ipad|ipod/i.test(plattform);
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
