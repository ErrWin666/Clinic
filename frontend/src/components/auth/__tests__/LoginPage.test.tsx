import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import LoginPage from "@/pages/LoginPage";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";
import i18n from "@/lib/i18n";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with username and password fields", () => {
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows validation error for short username", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/>=3/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "123");
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/>=6/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
    const toggleButton = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("submits valid form and shows loading state", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${config.apiUrl}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({
          success: true,
          data: { user: { id: 1, username: "admin", role: "admin" } },
          message: "OK",
        });
      })
    );
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "Admin@123");
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
    });
  });

  it("shows error toast on invalid credentials", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${config.apiUrl}/auth/login`, () => {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "INVALID_CREDENTIALS", message: "Invalid" },
            message: "Failed",
          },
          { status: 401 }
        );
      })
    );
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${config.apiUrl}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          data: { user: { id: 1, username: "admin", role: "admin" } },
          message: "OK",
        });
      })
    );
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "Admin@123");
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
    });
  });

  it("displays i18n labels in Arabic", async () => {
    await i18n.changeLanguage("ar");
    renderWithProviders(<LoginPage />, { initialEntries: ["/login"] });
    expect(screen.getByLabelText(/اسم المستخدم/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تسجيل الدخول/i })).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });
});
