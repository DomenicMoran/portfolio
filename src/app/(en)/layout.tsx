import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/RootDocument";
import { buildMetadata } from "@/lib/metadata";
import { en } from "@/content/en";
import "../globals.css";

export const metadata: Metadata = buildMetadata(en, "en");

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
