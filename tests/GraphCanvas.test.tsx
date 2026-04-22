import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useRef } from "react";

// Smart mock: captures the `cy={...}` callback and invokes it with a fake Core
// exposing `on`/`off`/`layout`/`nodes`/`batch`/`fit`/`png` jest spies.
// This lets tests exercise the real useEffect bindings in GraphCanvas.
type TapHandler = (e: { target: { id: () => string } }) => void;

interface FakeCore {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  layout: ReturnType<typeof vi.fn>;
  nodes: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
  fit: ReturnType<typeof vi.fn>;
  png: ReturnType<typeof vi.fn>;
  __handlers: {
    node: TapHandler[];
    edge: TapHandler[];
  };
}

let lastFakeCy: FakeCore | null = null;

function makeFakeCy(): FakeCore {
  const handlers: FakeCore["__handlers"] = { node: [], edge: [] };
  const layoutRun = vi.fn();
  const layout = vi.fn(() => ({ run: layoutRun }));
  const on = vi.fn((event: string, selector: string, handler: TapHandler) => {
    if (event === "tap" && selector === "node") handlers.node.push(handler);
    if (event === "tap" && selector === "edge") handlers.edge.push(handler);
  });
  const off = vi.fn((event: string, selector: string, handler: TapHandler) => {
    if (event === "tap" && selector === "node") {
      handlers.node = handlers.node.filter((h) => h !== handler);
    }
    if (event === "tap" && selector === "edge") {
      handlers.edge = handlers.edge.filter((h) => h !== handler);
    }
  });
  const nodesArr: Array<{ data: (k: string) => unknown; style: ReturnType<typeof vi.fn> }> = [];
  const nodes = vi.fn(() => ({
    forEach: (cb: (n: (typeof nodesArr)[number]) => void) => nodesArr.forEach(cb),
  }));
  const batch = vi.fn((fn: () => void) => fn());
  const fit = vi.fn();
  const png = vi.fn(() => "data:image/png;base64,FAKE");
  return {
    on,
    off,
    layout,
    nodes,
    batch,
    fit,
    png,
    __handlers: handlers,
  };
}

vi.mock("react-cytoscapejs", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  function CytoscapeMock({
    cy,
    style,
  }: {
    cy?: (c: FakeCore) => void;
    style?: React.CSSProperties;
  }) {
    // Real react-cytoscapejs invokes `cy` exactly once per mount with a
    // stable Core instance. Mirror that: lazy-init via useRef so we don't
    // thrash parent state with a fresh fake on every render.
    const ref = React.useRef<FakeCore | null>(null);
    if (!ref.current) {
      ref.current = makeFakeCy();
      lastFakeCy = ref.current;
      if (cy) cy(ref.current);
    }
    return <div data-testid="cytoscape-stub" style={style} />;
  }
  return { default: CytoscapeMock };
});

import { GraphCanvas, type GraphCanvasHandle } from "@/components/graph/GraphCanvas";

beforeEach(() => {
  lastFakeCy = null;
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
    expect(lastFakeCy).not.toBeNull();
    const cy = lastFakeCy!;
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
    const cy = lastFakeCy!;
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
    const cy = lastFakeCy!;
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
    const cy = lastFakeCy!;
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
    expect(lastFakeCy!.fit).toHaveBeenCalled();
    expect(handleRef.current?.png()).toBe("data:image/png;base64,FAKE");
    rerender(<Harness unmount={true} />);
    expect(handleRef.current).toBeNull();
  });
});
