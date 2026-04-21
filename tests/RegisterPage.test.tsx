import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithMantine } from "./test-utils";

const { getAuthConfigMock, apiRegisterMock, routerPushMock, notifShowMock } = vi.hoisted(() => ({
  getAuthConfigMock: vi.fn(),
  apiRegisterMock: vi.fn(),
  routerPushMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getAuthConfig: getAuthConfigMock,
  apiRegister: apiRegisterMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
}));

import RegisterPage from "@/app/register/page";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows disabled message when signup_enabled=false", async () => {
    getAuthConfigMock.mockResolvedValueOnce({
      signup_enabled: false,
      password_reset_enabled: true,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    renderWithMantine(<RegisterPage />);
    expect(await screen.findByText(/Registration disabled/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact your administrator/i)).toBeInTheDocument();
  });

  it("renders the form when signup_enabled=true", async () => {
    getAuthConfigMock.mockResolvedValueOnce({
      signup_enabled: true,
      password_reset_enabled: true,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    renderWithMantine(<RegisterPage />);
    expect(await screen.findByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Repeat the password/i)).toBeInTheDocument();
  });

  it("rejects mismatched passwords", async () => {
    getAuthConfigMock.mockResolvedValueOnce({
      signup_enabled: true,
      password_reset_enabled: true,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    renderWithMantine(<RegisterPage />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Email/i), "new@example.com");
    await user.type(screen.getByPlaceholderText(/At least 8 characters/i), "hunter222");
    await user.type(screen.getByPlaceholderText(/Repeat the password/i), "different");
    await user.click(screen.getByRole("button", { name: /Create account/i }));
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(apiRegisterMock).not.toHaveBeenCalled();
  });

  it("calls apiRegister and redirects on success", async () => {
    getAuthConfigMock.mockResolvedValueOnce({
      signup_enabled: true,
      password_reset_enabled: true,
      email_verify_enabled: false,
      oidc_enabled: false,
    });
    apiRegisterMock.mockResolvedValueOnce({
      id: "x",
      email: "new@example.com",
      is_active: true,
      is_superuser: false,
      is_verified: false,
      name: "New",
    });
    renderWithMantine(<RegisterPage />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Email/i), "new@example.com");
    await user.type(screen.getByLabelText(/Name/i), "New");
    await user.type(screen.getByPlaceholderText(/At least 8 characters/i), "hunter222");
    await user.type(screen.getByPlaceholderText(/Repeat the password/i), "hunter222");
    await user.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() =>
      expect(apiRegisterMock).toHaveBeenCalledWith("new@example.com", "hunter222", "New"),
    );
    await waitFor(() => expect(routerPushMock).toHaveBeenCalledWith("/login"));
  });
});
