import { Bot, Layers, Smartphone, Workflow } from "lucide-react";

export const ACCENT = {
  acid: {
    text: "text-acid",
    bg: "bg-acid",
    border: "border-acid/30",
    soft: "bg-acid/10",
  },
} as const;

export const TAB_IDS = [
  "highlights",
  "automation",
  "architecture",
  "stack",
] as const;
export const TAB_ICONS = {
  highlights: Layers,
  automation: Bot,
  architecture: Workflow,
  stack: Smartphone,
};

export type TabId = (typeof TAB_IDS)[number];
export const AUSFUEHRLICH = 5;
