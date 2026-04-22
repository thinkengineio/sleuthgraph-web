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
  // Layouts animate node-to-node transitions so switching feels fluid.
  // "end" timing means nodes tween to their final position smoothly.
  const common = {
    fit: true,
    padding: 40,
    animate: "end" as const,
    animationDuration: 650,
    animationEasing: "ease-out-cubic" as const,
  };
  switch (name) {
    case "cose-bilkent":
      return {
        ...common,
        name: "cose-bilkent",
        nodeRepulsion: 4500,
        idealEdgeLength: 110,
        nodeDimensionsIncludeLabels: true,
      } as LayoutOptions;
    case "concentric":
      return {
        ...common,
        name: "concentric",
        concentric: (node) => node.degree(false),
        levelWidth: () => 1,
        minNodeSpacing: 24,
      };
    case "breadthfirst":
      return { ...common, name: "breadthfirst", directed: true, spacingFactor: 1.1 };
    case "dagre":
      return {
        ...common,
        name: "dagre",
        rankDir: "TB",
        rankSep: 60,
        nodeSep: 40,
      } as LayoutOptions;
  }
}
