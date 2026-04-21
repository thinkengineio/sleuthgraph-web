import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithMantine } from "./test-utils";

const { apiForgotPasswordMock, notifShowMock } = vi.hoisted(() => ({
  apiForgotPasswordMock: vi.fn(),
  notifShowMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiForgotPassword: apiForgotPasswordMock,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: notifShowMock },
}));

import ForgotPasswordPage from "@/app/forgot-password/page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the email input initially", () => {
    renderWithMantine(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send reset link/i })).toBeInTheDocument();
  });

  it("shows neutral 'link sent' message on submit, including for unknown emails", async () => {
    apiForgotPasswordMock.mockResolvedValueOnce(undefined);
    renderWithMantine(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email/i), "ghost@example.com");
    await user.click(screen.getByRole("button", { name: /Send reset link/i }));

    await waitFor(() => expect(apiForgotPasswordMock).toHaveBeenCalledWith("ghost@example.com"));
    expect(await screen.findByText(/a reset link has been sent/i)).toBeInTheDocument();
  });

  it("shows an error notification on 5xx failure", async () => {
    apiForgotPasswordMock.mockRejectedValueOnce(new Error("Server error 502"));
    renderWithMantine(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email/i), "admin@example.com");
    await user.click(screen.getByRole("button", { name: /Send reset link/i }));

    await waitFor(() =>
      expect(notifShowMock).toHaveBeenCalledWith(expect.objectContaining({ color: "red" })),
    );
  });
});
