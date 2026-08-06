import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const systemHandlers = [
  // Dashboard
  http.get(`${apiUrl}/dashboard/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalPatients: 50,
        todayAppointments: 5,
        unpaidInvoices: { count: 3, totalAmount: 1500 },
        monthlyRevenue: 12000,
        appointmentsChart: [{ month: "Jan", count: 10 }],
        revenueChart: [{ month: "Jan", revenue: 5000 }],
        recentAppointments: [],
        recentExaminations: [],
      },
      message: "Stats retrieved",
    });
  }),

  // Notifications
  http.get(`${apiUrl}/notifications`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Notifications retrieved",
    });
  }),

  http.patch(`${apiUrl}/notifications/read-all`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "All marked as read",
    });
  }),

  // System
  http.get(`${apiUrl}/system/disk-space`, () => {
    return HttpResponse.json({
      success: true,
      data: { total: 500, used: 200, free: 300, percentage: 40, status: "ok" },
      message: "Disk space retrieved",
    });
  }),

  // Audit logs
  http.get(`${apiUrl}/audit-logs`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Audit logs retrieved",
    });
  }),

  // Relationships
  http.get(`${apiUrl}/patients/:patientId/relationships`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Relationships retrieved",
    });
  }),
];
