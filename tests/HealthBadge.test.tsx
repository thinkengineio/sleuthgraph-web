import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HealthBadge from "@/components/HealthBadge";

describe("HealthBadge", () => {
  it("shows 'Checking...' initially then 'API healthy' on ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", service: "sleuthgraph-api" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<HealthBadge />);
    expect(screen.getByText(/checking/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/api healthy/i)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("shows 'API unreachable' on error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    render(<HealthBadge />);
    await waitFor(() => {
      expect(screen.getByText(/api unreachable/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });
});
