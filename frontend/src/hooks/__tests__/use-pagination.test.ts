import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePagination } from "@/hooks/use-pagination";

describe("usePagination", () => {
  it("returns all pages when total is within display limit", () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 5, paginationItemsToDisplay: 7 })
    );
    expect(result.current.pages).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.showLeftEllipsis).toBe(false);
    expect(result.current.showRightEllipsis).toBe(false);
  });

  it("shows ellipsis on right when current page is near start", () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 20, paginationItemsToDisplay: 5 })
    );
    expect(result.current.pages).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.showLeftEllipsis).toBe(false);
    expect(result.current.showRightEllipsis).toBe(true);
  });

  it("shows ellipsis on left when current page is near end", () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 20, totalPages: 20, paginationItemsToDisplay: 5 })
    );
    expect(result.current.pages).toEqual([16, 17, 18, 19, 20]);
    expect(result.current.showLeftEllipsis).toBe(true);
    expect(result.current.showRightEllipsis).toBe(false);
  });

  it("shows both ellipsis when current page is in middle", () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 10, totalPages: 20, paginationItemsToDisplay: 5 })
    );
    expect(result.current.pages).toEqual([8, 9, 10, 11, 12]);
    expect(result.current.showLeftEllipsis).toBe(true);
    expect(result.current.showRightEllipsis).toBe(true);
  });

  it("handles single page", () => {
    const { result } = renderHook(() =>
      usePagination({ currentPage: 1, totalPages: 1, paginationItemsToDisplay: 5 })
    );
    expect(result.current.pages).toEqual([1]);
    expect(result.current.showLeftEllipsis).toBe(false);
    expect(result.current.showRightEllipsis).toBe(false);
  });
});
