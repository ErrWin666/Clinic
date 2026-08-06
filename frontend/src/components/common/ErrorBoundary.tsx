import { Component, type ErrorInfo, type ReactNode } from "react";
import { withTranslation } from "react-i18next";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: "full-page" | "page-level";
  t: (key: string) => string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = this.props;
      const isPageLevel = this.props.variant === "page-level";

      return (
        <div className={isPageLevel
          ? "flex flex-col items-center justify-center gap-5 py-20 px-4 animate-in fade-in zoom-in-95 duration-400"
          : "flex min-h-screen flex-col items-center justify-center gap-5 p-8 animate-in fade-in zoom-in-95 duration-400"
        }>
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/8 text-destructive shadow-soft ring-1 ring-destructive/15">
            <AlertTriangleIcon className="size-8" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-heading font-semibold tracking-tight">
              {t("error.title")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {t("error.message")}
            </p>
          </div>
          {this.state.error && (
            <details className="max-w-lg w-full">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t("error.details")}
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={this.handleReset}
            >
              <RefreshCwIcon className="size-4" />
              {t("error.tryAgain")}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={this.handleReload}
            >
              {t("error.refreshPage")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryClass);
