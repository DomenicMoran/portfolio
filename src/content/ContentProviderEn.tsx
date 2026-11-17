"use client";

import type { ReactNode } from "react";
import { en } from "@/content/en";
import { ContentProvider } from "@/content/ContentProvider";

/** Wie `ContentProviderDe`, für die englische Fassung. */
export function ContentProviderEn({ children }: { children: ReactNode }) {
  return <ContentProvider content={en}>{children}</ContentProvider>;
}
