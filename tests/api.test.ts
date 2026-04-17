import { describe, expect, it, vi } from "vitest";

import { apiClient, getApiBaseUrl } from "@/lib/api";

describe("getApiBaseUrl", () => {
  it("returns NEXT_PUBLIC_API_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    expect(getApiBaseUrl()).toBe("https://api.example.com");
    vi.unstubAllEnvs();
  });

  it("defaults to localhost:8000 when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(getApiBaseUrl()).toBe("http://localhost:8000");
    vi.unstubAllEnvs();
  });
});

describe("apiClient.health", () => {
  it("GETs /health and returns ok payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", service: "sleuthgraph-api" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiClient.health();
    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/health"), expect.any(Object));
    vi.unstubAllGlobals();
  });
});
