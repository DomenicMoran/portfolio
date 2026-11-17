"use client";

import type { ReactNode } from "react";
import { de } from "@/content/de";
import { ContentProvider } from "@/content/ContentProvider";

/**
 * Bindet den deutschen Inhalt auf der Client-Seite, ohne ihn als Server-Prop
 * durchzureichen. Als Prop landete das ganze Objekt in einem 90 KiB großen
 * Flight-Skript in der HTML-Datei, und Lighthouse-Lantern hat den Render
 * Delay des Hero-Leads an genau dieses Parsen gehängt (Median Performance 93,
 * LCP um 3,2 s). Der Lead steht schon im HTML und braucht diesen Inhalt nicht.
 */
export function ContentProviderDe({ children }: { children: ReactNode }) {
  return <ContentProvider content={de}>{children}</ContentProvider>;
}
