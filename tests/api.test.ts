import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, apiFetch, getApiBaseUrl } from "@/lib/api";

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

describe("401 interceptor", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // Replace window.location with a writable stub so we can detect redirects.
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
    vi.unstubAllGlobals();
  });

  it("redirects to /login on 401 from a non-auth endpoint via apiFetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
    );

    await apiFetch("/cases");
    expect(window.location.href).toBe("/login");
  });

  it("does NOT redirect on 401 from an /auth/ endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
    );

    await apiFetch("/auth/config");
    expect(window.location.href).toBe("");
  });

  it("does NOT redirect on non-401 error responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Forbidden", { status: 403 })));

    await apiFetch("/cases");
    expect(window.location.href).toBe("");
  });

  it("redirects to /login on 401 from request<T> (used by apiClient)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
    );

    // apiClient.health uses request<T> internally; the 401 redirect should
    // fire before the error throw.
    await apiClient.health().catch(() => {});
    expect(window.location.href).toBe("/login");
  });
});
