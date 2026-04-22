import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MantineProvider } from "@mantine/core";
import { ENTITY_TYPES, type EntityType } from "@/lib/entityTypes";
import { GraphToolbar } from "@/components/graph/GraphToolbar";

function renderToolbar(overrides: Partial<Parameters<typeof GraphToolbar>[0]> = {}) {
  const defaults = {
    layoutName: "cose-bilkent" as const,
    onLayoutChange: vi.fn(),
    visibleTypes: new Set<EntityType>(ENTITY_TYPES),
    onVisibleTypesChange: vi.fn(),
    searchQuery: "",
    onSearchChange: vi.fn(),
    entityCount: 5,
    relationshipCount: 3,
    onFit: vi.fn(),
    onExport: vi.fn(),
  };
  return render(
    <MantineProvider>
      <GraphToolbar {...defaults} {...overrides} />
    </MantineProvider>,
  );
}

describe("GraphToolbar", () => {
  it("renders stat text with entity and relationship counts", () => {
    renderToolbar({ entityCount: 7, relationshipCount: 4 });
    expect(screen.getByText(/7/)).toBeInTheDocument();
    expect(screen.getByText(/4/)).toBeInTheDocument();
  });

  it("calls onSearchChange when user types in search box", async () => {
    const onSearchChange = vi.fn();
    renderToolbar({ onSearchChange });
    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, "hello");
    expect(onSearchChange).toHaveBeenCalled();
    const lastArg = onSearchChange.mock.calls[onSearchChange.mock.calls.length - 1][0];
    expect(typeof lastArg).toBe("string");
  });

  it("calls onFit when fit button is clicked", async () => {
    const onFit = vi.fn();
    renderToolbar({ onFit });
    const fitBtn = screen.getByTitle(/fit/i);
    await userEvent.click(fitBtn);
    expect(onFit).toHaveBeenCalledOnce();
  });

  it("calls onExport when export button is clicked", async () => {
    const onExport = vi.fn();
    renderToolbar({ onExport });
    const exportBtn = screen.getByTitle(/export/i);
    await userEvent.click(exportBtn);
    expect(onExport).toHaveBeenCalledOnce();
  });
});
