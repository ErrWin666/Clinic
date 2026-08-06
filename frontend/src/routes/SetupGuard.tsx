import { type ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router";
import { SetupService } from "@/services/SetupService";
import { Spinner } from "@/components/ui/spinner";

export function SetupGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">(
    "loading"
  );

  useEffect(() => {
    SetupService.checkAdmin()
      .then((res) => {
        setStatus(res.data.adminExists ? "blocked" : "allowed");
      })
      .catch(() => {
        setStatus("allowed");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (status === "blocked") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
