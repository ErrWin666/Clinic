import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const mockPatientNote = {
  id: 1,
  patientId: 1,
  title: "Test Patient Note",
  content: "<p>This is a test patient note.</p>",
  userId: 1,
  attachments: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const patientNoteHandlers = [
  http.get(`${apiUrl}/patients/:patientId/notes`, ({ request, params }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    return HttpResponse.json({
      success: true,
      data: [{ ...mockPatientNote, patientId: Number(params.patientId) }],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: page,
        pageSize: 20,
      },
      message: "Patient notes retrieved",
    });
  }),

  http.get(`${apiUrl}/patients/:patientId/notes/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        ...mockPatientNote,
        id: Number(params.id),
        patientId: Number(params.patientId),
      },
      message: "Patient note retrieved",
    });
  }),

  http.post(`${apiUrl}/patients/:patientId/notes`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          ...mockPatientNote,
          ...body,
          id: 2,
          patientId: Number(params.patientId),
        },
        message: "Patient note created",
      },
      { status: 201 }
    );
  }),

  http.put(`${apiUrl}/patients/:patientId/notes/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        ...mockPatientNote,
        ...body,
        id: Number(params.id),
        patientId: Number(params.patientId),
      },
      message: "Patient note updated",
    });
  }),

  http.delete(`${apiUrl}/patients/:patientId/notes/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Patient note deleted",
    });
  }),
];
