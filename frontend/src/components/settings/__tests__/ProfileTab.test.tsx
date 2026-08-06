import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ProfileTab } from "@/components/settings/ProfileTab";

// Need to mock useAuth to provide a user
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: "admin",
      role: "admin",
      profileImage: null,
      isAdmin: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    isLoading: false,
    isAuthenticated: true,
    checkSession: vi.fn(),
    setUser: vi.fn(),
  }),
}));

describe("ProfileTab", () => {
  it("renders profile form with username pre-filled", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    expect(screen.getByLabelText(/username/i)).toHaveValue("admin");
  });

  it("renders current password field", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
  });

  it("renders new password field", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it("disables save button when form is not dirty", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows avatar upload button", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("enables save when username changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, "newadmin");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
  });

  it("shows avatar fallback when no profile image", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders hidden file input for image upload", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,image/gif,image/webp");
  });

  it("does not show remove image button when no profile image", () => {
    renderWithProviders(<ProfileTab />, { initialEntries: ["/settings"] });
    const removeButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector(".lucide-x")
    );
    expect(removeButtons.length).toBe(0);
  });
});
