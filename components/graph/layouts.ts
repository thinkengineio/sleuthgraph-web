import type { LayoutOptions } from "cytoscape";

export const LAYOUT_NAMES = ["cose-bilkent", "concentric", "breadthfirst", "dagre"] as const;
export type LayoutName = (typeof LAYOUT_NAMES)[number];

export const LAYOUT_LABELS: Record<LayoutName, string> = {
  "cose-bilkent": "Organic (force-directed)",
  concentric: "Concentric",
  breadthfirst: "Breadth-first",
  dagre: "Hierarchical",
};

export function layoutOptions(name: LayoutName): LayoutOptions {
  switch (name) {
    case "cose-bilkent":
      return {
        name: "cose-bilkent",
        animate: false,
        fit: true,
        padding: 30,
        nodeRepulsion: 4500,
        idealEdgeLength: 100,
      } as LayoutOptions;
    case "concentric":
      return {
        name: "concentric",
        animate: false,
        fit: true,
        padding: 30,
        concentric: (node) => node.degree(false),
        levelWidth: () => 1,
      };
    case "breadthfirst":
      return { name: "breadthfirst", animate: false, fit: true, padding: 30, directed: true };
    case "dagre":
      return { name: "dagre", animate: false, fit: true, padding: 30, rankDir: "TB" } as LayoutOptions;
  }
}
