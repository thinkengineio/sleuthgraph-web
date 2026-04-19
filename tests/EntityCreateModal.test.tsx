import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { EntityCreateModal } from "@/components/EntityCreateModal";
import { renderWithMantine } from "./test-utils";
import type { EntityRead } from "@/lib/api";

const { createEntityMock, notifShowMock } = vi.hoisted(() => ({
  createEntityMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  createEntity: createEntityMock,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
  Notifications: () => null,
}));

const ENTITY_RESULT: EntityRead = {
  id: "ent-abc",
  case_id: "c1",
  type: "EMAIL",
  label: "attacker@evil.com",
  confidence: 1.0,
  attrs: {},
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

describe("EntityCreateModal", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal() {
    return renderWithMantine(
      <EntityCreateModal caseId="c1" opened={true} onClose={onClose} onSuccess={onSuccess} />,
    );
  }

  it("renders form fields", () => {
    renderModal();
    expect(screen.getByText("Add Entity")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    expect(screen.getByText(/attrs/i)).toBeInTheDocument();
  });

  it("shows validation error when type not selected", async () => {
    renderModal();
    // Fill label but no type
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: "test label" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add entity/i }));
    await waitFor(() => {
      expect(screen.getByText(/entity type is required/i)).toBeInTheDocument();
    });
    expect(createEntityMock).not.toHaveBeenCalled();
  });

  it("shows invalid JSON notification when attrs is bad JSON", async () => {
    createEntityMock.mockResolvedValue(ENTITY_RESULT);
    renderModal();

    // Type selector: click the combobox input
    const typeInput = screen.getByPlaceholderText(/select entity type/i);
    fireEvent.click(typeInput);
    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Email"));

    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: "attacker@evil.com" },
    });

    // Put invalid JSON in attrs
    const attrsArea = screen.getByPlaceholderText(/source.*manual/i);
    fireEvent.change(attrsArea, { target: { value: "{not valid json" } });

    fireEvent.click(screen.getByRole("button", { name: /add entity/i }));

    await waitFor(() => {
      expect(notifShowMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Invalid JSON in attrs" }),
      );
    });
    expect(createEntityMock).not.toHaveBeenCalled();
  });

  it("calls createEntity with correct payload on valid submission", async () => {
    createEntityMock.mockResolvedValue(ENTITY_RESULT);
    renderModal();

    // Select type
    const typeInput = screen.getByPlaceholderText(/select entity type/i);
    fireEvent.click(typeInput);
    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Email"));

    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: "attacker@evil.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /add entity/i }));

    await waitFor(() => {
      expect(createEntityMock).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          type: "EMAIL",
          label: "attacker@evil.com",
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("does not close modal when closed", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
