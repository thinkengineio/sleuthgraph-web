import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import LoginPage from "@/app/login/page";
import { renderWithMantine } from "./test-utils";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

// Mock @mantine/notifications
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
  Notifications: () => null,
}));

// Mock AuthContext so we control login()
const loginMock = vi.fn();
vi.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: loginMock,
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: OIDC status returns enabled=false
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ enabled: false }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  it("renders email and password inputs", async () => {
    renderWithMantine(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("submits form and calls login with email and password", async () => {
    loginMock.mockResolvedValue({ ok: true });
    renderWithMantine(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@local.dev" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "adminpass1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("admin@local.dev", "adminpass1");
    });
  });

  it("redirects to / on successful login", async () => {
    loginMock.mockResolvedValue({ ok: true });
    renderWithMantine(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@local.dev" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "adminpass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("shows error notification on 401 failure", async () => {
    const { notifications } = await import("@mantine/notifications");
    loginMock.mockResolvedValue({ ok: false, error: "Invalid credentials" });
    renderWithMantine(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "badpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: "red" }),
      );
    });
  });

  it("shows SSO button as disabled when OIDC is enabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ enabled: true, issuer: "https://sso.example.com" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    renderWithMantine(<LoginPage />);

    await waitFor(() => {
      const ssoBtn = screen.getByRole("button", { name: /sign in with sso/i });
      expect(ssoBtn).toBeDisabled();
    });
  });
});
