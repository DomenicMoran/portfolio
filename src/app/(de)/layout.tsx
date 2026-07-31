import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/RootDocument";
import { buildMetadata } from "@/lib/metadata";
import { de } from "@/content/de";
import "../globals.css";

export const metadata: Metadata = buildMetadata(de, "de");

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default function DeLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="de">{children}</RootDocument>;
}
