import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const mockAppointment = {
  id: 1,
  appointmentDate: "2026-12-01",
  startTime: "10:00",
  endTime: "11:00",
  appointmentType: "checkup",
  status: "upcoming",
  patientId: 1,
  patient: { id: 1, fullName: "John Doe", displayId: "P-0001" },
  reason: null,
  notes: null,
};

export const appointmentHandlers = [
  http.get(`${apiUrl}/appointments`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockAppointment],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Appointments retrieved",
    });
  }),

  http.post(`${apiUrl}/appointments`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockAppointment, ...body, id: 2 },
        message: "Appointment created",
      },
      { status: 201 }
    );
  }),

  http.patch(`${apiUrl}/appointments/:id/status`, async ({ request, params }) => {
    const body = (await request.json()) as { status: string };
    return HttpResponse.json({
      success: true,
      data: { ...mockAppointment, id: Number(params.id), status: body.status },
      message: "Status updated",
    });
  }),

  http.put(`${apiUrl}/appointments/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockAppointment, ...body, id: Number(params.id) },
      message: "Appointment updated",
    });
  }),

  http.get(`${apiUrl}/appointments/slots`, ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? "";
    void date;
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Available slots retrieved",
    });
  }),
];
