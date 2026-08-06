import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const mockPatient = {
  id: 1,
  displayId: "P-0001",
  fullName: "John Doe",
  birthDate: "1990-01-01",
  gender: "male",
  phoneNumber: "5551234567",
  email: null,
  address: null,
  patientType: "regular",
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const patientHandlers = [
  http.get(`${apiUrl}/patients`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    return HttpResponse.json({
      success: true,
      data: [mockPatient],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: page,
        pageSize: 20,
      },
      message: "Patients retrieved",
    });
  }),

  http.get(`${apiUrl}/patients/autocomplete`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          displayId: "P-0001",
          fullName: "John Doe",
          phoneNumber: "5551234567",
          gender: "male",
          birthDate: "1990-01-01",
        },
      ],
      message: "Search results",
    });
  }),

  http.get(`${apiUrl}/patients/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockPatient, id: Number(params.id) },
      message: "Patient retrieved",
    });
  }),

  http.post(`${apiUrl}/patients`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockPatient, ...body, id: 2, displayId: "P-0002" },
        message: "Patient created",
      },
      { status: 201 }
    );
  }),

  http.put(`${apiUrl}/patients/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockPatient, ...body, id: Number(params.id) },
      message: "Patient updated",
    });
  }),

  http.delete(`${apiUrl}/patients/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Patient deleted",
    });
  }),

  http.post(`${apiUrl}/patients/:id/profile-image`, () => {
    return HttpResponse.json({
      success: true,
      data: { profileImageUrl: "patients/1/test-avatar.png" },
      message: "Image uploaded",
    });
  }),

  http.delete(`${apiUrl}/patients/:id/profile-image`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Image deleted",
    });
  }),
];
