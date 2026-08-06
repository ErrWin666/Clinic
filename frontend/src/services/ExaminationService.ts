import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { Examination } from "@/types/models";

export interface ExaminationListParams {
  page?: number;
  pageSize?: number;
  examStatus?: string;
  startDate?: string;
  endDate?: string;
}

export type ExaminationCreateData = Partial<Omit<Examination, "id" | "displayId" | "patientId" | "patient" | "createdAt" | "updatedAt">> & {
  examDate: string;
};

export type ExaminationUpdateData = Partial<ExaminationCreateData>;

export interface SimpleExamination {
  id: number;
  displayId: string;
  examDate: string;
}

export const ExaminationService = {
  async listByPatient(
    patientId: number,
    params?: ExaminationListParams
  ): Promise<ApiResponse<Examination[]>> {
    const { data } = await api.get<ApiResponse<Examination[]>>(
      `/patients/${patientId}/examinations`,
      { params }
    );
    return data;
  },

  async listByPatientSimple(
    patientId: number
  ): Promise<ApiResponse<SimpleExamination[]>> {
    const { data } = await api.get<ApiResponse<SimpleExamination[]>>(
      `/patients/${patientId}/examinations/simple`
    );
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Examination>> {
    const { data } = await api.get<ApiResponse<Examination>>(
      `/examinations/${id}`
    );
    return data;
  },

  async create(
    patientId: number,
    payload: ExaminationCreateData
  ): Promise<ApiResponse<Examination>> {
    const { data } = await api.post<ApiResponse<Examination>>(
      `/patients/${patientId}/examinations`,
      payload
    );
    return data;
  },

  async update(
    id: number,
    payload: ExaminationUpdateData
  ): Promise<ApiResponse<Examination>> {
    const { data } = await api.put<ApiResponse<Examination>>(
      `/examinations/${id}`,
      payload
    );
    return data;
  },

  async createFollowUp(id: number): Promise<ApiResponse<Examination>> {
    const { data } = await api.post<ApiResponse<Examination>>(
      `/examinations/${id}/follow-up`
    );
    return data;
  },

  getPDFUrl(id: number): string {
    return `${getApiUrl()}/examinations/${id}/pdf`;
  },

  getPrescriptionPDFUrl(id: number): string {
    return `${getApiUrl()}/examinations/${id}/prescription`;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/examinations/${id}`
    );
    return data;
  },
};
