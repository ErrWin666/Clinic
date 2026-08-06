import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { DashboardPage } from "@/pages/DashboardPage";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

describe("DashboardPage", () => {
  it("renders stat cards with data", async () => {
    renderWithProviders(<DashboardPage />, { initialEntries: ["/dashboard"] });
    await waitFor(() => {
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("renders dashboard title", async () => {
    renderWithProviders(<DashboardPage />, { initialEntries: ["/dashboard"] });
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get(`${config.apiUrl}/dashboard/stats`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "INTERNAL_ERROR", message: "Error" } },
          { status: 500 }
        );
      })
    );
    renderWithProviders(<DashboardPage />, { initialEntries: ["/dashboard"] });
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it("shows loading skeleton initially", () => {
    server.use(
      http.get(`${config.apiUrl}/dashboard/stats`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ success: true, data: {}, message: "" });
      })
    );
    const { container } = renderWithProviders(<DashboardPage />, { initialEntries: ["/dashboard"] });
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("displays currency in stats", async () => {
    renderWithProviders(<DashboardPage />, { initialEntries: ["/dashboard"] });
    await waitFor(() => {
      expect(screen.getByText("50")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/USD/i).length).toBeGreaterThan(0);
  });
});
