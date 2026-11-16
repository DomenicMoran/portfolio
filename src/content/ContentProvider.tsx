"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Content } from "./types";

/**
 * Stellt die Inhalte der aktuellen Sprachfassung bereit.
 *
 * Warum Kontext und nicht Props durch jede Ebene: Die Sektionen sind ohnehin
 * Client-Komponenten, und eine Sprache ist genau die Art von Wert, den jede
 * Ebene braucht und keine ändert. Kein deutscher Default im Modul: Der würde
 * den gesamten `de`-Inhalt in jeden Client-Chunk ziehen, auch wenn die Seite
 * englisch ist.
 */
const ContentContext = createContext<Content | null>(null);

export function ContentProvider({
  content,
  children,
}: {
  content: Content;
  children: ReactNode;
}) {
  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): Content {
  const value = useContext(ContentContext);
  if (!value) {
    throw new Error("useContent braucht einen ContentProvider.");
  }
  return value;
}
