import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import CasesListPage from "@/app/cases/page";
import { renderWithMantine } from "./test-utils";
import type { Case } from "@/lib/api";

// Hoist everything that's needed inside vi.mock factories
const {
  listCasesMock,
  createCaseMock,
  updateCaseMock,
  deleteCaseMock,
  STABLE_USER,
} = vi.hoisted(() => {
  const STABLE_USER = {
    id: "u1",
    email: "admin@local.dev",
    is_active: true,
    is_superuser: true,
    is_verified: true,
    name: null as string | null,
  };
  return {
    listCasesMock: vi.fn(),
    createCaseMock: vi.fn(),
    updateCaseMock: vi.fn(),
    deleteCaseMock: vi.fn(),
    STABLE_USER,
  };
});

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

// Mock @mantine/notifications
vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
  Notifications: () => null,
}));

// Mock AuthContext — use STABLE_USER so the user reference doesn't change between
// renders (new object refs in the mock would trigger infinite useEffect loops)
vi.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({
    user: STABLE_USER,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the API module
vi.mock("@/lib/api", () => ({
  listCases: listCasesMock,
  createCase: createCaseMock,
  updateCase: updateCaseMock,
  deleteCase: deleteCaseMock,
}));

const CASE_FIXTURE: Case = {
  id: "c1",
  owner_id: "u1",
  name: "Operation Lighthouse",
  status: "active",
  tags: ["osint", "phishing"],
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T10:00:00Z",
};

describe("CasesListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when API returns no cases", async () => {
    listCasesMock.mockResolvedValue([]);
    renderWithMantine(<CasesListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no cases yet/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /create your first case/i })).toBeInTheDocument();
  });

  it("renders cases table when API returns cases", async () => {
    listCasesMock.mockResolvedValue([CASE_FIXTURE]);
    renderWithMantine(<CasesListPage />);

    await waitFor(() => {
      expect(screen.getByText("Operation Lighthouse")).toBeInTheDocument();
    });
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("osint")).toBeInTheDocument();
    expect(screen.getByText("phishing")).toBeInTheDocument();
  });

  it("opens create modal when 'New case' button is clicked", async () => {
    listCasesMock.mockResolvedValue([]);
    renderWithMantine(<CasesListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no cases yet/i)).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button", { name: /new case/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /new case/i })).toBeInTheDocument();
    });
  });

  it("submits create form and calls createCase", async () => {
    const created: Case = { ...CASE_FIXTURE, id: "c2", name: "Test Case" };

    listCasesMock
      .mockResolvedValueOnce([])        // initial load
      .mockResolvedValueOnce([created]); // refresh after create

    createCaseMock.mockResolvedValue(created);

    renderWithMantine(<CasesListPage />);

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/no cases yet/i)).toBeInTheDocument();
    });

    // Open modal
    const newCaseButtons = screen.getAllByRole("button", { name: /new case/i });
    fireEvent.click(newCaseButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /new case/i })).toBeInTheDocument();
    });

    // Fill in the name field
    const nameInput = screen.getByPlaceholderText(/operation lighthouse/i);
    fireEvent.change(nameInput, { target: { value: "Test Case" } });

    // Submit the form
    const modalForm = nameInput.closest("form");
    if (!modalForm) throw new Error("Modal form not found");
    fireEvent.submit(modalForm);

    // createCase should be called with the name
    await waitFor(
      () => {
        expect(createCaseMock).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });
});
