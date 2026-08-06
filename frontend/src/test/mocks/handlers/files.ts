import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const fileHandlers = [
  http.get(`${apiUrl}/patients/:patientId/folders`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Folders retrieved",
    });
  }),

  http.get(`${apiUrl}/patients/:patientId/files`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Files retrieved",
    });
  }),
];
