import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlertIcon } from "lucide-react";

export function SessionExpiredDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, []);

  const handleLogin = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — session already expired
    }
    setUser(null);
    setOpen(false);
    navigate("/login");
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) return;
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <ShieldAlertIcon className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("dialogs.sessionExpired")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogs.sessionExpiredDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogin} className="w-full sm:w-auto">
            {t("dialogs.loginNow")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
