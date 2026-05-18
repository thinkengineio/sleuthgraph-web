import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

// Stub next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Use shared cytoscape mock with handler tracking + layout spies.
vi.mock("react-cytoscapejs", async () => {
  const { createCytoscapeMockFactory } = await import("./cytoscape-mock");
  return createCytoscapeMockFactory();
});

// Mock API functions
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getGraph: vi.fn().mockResolvedValue({
      vertices: [
        { id: "v1", type: "DOMAIN", label: "example.com", confidence: 1.0, attrs: {} },
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
    }),
    listEntities: vi.fn().mockResolvedValue([
      {
        id: "v1",
        case_id: "c1",
        type: "DOMAIN",
        label: "example.com",
        confidence: 1.0,
        attrs: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "v2",
        case_id: "c1",
        type: "IP_ADDRESS",
        label: "1.2.3.4",
        confidence: 0.9,
        attrs: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]),
    listRelationships: vi.fn().mockResolvedValue([
      {
        id: "e1",
        case_id: "c1",
        src_entity_id: "v1",
        dst_entity_id: "v2",
        rel_type: "RESOLVES_TO",
        confidence: 0.8,
        source_plugin: "dns",
        attrs: {},
        created_at: "2024-01-01T00:00:00Z",
      },
    ]),
  };
});

import { Suspense } from "react";
import GraphPage from "@/app/cases/[caseId]/graph/page";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <Notifications />
      <Suspense fallback={<div>Suspense loading...</div>}>{children}</Suspense>
    </MantineProvider>
  );
}

describe("GraphPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toolbar and canvas after loading", async () => {
    await act(async () => {
      render(
        <Wrapper>
          <GraphPage params={Promise.resolve({ caseId: "c1" })} />
        </Wrapper>,
      );
    });

    // After data loads: toolbar and canvas should appear
    await waitFor(() => {
      expect(screen.getByText(/case graph/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId("cytoscape-stub")).toBeInTheDocument();
  });

  it("shows empty state when no vertices returned", async () => {
    const { getGraph, listEntities, listRelationships } = await import("@/lib/api");
    vi.mocked(getGraph).mockResolvedValueOnce({ vertices: [], edges: [] });
    vi.mocked(listEntities).mockResolvedValueOnce([]);
    vi.mocked(listRelationships).mockResolvedValueOnce([]);

    await act(async () => {
      render(
        <Wrapper>
          <GraphPage params={Promise.resolve({ caseId: "c2" })} />
        </Wrapper>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
    });
  });
});
