import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

function ThrowOnRender(): never {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Refresh Page")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("renders custom fallback when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("shows error details in collapsible section", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Error details")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("recovers when Try Again is clicked", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});

    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error("Test error");
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByText("Try Again"));
    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("renders page-level variant without min-h-screen", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <ErrorBoundary variant="page-level">
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(container.firstChild).not.toHaveClass("min-h-screen");
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
