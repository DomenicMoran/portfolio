"use client";

import { useEffect, useState, type ComponentType } from "react";
import { PreparePrintImages } from "@/components/PreparePrintImages";

type Part = "sections" | "footer";

/** Wie HomeLateMountDe, für die englische Startseite. */
export function HomeLateMountEn({ part }: { part: Part }) {
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
        const mod = await import("@/components/HomeLateEn");
        if (!cancelled) setFoot(() => mod.HomeLateFooterEn);
        return;
      }
      const [light, cases, tail] = await Promise.all([
        import("@/components/HomeLateEnLight"),
        import("@/components/HomeLateEnCases"),
        import("@/components/HomeLateEnTail"),
      ]);
      if (cancelled) return;
      setLight(() => light.HomeLateEnLight);
      await yieldTick();
      if (cancelled) return;
      setCases(() => cases.HomeLateEnCases);
      await yieldTick();
      if (!cancelled) setTail(() => tail.HomeLateEnTail);
    })();

    return () => {
      cancelled = true;
    };
  }, [part]);

  if (part === "footer") return Foot ? <Foot /> : null;

  return (
    <>
      <PreparePrintImages />
      {Light ? <Light /> : null}
      {Cases ? <Cases /> : null}
      {Tail ? <Tail /> : null}
    </>
  );
}
