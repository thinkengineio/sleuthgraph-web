import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EvidencePanel } from "@/components/EvidencePanel";
import { renderWithMantine } from "./test-utils";
import type { Evidence } from "@/lib/api";

const { listEvidenceMock, downloadCsvMock, notifShowMock } = vi.hoisted(() => ({
  listEvidenceMock: vi.fn(),
  downloadCsvMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listEvidence: listEvidenceMock,
  downloadEvidenceCsv: downloadCsvMock,
  // evidenceBlobUrl used inside EvidenceTable which is rendered by EvidencePanel
  evidenceBlobUrl: (caseId: string, evId: string) =>
    `http://localhost:8000/cases/${caseId}/evidence/${evId}/blob`,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
  Notifications: () => null,
}));

const EV_FIXTURE: Evidence = {
  id: "ev-1",
  case_id: "c1",
  entity_id: null,
  source_plugin: "manual",
  query: "nmap scan",
  response_hash: "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
  response_uri: "s3://bucket/ev-1",
  response_bytes: 2048,
  response_content_type: "application/json",
  timestamp: "2026-04-17T10:00:00Z",
  reproducibility_spec: { tool: "nmap" },
  created_by: "u1",
  blob_url: null,
};

describe("EvidencePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when API returns no items", async () => {
    listEvidenceMock.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    renderWithMantine(<EvidencePanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText(/no evidence yet/i)).toBeInTheDocument();
    });

    // Export CSV button disabled when no items
    const exportBtn = screen.getByRole("button", { name: /export csv/i });
    expect(exportBtn).toBeDisabled();
  });

  it("shows evidence rows when API returns items", async () => {
    listEvidenceMock.mockResolvedValue({ items: [EV_FIXTURE], total: 1, limit: 100, offset: 0 });
    renderWithMantine(<EvidencePanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText("manual")).toBeInTheDocument();
    });

    expect(screen.getByText("abc123def456")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();

    // Export CSV enabled when items present
    const exportBtn = screen.getByRole("button", { name: /export csv/i });
    expect(exportBtn).not.toBeDisabled();
  });

  it("opens upload modal when Upload button is clicked", async () => {
    listEvidenceMock.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    renderWithMantine(<EvidencePanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText(/no evidence yet/i)).toBeInTheDocument();
    });

    const uploadBtn = screen.getByRole("button", { name: /upload evidence/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/upload evidence/i)).toBeInTheDocument();
    });
  });

  it("calls downloadEvidenceCsv when Export CSV is clicked", async () => {
    listEvidenceMock.mockResolvedValue({ items: [EV_FIXTURE], total: 1, limit: 100, offset: 0 });
    downloadCsvMock.mockResolvedValue(undefined);

    renderWithMantine(<EvidencePanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText("manual")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /export csv/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(downloadCsvMock).toHaveBeenCalledWith("c1");
    });
  });

  it("shows error notification when listEvidence fails", async () => {
    listEvidenceMock.mockRejectedValue(new Error("network error"));
    renderWithMantine(<EvidencePanel caseId="c1" />);

    await waitFor(() => {
      expect(notifShowMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Failed to load evidence" }),
      );
    });
  });

  it("calls listEvidence with the correct caseId", async () => {
    listEvidenceMock.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    renderWithMantine(<EvidencePanel caseId="case-42" />);

    await waitFor(() => {
      expect(listEvidenceMock).toHaveBeenCalledWith("case-42", expect.any(Object));
    });
  });
});
