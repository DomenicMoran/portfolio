"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { Nav } from "@/components/Nav";
import { Cursor } from "@/components/ui/Cursor";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

/**
 * Hält den wenigen Zustand, der die ganze Seite betrifft (Befehlspalette offen)
 * und hängt die globalen Interaktionsebenen ein. Weil er hier liegt, bleibt
 * `page.tsx` eine Server Component und liefert die Abschnitte als statisches
 * HTML aus.
 */
export function SiteShell({
  otherHref,
  hashBase,
}: { otherHref?: string; hashBase?: string } = {}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      <Nav
        onOpenPalette={() => setPaletteOpen(true)}
        otherHref={otherHref}
        hashBase={hashBase}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
