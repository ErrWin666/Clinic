import { describe, it, expect, vi } from "vitest";
import { waitFor, renderHook, act } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress console.error for this test since React prints the error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
    spy.mockRestore();
  });

  it("starts with loading state", () => {
    const { result } = renderHookWithProviders(() => useAuth());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("loads user session on mount", async () => {
    const { result } = renderHookWithProviders(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.username).toBe("admin");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("setUser updates auth state", async () => {
    const { result } = renderHookWithProviders(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setUser(null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
