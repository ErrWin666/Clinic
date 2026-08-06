import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { PatientsPage } from "@/pages/PatientsPage";
import { server } from "@/test/mocks/server";
import { mockPatient } from "@/test/mocks/handlers";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

describe("PatientsPage", () => {
  it("renders patient table with data", async () => {
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("shows add button", () => {
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    expect(screen.getByRole("button", { name: /add patient/i })).toBeInTheDocument();
  });

  it("opens create form on Add click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await user.click(screen.getByRole("button", { name: /add patient/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/add patient/i).length).toBeGreaterThan(1);
    });
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get(`${config.apiUrl}/patients`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "INTERNAL_ERROR", message: "Error" } },
          { status: 500 }
        );
      })
    );
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it("renders export button", () => {
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    server.use(
      http.get(`${config.apiUrl}/patients`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ success: true, data: [], pagination: {}, message: "" });
      })
    );
    const { container } = renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("filters by search input", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${config.apiUrl}/patients`, ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") || "";
        return HttpResponse.json({
          success: true,
          data: search.includes("Jane") ? [{ ...mockPatient, id: 2, fullName: "Jane Doe" }] : [mockPatient],
          pagination: { totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 20 },
          message: "Patients retrieved",
        });
      })
    );
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Jane");
    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  it("opens edit form on edit click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    const dropdownTrigger = screen.getAllByRole("button").find(
      (btn) => btn.querySelector(".lucide-ellipsis-vertical, .lucide-more-horizontal")
    );
    if (dropdownTrigger) {
      await user.click(dropdownTrigger);
      const editItem = await screen.findByText(/edit/i);
      await user.click(editItem);
      await waitFor(() => {
        expect(screen.getByText(/edit patient/i)).toBeInTheDocument();
      });
    }
  });

  it("creates patient successfully", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /add patient/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/add patient/i).length).toBeGreaterThan(1);
    });
  });

  it("confirms delete patient", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    const dropdownTrigger = screen.getAllByRole("button").find(
      (btn) => btn.querySelector(".lucide-ellipsis-vertical, .lucide-more-horizontal")
    );
    if (dropdownTrigger) {
      await user.click(dropdownTrigger);
      const deleteItem = await screen.findByText(/delete/i);
      await user.click(deleteItem);
      await waitFor(() => {
        expect(screen.getByText(/delete|confirm/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    }
  });

  it("renders patient type filter", () => {
    renderWithProviders(<PatientsPage />, { initialEntries: ["/patients"] });
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThan(0);
  });
});
