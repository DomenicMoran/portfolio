"use client";

import { useRef, type ReactNode, type Ref } from "react";
import { useHorizontalScrollWheel } from "@/lib/useHorizontalScrollWheel";

/**
 * `pre` oder `div`, waagerecht scrollend, mit dem Mausrad-Ausstieg aus
 * `useHorizontalScrollWheel`.
 *
 * Codekästen und Tabellen in den Artikeln sind dieselbe Falle wie die
 * Bildstrecken und die Architekturdiagramme: nur waagerecht scrollbar, also
 * schluckt der Kasten sonst jeden reinen Mausrad-Impuls, mit dem jemand
 * weiterlesen will.
 */
export function HorizontalScrollBox({
  as,
  className,
  tabIndex,
  role,
  "aria-label": ariaLabel,
  children,
}: {
  as: "pre" | "div";
  className?: string;
  tabIndex?: number;
  role?: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  const kasten = useRef<HTMLElement>(null);
  useHorizontalScrollWheel(kasten);

  if (as === "pre") {
    return (
      <pre
        ref={kasten as Ref<HTMLPreElement>}
        tabIndex={tabIndex}
        role={role}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </pre>
    );
  }

  return (
    <div
      ref={kasten as Ref<HTMLDivElement>}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}
