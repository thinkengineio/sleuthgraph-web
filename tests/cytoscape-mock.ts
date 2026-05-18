/**
 * Shared cytoscape mock for test files.
 *
 * Extracted from GraphCanvas.test.tsx (Phase 9) so that both GraphCanvas
 * and GraphPage tests (and any future graph tests) share the same smart
 * mock with handler tracking, layout spies, and fit/png stubs.
 *
 * Usage:
 *   vi.mock("react-cytoscapejs", async () => {
 *     const { createCytoscapeMockFactory } = await import("./cytoscape-mock");
 *     return createCytoscapeMockFactory();
 *   });
 *   import { getLastFakeCy, resetCytoscapeMock } from "./cytoscape-mock";
 */
import { vi } from "vitest";

// ── Types ──────────────────────────────────────────────────────────────────

export type TapHandler = (e: { target: { id: () => string } }) => void;

export interface FakeCore {
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

// ── Module-level state ─────────────────────────────────────────────────────

let lastFakeCy: FakeCore | null = null;

export function getLastFakeCy(): FakeCore | null {
  return lastFakeCy;
}

export function resetCytoscapeMock(): void {
  lastFakeCy = null;
}

// ── Factory ────────────────────────────────────────────────────────────────

export function makeFakeCy(): FakeCore {
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

/**
 * Returns a module-shaped object suitable as the return value of a
 * `vi.mock("react-cytoscapejs", ...)` factory.  The default export is a
 * React component that mirrors real react-cytoscapejs behaviour: it calls
 * the `cy` prop exactly once per mount with a stable FakeCore.
 */
export async function createCytoscapeMockFactory() {
  const React = await import("react");

  function CytoscapeMock({
    cy,
    style,
  }: {
    cy?: (c: FakeCore) => void;
    style?: React.CSSProperties;
  }) {
    const ref = React.useRef<FakeCore | null>(null);
    if (!ref.current) {
      ref.current = makeFakeCy();
      lastFakeCy = ref.current;
      if (cy) cy(ref.current);
    }
    return React.createElement("div", { "data-testid": "cytoscape-stub", style });
  }

  return { default: CytoscapeMock };
}
