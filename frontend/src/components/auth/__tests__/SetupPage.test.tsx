import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router";
import { renderWithProviders } from "@/test/test-utils";
import SetupPage from "@/pages/SetupPage";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

describe("SetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders setup form with all fields", () => {
    renderWithProviders(<SetupPage />, { initialEntries: ["/setup"] });
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clinic name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complete setup/i })).toBeInTheDocument();
  });

  it("validates password mismatch", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SetupPage />, { initialEntries: ["/setup"] });
    await user.type(screen.getByLabelText(/username/i), "admin");
    const passwordInputs = screen.getAllByLabelText(/password/i);
    await user.type(passwordInputs[0], "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Different123");
    await user.click(screen.getByRole("button", { name: /complete setup/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for short clinic name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SetupPage />, { initialEntries: ["/setup"] });
    await user.type(screen.getByLabelText(/username/i), "admin");
    const passwordInputs = screen.getAllByLabelText(/password/i);
    await user.type(passwordInputs[0], "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123");
    await user.type(screen.getByLabelText(/clinic name/i), "A");
    await user.click(screen.getByRole("button", { name: /complete setup/i }));
    await waitFor(() => {
      expect(screen.getByText(/>=2/i)).toBeInTheDocument();
    });
  });

  it("submits valid form and navigates to /login", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${config.apiUrl}/setup/create-admin`, () => {
        return HttpResponse.json({
          success: true,
          data: { id: 1, username: "admin", role: "admin" },
          message: "Admin created",
        });
      })
    );
    renderWithProviders(
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>,
      { initialEntries: ["/setup"] }
    );
    await user.type(screen.getByLabelText(/username/i), "admin");
    const passwordInputs = screen.getAllByLabelText(/password/i);
    await user.type(passwordInputs[0], "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123");
    await user.type(screen.getByLabelText(/clinic name/i), "Test Clinic");
    await user.click(screen.getByRole("button", { name: /complete setup/i }));
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("handles ADMIN_EXISTS error gracefully", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${config.apiUrl}/setup/create-admin`, () => {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "ADMIN_EXISTS", message: "Admin exists" },
            message: "Failed",
          },
          { status: 400 }
        );
      })
    );
    renderWithProviders(
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>,
      { initialEntries: ["/setup"] }
    );
    await user.type(screen.getByLabelText(/username/i), "admin");
    const passwordInputs = screen.getAllByLabelText(/password/i);
    await user.type(passwordInputs[0], "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123");
    await user.type(screen.getByLabelText(/clinic name/i), "Test Clinic");
    await user.click(screen.getByRole("button", { name: /complete setup/i }));
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });
});
