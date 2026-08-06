import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const examinationHandlers = [
  http.get(`${apiUrl}/patients/:patientId/examinations`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
      },
      message: "Examinations retrieved",
    });
  }),

  http.get(`${apiUrl}/patients/:patientId/examinations/simple`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Examinations retrieved",
    });
  }),
];
