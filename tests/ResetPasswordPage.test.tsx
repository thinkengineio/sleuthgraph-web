import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithMantine } from "./test-utils";

const { apiResetPasswordMock, routerPushMock, notifShowMock, searchParamsGet } = vi.hoisted(() => ({
  apiResetPasswordMock: vi.fn(),
  routerPushMock: vi.fn(),
  notifShowMock: vi.fn(),
  searchParamsGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiResetPassword: apiResetPasswordMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
  useSearchParams: () => ({ get: searchParamsGet }),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
}));

import ResetPasswordPage from "@/app/reset-password/page";

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows 'missing reset link' when token param is absent", async () => {
    searchParamsGet.mockReturnValue(null);
    renderWithMantine(<ResetPasswordPage />);
    expect(await screen.findByText(/Missing reset link/i)).toBeInTheDocument();
  });

  it("renders the password form when token is present", async () => {
    searchParamsGet.mockReturnValue("valid-token");
    renderWithMantine(<ResetPasswordPage />);
    expect(await screen.findByLabelText(/New password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Repeat the password/i)).toBeInTheDocument();
  });

  it("calls apiResetPassword and redirects on success", async () => {
    searchParamsGet.mockReturnValue("valid-token");
    apiResetPasswordMock.mockResolvedValueOnce(undefined);
    renderWithMantine(<ResetPasswordPage />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/New password/i), "newpassword1");
    await user.type(screen.getByPlaceholderText(/Repeat the password/i), "newpassword1");
    await user.click(screen.getByRole("button", { name: /Update password/i }));

    await waitFor(() =>
      expect(apiResetPasswordMock).toHaveBeenCalledWith("valid-token", "newpassword1"),
    );
    await waitFor(() => expect(routerPushMock).toHaveBeenCalledWith("/login"));
  });

  it("shows error notification on invalid token (400)", async () => {
    searchParamsGet.mockReturnValue("bad-token");
    apiResetPasswordMock.mockRejectedValueOnce(
      new Error("Invalid or expired reset link. Request a new one."),
    );
    renderWithMantine(<ResetPasswordPage />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/New password/i), "newpassword1");
    await user.type(screen.getByPlaceholderText(/Repeat the password/i), "newpassword1");
    await user.click(screen.getByRole("button", { name: /Update password/i }));

    await waitFor(() =>
      expect(notifShowMock).toHaveBeenCalledWith(expect.objectContaining({ color: "red" })),
    );
  });
});
