import type { ElementDefinition } from "cytoscape";

import type { GraphDump } from "@/lib/api";

export function graphToElements(dump: GraphDump): ElementDefinition[] {
  const ids = new Set(dump.vertices.map((v) => v.id));

  const nodes: ElementDefinition[] = dump.vertices.map((v) => ({
    data: {
      id: v.id,
      type: v.type,
      label: v.label,
      confidence: v.confidence,
    },
  }));

  const edges: ElementDefinition[] = [];
  for (const e of dump.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      // Defensive — backend should never hand us orphan edges, but we don't
      // crash the canvas if it does.
      continue;
    }
    edges.push({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        rel_type: e.rel_type,
        confidence: e.confidence,
        source_plugin: e.source_plugin,
      },
    });
  }

  return [...nodes, ...edges];
}
