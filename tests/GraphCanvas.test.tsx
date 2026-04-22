import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Stub react-cytoscapejs — it tries to call cy.destroy() on a null instance
// in jsdom because HTMLCanvasElement.getContext returns null (no real canvas).
vi.mock("react-cytoscapejs", () => ({
  default: ({ style }: { style?: React.CSSProperties }) => (
    <div data-testid="cytoscape-stub" style={style} />
  ),
}));

import { GraphCanvas } from "@/components/graph/GraphCanvas";

describe("GraphCanvas", () => {
  it("renders without crashing for an empty graph", () => {
    const { container } = render(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="cose-bilkent"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with vertices and edges without crashing", () => {
    const { container } = render(
      <GraphCanvas
        dump={{
          vertices: [
            { id: "v1", type: "DOMAIN", label: "example.com", confidence: 1, attrs: {} },
            { id: "v2", type: "IP_ADDRESS", label: "1.2.3.4", confidence: 0.9, attrs: {} },
          ],
          edges: [{
            id: "e1", source: "v1", target: "v2", rel_type: "RESOLVES_TO",
            confidence: 0.8, source_plugin: "dns", attrs: {},
          }],
        }}
        layoutName="dagre"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
