import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useInvoices, useChangeInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const defaultParams = {
  search: "",
  status: "",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  page: 1,
};

describe("useInvoices", () => {
  it("fetches invoices list", async () => {
    const { result } = renderHookWithProviders(() => useInvoices(defaultParams));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].displayId).toBe("INV-0001");
  });

  it("returns pagination metadata", async () => {
    const { result } = renderHookWithProviders(() => useInvoices(defaultParams));

    await waitFor(() => {
      expect(result.current.pagination).toBeDefined();
    });

    expect(result.current.pagination?.totalItems).toBe(1);
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get(`${config.apiUrl}/invoices`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "INTERNAL_ERROR", message: "Error" } },
          { status: 500 }
        );
      })
    );

    const { result } = renderHookWithProviders(() => useInvoices(defaultParams));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("changes invoice status successfully", async () => {
    const { result } = renderHookWithProviders(() => ({
      query: useInvoices(defaultParams),
      mutation: useChangeInvoiceStatus(),
    }));

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false);
    });

    await result.current.mutation.changeStatus({ id: 1, status: "paid" });

    await waitFor(() => {
      expect(result.current.mutation.isChangingStatus).toBe(false);
    });
  });

  it("deletes invoice successfully", async () => {
    const { result } = renderHookWithProviders(() => ({
      query: useInvoices(defaultParams),
      mutation: useDeleteInvoice(),
    }));

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false);
    });

    await result.current.mutation.deleteInvoice(1);

    await waitFor(() => {
      expect(result.current.mutation.isDeleting).toBe(false);
    });
  });

  it("filters by invoiceType", async () => {
    let capturedType: string | null = null;
    server.use(
      http.get(`${config.apiUrl}/invoices`, ({ request }) => {
        const url = new URL(request.url);
        capturedType = url.searchParams.get("invoiceType");
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 20 },
          message: "Invoices retrieved",
        });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useInvoices({ ...defaultParams, invoiceType: "patient" })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(capturedType).toBe("patient");
  });
});
