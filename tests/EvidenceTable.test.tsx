import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EvidenceTable } from "@/components/EvidenceTable";
import { renderWithMantine } from "./test-utils";
import type { Evidence } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  evidenceBlobUrl: (caseId: string, evId: string) =>
    `http://localhost:8000/cases/${caseId}/evidence/${evId}/blob`,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
  Notifications: () => null,
}));

const EV_FIXTURE: Evidence = {
  id: "ev-1",
  case_id: "c1",
  entity_id: null,
  source_plugin: "manual",
  query: "nmap scan of 192.168.1.0/24",
  response_hash: "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
  response_uri: "s3://bucket/ev-1",
  response_bytes: 2048,
  response_content_type: "application/json",
  timestamp: "2026-04-17T10:00:00Z",
  reproducibility_spec: { tool: "nmap", args: "-sV" },
  created_by: "u1",
  blob_url: null,
};

const EV_FIXTURE_2: Evidence = {
  ...EV_FIXTURE,
  id: "ev-2",
  source_plugin: "shodan",
  query: "shodan host lookup",
  response_hash: "deadbeef1234deadbeef1234deadbeef1234deadbeef1234deadbeef1234dead",
  response_bytes: 1024 * 1024 * 5,
  response_content_type: "text/plain",
};

describe("EvidenceTable", () => {
  const onViewDetail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no items", () => {
    renderWithMantine(<EvidenceTable items={[]} onViewDetail={onViewDetail} />);
    expect(screen.getByText(/no evidence yet/i)).toBeInTheDocument();
  });

  it("renders table headers", () => {
    renderWithMantine(<EvidenceTable items={[EV_FIXTURE]} onViewDetail={onViewDetail} />);
    expect(screen.getByText("Hash")).toBeInTheDocument();
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Query")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders table rows for two evidence items", () => {
    renderWithMantine(
      <EvidenceTable items={[EV_FIXTURE, EV_FIXTURE_2]} onViewDetail={onViewDetail} />,
    );

    // Source plugin badges
    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(screen.getByText("shodan")).toBeInTheDocument();

    // Short hashes (unique per row)
    expect(screen.getByText("abc123def456")).toBeInTheDocument();
    expect(screen.getByText("deadbeef1234")).toBeInTheDocument();

    // Human sizes
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    expect(screen.getByText("5.0 MB")).toBeInTheDocument();

    // Content types
    expect(screen.getByText("application/json")).toBeInTheDocument();
    expect(screen.getByText("text/plain")).toBeInTheDocument();
  });

  it("shows content type in the table", () => {
    renderWithMantine(<EvidenceTable items={[EV_FIXTURE]} onViewDetail={onViewDetail} />);
    expect(screen.getByText("application/json")).toBeInTheDocument();
  });

  it("renders download blob link with correct href", () => {
    renderWithMantine(<EvidenceTable items={[EV_FIXTURE]} onViewDetail={onViewDetail} />);
    const links = screen.getAllByRole("link");
    const blobLink = links.find((l) => l.getAttribute("href")?.includes("blob"));
    expect(blobLink).toBeDefined();
    expect(blobLink).toHaveAttribute("href", "http://localhost:8000/cases/c1/evidence/ev-1/blob");
  });

  it("calls onViewDetail when eye icon action is clicked", () => {
    renderWithMantine(<EvidenceTable items={[EV_FIXTURE]} onViewDetail={onViewDetail} />);

    // Get all buttons (not links). The eye button has no href.
    const buttons = screen.getAllByRole("button");
    // The last button in the row is the view-details eye icon
    const eyeBtn = buttons[buttons.length - 1];
    fireEvent.click(eyeBtn);
    expect(onViewDetail).toHaveBeenCalledWith(EV_FIXTURE);
  });
});
