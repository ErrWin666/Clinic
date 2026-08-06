import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const mockInvoice = {
  id: 1,
  displayId: "INV-0001",
  invoiceDate: "2026-01-15",
  dueDate: null,
  totalAmount: 100,
  invoiceStatus: "unpaid",
  patientId: 1,
  patient: { id: 1, fullName: "John Doe", displayId: "P-0001" },
  items: [
    { id: 1, description: "Consultation", quantity: 1, unitPrice: 100, total: 100 },
  ],
  taxAmount: 0,
  discountAmount: 0,
  createdAt: "2026-01-15T00:00:00.000Z",
};

export const invoiceHandlers = [
  http.get(`${apiUrl}/invoices`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockInvoice],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Invoices retrieved",
    });
  }),

  http.get(`${apiUrl}/invoices/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockInvoice, id: Number(params.id) },
      message: "Invoice retrieved",
    });
  }),

  http.post(`${apiUrl}/invoices`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockInvoice, ...body, id: 2, displayId: "INV-0002" },
        message: "Invoice created",
      },
      { status: 201 }
    );
  }),

  http.put(`${apiUrl}/invoices/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockInvoice, ...body, id: Number(params.id) },
      message: "Invoice updated",
    });
  }),

  http.patch(`${apiUrl}/invoices/:id/status`, async ({ request, params }) => {
    const body = (await request.json()) as { status: string };
    return HttpResponse.json({
      success: true,
      data: {
        ...mockInvoice,
        id: Number(params.id),
        invoiceStatus: body.status,
      },
      message: "Status updated",
    });
  }),

  http.delete(`${apiUrl}/invoices/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Invoice deleted",
    });
  }),
];
