import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const mockClinicNote = {
  id: 1,
  title: "Test Clinic Note",
  content: "<p>This is a test clinic note.</p>",
  userId: 1,
  attachments: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const clinicNoteHandlers = [
  http.get(`${apiUrl}/clinic-notes`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    return HttpResponse.json({
      success: true,
      data: [mockClinicNote],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: page,
        pageSize: 20,
      },
      message: "Clinic notes retrieved",
    });
  }),

  http.get(`${apiUrl}/clinic-notes/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockClinicNote, id: Number(params.id) },
      message: "Clinic note retrieved",
    });
  }),

  http.post(`${apiUrl}/clinic-notes`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockClinicNote, ...body, id: 2 },
        message: "Clinic note created",
      },
      { status: 201 }
    );
  }),

  http.put(`${apiUrl}/clinic-notes/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockClinicNote, ...body, id: Number(params.id) },
      message: "Clinic note updated",
    });
  }),

  http.delete(`${apiUrl}/clinic-notes/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Clinic note deleted",
    });
  }),
];
