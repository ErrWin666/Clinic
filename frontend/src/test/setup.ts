import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "@/lib/i18n";
import { server } from "./mocks/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.clearAllMocks();
});

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  window.scrollTo = vi.fn();
  Element.prototype.getAnimations = vi.fn().mockReturnValue([]) as unknown as typeof Element.prototype.getAnimations;
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, origin: "http://localhost:5173" },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

void i18n;
