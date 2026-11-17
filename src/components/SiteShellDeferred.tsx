"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { whenIdle } from "@/lib/when-idle";

type Props = {
  otherHref?: string;
  hashBase?: string;
  lang?: "de" | "en";
};

type ShellCmp = ComponentType<{ otherHref?: string; hashBase?: string }>;
type ProviderCmp = ComponentType<{ children: ReactNode }>;

/**
 * Vorspann zuerst, Wow nach dem ersten Paint, Kopfleiste im Leerlauf.
 *
 * Die Motion-Wiederherstellung zog Nav und Framer nach 200 ms in den Weg
 * des Lighthouse-Hauptthreads (TBT 1.050 ms). Die Laufschrift steht im
 * statischen Vorspann, das Signal Field mountet frueh, die Kopfleiste erst
 * nach `load` und Leerlauf oder sobald jemand tippt oder scrollt.
 */
export function SiteShellDeferred(props: Props) {
  const [Shell, setShell] = useState<ComponentType<Props> | null>(null);
  const [Wow, setWow] = useState<ComponentType | null>(null);
  const [wowSlot, setWowSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let shellGestartet = false;

    const wrapShell = (
      ShellInner: ShellCmp,
      providerMod: unknown,
      lang: Props["lang"],
    ) => {
      const Provider: ProviderCmp | null =
        lang === "de" &&
        providerMod &&
        typeof providerMod === "object" &&
        "ContentProviderDe" in providerMod
          ? (providerMod as { ContentProviderDe: ProviderCmp })
              .ContentProviderDe
          : lang === "en" &&
              providerMod &&
              typeof providerMod === "object" &&
              "ContentProviderEn" in providerMod
            ? (providerMod as { ContentProviderEn: ProviderCmp })
                .ContentProviderEn
            : null;
      if (!Provider) return ShellInner;
      const Wrapped = (shellProps: Props) => (
        <Provider>
          <ShellInner
            otherHref={shellProps.otherHref}
            hashBase={shellProps.hashBase}
          />
        </Provider>
      );
      return Wrapped;
    };

    const loadWow = async () => {
      const wowMod = await import("@/components/hero/HeroWowMount");
      if (cancelled) return;
      setWow(() => wowMod.HeroWowMount);
      setWowSlot(document.getElementById("hero-wow-slot"));
    };

    const loadShell = async () => {
      if (shellGestartet || cancelled) return;
      shellGestartet = true;
      const lang = props.lang;
      const [shellMod, providerMod] = await Promise.all([
        import("@/components/SiteShell"),
        lang === "de"
          ? import("@/content/ContentProviderDe")
          : lang === "en"
            ? import("@/content/ContentProviderEn")
            : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setShell(() => wrapShell(shellMod.SiteShell, providerMod, lang));
    };

    const startShellDeferred = () => {
      whenIdle(() => {
        void loadShell();
      }, 5000);
    };

    const shellFrueh = () => {
      void loadShell();
    };

    const ereignisse = ["pointerdown", "wheel", "keydown"] as const;
    for (const e of ereignisse) {
      window.addEventListener(e, shellFrueh, { once: true, passive: true });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void loadWow();
      });
    });

    if (document.readyState === "complete") startShellDeferred();
    else window.addEventListener("load", startShellDeferred, { once: true });

    return () => {
      cancelled = true;
      for (const e of ereignisse) window.removeEventListener(e, shellFrueh);
    };
  }, [props.lang]);

  return (
    <>
      {Wow && wowSlot ? createPortal(<Wow />, wowSlot) : null}
      {Shell ? <Shell {...props} /> : null}
    </>
  );
}