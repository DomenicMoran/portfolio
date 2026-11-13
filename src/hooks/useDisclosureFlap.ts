"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Ob der Seitenanker beim Laden auf eines der übergebenen Sprungziele zeigt.
 * Derselbe `useSyncExternalStore`-Griff wie in `useMediaQuery.ts`: Der
 * Serverwert ist "", nur der Browser kennt den Anker.
 */
export function useMatchingHash(ids: readonly string[]) {
  const subscribe = useCallback((melde: () => void) => {
    window.addEventListener("hashchange", melde);
    return () => window.removeEventListener("hashchange", melde);
  }, []);

  const holen = useCallback(() => {
    const ziel = window.location.hash.replace("#", "");
    return ids.includes(ziel) ? ziel : "";
  }, [ids]);

  const serverHolen = useCallback(() => "", []);

  return useSyncExternalStore(subscribe, holen, serverHolen);
}

export function useDisclosureFlap(hashTargets?: readonly string[]) {
  const [manuellOffen, setManuellOffen] = useState(false);
  const passenderAnker = useMatchingHash(hashTargets ?? []);
  const offen = manuellOffen || passenderAnker !== "";

  useEffect(() => {
    if (!passenderAnker) return;
    requestAnimationFrame(() => {
      document.getElementById(passenderAnker)?.scrollIntoView({ block: "start" });
    });
  }, [passenderAnker]);

  const umschalten = useCallback(() => setManuellOffen((v) => !v), []);

  return { offen, umschalten };
}
