import { type ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { SetupService } from "@/services/SetupService";
import { Spinner } from "@/components/ui/spinner";

export function LoginGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [adminStatus, setAdminStatus] = useState<"loading" | "exists" | "none">("loading");

  useEffect(() => {
    SetupService.checkAdmin()
      .then((res) => {
        setAdminStatus(res.data.adminExists ? "exists" : "none");
      })
      .catch(() => {
        setAdminStatus("exists");
      });
  }, []);

  if (adminStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminStatus === "none") {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
