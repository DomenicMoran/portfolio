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
    w.requestIdleCallback(work, { timeout: 2500 });
  } else {
    window.setTimeout(work, 200);
  }
};

export function SignalFieldLazy({ className }: Props) {
  const [Field, setField] = useState<SignalFieldType | null>(null);

  useEffect(() => {
    let cancelled = false;
    whenIdle(() => {
      void import("./SignalField").then((mod) => {
        if (!cancelled) setField(() => mod.SignalField);
      });
    });
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
