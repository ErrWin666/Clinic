import { getApiUrl } from "@/lib/config";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  InventoryValuationReport,
  ProfitLossReport,
  LowStockReport,
  ExpiryReport,
  DeadStockReport,
} from "@/types/models";

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  patientType?: string;
  gender?: string;
}

export interface StockMovementReportParams {
  startDate?: string;
  endDate?: string;
  type?: string;
  reason?: string;
  productVariantId?: number;
}

export interface POReportParams {
  supplierId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

function buildQS(params: Record<string, unknown> | undefined): string {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    });
  }
  return qs.toString();
}

export const ReportService = {
  exportPatients(params: ReportParams): void {
    window.open(`${getApiUrl()}/reports/patients?${buildQS(params as Record<string, unknown>)}`, "_blank");
  },

  exportInvoices(params: ReportParams): void {
    window.open(`${getApiUrl()}/reports/invoices?${buildQS(params as Record<string, unknown>)}`, "_blank");
  },

  exportAppointments(params: ReportParams): void {
    window.open(`${getApiUrl()}/reports/appointments?${buildQS(params as Record<string, unknown>)}`, "_blank");
  },

  // === Inventory CSV exports ===

  exportInventory(): void {
    window.open(`${getApiUrl()}/reports/inventory`, "_blank");
  },

  exportStockMovements(params?: StockMovementReportParams): void {
    window.open(`${getApiUrl()}/reports/stock-movements?${buildQS(params as Record<string, unknown> | undefined)}`, "_blank");
  },

  exportSuppliers(search?: string): void {
    window.open(`${getApiUrl()}/reports/suppliers?${buildQS({ search })}`, "_blank");
  },

  exportPurchaseOrders(params?: POReportParams): void {
    window.open(`${getApiUrl()}/reports/purchase-orders?${buildQS(params as Record<string, unknown> | undefined)}`, "_blank");
  },

  exportSupplierStatement(supplierId: number, params?: ReportParams): void {
    window.open(`${getApiUrl()}/reports/supplier-statement/${supplierId}?${buildQS(params as Record<string, unknown> | undefined)}`, "_blank");
  },

  // === Inventory JSON reports ===

  async getInventoryValuation(): Promise<ApiResponse<InventoryValuationReport>> {
    const { data } = await api.get<ApiResponse<InventoryValuationReport>>("/reports/inventory-valuation");
    return data;
  },

  async getProfitLoss(startDate: string, endDate: string): Promise<ApiResponse<ProfitLossReport>> {
    const { data } = await api.get<ApiResponse<ProfitLossReport>>("/reports/profit-loss", {
      params: { startDate, endDate },
    });
    return data;
  },

  async getLowStock(): Promise<ApiResponse<LowStockReport>> {
    const { data } = await api.get<ApiResponse<LowStockReport>>("/reports/low-stock");
    return data;
  },

  async getExpiryReport(days?: number): Promise<ApiResponse<ExpiryReport>> {
    const { data } = await api.get<ApiResponse<ExpiryReport>>("/reports/expiry", {
      params: days ? { days } : undefined,
    });
    return data;
  },

  async getDeadStock(months?: number): Promise<ApiResponse<DeadStockReport>> {
    const { data } = await api.get<ApiResponse<DeadStockReport>>("/reports/dead-stock", {
      params: months ? { months } : undefined,
    });
    return data;
  },

  // === PDF Reports ===

  downloadInventoryValuationPDF(): void {
    window.open(`${getApiUrl()}/reports/inventory-valuation/pdf`, "_blank");
  },

  downloadLowStockPDF(): void {
    window.open(`${getApiUrl()}/reports/low-stock/pdf`, "_blank");
  },

  downloadExpiryPDF(days?: number): void {
    window.open(`${getApiUrl()}/reports/expiry/pdf?${buildQS({ days })}`, "_blank");
  },

  downloadDeadStockPDF(months?: number): void {
    window.open(`${getApiUrl()}/reports/dead-stock/pdf?${buildQS({ months })}`, "_blank");
  },

  downloadStockAgingPDF(): void {
    window.open(`${getApiUrl()}/reports/stock-aging/pdf`, "_blank");
  },

  downloadMovementsSummaryPDF(startDate?: string, endDate?: string): void {
    window.open(`${getApiUrl()}/reports/movements-summary/pdf?${buildQS({ startDate, endDate })}`, "_blank");
  },

  downloadProfitLossPDF(startDate: string, endDate: string): void {
    window.open(`${getApiUrl()}/reports/profit-loss/pdf?${buildQS({ startDate, endDate })}`, "_blank");
  },

  downloadStocktakingPDF(id: number): void {
    window.open(`${getApiUrl()}/reports/stocktaking/${id}/pdf`, "_blank");
  },
};
