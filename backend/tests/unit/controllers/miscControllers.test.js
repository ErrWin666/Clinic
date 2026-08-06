const DashboardController = require("../../../src/controllers/DashboardController");
const SystemController = require("../../../src/controllers/SystemController");
const AuditLogController = require("../../../src/controllers/AuditLogController");
const SetupController = require("../../../src/controllers/SetupController");
const SettingsController = require("../../../src/controllers/SettingsController");
const NotificationController = require("../../../src/controllers/NotificationController");
const ReportController = require("../../../src/controllers/reports");
const CustomError = require("../../../src/utils/CustomError");

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    writeHead: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
}

describe("DashboardController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new DashboardController();
    next = jest.fn();
    res = mockRes();
    req = {};
  });

  it("should return stats", async () => {
    jest.spyOn(controller.dashboardService, "getStats").mockResolvedValue({ totalPatients: 10 });
    await controller.getStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { totalPatients: 10 } }));
  });

  it("should call next on error", async () => {
    jest.spyOn(controller.dashboardService, "getStats").mockRejectedValue(new Error("fail"));
    await controller.getStats(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("SystemController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new SystemController();
    next = jest.fn();
    res = mockRes();
    req = {};
  });

  it("should return disk space", async () => {
    jest.spyOn(controller.systemService, "getDiskSpace").mockResolvedValue({ used: 100, total: 500, percentage: 20, status: "ok" });
    await controller.getDiskSpace(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should call next on error", async () => {
    jest.spyOn(controller.systemService, "getDiskSpace").mockRejectedValue(new Error("fail"));
    await controller.getDiskSpace(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("AuditLogController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new AuditLogController();
    next = jest.fn();
    res = mockRes();
    req = { query: {} };
  });

  it("should return paginated audit logs", async () => {
    jest.spyOn(controller.auditLogService, "list").mockResolvedValue({
      rows: [{ id: 1, action: "CREATE" }],
      pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
    });
    await controller.list(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should call next on error", async () => {
    jest.spyOn(controller.auditLogService, "list").mockRejectedValue(new Error("fail"));
    await controller.list(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("SetupController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new SetupController();
    next = jest.fn();
    res = mockRes();
    req = { body: {} };
  });

  it("should check admin exists", async () => {
    jest.spyOn(controller.setupService, "checkAdminExists").mockResolvedValue({ exists: false });
    await controller.checkAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { exists: false } }));
  });

  it("should create admin and return 201", async () => {
    req.body = { username: "admin", password: "pass123" };
    jest.spyOn(controller.setupService, "createAdmin").mockResolvedValue({ id: 1, username: "admin" });
    await controller.createAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should call next on createAdmin error", async () => {
    jest.spyOn(controller.setupService, "createAdmin").mockRejectedValue(new Error("fail"));
    await controller.createAdmin(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("SettingsController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new SettingsController();
    next = jest.fn();
    res = mockRes();
    req = { body: {}, user: { id: 1 }, file: undefined };
  });

  it("should get all settings", async () => {
    jest.spyOn(controller.settingsService, "getAll").mockResolvedValue({ clinic: { name: "Test" } });
    await controller.getAll(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should update settings", async () => {
    req.body = { settings: [{ key: "clinic.name", value: '"Updated"', category: "clinic" }] };
    jest.spyOn(controller.settingsService, "update").mockResolvedValue({ clinic: { name: "Updated" } });
    await controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should update admin", async () => {
    req.body = { currentPassword: "pass", username: "newadmin" };
    jest.spyOn(controller.settingsService, "updateAdmin").mockResolvedValue({ id: 1, username: "newadmin" });
    await controller.updateAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should call next with CustomError if no file for uploadAdminImage", async () => {
    await controller.uploadAdminImage(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it("should upload admin image", async () => {
    req.file = { filename: "avatar.png" };
    jest.spyOn(controller.settingsService, "uploadAdminImage").mockResolvedValue({ id: 1, profileImage: "avatar.png" });
    await controller.uploadAdminImage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { profileImageUrl: "admin/avatar.png" } })
    );
  });

  it("should delete admin image", async () => {
    jest.spyOn(controller.settingsService, "deleteAdminImage").mockResolvedValue(true);
    await controller.deleteAdminImage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("NotificationController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new NotificationController();
    next = jest.fn();
    res = mockRes();
    req = { params: {}, query: {}, on: jest.fn() };
  });

  it("should list notifications", async () => {
    jest.spyOn(controller.notificationService, "list").mockResolvedValue({
      rows: [{ id: 1 }],
      pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
    });
    await controller.list(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should mark notification as read", async () => {
    req.params.id = "1";
    jest.spyOn(controller.notificationService, "markRead").mockResolvedValue({ id: 1, isRead: true });
    await controller.markRead(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should mark all as read", async () => {
    jest.spyOn(controller.notificationService, "markAllRead").mockResolvedValue(true);
    await controller.markAllRead(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should delete notification", async () => {
    req.params.id = "1";
    jest.spyOn(controller.notificationService, "delete").mockResolvedValue(true);
    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should call next for invalid id on markRead", async () => {
    req.params.id = "abc";
    await controller.markRead(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
  });

  it("should call next on markRead error", async () => {
    req.params.id = "1";
    jest.spyOn(controller.notificationService, "markRead").mockRejectedValue(new Error("fail"));
    await controller.markRead(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should call next on markAllRead error", async () => {
    jest.spyOn(controller.notificationService, "markAllRead").mockRejectedValue(new Error("fail"));
    await controller.markAllRead(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should call next for invalid id on delete", async () => {
    req.params.id = "0";
    await controller.delete(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
  });

  it("should call next on delete error", async () => {
    req.params.id = "1";
    jest.spyOn(controller.notificationService, "delete").mockRejectedValue(new Error("fail"));
    await controller.delete(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should stream notifications via SSE", async () => {
    jest.spyOn(controller.notificationService, "list").mockResolvedValue({
      rows: [],
      pagination: { totalItems: 0, currentPage: 1, totalPages: 0 },
    });
    let closeCallback;
    req.on = jest.fn((event, cb) => { if (event === "close") closeCallback = cb; });
    await controller.stream(req, res, next);
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      "Content-Type": "text/event-stream",
    }));
    expect(res.write).toHaveBeenCalled();
    expect(req.on).toHaveBeenCalledWith("close", expect.any(Function));
    // Trigger close to clear interval and prevent lingering timers
    if (closeCallback) closeCallback();
  });
});

describe("ReportController", () => {
  let controller, req, res, next;
  beforeEach(() => {
    controller = new ReportController();
    next = jest.fn();
    res = mockRes();
    req = { query: {} };
  });

  it("should export patients as CSV", async () => {
    jest.spyOn(controller.reportService, "exportPatients").mockResolvedValue({
      headers: ["ID", "Name"],
      rows: [[1, "Test Patient"]],
    });
    await controller.exportPatients(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
    expect(res.send).toHaveBeenCalled();
    const sent = res.send.mock.calls[0][0];
    expect(sent).toContain("Test Patient");
  });

  it("should export invoices as CSV", async () => {
    jest.spyOn(controller.reportService, "exportInvoices").mockResolvedValue({
      headers: ["ID", "Total"],
      rows: [[1, "100"]],
    });
    await controller.exportInvoices(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=invoices-report.csv");
  });

  it("should export appointments as CSV", async () => {
    jest.spyOn(controller.reportService, "exportAppointments").mockResolvedValue({
      headers: ["ID", "Date"],
      rows: [[1, "2026-01-01"]],
    });
    await controller.exportAppointments(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=appointments-report.csv");
  });

  it("should call next on export error", async () => {
    jest.spyOn(controller.reportService, "exportPatients").mockRejectedValue(new Error("fail"));
    await controller.exportPatients(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  describe("buildCSV", () => {
    it("should escape cells with commas", () => {
      const csv = controller.buildCSV(["Name"], [["Doe, John"]]);
      expect(csv).toContain('"Doe, John"');
    });

    it("should escape cells with quotes", () => {
      const csv = controller.buildCSV(["Name"], [['He said "hi"']]);
      expect(csv).toContain('""hi""');
    });

    it("should handle null values", () => {
      const csv = controller.buildCSV(["ID", "Name"], [[1, null]]);
      expect(csv).toContain('"1",""');
    });

    it("should handle newlines in cells", () => {
      const csv = controller.buildCSV(["Text"], [["Line1\nLine2"]]);
      expect(csv).toContain('"Line1\nLine2"');
    });
  });
});
