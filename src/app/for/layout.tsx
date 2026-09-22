import type { Metadata } from "next";
import { RootDocument } from "@/components/RootDocument";
import { site } from "@/content/site";
import "../globals.css";

export const metadata: Metadata = { metadataBase: new URL(site.url) };

export default function TargetedLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="de">{children}</RootDocument>;
}
