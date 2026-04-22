import { describe, it, expect, vi, beforeEach } from "vitest";

import { getGraph } from "@/lib/api";

describe("getGraph", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        vertices: [{ id: "v1", type: "DOMAIN", label: "example.com", confidence: 1.0, attrs: {} }],
        edges: [],
      }), { status: 200, headers: { "content-type": "application/json" } }),
    ));
  });

  it("fetches /cases/:id/graph and returns typed result", async () => {
    const result = await getGraph("case-1");
    expect(result.vertices).toHaveLength(1);
    expect(result.vertices[0].type).toBe("DOMAIN");
    expect(result.edges).toEqual([]);
  });
});
