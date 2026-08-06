import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { Patient, PatientDetail } from "@/types/models";

export interface PatientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  patientType?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PatientCreateData {
  fullName: string;
  birthDate: string;
  gender: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  patientType?: string;
  notes?: string | null;
}

export type PatientUpdateData = Partial<PatientCreateData>;

export interface AutocompleteResult {
  id: number;
  displayId: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  birthDate: string;
  address?: string | null;
  email?: string | null;
}

export const PatientService = {
  async list(
    params?: PatientListParams
  ): Promise<ApiResponse<Patient[]>> {
    const { data } = await api.get<ApiResponse<Patient[]>>("/patients", {
      params,
    });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<PatientDetail>> {
    const { data } = await api.get<ApiResponse<PatientDetail>>(`/patients/${id}`);
    return data;
  },

  async create(payload: PatientCreateData): Promise<ApiResponse<Patient>> {
    const { data } = await api.post<ApiResponse<Patient>>("/patients", payload);
    return data;
  },

  async update(
    id: number,
    payload: PatientUpdateData
  ): Promise<ApiResponse<Patient>> {
    const { data } = await api.put<ApiResponse<Patient>>(
      `/patients/${id}`,
      payload
    );
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/patients/${id}`);
    return data;
  },

  async autocomplete(
    q: string,
    limit = 10
  ): Promise<ApiResponse<AutocompleteResult[]>> {
    const { data } = await api.get<ApiResponse<AutocompleteResult[]>>(
      "/patients/autocomplete",
      { params: { q, limit } }
    );
    return data;
  },

  export(filters: PatientListParams): void {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.patientType) params.set("patientType", filters.patientType);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.minAge !== undefined) params.set("minAge", String(filters.minAge));
    if (filters.maxAge !== undefined) params.set("maxAge", String(filters.maxAge));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    window.open(`${getApiUrl()}/patients/export?${params.toString()}`, "_blank");
  },

  async uploadProfileImage(
    id: number,
    file: File
  ): Promise<ApiResponse<{ profileImageUrl: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await api.post<ApiResponse<{ profileImageUrl: string }>>(
      `/patients/${id}/profile-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  async deleteProfileImage(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/patients/${id}/profile-image`
    );
    return data;
  },

  getSummaryPDF(id: number): void {
    window.open(`${getApiUrl()}/patients/${id}/summary-pdf`, "_blank");
  },

  async sendTelegramInvite(id: number): Promise<ApiResponse<{ inviteLink: string; smsSent: boolean; smsChannel: string }>> {
    const { data } = await api.post<ApiResponse<{ inviteLink: string; smsSent: boolean; smsChannel: string }>>(
      `/telegram/invite/${id}`
    );
    return data;
  },

  async updateContactMethod(id: number, method: string): Promise<ApiResponse<unknown>> {
    const { data } = await api.put<ApiResponse<unknown>>(`/patients/${id}`, {
      preferredContactMethod: method,
    });
    return data;
  },
};
