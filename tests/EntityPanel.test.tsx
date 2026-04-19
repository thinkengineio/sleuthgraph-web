import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EntityPanel } from "@/components/EntityPanel";
import { renderWithMantine } from "./test-utils";
import type { EntityRead } from "@/lib/api";

const { listEntitiesMock, deleteEntityMock, notifShowMock } = vi.hoisted(() => ({
  listEntitiesMock: vi.fn(),
  deleteEntityMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listEntities: listEntitiesMock,
  deleteEntity: deleteEntityMock,
  createEntity: vi.fn(),
  updateEntity: vi.fn(),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
  Notifications: () => null,
}));

const ENTITY_FIXTURE: EntityRead = {
  id: "ent-0001",
  case_id: "c1",
  type: "PERSON",
  label: "Bob Suspect",
  confidence: 0.9,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

describe("EntityPanel", () => {
  const onEntitiesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when API returns no entities", async () => {
    listEntitiesMock.mockResolvedValue([]);
    renderWithMantine(<EntityPanel caseId="c1" onEntitiesChange={onEntitiesChange} />);

    await waitFor(() => {
      expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
    });
    expect(onEntitiesChange).toHaveBeenCalledWith([]);
  });

  it("shows entity rows when API returns entities", async () => {
    listEntitiesMock.mockResolvedValue([ENTITY_FIXTURE]);
    renderWithMantine(<EntityPanel caseId="c1" onEntitiesChange={onEntitiesChange} />);

    await waitFor(() => {
      expect(screen.getByText("Bob Suspect")).toBeInTheDocument();
    });
    expect(onEntitiesChange).toHaveBeenCalledWith([ENTITY_FIXTURE]);
  });

  it("shows error notification when listEntities fails", async () => {
    listEntitiesMock.mockRejectedValue(new Error("network error"));
    renderWithMantine(<EntityPanel caseId="c1" />);

    await waitFor(() => {
      expect(notifShowMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Failed to load entities" }),
      );
    });
  });

  it("calls listEntities with the correct caseId", async () => {
    listEntitiesMock.mockResolvedValue([]);
    renderWithMantine(<EntityPanel caseId="case-99" />);

    await waitFor(() => {
      expect(listEntitiesMock).toHaveBeenCalledWith("case-99", expect.any(Object));
    });
  });

  it("opens create modal when Add entity button is clicked", async () => {
    listEntitiesMock.mockResolvedValue([]);
    renderWithMantine(<EntityPanel caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText(/no entities yet/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /add entity/i }));

    await waitFor(() => {
      expect(screen.getByText("Add Entity")).toBeInTheDocument();
    });
  });
});
