import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  FileService,
  type CreateFolderData,
  type ListFilesParams,
  type ListFoldersParams,
} from "@/services/FileService";
import { useApiError } from "@/hooks/useApiError";

export function useFiles(
  patientId: number,
  selectedFolderId?: number | string | null,
  filesParams?: Omit<ListFilesParams, "folderId">,
  foldersParams?: ListFoldersParams,
  examinationId?: number | null
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const foldersQuery = useQuery({
    queryKey: ["folders", patientId, foldersParams],
    queryFn: () => FileService.listFolders(patientId, foldersParams),
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const filesQuery = useQuery({
    queryKey: ["files", patientId, selectedFolderId, filesParams, examinationId],
    queryFn: () =>
      FileService.listFiles(patientId, {
        ...filesParams,
        folderId: typeof selectedFolderId === "number" ? selectedFolderId : undefined,
        examinationId: examinationId ?? undefined,
      }),
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const createFolderMutation = useMutation({
    mutationFn: ({ patientId, data }: { patientId: number; data: CreateFolderData }) =>
      FileService.createFolder(patientId, data),
    onSuccess: () => {
      toast.success(t("files.folderCreated"));
      queryClient.invalidateQueries({ queryKey: ["folders", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: number; name: string }) =>
      FileService.renameFolder(patientId, folderId, name),
    onSuccess: () => {
      toast.success(t("files.folderRenamed"));
      queryClient.invalidateQueries({ queryKey: ["folders", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: number) => FileService.deleteFolder(patientId, folderId),
    onSuccess: () => {
      toast.success(t("files.folderDeleted"));
      queryClient.invalidateQueries({ queryKey: ["folders", patientId] });
      queryClient.invalidateQueries({ queryKey: ["files", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ patientId, file, folderId, examinationId }: { patientId: number; file: File; folderId?: number | null; examinationId?: number | null }) =>
      FileService.uploadFile(patientId, file, folderId, examinationId),
    onSuccess: () => {
      toast.success(t("files.fileUploaded"));
      queryClient.invalidateQueries({ queryKey: ["files", patientId, selectedFolderId, filesParams, examinationId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) => FileService.deleteFile(patientId, fileId),
    onSuccess: () => {
      toast.success(t("files.fileDeleted"));
      queryClient.invalidateQueries({ queryKey: ["files", patientId, selectedFolderId, filesParams, examinationId] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    folders: foldersQuery.data?.data ?? [],
    files: filesQuery.data?.data ?? [],
    filesPagination: filesQuery.data?.pagination,
    foldersPagination: foldersQuery.data?.pagination,
    isLoadingFolders: foldersQuery.isLoading,
    isLoadingFiles: filesQuery.isLoading,
    isErrorFolders: foldersQuery.isError,
    isErrorFiles: filesQuery.isError,
    refetchFolders: foldersQuery.refetch,
    refetchFiles: filesQuery.refetch,
    createFolder: createFolderMutation.mutateAsync,
    renameFolder: renameFolderMutation.mutateAsync,
    deleteFolder: deleteFolderMutation.mutateAsync,
    uploadFile: uploadFileMutation.mutateAsync,
    deleteFile: deleteFileMutation.mutateAsync,
    isCreatingFolder: createFolderMutation.isPending,
    isRenamingFolder: renameFolderMutation.isPending,
    isDeletingFolder: deleteFolderMutation.isPending,
    isUploading: uploadFileMutation.isPending,
    isDeletingFile: deleteFileMutation.isPending,
  };
}
