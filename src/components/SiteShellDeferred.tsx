"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  otherHref?: string;
  hashBase?: string;
  lang?: "de" | "en";
};

type ShellCmp = ComponentType<{ otherHref?: string; hashBase?: string }>;
type ProviderCmp = ComponentType<{ children: ReactNode }>;

/**
 * Deko und Laufschrift direkt nach dem ersten Paint, Kopfleiste knapp danach.
 *
 * Vorher warteten beide auf `load` und einen Leerlauf mit bis zu 12 Sekunden
 * Frist. Damit fehlten Technologiezeile, Signal Field und Navigation beim
 * ersten Blick, und Lenis sprang oft erst mitten im Scrollen ein.
 *
 * Die Kopfleiste bleibt einen Tick versetzt, damit ihr Buendel nicht in
 * derselben langen Aufgabe mit den nachgeladenen Abschnitten liegt.
 */
export function SiteShellDeferred(props: Props) {
  const [Shell, setShell] = useState<ComponentType<Props> | null>(null);
  const [Wow, setWow] = useState<ComponentType | null>(null);
  const [wowSlot, setWowSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let shellTimer = 0;

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

    void loadWow();
    shellTimer = window.setTimeout(() => {
      void loadShell();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(shellTimer);
    };
  }, [props.lang]);

  return (
    <>
      {Wow && wowSlot ? createPortal(<Wow />, wowSlot) : null}
      {Shell ? <Shell {...props} /> : null}
    </>
  );
}
