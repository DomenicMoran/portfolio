"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";

type Props = {
  otherHref?: string;
  hashBase?: string;
  lang?: "de" | "en";
};

/**
 * Kopfleiste und globale Interaktion erst im Leerlauf: Der Lead im Vorspann
 * soll unter Lighthouse-Mobile-Drossel nicht hinter Nav- und Framer-Chunks
 * warten müssen.
 */
export function SiteShellDeferred(props: Props) {
  const [Shell, setShell] = useState<ComponentType<Props> | null>(null);
  const [Wow, setWow] = useState<ComponentType | null>(null);
  const [wowSlot, setWowSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const idle = (work: () => void) => {
      const w = window as typeof window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => void;
      };
      if (typeof w.requestIdleCallback === "function") {
        w.requestIdleCallback(work, { timeout: 12000 });
      } else {
        window.setTimeout(work, 2000);
      }
    };
    const load = () => {
      idle(() => {
        const lang = props.lang;
        void Promise.all([
          import("@/components/SiteShell"),
          import("@/components/hero/HeroWowMount"),
          lang === "de"
            ? import("@/content/ContentProviderDe")
            : lang === "en"
              ? import("@/content/ContentProviderEn")
              : Promise.resolve(null),
        ]).then(([shellMod, wowMod, providerMod]) => {
          const Shell = shellMod.SiteShell;
          const Provider =
            lang === "de" && providerMod && "ContentProviderDe" in providerMod
              ? providerMod.ContentProviderDe
              : lang === "en" &&
                  providerMod &&
                  "ContentProviderEn" in providerMod
                ? providerMod.ContentProviderEn
                : null;
          setShell(() =>
            Provider
              ? (shellProps: Props) => (
                  <Provider>
                    <Shell
                      otherHref={shellProps.otherHref}
                      hashBase={shellProps.hashBase}
                    />
                  </Provider>
                )
              : Shell,
          );
          setWow(() => wowMod.HeroWowMount);
          setWowSlot(document.getElementById("hero-wow-slot"));
        });
      });
    };
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });
  }, [props.lang]);

  return (
    <>
      {Wow && wowSlot ? createPortal(<Wow />, wowSlot) : null}
      {Shell ? <Shell {...props} /> : null}
    </>
  );
}
