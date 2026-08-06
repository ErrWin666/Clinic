import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

const mockMovement = {
  id: 1,
  productVariantId: 1,
  type: "in",
  reason: "opening_stock",
  quantity: 100,
  unitCost: 10.5,
  batchNumber: "BATCH-001",
  referenceType: null,
  referenceId: null,
  createdAt: "2025-01-01T10:00:00.000Z",
};

const mockStats = {
  totalProducts: 50,
  totalVariants: 120,
  totalStockValue: 15000.5,
  lowStockCount: 5,
  outOfStockCount: 2,
  expiringCount: 3,
  expiredCount: 1,
};

export const stockHandlers = [
  http.get(`${apiUrl}/stock/movements`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    return HttpResponse.json({
      success: true,
      data: [mockMovement],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: page,
        pageSize: 20,
      },
      message: "Stock movements retrieved",
    });
  }),

  http.get(`${apiUrl}/stock/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: mockStats,
      message: "Stock stats retrieved",
    });
  }),

  http.get(`${apiUrl}/stock/alerts`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        lowStock: [],
        outOfStock: [],
        expiring: [],
        expired: [],
        summary: {
          lowStockCount: 0,
          outOfStockCount: 0,
          expiringCount: 0,
          expiredCount: 0,
          total: 0,
        },
      },
      message: "Stock alerts retrieved",
    });
  }),

  http.post(`${apiUrl}/stock/opening-stock`, () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockMovement, id: 2, reason: "opening_stock" },
      message: "Opening stock added",
    });
  }),

  http.post(`${apiUrl}/stock/adjust`, () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockMovement, id: 3, reason: "adjustment" },
      message: "Stock adjusted",
    });
  }),

  http.post(`${apiUrl}/stock/damage`, () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockMovement, id: 4, reason: "damage" },
      message: "Damage recorded",
    });
  }),

  http.post(`${apiUrl}/stock/expiry`, () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockMovement, id: 5, reason: "expiry" },
      message: "Expiry recorded",
    });
  }),
];
