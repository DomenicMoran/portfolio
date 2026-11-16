import { salatiDiagram } from "./diagrams/salati";
import { menucloudDiagram } from "./diagrams/menucloud";
import { wohnungsjaegerDiagram } from "./diagrams/wohnungsjaeger";
import { nouriDiagram } from "./diagrams/nouri";
import { bitdojoDiagram } from "./diagrams/bitdojo";
import { dartileDiagram } from "./diagrams/dartile";
import { lexipulseDiagram } from "./diagrams/lexipulse";
import { aegisDiagram } from "./diagrams/aegis";
import type { Diagram } from "./types";

export const ARCHITECTURES: Record<string, Diagram> = {
  salati: salatiDiagram,
  menucloud: menucloudDiagram,
  wohnungsjaeger: wohnungsjaegerDiagram,
  nouri: nouriDiagram,
  bitdojo: bitdojoDiagram,
  dartile: dartileDiagram,
  lexipulse: lexipulseDiagram,
  aegis: aegisDiagram,
};
