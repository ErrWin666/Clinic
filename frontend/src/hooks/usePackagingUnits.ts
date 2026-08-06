import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PackagingUnitService } from "@/services/PackagingUnitService";
import type { PackagingUnitCreateData, PackagingUnitUpdateData } from "@/services/PackagingUnitService";
import { useApiError } from "@/hooks/useApiError";

const PACKAGING_UNITS_KEY = "packaging-units";

/**
 * Hook for managing packaging units of a product variant.
 * Provides list, create, update, delete operations with cache invalidation,
 * toast notifications, and centralized error handling.
 */
export function usePackagingUnits(variantId: number | null | undefined) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const listQuery = useQuery({
    queryKey: [PACKAGING_UNITS_KEY, variantId],
    queryFn: () => PackagingUnitService.listByVariant(variantId as number),
    enabled: variantId != null,
  });

  const createMutation = useMutation({
    mutationFn: (payload: PackagingUnitCreateData) =>
      PackagingUnitService.create(variantId as number, payload),
    onSuccess: () => {
      toast.success(t("inventory.packaging.created"));
      queryClient.invalidateQueries({ queryKey: [PACKAGING_UNITS_KEY, variantId] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PackagingUnitUpdateData }) =>
      PackagingUnitService.update(variantId as number, id, payload),
    onSuccess: () => {
      toast.success(t("inventory.packaging.updated"));
      queryClient.invalidateQueries({ queryKey: [PACKAGING_UNITS_KEY, variantId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => PackagingUnitService.delete(variantId as number, id),
    onSuccess: () => {
      toast.success(t("inventory.packaging.deleted"));
      queryClient.invalidateQueries({ queryKey: [PACKAGING_UNITS_KEY, variantId] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    packagingUnits: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    createUnit: createMutation.mutateAsync,
    updateUnit: updateMutation.mutateAsync,
    deleteUnit: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
