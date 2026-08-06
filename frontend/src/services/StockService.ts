import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { StockMovement, InventoryStats } from "@/types/models";
import type { StockMovementType, StockMovementReason } from "@/types/enums";

export interface StockMovementListParams {
  page?: number;
  pageSize?: number;
  productVariantId?: number;
  batchId?: number;
  type?: StockMovementType;
  reason?: StockMovementReason;
  referenceType?: string;
  referenceId?: number;
  startDate?: string;
  endDate?: string;
}

export interface OpeningStockData {
  productVariantId: number;
  quantity: number;
  unitCost: number;
  batchNumber: string;
  expiryDate?: string;
  note?: string;
}

export interface AdjustStockData {
  productVariantId: number;
  batchId?: number;
  newQuantity: number;
  reason: string;
  note?: string;
}

export interface DamageData {
  batchId: number;
  quantity: number;
  note?: string;
}

export interface ExpiryData {
  batchId: number;
  note?: string;
}

export interface StockAlerts {
  lowStock: StockAlertItem[];
  outOfStock: StockAlertItem[];
  expiring: StockAlertItem[];
  expired: StockAlertItem[];
  summary: {
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
    expiredCount: number;
    total: number;
  };
}

export interface StockAlertItem {
  type: "low_stock" | "out_of_stock" | "expiring" | "expired";
  variantId?: number;
  variantName?: string;
  productName?: string;
  sku?: string;
  batchId?: number;
  batchNumber?: string;
  quantity?: number;
  minQuantity?: number;
  expiryDate?: string;
  daysUntilExpiry?: number;
}

export const StockService = {
  async listMovements(params?: StockMovementListParams): Promise<ApiResponse<StockMovement[]>> {
    const { data } = await api.get<ApiResponse<StockMovement[]>>("/stock/movements", { params });
    return data;
  },

  async getStats(): Promise<ApiResponse<InventoryStats>> {
    const { data } = await api.get<ApiResponse<InventoryStats>>("/stock/stats");
    return data;
  },

  async checkAlerts(daysAhead?: number): Promise<ApiResponse<StockAlerts>> {
    const { data } = await api.get<ApiResponse<StockAlerts>>("/stock/alerts", {
      params: daysAhead ? { daysAhead } : undefined,
    });
    return data;
  },

  async openingStock(payload: OpeningStockData): Promise<ApiResponse<StockMovement>> {
    const { data } = await api.post<ApiResponse<StockMovement>>("/stock/opening-stock", payload);
    return data;
  },

  async adjustStock(payload: AdjustStockData): Promise<ApiResponse<StockMovement>> {
    const { data } = await api.post<ApiResponse<StockMovement>>("/stock/adjust", payload);
    return data;
  },

  async recordDamage(payload: DamageData): Promise<ApiResponse<StockMovement>> {
    const { data } = await api.post<ApiResponse<StockMovement>>("/stock/damage", payload);
    return data;
  },

  async recordExpiry(payload: ExpiryData): Promise<ApiResponse<StockMovement>> {
    const { data } = await api.post<ApiResponse<StockMovement>>("/stock/expiry", payload);
    return data;
  },
};
