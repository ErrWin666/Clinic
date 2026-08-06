import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useExaminations, useExaminationsSimple } from "@/hooks/useExaminations";

describe("useExaminations", () => {
  it("returns loading state initially", () => {
    const { result } = renderHookWithProviders(() =>
      useExaminations({ patientId: 1 })
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when patientId is 0", () => {
    const { result } = renderHookWithProviders(() =>
      useExaminations({ patientId: 0 })
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.examinations).toEqual([]);
  });

  it("fetches examinations for a patient", async () => {
    const { result } = renderHookWithProviders(() =>
      useExaminations({ patientId: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.examinations).toEqual([]);
    expect(result.current.pagination?.totalItems).toBe(0);
    expect(result.current.isError).toBe(false);
  });

  it("exposes mutation functions", () => {
    const { result } = renderHookWithProviders(() =>
      useExaminations({ patientId: 1 })
    );

    expect(typeof result.current.createExam).toBe("function");
    expect(typeof result.current.updateExam).toBe("function");
    expect(typeof result.current.deleteExam).toBe("function");
    expect(typeof result.current.followUp).toBe("function");
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});

describe("useExaminationsSimple", () => {
  it("is disabled when patientId is null", () => {
    const { result } = renderHookWithProviders(() =>
      useExaminationsSimple(null)
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches simple examinations list", async () => {
    const { result } = renderHookWithProviders(() =>
      useExaminationsSimple(1)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.data).toEqual([]);
    expect(result.current.data?.success).toBe(true);
  });
});
