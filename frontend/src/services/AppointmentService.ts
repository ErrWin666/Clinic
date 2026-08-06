import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Appointment } from "@/types/models";

export interface AppointmentListParams {
  page?: number;
  pageSize?: number;
  patientId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  appointmentType?: string;
}

export interface AppointmentCreateData {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  reason?: string | null;
  notes?: string | null;
  patientId?: number | null;
  quickName?: string | null;
  quickPhone?: string | null;
  examinationId?: number | null;
  invoiceId?: number | null;
}

export type AppointmentUpdateData = Partial<AppointmentCreateData>;

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

export interface WorkingHours {
  start: string;
  end: string;
  days: number[];
}

export const AppointmentService = {
  async list(
    params?: AppointmentListParams
  ): Promise<ApiResponse<Appointment[]>> {
    const { data } = await api.get<ApiResponse<Appointment[]>>(
      "/appointments",
      { params }
    );
    return data;
  },

  async getCalendar(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Appointment[]>> {
    const { data } = await api.get<ApiResponse<Appointment[]>>(
      "/appointments/calendar",
      { params: { startDate, endDate } }
    );
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Appointment>> {
    const { data } = await api.get<ApiResponse<Appointment>>(
      `/appointments/${id}`
    );
    return data;
  },

  async create(
    payload: AppointmentCreateData
  ): Promise<ApiResponse<Appointment>> {
    const { data } = await api.post<ApiResponse<Appointment>>(
      "/appointments",
      payload
    );
    return data;
  },

  async update(
    id: number,
    payload: AppointmentUpdateData
  ): Promise<ApiResponse<Appointment>> {
    const { data } = await api.put<ApiResponse<Appointment>>(
      `/appointments/${id}`,
      payload
    );
    return data;
  },

  async changeStatus(
    id: number,
    status: string
  ): Promise<ApiResponse<Appointment>> {
    const { data } = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/status`,
      { status }
    );
    return data;
  },

  async linkPatient(
    id: number,
    patientId: number
  ): Promise<ApiResponse<Appointment>> {
    const { data } = await api.post<ApiResponse<Appointment>>(
      `/appointments/${id}/link-patient`,
      { patientId }
    );
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/appointments/${id}`
    );
    return data;
  },

  async confirm(id: number): Promise<ApiResponse<Appointment>> {
    const { data } = await api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/confirm`
    );
    return data;
  },

  async linkExamination(
    id: number,
    examinationId: number
  ): Promise<ApiResponse<Appointment>> {
    const { data } = await api.post<ApiResponse<Appointment>>(
      `/appointments/${id}/link-examination`,
      { entityId: examinationId }
    );
    return data;
  },

  async linkInvoice(
    id: number,
    invoiceId: number
  ): Promise<ApiResponse<Appointment>> {
    const { data } = await api.post<ApiResponse<Appointment>>(
      `/appointments/${id}/link-invoice`,
      { entityId: invoiceId }
    );
    return data;
  },

  async getAvailableSlots(
    date: string,
    appointmentType: string
  ): Promise<ApiResponse<TimeSlot[]>> {
    const { data } = await api.get<ApiResponse<TimeSlot[]>>(
      `/appointments/slots`,
      { params: { date, appointmentType } }
    );
    return data;
  },

  async getWorkingHours(): Promise<ApiResponse<WorkingHours>> {
    const { data } = await api.get<ApiResponse<WorkingHours>>(
      `/appointments/working-hours`
    );
    return data;
  },
};
