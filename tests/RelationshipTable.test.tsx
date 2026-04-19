import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RelationshipTable } from "@/components/RelationshipTable";
import { renderWithMantine } from "./test-utils";
import type { EntityRead, RelationshipRead } from "@/lib/api";

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
  Notifications: () => null,
}));

const ENTITY_SRC: EntityRead = {
  id: "ent-src",
  case_id: "c1",
  type: "PERSON",
  label: "Alice",
  confidence: 1.0,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

const ENTITY_DST: EntityRead = {
  id: "ent-dst",
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
  src_entity_id: "ent-src",
  dst_entity_id: "ent-dst",
  rel_type: "OWNS",
  confidence: 0.85,
  source_plugin: "passive-dns",
  attrs: {},
  created_at: "2026-04-17T12:00:00Z",
};

describe("RelationshipTable", () => {
  const onViewDetail = vi.fn();
  const onDelete = vi.fn();
  const entities = [ENTITY_SRC, ENTITY_DST];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no items", () => {
    renderWithMantine(
      <RelationshipTable
        items={[]}
        entities={entities}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText(/no relationships yet/i)).toBeInTheDocument();
  });

  it("renders table headers when items present", () => {
    renderWithMantine(
      <RelationshipTable
        items={[REL_FIXTURE]}
        entities={entities}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText("SRC → DST")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders src/dst labels resolved from entities prop", () => {
    renderWithMantine(
      <RelationshipTable
        items={[REL_FIXTURE]}
        entities={entities}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    // Entity labels should appear as badge content
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("evil.com")).toBeInTheDocument();
    // rel_type badge
    expect(screen.getByText("OWNS")).toBeInTheDocument();
    // source_plugin
    expect(screen.getByText("passive-dns")).toBeInTheDocument();
  });

  it("shows truncated ID when entity not in entities prop", () => {
    const relWithUnknownEntity: RelationshipRead = {
      ...REL_FIXTURE,
      src_entity_id: "unknown-entity-id-xyz",
    };
    renderWithMantine(
      <RelationshipTable
        items={[relWithUnknownEntity]}
        entities={[ENTITY_DST]}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    // Should show truncated ID (first 8 chars) for unknown src entity
    // "unknown-entity-id-xyz".slice(0, 8) === "unknown-"
    expect(screen.getByText("unknown-\u2026")).toBeInTheDocument();
  });

  it("calls onViewDetail when view button is clicked", () => {
    renderWithMantine(
      <RelationshipTable
        items={[REL_FIXTURE]}
        entities={entities}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    const viewBtn = screen.getByRole("button", { name: /view relationship details/i });
    fireEvent.click(viewBtn);
    expect(onViewDetail).toHaveBeenCalledWith(REL_FIXTURE);
  });

  it("calls onDelete when delete button is clicked", () => {
    renderWithMantine(
      <RelationshipTable
        items={[REL_FIXTURE]}
        entities={entities}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    const deleteBtn = screen.getByRole("button", { name: /delete relationship/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(REL_FIXTURE);
  });
});
