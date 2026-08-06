import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useClinicNotes } from "@/hooks/useClinicNotes";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

describe("useClinicNotes", () => {
  it("returns loading state initially", () => {
    const { result } = renderHookWithProviders(() =>
      useClinicNotes({ page: 1, pageSize: 20 })
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches clinic notes list", async () => {
    const { result } = renderHookWithProviders(() =>
      useClinicNotes({ page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].title).toBe("Test Clinic Note");
  });

  it("returns pagination metadata", async () => {
    const { result } = renderHookWithProviders(() =>
      useClinicNotes({ page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.pagination).toBeDefined();
    });

    expect(result.current.pagination?.totalItems).toBe(1);
    expect(result.current.pagination?.currentPage).toBe(1);
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get(`${config.apiUrl}/clinic-notes`, () => {
        return HttpResponse.json(
          { success: false, error: { code: "INTERNAL_ERROR", message: "Error" } },
          { status: 500 }
        );
      })
    );

    const { result } = renderHookWithProviders(() =>
      useClinicNotes({ page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("creates a clinic note successfully", async () => {
    const { result } = renderHookWithProviders(() =>
      useClinicNotes({ page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createNote({ content: "New note content" });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });

  it("deletes a clinic note successfully", async () => {
    const { result } = renderHookWithProviders(() =>
      useClinicNotes({ page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deleteNote(1);

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });
  });
});
