import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { NotificationService } from "@/services/NotificationService";
import { useApiError } from "@/hooks/useApiError";

const TEMPLATES_KEY = "notification-templates";

interface TemplateData {
  text: string;
  html: string;
  whatsappParams: string[];
}

interface TemplatesResponse {
  templates: Record<string, TemplateData>;
  types: string[];
  whatsappCloudDefinitions: Array<{ name: string; language: string; body: string; params: string[] }>;
  language: string;
}

export function useNotificationTemplates() {
  const query = useQuery({
    queryKey: [TEMPLATES_KEY],
    queryFn: async () => {
      const res = await NotificationService.getTemplates();
      return res.data as TemplatesResponse;
    },
  });

  return {
    templates: query.data?.templates ?? {},
    types: query.data?.types ?? [],
    whatsappCloudDefinitions: query.data?.whatsappCloudDefinitions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useUpdateTemplate() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ type, payload }: { type: string; payload: { text: string; html: string } }) =>
      NotificationService.updateTemplate(type, payload),
    onSuccess: () => {
      toast.success(t("settings.templates.saved"));
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateTemplate: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

export function useResetTemplate() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (type: string) => NotificationService.resetTemplate(type),
    onSuccess: () => {
      toast.success(t("settings.templates.reset"));
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    resetTemplate: mutation.mutateAsync,
    isResetting: mutation.isPending,
  };
}
