import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const settingsHandlers = [
  http.get(`${apiUrl}/settings`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        clinic: {
          "clinic.name": '"Test Clinic"',
          "clinic.currency": '"USD"',
          "clinic.language": '"ar"',
        },
        backup: { "backup.schedule": "7" },
        notification: { "notification.appointmentReminder": "30" },
        ui: { "ui.theme": '"light"' },
      },
      message: "Settings retrieved",
    });
  }),

  http.put(`${apiUrl}/settings`, () => {
    return HttpResponse.json({
      success: true,
      data: {},
      message: "Settings updated",
    });
  }),

  http.put(`${apiUrl}/settings/admin`, () => {
    return HttpResponse.json({
      success: true,
      data: { id: 1, username: "admin", role: "admin" },
      message: "Admin updated",
    });
  }),

  http.post(`${apiUrl}/settings/admin/profile-image`, () => {
    return HttpResponse.json({
      success: true,
      data: { profileImageUrl: "admin/test-avatar.png" },
      message: "Image uploaded",
    });
  }),

  http.delete(`${apiUrl}/settings/admin/profile-image`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Image deleted",
    });
  }),
];
