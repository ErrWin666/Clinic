import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginGuard } from "@/routes/LoginGuard";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

describe("ProtectedRoute", () => {
  it("redirects to /login when unauthenticated", async () => {
    server.use(
      http.get(`${config.apiUrl}/auth/session-status`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "No session" } },
          { status: 401 }
        );
      })
    );
    renderWithProviders(
      <ProtectedRoute>
        <div>Dashboard Content</div>
      </ProtectedRoute>,
      { initialEntries: ["/dashboard"] }
    );
    await waitFor(() => {
      expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
    });
  });

  it("renders children when authenticated", async () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Dashboard Content</div>
      </ProtectedRoute>,
      { initialEntries: ["/dashboard"] }
    );
    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });
  });

  it("shows spinner while loading", async () => {
    server.use(
      http.get(`${config.apiUrl}/auth/session-status`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ success: true, data: { user: {} }, message: "Session active" });
      })
    );
    renderWithProviders(
      <ProtectedRoute>
        <div>Dashboard Content</div>
      </ProtectedRoute>,
      { initialEntries: ["/dashboard"] }
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("LoginGuard", () => {
  it("renders login page when admin exists and not authenticated", async () => {
    server.use(
      http.get(`${config.apiUrl}/setup/check-admin`, () => {
        return HttpResponse.json({
          success: true,
          data: { adminExists: true },
          message: "Admin exists",
        });
      }),
      http.get(`${config.apiUrl}/auth/session-status`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "No session" } },
          { status: 401 }
        );
      })
    );
    renderWithProviders(
      <LoginGuard>
        <div>Login Page Content</div>
      </LoginGuard>,
      { initialEntries: ["/login"] }
    );
    await waitFor(() => {
      expect(screen.getByText("Login Page Content")).toBeInTheDocument();
    });
  });

  it("redirects to /setup when no admin exists", async () => {
    server.use(
      http.get(`${config.apiUrl}/setup/check-admin`, () => {
        return HttpResponse.json({
          success: true,
          data: { adminExists: false },
          message: "No admin",
        });
      }),
      http.get(`${config.apiUrl}/auth/session-status`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "No session" } },
          { status: 401 }
        );
      })
    );
    renderWithProviders(
      <LoginGuard>
        <div>Login Page Content</div>
      </LoginGuard>,
      { initialEntries: ["/login"] }
    );
    await waitFor(() => {
      expect(screen.queryByText("Login Page Content")).not.toBeInTheDocument();
    });
  });

  it("redirects to /dashboard when authenticated", async () => {
    server.use(
      http.get(`${config.apiUrl}/setup/check-admin`, () => {
        return HttpResponse.json({
          success: true,
          data: { adminExists: true },
          message: "Admin exists",
        });
      })
    );
    renderWithProviders(
      <LoginGuard>
        <div>Login Page Content</div>
      </LoginGuard>,
      { initialEntries: ["/login"] }
    );
    await waitFor(() => {
      expect(screen.queryByText("Login Page Content")).not.toBeInTheDocument();
    });
  });
});
