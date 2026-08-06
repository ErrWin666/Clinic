import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useDashboard } from "@/hooks/useDashboard";

describe("useDashboard", () => {
  it("fetches dashboard stats successfully", async () => {
    const { result } = renderHookWithProviders(() => useDashboard());

    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
    });

    expect(result.current.stats?.totalPatients).toBe(50);
    expect(result.current.stats?.todayAppointments).toBe(5);
    expect(result.current.stats?.unpaidInvoices.count).toBe(3);
    expect(result.current.stats?.monthlyRevenue).toBe(12000);
  });

  it("returns loading state initially", () => {
    const { result } = renderHookWithProviders(() => useDashboard());
    expect(result.current.isLoading).toBe(true);
  });

  it("returns chart data", async () => {
    const { result } = renderHookWithProviders(() => useDashboard());

    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
    });

    expect(result.current.stats?.appointmentsChart).toHaveLength(1);
    expect(result.current.stats?.revenueChart).toHaveLength(1);
  });
});
