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

// Mock getAuthConfig so the new login page effect has a stable signal source.
const { getAuthConfigMock } = vi.hoisted(() => ({ getAuthConfigMock: vi.fn() }));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, getAuthConfig: getAuthConfigMock };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: OIDC status returns enabled=false.  mockImplementation so each
    // call gets a fresh Response (body streams are single-use).
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ enabled: false }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    );

    // Default: auth config — all features off.
    getAuthConfigMock.mockResolvedValue({
      signup_enabled: false,
      password_reset_enabled: false,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
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
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ color: "red" }));
    });
  });

  it("shows SSO button and redirects on click when OIDC is enabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ enabled: true, issuer: "https://sso.example.com" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    );

    // jsdom window.location is non-assignable by default; stub it.
    const original = window.location;
    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, href: "", assign: assignMock },
    });

    renderWithMantine(<LoginPage />);
    const ssoBtn = await screen.findByRole("button", { name: /sign in with sso/i });
    expect(ssoBtn).not.toBeDisabled();
    fireEvent.click(ssoBtn);
    expect(window.location.href).toContain("/auth/oidc/login");

    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  it("renders 'Forgot password?' link when password_reset_enabled=true", async () => {
    getAuthConfigMock.mockResolvedValue({
      signup_enabled: false,
      password_reset_enabled: true,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    renderWithMantine(<LoginPage />);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /forgot your password/i })).toBeInTheDocument();
    });
  });

  it("renders 'Register' link when signup_enabled=true", async () => {
    getAuthConfigMock.mockResolvedValue({
      signup_enabled: true,
      password_reset_enabled: false,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    renderWithMantine(<LoginPage />);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^register$/i })).toBeInTheDocument();
    });
  });

  it("hides forgot/register links when both features are disabled", async () => {
    getAuthConfigMock.mockResolvedValue({
      signup_enabled: false,
      password_reset_enabled: false,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    renderWithMantine(<LoginPage />);
    // After mount + effect resolution
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /forgot your password/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: /^register$/i })).not.toBeInTheDocument();
  });
});
