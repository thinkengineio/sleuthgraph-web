import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { PluginRunsPanel } from "@/components/PluginRunsPanel";
import { renderWithMantine } from "./test-utils";
import type { PluginRunRead } from "@/lib/api";

const { listPluginRunsMock, notifShowMock } = vi.hoisted(() => ({
  listPluginRunsMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listPluginRuns: listPluginRunsMock,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
  Notifications: () => null,
}));

const RUN_FIXTURE: PluginRunRead = {
  id: "run-1",
  case_id: "c1",
  input_entity_id: "ent-0001",
  plugin_name: "crtsh",
  plugin_version: "0.1.0",
  started_at: "2026-04-17T10:00:00Z",
  finished_at: "2026-04-17T10:00:27Z",
  status: "succeeded",
  error_message: null,
  entities_created_count: 4,
  relationships_created_count: 4,
  evidence_count: 1,
  created_by: "u1",
};

describe("PluginRunsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when API returns no runs", async () => {
    listPluginRunsMock.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    renderWithMantine(<PluginRunsPanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText(/no plugin runs yet/i)).toBeInTheDocument();
    });
  });

  it("shows run rows when API returns items", async () => {
    listPluginRunsMock.mockResolvedValue({ items: [RUN_FIXTURE], total: 1, limit: 100, offset: 0 });
    renderWithMantine(<PluginRunsPanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText(/crtsh@0\.1\.0/)).toBeInTheDocument();
    });

    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
    expect(screen.getByText("27.0s")).toBeInTheDocument();
  });

  it("opens detail drawer when View detail is clicked", async () => {
    listPluginRunsMock.mockResolvedValue({ items: [RUN_FIXTURE], total: 1, limit: 100, offset: 0 });
    renderWithMantine(<PluginRunsPanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText(/crtsh@0\.1\.0/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /view run detail/i }));

    await waitFor(() => {
      expect(screen.getByText("Plugin Run Detail")).toBeInTheDocument();
    });
  });

  it("shows error notification when listPluginRuns fails", async () => {
    listPluginRunsMock.mockRejectedValue(new Error("network error"));
    renderWithMantine(<PluginRunsPanel caseId="c1" />);

    await waitFor(() => {
      expect(notifShowMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Failed to load plugin runs" }),
      );
    });
  });

  it("re-fetches when refreshToken changes", async () => {
    listPluginRunsMock.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    const { rerender } = renderWithMantine(<PluginRunsPanel caseId="c1" refreshToken={0} />);

    await waitFor(() => {
      expect(listPluginRunsMock).toHaveBeenCalledTimes(1);
    });

    rerender(<PluginRunsPanel caseId="c1" refreshToken={1} />);

    await waitFor(() => {
      expect(listPluginRunsMock).toHaveBeenCalledTimes(2);
    });
  });
});
