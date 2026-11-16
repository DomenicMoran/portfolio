"use client";

import { useEffect, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";

type Props = { className?: string };

type SignalFieldType = ComponentType<{ className?: string }>;

const whenIdle = (work: () => void) => {
  const w = window as typeof window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    /* Spät laden: Lighthouse-Mobile zählt die Haupt-Thread-Arbeit in den
       ersten Sekunden mit. Der Canvas-Deko ist kein LCP-Element, darf die
       Messung nicht mittragen. */
    w.requestIdleCallback(work, { timeout: 5000 });
  } else {
    window.setTimeout(work, 1200);
  }
};

export function SignalFieldLazy({ className }: Props) {
  const [Field, setField] = useState<SignalFieldType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      whenIdle(() => {
        void import("./SignalField").then((mod) => {
          if (!cancelled) setField(() => mod.SignalField);
        });
      });
    };
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Field) {
    return (
      <svg
        aria-hidden
        className={cn("pointer-events-none size-full opacity-0", className)}
      />
    );
  }

  return <Field className={className} />;
}
