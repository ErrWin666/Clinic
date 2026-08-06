import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useAppointmentsList, useAvailableSlots } from "@/hooks/useAppointments";

describe("useAppointmentsList", () => {
  it("returns loading state initially", () => {
    const { result } = renderHookWithProviders(() =>
      useAppointmentsList({ page: 1, pageSize: 20 })
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches appointments successfully", async () => {
    const { result } = renderHookWithProviders(() =>
      useAppointmentsList({ page: 1, pageSize: 20 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0]!.patient!.fullName).toBe("John Doe");
    expect(result.current.pagination?.totalItems).toBe(1);
    expect(result.current.isError).toBe(false);
  });

  it("returns empty appointments when still loading", () => {
    const { result } = renderHookWithProviders(() =>
      useAppointmentsList({ page: 1, pageSize: 10 })
    );
    expect(result.current.appointments).toEqual([]);
    expect(result.current.pagination).toBeUndefined();
  });
});

describe("useAvailableSlots", () => {
  it("is disabled when date is undefined", () => {
    const { result } = renderHookWithProviders(() =>
      useAvailableSlots(undefined, "consultation")
    );
    expect(result.current.slots).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("is disabled when appointmentType is undefined", () => {
    const { result } = renderHookWithProviders(() =>
      useAvailableSlots("2026-12-01", undefined)
    );
    expect(result.current.slots).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches slots when both date and type are provided", async () => {
    const { result } = renderHookWithProviders(() =>
      useAvailableSlots("2026-12-01", "consultation")
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slots).toEqual([]);
  });
});
