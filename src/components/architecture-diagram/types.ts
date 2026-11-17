type Tone = "neutral" | "acid" | "muted";

export type Node = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h?: number;
  tone?: Tone;
  external?: boolean;
};

export type Edge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type Diagram = {
  title: string;
  caption: string;
  height: number;
  lanes: { label: string; y: number }[];
  nodes: Node[];
  edges: Edge[];
};

export const TONE: Record<
  Tone,
  { fill: string; stroke: string; text: string }
> = {
  neutral: { fill: "#16161d", stroke: "#2c2c38", text: "#e8e8ec" },
  acid: { fill: "#1b2007", stroke: "#5c7010", text: "#d4ff45" },
  muted: { fill: "#101014", stroke: "#22222a", text: "#8b8b96" },
};

export const NODE_H = 62;
