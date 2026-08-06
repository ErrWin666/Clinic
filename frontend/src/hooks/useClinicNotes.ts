import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ClinicNoteService,
  type ListClinicNotesParams,
  type CreateClinicNoteData,
  type UpdateClinicNoteData,
} from "@/services/ClinicNoteService";
import { useApiError } from "@/hooks/useApiError";
import type { ClinicNote, NoteAttachment } from "@/types/models";

export function useClinicNotes(params?: ListClinicNotesParams) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const notesQuery = useQuery({
    queryKey: ["clinic-notes", params],
    queryFn: () => ClinicNoteService.list(params),
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClinicNoteData) => ClinicNoteService.create(data),
    onSuccess: () => {
      toast.success(t("clinicNotes.created"));
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClinicNoteData }) =>
      ClinicNoteService.update(id, data),
    onSuccess: () => {
      toast.success(t("clinicNotes.updated"));
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ClinicNoteService.delete(id),
    onSuccess: () => {
      toast.success(t("clinicNotes.deleted"));
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: ({ noteId, files }: { noteId: number; files: File[] }) =>
      ClinicNoteService.uploadAttachments(noteId, files),
    onSuccess: () => {
      toast.success(t("clinicNotes.attachmentUploaded"));
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ noteId, fileId }: { noteId: number; fileId: number }) =>
      ClinicNoteService.deleteAttachment(noteId, fileId),
    onSuccess: () => {
      toast.success(t("clinicNotes.attachmentDeleted"));
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    notes: notesQuery.data?.data ?? [],
    pagination: notesQuery.data?.pagination,
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
    refetch: notesQuery.refetch,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    uploadAttachments: uploadAttachmentsMutation.mutateAsync,
    deleteAttachment: deleteAttachmentMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploading: uploadAttachmentsMutation.isPending,
    isDeletingAttachment: deleteAttachmentMutation.isPending,
  };
}

export function useClinicNoteDetail(id?: number) {
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();
  const { t } = useTranslation();

  const noteQuery = useQuery({
    queryKey: ["clinic-note", id],
    queryFn: () => ClinicNoteService.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ noteId, fileId }: { noteId: number; fileId: number }) =>
      ClinicNoteService.deleteAttachment(noteId, fileId),
    onSuccess: () => {
      toast.success(t("clinicNotes.attachmentDeleted"));
      queryClient.invalidateQueries({ queryKey: ["clinic-note", id] });
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: ({ noteId, files }: { noteId: number; files: File[] }) =>
      ClinicNoteService.uploadAttachments(noteId, files),
    onSuccess: () => {
      toast.success(t("clinicNotes.attachmentUploaded"));
      queryClient.invalidateQueries({ queryKey: ["clinic-note", id] });
      queryClient.invalidateQueries({ queryKey: ["clinic-notes"] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    note: noteQuery.data?.data as ClinicNote | undefined,
    isLoading: noteQuery.isLoading,
    isError: noteQuery.isError,
    refetch: noteQuery.refetch,
    uploadAttachments: uploadAttachmentsMutation.mutateAsync,
    deleteAttachment: deleteAttachmentMutation.mutateAsync,
    isUploading: uploadAttachmentsMutation.isPending,
    isDeletingAttachment: deleteAttachmentMutation.isPending,
  };
}

export type { ClinicNote, NoteAttachment };
