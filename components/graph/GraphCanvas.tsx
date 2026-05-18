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

  // Bind click + hover handlers — re-bind when cy or callbacks change.
  useEffect(() => {
    if (!cy) return;
    const handleNode = (e: cytoscape.EventObject) => onNodeClick(e.target.id() as string);
    const handleEdge = (e: cytoscape.EventObject) => onEdgeClick(e.target.id() as string);

    // Hover: grow the node + its connected edges, fade everything else for focus.
    const handleNodeMouseover = (e: cytoscape.EventObject) => {
      const node = e.target;
      const neighborhood = node.closedNeighborhood();
      cy.batch(() => {
        cy.elements().not(neighborhood).addClass("faded");
        node.addClass("hovered");
        node.connectedEdges().addClass("hovered");
      });
      cy.container()?.style.setProperty("cursor", "pointer");
    };
    const handleNodeMouseout = (e: cytoscape.EventObject) => {
      cy.batch(() => {
        cy.elements().removeClass("faded");
        e.target.removeClass("hovered");
        e.target.connectedEdges().removeClass("hovered");
      });
      cy.container()?.style.removeProperty("cursor");
    };
    const handleEdgeMouseover = (e: cytoscape.EventObject) => {
      e.target.addClass("hovered");
      cy.container()?.style.setProperty("cursor", "pointer");
    };
    const handleEdgeMouseout = (e: cytoscape.EventObject) => {
      e.target.removeClass("hovered");
      cy.container()?.style.removeProperty("cursor");
    };

    cy.on("tap", "node", handleNode);
    cy.on("tap", "edge", handleEdge);
    cy.on("mouseover", "node", handleNodeMouseover);
    cy.on("mouseout", "node", handleNodeMouseout);
    cy.on("mouseover", "edge", handleEdgeMouseover);
    cy.on("mouseout", "edge", handleEdgeMouseout);
    return () => {
      cy.off("tap", "node", handleNode);
      cy.off("tap", "edge", handleEdge);
      cy.off("mouseover", "node", handleNodeMouseover);
      cy.off("mouseout", "node", handleNodeMouseout);
      cy.off("mouseover", "edge", handleEdgeMouseover);
      cy.off("mouseout", "edge", handleEdgeMouseout);
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

  const entityCount = dump.vertices.length;
  const relationshipCount = dump.edges.length;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        role="img"
        aria-label={`Investigation graph — ${entityCount} entities, ${relationshipCount} relationships`}
        style={{ width: "100%", height: "100%" }}
      >
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
      </div>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
        }}
      >
        Graph entities: {dump.vertices.map((v) => `${v.label} (${v.type})`).join(", ") || "none"}
      </span>
    </div>
  );
}
