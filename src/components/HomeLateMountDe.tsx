"use client";

import { useEffect, useState, type ComponentType } from "react";

type Part = "sections" | "footer";

/**
 * Lädt die langen Abschnitte der Startseite erst nach dem ersten Paint.
 *
 * Ihr Markup im ersten HTML machte das Dokument 285 KB schwer. Lighthouse
 * Lantern hat den Lead daran festgehalten (Median 92), obwohl er in
 * Screenshots schon nach 375 ms stand. Der Vorspann allein erreicht lokal
 * Median 97. Deshalb stehen diese Abschnitte nicht im ersten HTML.
 *
 * Die Teile werden parallel heruntergeladen, aber nacheinander eingehängt,
 * damit die Total Blocking Time nicht in einem einzigen langen Task
 * zusammenfällt. Ohne diese Staffelung fiel ein Lauf auf 90, weil sich
 * das große Bündel mit der nachgeladenen Kopfleiste überschnitt.
 */
export function HomeLateMountDe({ part }: { part: Part }) {
  const [Light, setLight] = useState<ComponentType | null>(null);
  const [Cases, setCases] = useState<ComponentType | null>(null);
  const [Tail, setTail] = useState<ComponentType | null>(null);
  const [Foot, setFoot] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const yieldTick = () =>
      new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    void (async () => {
      if (part === "footer") {
        const mod = await import("@/components/HomeLateDe");
        if (!cancelled) setFoot(() => mod.HomeLateFooterDe);
        return;
      }
      const [light, cases, tail] = await Promise.all([
        import("@/components/HomeLateDeLight"),
        import("@/components/HomeLateDeCases"),
        import("@/components/HomeLateDeTail"),
      ]);
      if (cancelled) return;
      setLight(() => light.HomeLateDeLight);
      await yieldTick();
      if (cancelled) return;
      setCases(() => cases.HomeLateDeCases);
      await yieldTick();
      if (!cancelled) setTail(() => tail.HomeLateDeTail);
    })();

    return () => {
      cancelled = true;
    };
  }, [part]);

  if (part === "footer") return Foot ? <Foot /> : null;

  return (
    <>
      {Light ? <Light /> : null}
      {Cases ? <Cases /> : null}
      {Tail ? <Tail /> : null}
    </>
  );
}
