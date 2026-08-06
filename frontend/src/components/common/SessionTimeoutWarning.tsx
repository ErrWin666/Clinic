import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClockIcon } from "lucide-react";

const WARNING_MINUTES = 5;
const TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

export function SessionTimeoutWarning() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(WARNING_MINUTES);
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleStayLoggedIn = useCallback(async () => {
    try {
      await api.post("/auth/refresh-token", {}, { withCredentials: true });
      lastActivityRef.current = Date.now();
    } catch {
      // refresh failed — session expired dialog will handle it
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];

    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetActivity, { passive: true })
    );

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remainingMs = TOKEN_LIFETIME_MS - elapsed;

      if (remainingMs <= 0) {
        // Token likely expired — let the API interceptor handle session expiry
        setOpen(false);
      } else if (remainingMs <= WARNING_MINUTES * 60 * 1000) {
        setMinutesLeft(Math.ceil(remainingMs / 60000));
        setOpen(true);
      } else {
        setOpen(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, resetActivity)
      );
      clearInterval(interval);
    };
  }, [resetActivity]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ClockIcon className="size-5 text-amber-500" />
            {t("auth.sessionExpiringTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("auth.sessionExpiringMessage", { minutes: minutesLeft })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            {t("common.close")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            {t("auth.sessionStayLoggedIn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
