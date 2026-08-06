import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  RelationshipService,
  type CreateRelationshipData,
} from "@/services/RelationshipService";
import { useApiError } from "@/hooks/useApiError";

export function useRelationships(patientId: number) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const query = useQuery({
    queryKey: ["relationships", patientId],
    queryFn: () => RelationshipService.list(patientId),
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const relationships = query.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: ({ patientId, data }: { patientId: number; data: CreateRelationshipData }) =>
      RelationshipService.create(patientId, data),
    onSuccess: (_data, variables) => {
      toast.success(t("relationships.linked"));
      queryClient.invalidateQueries({ queryKey: ["relationships", patientId] });
      queryClient.invalidateQueries({ queryKey: ["relationships", variables.data.relatedPatientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ patientId, relationshipId }: { patientId: number; relationshipId: number }) =>
      RelationshipService.delete(patientId, relationshipId),
    onSuccess: () => {
      toast.success(t("relationships.unlinked"));
      queryClient.invalidateQueries({ queryKey: ["relationships", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    relationships,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createRelationship: createMutation.mutateAsync,
    deleteRelationship: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
