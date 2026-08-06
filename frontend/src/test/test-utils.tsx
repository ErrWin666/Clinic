import { type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { renderHook, type RenderHookOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import type { User } from "@/types/models";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

function createWrapper(initialEntries: string[] = ["/"]) {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </I18nextProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactNode,
  options: RenderWithProvidersOptions = {}
) {
  const { initialEntries = ["/"], ...renderOptions } = options;
  const queryClient = createTestQueryClient();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </I18nextProvider>
      <Toaster />
    </QueryClientProvider>,
    renderOptions
  );
  return { ...result, queryClient };
}

interface RenderHookWithProvidersOptions extends Omit<RenderHookOptions<unknown>, "wrapper"> {
  initialEntries?: string[];
}

export function renderHookWithProviders<T>(
  hook: () => T,
  options: RenderHookWithProvidersOptions = {}
) {
  const { initialEntries = ["/"], ...hookOptions } = options;
  const Wrapper = createWrapper(initialEntries);
  return renderHook(hook, { wrapper: Wrapper, ...hookOptions });
}

export { createTestQueryClient };
export type { User };
