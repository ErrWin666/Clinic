import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  PatientNoteService,
  type ListPatientNotesParams,
  type CreatePatientNoteData,
  type UpdatePatientNoteData,
} from "@/services/PatientNoteService";
import { useApiError } from "@/hooks/useApiError";
import type { PatientNote, NoteAttachment } from "@/types/models";

export function usePatientNotes(patientId: number, params?: ListPatientNotesParams) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const notesQuery = useQuery({
    queryKey: ["patient-notes", patientId, params],
    queryFn: () => PatientNoteService.list(patientId, params),
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePatientNoteData) =>
      PatientNoteService.create(patientId, data),
    onSuccess: () => {
      toast.success(t("patientNotes.created"));
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePatientNoteData }) =>
      PatientNoteService.update(patientId, id, data),
    onSuccess: () => {
      toast.success(t("patientNotes.updated"));
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => PatientNoteService.delete(patientId, id),
    onSuccess: () => {
      toast.success(t("patientNotes.deleted"));
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: ({ noteId, files }: { noteId: number; files: File[] }) =>
      PatientNoteService.uploadAttachments(patientId, noteId, files),
    onSuccess: () => {
      toast.success(t("patientNotes.attachmentUploaded"));
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patientId] });
    },
    onError: (error) => handleApiError(error),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ noteId, fileId }: { noteId: number; fileId: number }) =>
      PatientNoteService.deleteAttachment(patientId, noteId, fileId),
    onSuccess: () => {
      toast.success(t("patientNotes.attachmentDeleted"));
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patientId] });
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

export type { PatientNote, NoteAttachment };
