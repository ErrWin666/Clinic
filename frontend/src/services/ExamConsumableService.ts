import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ExamConsumableRule } from "@/types/models";

export interface ExamConsumableListParams {
  page?: number;
  pageSize?: number;
  examType?: string;
  isActive?: boolean;
}

export interface ExamConsumableCreateData {
  examType: string;
  productVariantId: number;
  quantity: number;
}

export interface ExamConsumableUpdateData {
  quantity?: number;
  isActive?: boolean;
}

export const ExamConsumableService = {
  async list(params?: ExamConsumableListParams): Promise<ApiResponse<ExamConsumableRule[]>> {
    const { data } = await api.get<ApiResponse<ExamConsumableRule[]>>("/exam-consumables", { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<ExamConsumableRule>> {
    const { data } = await api.get<ApiResponse<ExamConsumableRule>>(`/exam-consumables/${id}`);
    return data;
  },

  async create(payload: ExamConsumableCreateData): Promise<ApiResponse<ExamConsumableRule>> {
    const { data } = await api.post<ApiResponse<ExamConsumableRule>>("/exam-consumables", payload);
    return data;
  },

  async update(id: number, payload: ExamConsumableUpdateData): Promise<ApiResponse<ExamConsumableRule>> {
    const { data } = await api.put<ApiResponse<ExamConsumableRule>>(`/exam-consumables/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/exam-consumables/${id}`);
    return data;
  },
};
