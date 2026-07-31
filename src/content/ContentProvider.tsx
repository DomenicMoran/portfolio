"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Content } from "./types";
import { de } from "./de";

/**
 * Stellt die Inhalte der aktuellen Sprachfassung bereit.
 *
 * Warum Kontext und nicht Props durch jede Ebene: Die Sektionen sind ohnehin
 * Client-Komponenten, und eine Sprache ist genau die Art von Wert, den jede
 * Ebene braucht und keine ändert. Der deutsche Inhalt ist die Vorgabe. Wer
 * den Provider vergisst, bekommt eine vollständige Seite statt eines Absturzes.
 */
const ContentContext = createContext<Content>(de);

export function ContentProvider({
  content,
  children,
}: {
  content: Content;
  children: ReactNode;
}) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent(): Content {
  return useContext(ContentContext);
}
