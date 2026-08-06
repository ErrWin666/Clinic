import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types/models";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { t } = useTranslation();
  const { notifications, unreadCount, isLoading, markAllRead, markRead, deleteNotification } =
    useNotifications();
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative transition-transform duration-200 hover:scale-105 active:scale-95"
            aria-label={t("notifications.title")}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -end-1 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full px-1 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0 shadow-xl ring-1 ring-border/40">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <span className="text-sm font-semibold">
            {t("notifications.title")}
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto text-xs"
              onClick={() => markAllRead()}
            >
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("notifications.empty")}
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={cn(
                    "group flex animate-in fade-in slide-in-from-top-2 items-start gap-1 border-b border-border/40 px-4 py-3 text-start transition-colors hover:bg-accent/80",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  <button
                    onClick={() => {
                      if (!notification.isRead) markRead(notification.id);
                    }}
                    className="flex flex-1 flex-col gap-1 text-start"
                  >
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className="text-sm font-medium">
                        {notification.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                  </button>
                  <AlertDialog
                    open={deleteTarget?.id === notification.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteTarget(null);
                    }}
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label={t("notifications.delete")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(notification);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                          <Trash2 className="size-6" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>{t("notifications.delete")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("notifications.confirmDelete")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => {
                            deleteNotification(notification.id);
                            setDeleteTarget(null);
                          }}
                        >
                          {t("notifications.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
