"use client";

import { useEffect, useState, type ComponentType } from "react";
import { whenIdle } from "@/lib/when-idle";
import { cn } from "@/lib/utils";

type Props = { className?: string };

type SignalFieldType = ComponentType<{ className?: string }>;

export function SignalFieldLazy({ className }: Props) {
  const [Field, setField] = useState<SignalFieldType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      whenIdle(() => {
        void import("./SignalField").then((mod) => {
          if (!cancelled) setField(() => mod.SignalField);
        });
      }, 6000);
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
