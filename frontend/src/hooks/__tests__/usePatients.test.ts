import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { usePatients } from "@/hooks/usePatients";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

describe("usePatients", () => {
  it("fetches patients list", async () => {
    const { result } = renderHookWithProviders(() =>
      usePatients({ search: "", patientType: "", gender: "", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].fullName).toBe("John Doe");
  });

  it("returns pagination metadata", async () => {
    const { result } = renderHookWithProviders(() =>
      usePatients({ search: "", patientType: "", gender: "", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.pagination).toBeDefined();
    });

    expect(result.current.pagination?.totalItems).toBe(1);
    expect(result.current.pagination?.currentPage).toBe(1);
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

    const { result } = renderHookWithProviders(() =>
      usePatients({ search: "", patientType: "", gender: "", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("creates patient successfully", async () => {
    const { result } = renderHookWithProviders(() =>
      usePatients({ search: "", patientType: "", gender: "", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createPatient({
      fullName: "Jane Doe",
      birthDate: "1995-05-10",
      gender: "female",
      phoneNumber: "5559876543",
      patientType: "regular",
    });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });

  it("deletes patient successfully", async () => {
    const { result } = renderHookWithProviders(() =>
      usePatients({ search: "", patientType: "", gender: "", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deletePatient(1);

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });
  });

  it("passes search param to API", async () => {
    let capturedSearch: string | null = null;
    server.use(
      http.get(`${config.apiUrl}/patients`, ({ request }) => {
        const url = new URL(request.url);
        capturedSearch = url.searchParams.get("search");
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 20 },
          message: "Patients retrieved",
        });
      })
    );

    const { result } = renderHookWithProviders(() =>
      usePatients({ search: "John", patientType: "", gender: "", page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // useDebouncedValue delays by 300ms
    await waitFor(
      () => {
        expect(capturedSearch).toBe("John");
      },
      { timeout: 2000 }
    );
  });
});
