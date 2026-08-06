import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  AppointmentService,
  type AppointmentListParams,
} from "@/services/AppointmentService";
import type { Pagination } from "@/types/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const APPOINTMENTS_KEY = "appointments";

interface UseAppointmentsListOptions {
  search?: string;
  status?: string;
  appointmentType?: string;
  patientId?: number;
  page?: number;
  pageSize?: number;
}

export function useAppointmentsList({
  search,
  status,
  appointmentType,
  patientId,
  page = 1,
  pageSize = 20,
}: UseAppointmentsListOptions) {
  const debouncedSearch = useDebouncedValue(search ?? "", 300);

  const params: AppointmentListParams = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
    appointmentType: appointmentType || undefined,
    patientId,
  };

  const query = useQuery({
    queryKey: [APPOINTMENTS_KEY, "list", params],
    queryFn: () => AppointmentService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const appointments = query.data?.data ?? [];
  const pagination: Pagination | undefined = query.data?.pagination;

  return {
    appointments,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseAppointmentCalendarOptions {
  startDate: string;
  endDate: string;
}

export function useAppointmentCalendar({
  startDate,
  endDate,
}: UseAppointmentCalendarOptions) {
  const query = useQuery({
    queryKey: [APPOINTMENTS_KEY, "calendar", startDate, endDate],
    queryFn: () => AppointmentService.getCalendar(startDate, endDate),
    staleTime: 60 * 1000,
  });

  const appointments = query.data?.data ?? [];

  return {
    appointments,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseAppointmentSearchOptions {
  search?: string;
  status?: string;
  appointmentType?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useAppointmentSearch({
  search,
  status,
  appointmentType,
  startDate,
  endDate,
  enabled = false,
}: UseAppointmentSearchOptions) {
  const debouncedSearch = useDebouncedValue(search ?? "", 400);

  const params: AppointmentListParams = {
    page: 1,
    pageSize: 500,
    search: debouncedSearch || undefined,
    status: status || undefined,
    appointmentType: appointmentType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const query = useQuery({
    queryKey: [APPOINTMENTS_KEY, "search", params],
    queryFn: () => AppointmentService.list(params),
    enabled,
    staleTime: 30 * 1000,
  });

  const appointments = query.data?.data ?? [];

  return {
    appointments,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

export function useAvailableSlots(date: string | undefined, appointmentType: string | undefined) {
  const query = useQuery({
    queryKey: [APPOINTMENTS_KEY, "slots", date, appointmentType],
    queryFn: () => AppointmentService.getAvailableSlots(date!, appointmentType || "consultation"),
    enabled: !!date && !!appointmentType,
    staleTime: 30 * 1000,
  });

  const slots = query.data?.data ?? [];

  return {
    slots,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useWorkingHours() {
  const query = useQuery({
    queryKey: [APPOINTMENTS_KEY, "working-hours"],
    queryFn: () => AppointmentService.getWorkingHours(),
    staleTime: 5 * 60 * 1000,
  });

  const workingHours = query.data?.data;

  return {
    workingHours,
    isLoading: query.isLoading,
  };
}
