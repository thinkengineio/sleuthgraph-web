import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EntityTable } from "@/components/EntityTable";
import { renderWithMantine } from "./test-utils";
import type { EntityRead } from "@/lib/api";

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
  Notifications: () => null,
}));

const ENTITY_PERSON: EntityRead = {
  id: "ent-1111-0000-0000-0000-000000000001",
  case_id: "c1",
  type: "PERSON",
  label: "Alice Smith",
  confidence: 0.95,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

const ENTITY_DOMAIN: EntityRead = {
  id: "ent-2222-0000-0000-0000-000000000002",
  case_id: "c1",
  type: "DOMAIN",
  label: "evil-c2.example.com",
  confidence: 0.8,
  attrs: { source: "passive-dns" },
  created_at: "2026-04-17T11:00:00Z",
  updated_at: "2026-04-17T11:00:00Z",
};

describe("EntityTable", () => {
  const onViewDetail = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no items", () => {
    renderWithMantine(<EntityTable items={[]} onViewDetail={onViewDetail} onDelete={onDelete} />);
    expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
  });

  it("renders table headers when items present", () => {
    renderWithMantine(
      <EntityTable items={[ENTITY_PERSON]} onViewDetail={onViewDetail} onDelete={onDelete} />,
    );
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders two rows of different types", () => {
    renderWithMantine(
      <EntityTable
        items={[ENTITY_PERSON, ENTITY_DOMAIN]}
        onViewDetail={onViewDetail}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("evil-c2.example.com")).toBeInTheDocument();
    // Both type badges should be visible
    expect(screen.getByText("Person")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
    // Confidence values
    expect(screen.getByText("0.95")).toBeInTheDocument();
    expect(screen.getByText("0.80")).toBeInTheDocument();
  });

  it("calls onViewDetail when view button is clicked", () => {
    renderWithMantine(
      <EntityTable items={[ENTITY_PERSON]} onViewDetail={onViewDetail} onDelete={onDelete} />,
    );
    const viewBtn = screen.getByRole("button", { name: /view entity details/i });
    fireEvent.click(viewBtn);
    expect(onViewDetail).toHaveBeenCalledWith(ENTITY_PERSON);
  });

  it("calls onDelete when delete button is clicked", () => {
    renderWithMantine(
      <EntityTable items={[ENTITY_PERSON]} onViewDetail={onViewDetail} onDelete={onDelete} />,
    );
    const deleteBtn = screen.getByRole("button", { name: /delete entity/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(ENTITY_PERSON);
  });
});
