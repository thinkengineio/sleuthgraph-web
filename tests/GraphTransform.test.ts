import { describe, it, expect } from "vitest";

import { graphToElements } from "@/components/graph/transform";

describe("graphToElements", () => {
  it("emits node for each vertex with data.type + data.label", () => {
    const elements = graphToElements({
      vertices: [{ id: "v1", type: "DOMAIN", label: "example.com", confidence: 1, attrs: {} }],
      edges: [],
    });
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({
      data: { id: "v1", type: "DOMAIN", label: "example.com" },
    });
  });

  it("emits edge for each relationship with source/target refs", () => {
    const elements = graphToElements({
      vertices: [
        { id: "a", type: "DOMAIN", label: "a", confidence: 1, attrs: {} },
        { id: "b", type: "DOMAIN", label: "b", confidence: 1, attrs: {} },
      ],
      edges: [
        {
          id: "e1",
          source: "a",
          target: "b",
          rel_type: "ASSOCIATED_WITH",
          confidence: 0.9,
          source_plugin: "crtsh",
          attrs: {},
        },
      ],
    });
    const edge = elements.find((el) => el.data?.source !== undefined);
    expect(edge?.data).toMatchObject({
      id: "e1",
      source: "a",
      target: "b",
      rel_type: "ASSOCIATED_WITH",
    });
  });

  it("drops edges whose endpoints are not in the vertex set", () => {
    const elements = graphToElements({
      vertices: [{ id: "a", type: "DOMAIN", label: "a", confidence: 1, attrs: {} }],
      edges: [
        {
          id: "e1",
          source: "a",
          target: "missing",
          rel_type: "ASSOCIATED_WITH",
          confidence: 1,
          source_plugin: null,
          attrs: {},
        },
      ],
    });
    // Only the one node should remain; the edge is dropped.
    expect(elements).toHaveLength(1);
  });
});
