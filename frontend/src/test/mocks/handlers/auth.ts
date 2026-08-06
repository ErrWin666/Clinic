import { http, HttpResponse } from "msw";
import { config } from "@/lib/config";

const apiUrl = config.apiUrl;

export const mockUser = {
  id: 1,
  username: "admin",
  role: "admin",
  profileImage: null as string | null,
  isAdmin: true,
};

export const authHandlers = [
  http.post(`${apiUrl}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.username === "admin" && body.password === "Admin@123") {
      return HttpResponse.json({
        success: true,
        data: { user: mockUser },
        message: "Login successful",
      });
    }
    return HttpResponse.json(
      {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
        message: "Login failed",
      },
      { status: 401 }
    );
  }),

  http.get(`${apiUrl}/auth/session-status`, () => {
    return HttpResponse.json({
      success: true,
      data: { user: mockUser },
      message: "Session active",
    });
  }),

  http.post(`${apiUrl}/auth/logout`, () => {
    return HttpResponse.json({ success: true, data: null, message: "Logged out" });
  }),

  http.post(`${apiUrl}/auth/refresh-token`, () => {
    return HttpResponse.json({
      success: true,
      data: { user: mockUser },
      message: "Token refreshed",
    });
  }),

  // Setup
  http.get(`${apiUrl}/setup/check-admin`, () => {
    return HttpResponse.json({
      success: true,
      data: { adminExists: true },
      message: "Admin exists",
    });
  }),

  http.post(`${apiUrl}/setup/create-admin`, async ({ request }) => {
    const body = (await request.json()) as { username: string };
    return HttpResponse.json({
      success: true,
      data: { id: 1, username: body.username, role: "admin" },
      message: "Admin created",
    });
  }),
];
