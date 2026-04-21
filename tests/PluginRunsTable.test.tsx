import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PluginRunsTable } from "@/components/PluginRunsTable";
import { renderWithMantine } from "./test-utils";
import type { PluginRunRead } from "@/lib/api";

const SUCCEEDED_RUN: PluginRunRead = {
  id: "run-1",
  case_id: "c1",
  input_entity_id: "ent-0001",
  plugin_name: "crtsh",
  plugin_version: "0.1.0",
  started_at: "2026-04-17T10:00:00Z",
  finished_at: "2026-04-17T10:00:30Z",
  status: "succeeded",
  error_message: null,
  entities_created_count: 3,
  relationships_created_count: 2,
  evidence_count: 1,
  created_by: "u1",
};

const FAILED_RUN: PluginRunRead = {
  id: "run-2",
  case_id: "c1",
  input_entity_id: "ent-0002",
  plugin_name: "crtsh",
  plugin_version: "0.1.0",
  started_at: "2026-04-17T11:00:00Z",
  finished_at: "2026-04-17T11:00:05Z",
  status: "failed",
  error_message: "upstream_http_error:HTTPStatusError",
  entities_created_count: 0,
  relationships_created_count: 0,
  evidence_count: 0,
  created_by: "u1",
};

const RUNNING_RUN: PluginRunRead = {
  id: "run-3",
  case_id: "c1",
  input_entity_id: "ent-0003",
  plugin_name: "crtsh",
  plugin_version: "0.1.0",
  started_at: "2026-04-17T12:00:00Z",
  finished_at: null,
  status: "running",
  error_message: null,
  entities_created_count: 0,
  relationships_created_count: 0,
  evidence_count: 0,
  created_by: "u1",
};

describe("PluginRunsTable", () => {
  it("shows empty state when items is empty", () => {
    renderWithMantine(<PluginRunsTable items={[]} onViewDetail={vi.fn()} />);
    expect(screen.getByText(/no plugin runs yet/i)).toBeInTheDocument();
  });

  it("renders succeeded run with green badge and duration", () => {
    renderWithMantine(<PluginRunsTable items={[SUCCEEDED_RUN]} onViewDetail={vi.fn()} />);
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
    expect(screen.getByText("30.0s")).toBeInTheDocument();
    // Counts column
    expect(screen.getByText(/3E/)).toBeInTheDocument();
  });

  it("renders failed run with red badge", () => {
    renderWithMantine(<PluginRunsTable items={[FAILED_RUN]} onViewDetail={vi.fn()} />);
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it("renders running run with dash for duration", () => {
    renderWithMantine(<PluginRunsTable items={[RUNNING_RUN]} onViewDetail={vi.fn()} />);
    expect(screen.getByText(/running/i)).toBeInTheDocument();
    // Duration should be em-dash for still-running
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("calls onViewDetail when eye button is clicked", () => {
    const onViewDetail = vi.fn();
    renderWithMantine(<PluginRunsTable items={[SUCCEEDED_RUN]} onViewDetail={onViewDetail} />);
    fireEvent.click(screen.getByRole("button", { name: /view run detail/i }));
    expect(onViewDetail).toHaveBeenCalledWith(SUCCEEDED_RUN);
  });
});
