import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RelationshipCreateModal } from "@/components/RelationshipCreateModal";
import { renderWithMantine } from "./test-utils";
import type { EntityRead } from "@/lib/api";

const { createRelationshipMock, notifShowMock } = vi.hoisted(() => ({
  createRelationshipMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  createRelationship: createRelationshipMock,
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

const ENTITIES = [ENTITY_A, ENTITY_B];

describe("RelationshipCreateModal", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderModal() {
    return renderWithMantine(
      <RelationshipCreateModal
        caseId="c1"
        entities={ENTITIES}
        opened={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );
  }

  it("renders modal with required form fields", () => {
    renderModal();
    expect(screen.getByText("Create Relationship")).toBeInTheDocument();
    expect(screen.getByText("Source entity")).toBeInTheDocument();
    expect(screen.getByText("Destination entity")).toBeInTheDocument();
    expect(screen.getByText("Relationship type")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
  });

  it("src select is searchable and shows entity options when clicked", async () => {
    renderModal();
    const srcInput = screen.getAllByPlaceholderText(/search entities/i)[0];
    fireEvent.click(srcInput);
    await waitFor(() => {
      const aliceOpts = screen.getAllByText("Person: Alice");
      expect(aliceOpts.length).toBeGreaterThan(0);
    });
    const evilOpts = screen.getAllByText("Domain: evil.com");
    expect(evilOpts.length).toBeGreaterThan(0);
  });

  it("dst select is searchable and shows entity options when clicked", async () => {
    renderModal();
    const dstInput = screen.getAllByPlaceholderText(/search entities/i)[1];
    fireEvent.click(dstInput);
    await waitFor(() => {
      const aliceOpts = screen.getAllByText("Person: Alice");
      expect(aliceOpts.length).toBeGreaterThan(0);
    });
  });

  it("renders all 8 relationship types in the type select", async () => {
    renderModal();
    const relTypeInput = screen.getAllByPlaceholderText(/select type/i)[0];
    fireEvent.click(relTypeInput);
    await waitFor(() => {
      expect(screen.getByText("OWNS")).toBeInTheDocument();
    });
    expect(screen.getByText("EMPLOYED_BY")).toBeInTheDocument();
    expect(screen.getByText("REGISTERED_BY")).toBeInTheDocument();
    expect(screen.getByText("HOSTED_ON")).toBeInTheDocument();
    expect(screen.getByText("RESOLVES_TO")).toBeInTheDocument();
    expect(screen.getByText("ASSOCIATED_WITH")).toBeInTheDocument();
    expect(screen.getByText("COMMUNICATED_WITH")).toBeInTheDocument();
    expect(screen.getByText("MENTIONS")).toBeInTheDocument();
  });

  it("shows validation errors when required selects are empty on submit", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /create relationship/i }));
    await waitFor(() => {
      expect(screen.getByText(/source entity is required/i)).toBeInTheDocument();
    });
    expect(createRelationshipMock).not.toHaveBeenCalled();
  });

  it("shows required field error when source entity is missing despite invalid attrs", async () => {
    renderModal();
    // Enter bad JSON in attrs without selecting required selects — required-field
    // validation fires first, so the attrs parse error is never reached.
    const attrsArea = screen.getByPlaceholderText(/note/i);
    fireEvent.change(attrsArea, { target: { value: "{not valid json" } });

    fireEvent.click(screen.getByRole("button", { name: /create relationship/i }));
    await waitFor(() => {
      expect(screen.getByText(/source entity is required/i)).toBeInTheDocument();
    });
    expect(createRelationshipMock).not.toHaveBeenCalled();
  });

  it("shows self-loop error when source and destination are the same entity", async () => {
    renderModal();
    const user = userEvent.setup();
    const [srcInput, dstInput] = screen.getAllByPlaceholderText(/search entities/i);

    // Select "Person: Alice" (ent-aaa) as source via combobox option
    await user.click(srcInput);
    await waitFor(() => {
      const opts = document.querySelectorAll("[data-combobox-option][value='ent-aaa']");
      expect(opts.length).toBeGreaterThan(0);
    });
    await user.click(document.querySelector("[data-combobox-option][value='ent-aaa']") as HTMLElement);

    // Select the same entity (ent-aaa) as destination
    await user.click(dstInput);
    await waitFor(() => {
      const opts = document.querySelectorAll("[data-combobox-option][value='ent-aaa']");
      expect(opts.length).toBeGreaterThan(0);
    });
    const dstOpts = document.querySelectorAll("[data-combobox-option][value='ent-aaa']");
    await user.click(dstOpts[dstOpts.length - 1] as HTMLElement);

    // Select a relationship type to satisfy that validator
    const relTypeInput = screen.getAllByPlaceholderText(/select type/i)[0];
    await user.click(relTypeInput);
    await waitFor(() => {
      expect(screen.getByText("OWNS")).toBeInTheDocument();
    });
    await user.click(screen.getByText("OWNS"));

    // Submit
    await user.click(screen.getByRole("button", { name: /create relationship/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/source and destination must be different entities/i),
      ).toBeInTheDocument();
    });
    expect(createRelationshipMock).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
