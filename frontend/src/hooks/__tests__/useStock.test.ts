import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import {
  useStockMovements,
  useStockStats,
} from "@/hooks/useStock";

describe("useStockMovements", () => {
  it("returns loading state initially", () => {
    const { result } = renderHookWithProviders(() =>
      useStockMovements({ page: 1 })
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches stock movements successfully", async () => {
    const { result } = renderHookWithProviders(() =>
      useStockMovements({ page: 1 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.movements).toHaveLength(1);
    expect(result.current.movements[0].batchNumber).toBe("BATCH-001");
    expect(result.current.pagination?.totalItems).toBe(1);
    expect(result.current.isError).toBe(false);
  });

  it("returns empty movements while loading", () => {
    const { result } = renderHookWithProviders(() =>
      useStockMovements({ page: 1, pageSize: 10 })
    );
    expect(result.current.movements).toEqual([]);
    expect(result.current.pagination).toBeUndefined();
  });
});

describe("useStockStats", () => {
  it("returns loading state initially", () => {
    const { result } = renderHookWithProviders(() => useStockStats());
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches stock stats successfully", async () => {
    const { result } = renderHookWithProviders(() => useStockStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats?.totalProducts).toBe(50);
    expect(result.current.stats?.lowStockCount).toBe(5);
    expect(result.current.isError).toBe(false);
  });

  it("returns undefined stats while loading", () => {
    const { result } = renderHookWithProviders(() => useStockStats());
    expect(result.current.stats).toBeUndefined();
  });
});
