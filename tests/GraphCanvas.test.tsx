import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useRef } from "react";

import { getLastFakeCy, resetCytoscapeMock } from "./cytoscape-mock";

vi.mock("react-cytoscapejs", async () => {
  const { createCytoscapeMockFactory } = await import("./cytoscape-mock");
  return createCytoscapeMockFactory();
});

import { GraphCanvas, type GraphCanvasHandle } from "@/components/graph/GraphCanvas";

beforeEach(() => {
  resetCytoscapeMock();
});

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
          edges: [
            {
              id: "e1",
              source: "v1",
              target: "v2",
              rel_type: "RESOLVES_TO",
              confidence: 0.8,
              source_plugin: "dns",
              attrs: {},
            },
          ],
        }}
        layoutName="dagre"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("binds node click handler and fires onNodeClick when a node is tapped", () => {
    const onNodeClick = vi.fn();
    render(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="cose-bilkent"
        onNodeClick={onNodeClick}
        onEdgeClick={vi.fn()}
      />,
    );
    expect(getLastFakeCy()).not.toBeNull();
    const cy = getLastFakeCy()!;
    expect(cy.on).toHaveBeenCalledWith("tap", "node", expect.any(Function));
    expect(cy.__handlers.node.length).toBeGreaterThan(0);
    // Invoke the captured handler with a fake event.
    cy.__handlers.node[0]({ target: { id: () => "v1" } });
    expect(onNodeClick).toHaveBeenCalledWith("v1");
  });

  it("binds edge click handler and fires onEdgeClick when an edge is tapped", () => {
    const onEdgeClick = vi.fn();
    render(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="cose-bilkent"
        onNodeClick={vi.fn()}
        onEdgeClick={onEdgeClick}
      />,
    );
    const cy = getLastFakeCy()!;
    expect(cy.on).toHaveBeenCalledWith("tap", "edge", expect.any(Function));
    cy.__handlers.edge[0]({ target: { id: () => "e42" } });
    expect(onEdgeClick).toHaveBeenCalledWith("e42");
  });

  it("invokes cy.layout(...).run() when layoutName changes", () => {
    const { rerender } = render(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="cose-bilkent"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
      />,
    );
    const cy = getLastFakeCy()!;
    // The initial layout-effect runs once on mount.
    const initialCalls = cy.layout.mock.calls.length;
    rerender(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="dagre"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
      />,
    );
    expect(cy.layout.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it("calls cy.batch when filter inputs change", () => {
    const { rerender } = render(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="cose-bilkent"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
        searchQuery="foo"
      />,
    );
    const cy = getLastFakeCy()!;
    const initialBatch = cy.batch.mock.calls.length;
    rerender(
      <GraphCanvas
        dump={{ vertices: [], edges: [] }}
        layoutName="cose-bilkent"
        onNodeClick={vi.fn()}
        onEdgeClick={vi.fn()}
        searchQuery="bar"
      />,
    );
    expect(cy.batch.mock.calls.length).toBeGreaterThan(initialBatch);
  });

  it("exposes fit/png via cyCallbackRef and nulls the ref on unmount", () => {
    function Harness({ unmount }: { unmount: boolean }) {
      const ref = useRef<GraphCanvasHandle | null>(null);
      // Expose the ref on the window for the assertion.
      (window as unknown as { __handle: typeof ref }).__handle = ref;
      if (unmount) return null;
      return (
        <GraphCanvas
          dump={{ vertices: [], edges: [] }}
          layoutName="cose-bilkent"
          onNodeClick={vi.fn()}
          onEdgeClick={vi.fn()}
          cyCallbackRef={ref}
        />
      );
    }
    const { rerender } = render(<Harness unmount={false} />);
    const handleRef = (window as unknown as { __handle: { current: GraphCanvasHandle | null } })
      .__handle;
    expect(handleRef.current).not.toBeNull();
    act(() => {
      handleRef.current?.fit();
    });
    expect(getLastFakeCy()!.fit).toHaveBeenCalled();
    expect(handleRef.current?.png()).toBe("data:image/png;base64,FAKE");
    rerender(<Harness unmount={true} />);
    expect(handleRef.current).toBeNull();
  });
});
