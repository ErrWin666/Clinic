import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from "@/services/NotificationService";
import { useAuth } from "@/hooks/useAuth";
import { useApiError } from "@/hooks/useApiError";
import { getApiUrl } from "@/lib/config";

const NOTIFICATIONS_KEY = "notifications";

export function useNotifications() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectSSERef = useRef<() => void>(() => {});
  const [sseUnreadCount, setSseUnreadCount] = useState<number | null>(null);

  const query = useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: () => NotificationService.list({ pageSize: 20 }),
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) return false;
      return failureCount < 2;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => NotificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => NotificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  const connectSSE = useCallback(() => {
    const baseUrl = getApiUrl();
    const eventSource = new EventSource(`${baseUrl}/notifications/stream`, {
      withCredentials: true,
    });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.unreadCount !== undefined) {
          setSseUnreadCount(data.unreadCount);
        }
      } catch {
        // ignore parse errors
      }
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      reconnectTimerRef.current = setTimeout(() => connectSSERef.current(), 5000);
    };
  }, [queryClient]);

  useEffect(() => {
    connectSSERef.current = connectSSE;
  }, [connectSSE]);

  useEffect(() => {
    if (!isAuthenticated) return;
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [isAuthenticated, connectSSE]);

  const notifications = query.data?.data ?? [];
  const unreadCount = sseUnreadCount ?? notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
  };
}
