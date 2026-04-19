import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Test CaseDetailContent directly
import { CaseDetailContent } from "@/app/cases/[caseId]/page";
import { renderWithMantine } from "./test-utils";
import type { Case } from "@/lib/api";

// Hoist everything needed inside vi.mock factories
const { getCaseMock, updateCaseMock, deleteCaseMock, listEvidenceMock, STABLE_USER } = vi.hoisted(
  () => {
    const STABLE_USER = {
      id: "u1",
      email: "admin@local.dev",
      is_active: true,
      is_superuser: true,
      is_verified: true,
      name: null as string | null,
    };
    return {
      getCaseMock: vi.fn(),
      updateCaseMock: vi.fn(),
      deleteCaseMock: vi.fn(),
      listEvidenceMock: vi.fn(),
      STABLE_USER,
    };
  },
);

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
  useParams: () => ({ caseId: "c1" }),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
  Notifications: () => null,
}));

// Use STABLE_USER to avoid infinite useEffect loops from new object refs
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

vi.mock("@/lib/api", () => ({
  getCase: getCaseMock,
  updateCase: updateCaseMock,
  deleteCase: deleteCaseMock,
  listEvidence: listEvidenceMock,
  evidenceBlobUrl: (caseId: string, evId: string) =>
    `http://localhost:8000/cases/${caseId}/evidence/${evId}/blob`,
}));

const CASE_FIXTURE: Case = {
  id: "c1",
  owner_id: "u1",
  name: "Operation Lighthouse",
  status: "active",
  tags: ["osint", "phishing"],
  created_at: "2026-04-17T10:00:00Z",
  updated_at: "2026-04-17T11:30:00Z",
};

describe("CaseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty evidence list so EvidencePanel doesn't throw
    listEvidenceMock.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
  });

  it("renders case details from mocked fetch", async () => {
    getCaseMock.mockResolvedValue(CASE_FIXTURE);
    renderWithMantine(<CaseDetailContent caseId="c1" />);

    await waitFor(() => {
      expect(screen.getByText("Operation Lighthouse")).toBeInTheDocument();
    });

    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Operation Lighthouse")).toBeInTheDocument();
    // Evidence panel heading
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    // Entities placeholder still present
    expect(screen.getByText(/coming next phase/i)).toBeInTheDocument();
  });

  it("shows 'not found' message on 404", async () => {
    getCaseMock.mockResolvedValue(null);
    renderWithMantine(<CaseDetailContent caseId="nonexistent" />);

    await waitFor(() => {
      expect(screen.getByText(/case not found or you don.t have access/i)).toBeInTheDocument();
    });
  });
});
