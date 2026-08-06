import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  AppointmentService,
  type AppointmentListParams,
} from "@/services/AppointmentService";
import type { Pagination } from "@/types/api";

interface UsePatientAppointmentsOptions {
  patientId: number;
  page?: number;
  pageSize?: number;
}

export function usePatientAppointments({
  patientId,
  page = 1,
  pageSize = 10,
}: UsePatientAppointmentsOptions) {
  const params: AppointmentListParams = {
    page,
    pageSize,
    patientId,
  };

  const query = useQuery({
    queryKey: ["appointments", "patient", patientId, params],
    queryFn: () => AppointmentService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

  const appointments = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  return {
    appointments,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
