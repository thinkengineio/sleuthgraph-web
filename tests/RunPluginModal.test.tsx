import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RunPluginModal } from "@/components/RunPluginModal";
import { renderWithMantine } from "./test-utils";
import type { EntityRead, PluginInfo, PluginRunResponse } from "@/lib/api";

const { runPluginMock, notifShowMock } = vi.hoisted(() => ({
  runPluginMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  runPlugin: runPluginMock,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
  Notifications: () => null,
}));

const ENTITY_FIXTURE: EntityRead = {
  id: "ent-0001",
  case_id: "c1",
  type: "DOMAIN",
  label: "example.com",
  confidence: 1.0,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

const PLUGIN_FIXTURE: PluginInfo = {
  name: "crtsh",
  version: "0.1.0",
  entity_types_accepted: ["DOMAIN"],
  entity_types_produced: ["DOMAIN"],
  requires_credentials: false,
};

const RUN_RESPONSE_FIXTURE: PluginRunResponse = {
  run: {
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
  },
  entities: [],
  relationships: [],
  evidence: [],
};

describe("RunPluginModal", () => {
  const onCloseMock = vi.fn();
  const onSuccessMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders idle state with entity and plugin info", async () => {
    renderWithMantine(
      <RunPluginModal
        opened={true}
        entity={ENTITY_FIXTURE}
        plugin={PLUGIN_FIXTURE}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("example.com")).toBeInTheDocument();
    });
    expect(screen.getByText(/crtsh@0\.1\.0/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("transitions to success state and calls onSuccess after 201", async () => {
    runPluginMock.mockResolvedValue(RUN_RESPONSE_FIXTURE);

    renderWithMantine(
      <RunPluginModal
        opened={true}
        entity={ENTITY_FIXTURE}
        plugin={PLUGIN_FIXTURE}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^run$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));

    await waitFor(() => {
      expect(screen.getByText(/plugin succeeded/i)).toBeInTheDocument();
    });

    expect(onSuccessMock).toHaveBeenCalledWith(RUN_RESPONSE_FIXTURE);
    expect(screen.getByText(/\+4 entities/i)).toBeInTheDocument();
    expect(screen.getByText(/\+4 relationships/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1 evidence/i)).toBeInTheDocument();
  });

  it("transitions to error state on 422 and shows detail", async () => {
    runPluginMock.mockRejectedValue(
      new Error("API 422: Input entity type PERSON is not accepted by crtsh"),
    );

    renderWithMantine(
      <RunPluginModal
        opened={true}
        entity={ENTITY_FIXTURE}
        plugin={PLUGIN_FIXTURE}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^run$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));

    await waitFor(() => {
      expect(screen.getByText(/plugin failed/i)).toBeInTheDocument();
    });

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("transitions to error state on 500", async () => {
    runPluginMock.mockRejectedValue(new Error("API 500: plugin execution failed"));

    renderWithMantine(
      <RunPluginModal
        opened={true}
        entity={ENTITY_FIXTURE}
        plugin={PLUGIN_FIXTURE}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^run$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));

    await waitFor(() => {
      expect(screen.getByText(/plugin failed/i)).toBeInTheDocument();
    });

    expect(notifShowMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Plugin run failed" }),
    );
  });

  it("retry button resets modal to idle state", async () => {
    runPluginMock.mockRejectedValue(new Error("API 500: plugin execution failed"));

    renderWithMantine(
      <RunPluginModal
        opened={true}
        entity={ENTITY_FIXTURE}
        plugin={PLUGIN_FIXTURE}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^run$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^run$/i })).toBeInTheDocument();
    });
  });

  it("renders nothing when entity or plugin is null", () => {
    renderWithMantine(
      <RunPluginModal
        opened={true}
        entity={null}
        plugin={null}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    expect(screen.queryByRole("button", { name: /^run$/i })).not.toBeInTheDocument();
  });
});
