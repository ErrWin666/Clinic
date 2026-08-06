import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Stocktaking } from "@/types/models";

export interface StocktakingListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface StocktakingCountUpdate {
  id: number;
  countedQuantity?: number | null;
  note?: string | null;
}

export const StocktakingService = {
  async list(params?: StocktakingListParams): Promise<ApiResponse<Stocktaking[]>> {
    const { data } = await api.get<ApiResponse<Stocktaking[]>>("/stocktaking", { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Stocktaking>> {
    const { data } = await api.get<ApiResponse<Stocktaking>>(`/stocktaking/${id}`);
    return data;
  },

  async start(note?: string): Promise<ApiResponse<Stocktaking>> {
    const { data } = await api.post<ApiResponse<Stocktaking>>("/stocktaking", { note });
    return data;
  },

  async updateCounts(id: number, items: StocktakingCountUpdate[]): Promise<ApiResponse<Stocktaking>> {
    const { data } = await api.put<ApiResponse<Stocktaking>>(`/stocktaking/${id}/counts`, { items });
    return data;
  },

  async complete(id: number): Promise<ApiResponse<Stocktaking>> {
    const { data } = await api.post<ApiResponse<Stocktaking>>(`/stocktaking/${id}/complete`);
    return data;
  },

  async cancel(id: number): Promise<ApiResponse<Stocktaking>> {
    const { data } = await api.post<ApiResponse<Stocktaking>>(`/stocktaking/${id}/cancel`);
    return data;
  },
};
