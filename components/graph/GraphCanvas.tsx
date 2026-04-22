"use client";

import { useEffect, useMemo, useRef } from "react";

import cytoscape, { type Core, type LayoutOptions } from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";

import { buildStylesheet } from "./stylesheet";
import { layoutOptions, type LayoutName } from "./layouts";
import { graphToElements } from "./transform";

import type { GraphDump } from "@/lib/api";

// Register extensions exactly once per process (lazy, import-on-demand).
let _registered = false;
function registerExtensions() {
  if (_registered) return;
  _registered = true;
  // Dynamic requires to avoid SSR issues. These are optional layout plugins.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const coseBilkent = require("cytoscape-cose-bilkent") as Parameters<typeof cytoscape.use>[0];
    cytoscape.use(coseBilkent);
  } catch {
    // Layout plugin unavailable in this environment (e.g. SSR) — fall through.
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dagre = require("cytoscape-dagre") as Parameters<typeof cytoscape.use>[0];
    cytoscape.use(dagre);
  } catch {
    // Layout plugin unavailable — fall through.
  }
}

interface GraphCanvasProps {
  dump: GraphDump;
  layoutName: LayoutName;
  onNodeClick: (id: string) => void;
  onEdgeClick: (id: string) => void;
  visibleTypes?: Set<string>;
  searchQuery?: string;
}

export function GraphCanvas({
  dump,
  layoutName,
  onNodeClick,
  onEdgeClick,
  visibleTypes,
  searchQuery,
}: GraphCanvasProps) {
  registerExtensions();
  const cyRef = useRef<Core | null>(null);

  const elements = useMemo(() => graphToElements(dump), [dump]);
  const stylesheet = useMemo(() => buildStylesheet(), []);

  // Bind click handlers — re-bind when callbacks change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const handleNode = (e: cytoscape.EventObject) => onNodeClick(e.target.id() as string);
    const handleEdge = (e: cytoscape.EventObject) => onEdgeClick(e.target.id() as string);
    cy.on("tap", "node", handleNode);
    cy.on("tap", "edge", handleEdge);
    return () => {
      cy.off("tap", "node", handleNode);
      cy.off("tap", "edge", handleEdge);
    };
  }, [onNodeClick, onEdgeClick]);

  // Re-layout on layoutName or element count change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const opts: LayoutOptions = layoutOptions(layoutName);
    cy.layout(opts).run();
  }, [layoutName, elements.length]);

  // Apply type/search filter by toggling visibility on the cy instance
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const type = n.data("type") as string;
        const label = String(n.data("label") ?? "").toLowerCase();
        const typeOk = !visibleTypes || visibleTypes.has(type);
        const searchOk = !searchQuery || label.includes(searchQuery.toLowerCase());
        n.style("display", typeOk && searchOk ? "element" : "none");
      });
    });
  }, [visibleTypes, searchQuery]);

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={stylesheet}
      style={{ width: "100%", height: "100%" }}
      cy={(cy) => {
        cyRef.current = cy;
      }}
      layout={layoutOptions(layoutName)}
      wheelSensitivity={0.2}
    />
  );
}
