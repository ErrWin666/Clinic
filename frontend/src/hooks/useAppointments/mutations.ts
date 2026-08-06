import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  AppointmentService,
  type AppointmentCreateData,
  type AppointmentUpdateData,
} from "@/services/AppointmentService";
import { useApiError } from "@/hooks/useApiError";

const APPOINTMENTS_KEY = "appointments";

export function useCreateAppointment() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (data: AppointmentCreateData) =>
      AppointmentService.create(data),
    onSuccess: () => {
      toast.success(t("appointments.created"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    createAppointment: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useUpdateAppointment() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentUpdateData }) =>
      AppointmentService.update(id, data),
    onSuccess: () => {
      toast.success(t("appointments.updated"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    updateAppointment: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useChangeAppointmentStatus() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      AppointmentService.changeStatus(id, status),
    onSuccess: () => {
      toast.success(t("appointments.statusChanged"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    changeStatus: mutation.mutateAsync,
    isChangingStatus: mutation.isPending,
  };
}

export function useLinkPatient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, patientId }: { id: number; patientId: number }) =>
      AppointmentService.linkPatient(id, patientId),
    onSuccess: () => {
      toast.success(t("appointments.linked"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    linkPatient: mutation.mutateAsync,
    isLinking: mutation.isPending,
  };
}

export function useDeleteAppointment() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => AppointmentService.delete(id),
    onSuccess: () => {
      toast.success(t("appointments.deleted"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    deleteAppointment: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export function useConfirmAppointment() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: (id: number) => AppointmentService.confirm(id),
    onSuccess: () => {
      toast.success(t("appointments.confirmed"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    confirmAppointment: mutation.mutateAsync,
    isConfirming: mutation.isPending,
  };
}

export function useLinkExamination() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, examinationId }: { id: number; examinationId: number }) =>
      AppointmentService.linkExamination(id, examinationId),
    onSuccess: () => {
      toast.success(t("appointments.examinationLinked"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    linkExamination: mutation.mutateAsync,
    isLinking: mutation.isPending,
  };
}

export function useLinkInvoice() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleApiError } = useApiError();

  const mutation = useMutation({
    mutationFn: ({ id, invoiceId }: { id: number; invoiceId: number }) =>
      AppointmentService.linkInvoice(id, invoiceId),
    onSuccess: () => {
      toast.success(t("appointments.invoiceLinked"));
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
    onError: (error) => handleApiError(error),
  });

  return {
    linkInvoice: mutation.mutateAsync,
    isLinking: mutation.isPending,
  };
}
