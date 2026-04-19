import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RelationshipPanel } from "@/components/RelationshipPanel";
import { renderWithMantine } from "./test-utils";
import type { EntityRead, RelationshipRead } from "@/lib/api";

const { listRelationshipsMock, notifShowMock } = vi.hoisted(() => ({
  listRelationshipsMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listRelationships: listRelationshipsMock,
  createRelationship: vi.fn(),
  deleteRelationship: vi.fn(),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
  Notifications: () => null,
}));

const ENTITY_A: EntityRead = {
  id: "ent-aaa",
  case_id: "c1",
  type: "PERSON",
  label: "Alice",
  confidence: 1.0,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

const ENTITY_B: EntityRead = {
  id: "ent-bbb",
  case_id: "c1",
  type: "DOMAIN",
  label: "evil.com",
  confidence: 0.9,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

const REL_FIXTURE: RelationshipRead = {
  id: "rel-001",
  case_id: "c1",
  src_entity_id: "ent-aaa",
  dst_entity_id: "ent-bbb",
  rel_type: "OWNS",
  confidence: 0.85,
  source_plugin: null,
  attrs: {},
  created_at: "2026-04-17T12:00:00Z",
};

const ENTITIES = [ENTITY_A, ENTITY_B];

describe("RelationshipPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when API returns no relationships", async () => {
    listRelationshipsMock.mockResolvedValue([]);
    renderWithMantine(<RelationshipPanel caseId="c1" entities={ENTITIES} />);

    await waitFor(() => {
      expect(screen.getByText(/no relationships yet/i)).toBeInTheDocument();
    });
  });

  it("shows relationship rows when API returns data", async () => {
    listRelationshipsMock.mockResolvedValue([REL_FIXTURE]);
    renderWithMantine(<RelationshipPanel caseId="c1" entities={ENTITIES} />);

    await waitFor(() => {
      expect(screen.getByText("OWNS")).toBeInTheDocument();
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("evil.com")).toBeInTheDocument();
  });

  it("shows error notification when listRelationships fails", async () => {
    listRelationshipsMock.mockRejectedValue(new Error("network error"));
    renderWithMantine(<RelationshipPanel caseId="c1" entities={ENTITIES} />);

    await waitFor(() => {
      expect(notifShowMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Failed to load relationships" }),
      );
    });
  });

  it("calls listRelationships with correct caseId", async () => {
    listRelationshipsMock.mockResolvedValue([]);
    renderWithMantine(<RelationshipPanel caseId="case-77" entities={ENTITIES} />);

    await waitFor(() => {
      expect(listRelationshipsMock).toHaveBeenCalledWith("case-77", expect.any(Object));
    });
  });

  it("Create relationship button is disabled when entities list is empty", async () => {
    listRelationshipsMock.mockResolvedValue([]);
    renderWithMantine(<RelationshipPanel caseId="c1" entities={[]} />);

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /create relationship/i });
      expect(btn).toBeDisabled();
    });
  });

  it("opens create modal when button is clicked with entities available", async () => {
    listRelationshipsMock.mockResolvedValue([]);
    renderWithMantine(<RelationshipPanel caseId="c1" entities={ENTITIES} />);

    await waitFor(() => {
      expect(screen.getByText(/no relationships yet/i)).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /create relationship/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("Create Relationship")).toBeInTheDocument();
    });
  });
});
