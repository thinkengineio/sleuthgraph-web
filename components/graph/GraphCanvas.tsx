"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";

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

/** Public imperative handle exposed to the parent page (fit + export). */
export type GraphCanvasHandle = {
  fit: () => void;
  png: () => string | undefined;
};

interface GraphCanvasProps {
  dump: GraphDump;
  layoutName: LayoutName;
  onNodeClick: (id: string) => void;
  onEdgeClick: (id: string) => void;
  visibleTypes?: Set<string>;
  searchQuery?: string;
  /** Optional ref that the parent can use to call fit() / png(). */
  cyCallbackRef?: React.MutableRefObject<GraphCanvasHandle | null>;
}

export function GraphCanvas({
  dump,
  layoutName,
  onNodeClick,
  onEdgeClick,
  visibleTypes,
  searchQuery,
  cyCallbackRef,
}: GraphCanvasProps) {
  registerExtensions();
  // Hold the Cytoscape core in state (not ref) so the effects below re-run
  // once the core becomes available. A plain ref would stay null on the
  // first-render effect pass and never re-fire when the cy prop callback
  // fires, leaving tap handlers unbound.
  const [cy, setCy] = useState<Core | null>(null);

  const elements = useMemo(() => graphToElements(dump), [dump]);
  const stylesheet = useMemo(() => buildStylesheet(), []);

  // Bind click handlers — re-bind when cy or callbacks change.
  useEffect(() => {
    if (!cy) return;
    const handleNode = (e: cytoscape.EventObject) => onNodeClick(e.target.id() as string);
    const handleEdge = (e: cytoscape.EventObject) => onEdgeClick(e.target.id() as string);
    cy.on("tap", "node", handleNode);
    cy.on("tap", "edge", handleEdge);
    return () => {
      cy.off("tap", "node", handleNode);
      cy.off("tap", "edge", handleEdge);
    };
  }, [cy, onNodeClick, onEdgeClick]);

  // Re-layout on layoutName or element count change.
  useEffect(() => {
    if (!cy) return;
    const opts: LayoutOptions = layoutOptions(layoutName);
    cy.layout(opts).run();
  }, [cy, layoutName, elements.length]);

  // Apply type/search filter by toggling visibility on the cy instance.
  useEffect(() => {
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
  }, [cy, visibleTypes, searchQuery]);

  // Wire up the imperative handle for the parent page. Null it on unmount
  // (or when cy changes) so a stale handle can't call into a destroyed core.
  useEffect(() => {
    if (!cy || !cyCallbackRef) return;
    cyCallbackRef.current = {
      fit: () => cy.fit(undefined, 30),
      png: () => cy.png({ output: "base64uri", bg: "#1a1b1e", full: true }) as string | undefined,
    };
    return () => {
      cyCallbackRef.current = null;
    };
  }, [cy, cyCallbackRef]);

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={stylesheet}
      style={{ width: "100%", height: "100%" }}
      cy={(instance) => {
        setCy(instance);
      }}
      layout={layoutOptions(layoutName)}
      wheelSensitivity={0.2}
    />
  );
}
