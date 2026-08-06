const NotificationController = require("../../../src/controllers/NotificationController");
const CustomError = require("../../../src/utils/CustomError");

describe("NotificationController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new NotificationController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return paginated notifications", async () => {
      jest.spyOn(controller.notificationService, "list").mockResolvedValue({
        rows: [{ id: 1, type: "appointment_reminder" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.notificationService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("markRead", () => {
    it("should mark notification as read", async () => {
      req.params.id = "1";
      jest.spyOn(controller.notificationService, "markRead").mockResolvedValue({ id: 1, isRead: true });
      await controller.markRead(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.markRead(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("markAllRead", () => {
    it("should mark all notifications as read", async () => {
      jest.spyOn(controller.notificationService, "markAllRead").mockResolvedValue(true);
      await controller.markAllRead(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.notificationService, "markAllRead").mockRejectedValue(new Error("DB error"));
      await controller.markAllRead(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete notification", async () => {
      req.params.id = "1";
      jest.spyOn(controller.notificationService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.notificationService, "delete").mockRejectedValue(new Error("DB error"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("stream", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("should set up SSE connection", async () => {
      let closeCallback;
      req.app = { get: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      req.on = jest.fn((event, cb) => { closeCallback = cb; });
      res.writeHead = jest.fn();
      res.write = jest.fn();
      res.end = jest.fn();
      jest.spyOn(controller.notificationService, "list").mockResolvedValue({
        rows: [],
        pagination: { totalItems: 0, currentPage: 1, totalPages: 0 },
      });
      await controller.stream(req, res, next);
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining("connected"));
      if (closeCallback) closeCallback();
      expect(res.end).toHaveBeenCalled();
    });

    it("should trigger heartbeat and interval callbacks", async () => {
      let closeCallback;
      req.app = { get: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      req.on = jest.fn((event, cb) => { closeCallback = cb; });
      res.writeHead = jest.fn();
      res.write = jest.fn();
      res.end = jest.fn();
      jest.spyOn(controller.notificationService, "list").mockResolvedValue({
        rows: [],
        pagination: { totalItems: 5, currentPage: 1, totalPages: 1 },
      });
      await controller.stream(req, res, next);

      // Advance timers to trigger heartbeat (15s) and interval (30s)
      jest.advanceTimersByTime(16000);
      jest.advanceTimersByTime(31000);

      expect(res.write).toHaveBeenCalledWith(expect.stringContaining("ping"));

      if (closeCallback) closeCallback();
    });

    it("should handle SSE poll error in interval", async () => {
      let closeCallback;
      req.app = { get: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      req.on = jest.fn((event, cb) => { closeCallback = cb; });
      res.writeHead = jest.fn();
      res.write = jest.fn();
      res.end = jest.fn();
      jest.spyOn(controller.notificationService, "list").mockRejectedValue(new Error("Poll error"));
      await controller.stream(req, res, next);

      // Advance timers to trigger interval callback which will catch the error
      jest.advanceTimersByTime(31000);

      if (closeCallback) closeCallback();
    });
  });

  describe("getReminderSettings", () => {
    it("should return reminder settings with defaults", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findAll").mockResolvedValue([]);
      await controller.getReminderSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            appointmentReminderDays: 2,
            invoiceReminderDays: 3,
            followUpDays: 30,
          }),
        })
      );
    });

    it("should return reminder settings from DB with parsed values", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findAll").mockResolvedValue([
        { key: "notification.appointmentReminderDays", value: "5" },
        { key: "notification.invoiceReminderDays", value: "7" },
        { key: "notification.followUpDays", value: "60" },
      ]);
      await controller.getReminderSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.appointmentReminderDays).toBe(5);
      expect(data.invoiceReminderDays).toBe(7);
      expect(data.followUpDays).toBe(60);
    });

    it("should handle non-JSON values gracefully", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findAll").mockResolvedValue([
        { key: "notification.appointmentReminderDays", value: "not-json" },
      ]);
      await controller.getReminderSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findAll").mockRejectedValue(new Error("DB error"));
      await controller.getReminderSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateReminderSettings", () => {
    it("should update existing settings", async () => {
      const mockUpdate = jest.fn();
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockResolvedValue({ update: mockUpdate });
      req.body = { appointmentReminderDays: 5, invoiceReminderDays: 7, followUpDays: 60 };
      await controller.updateReminderSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should create settings when not existing", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockResolvedValue(null);
      jest.spyOn(require("../../../src/models").Settings, "create").mockResolvedValue({});
      req.body = { appointmentReminderDays: 5, invoiceReminderDays: 7, followUpDays: 60 };
      await controller.updateReminderSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(require("../../../src/models").Settings.create).toHaveBeenCalled();
    });

    it("should use defaults for invalid values", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockResolvedValue(null);
      jest.spyOn(require("../../../src/models").Settings, "create").mockResolvedValue({});
      req.body = { appointmentReminderDays: "invalid", invoiceReminderDays: null, followUpDays: undefined };
      await controller.updateReminderSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.appointmentReminderDays).toBe(2);
      expect(data.invoiceReminderDays).toBe(3);
      expect(data.followUpDays).toBe(30);
    });

    it("should call next on error", async () => {
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockRejectedValue(new Error("DB error"));
      req.body = { appointmentReminderDays: 5 };
      await controller.updateReminderSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getTemplates", () => {
    it("should return templates", async () => {
      jest.spyOn(controller.templates, "getClinicInfo").mockResolvedValue({ language: "en" });
      jest.spyOn(controller.templates, "getTemplates").mockResolvedValue({ appointment_reminder: "test" });
      jest.spyOn(controller.templates, "listTemplateTypes").mockReturnValue(["appointment_reminder"]);
      jest.spyOn(controller.templates, "getWhatsAppCloudTemplateDefinitions").mockReturnValue({});
      await controller.getTemplates(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ templates: { appointment_reminder: "test" } }),
        })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.templates, "getClinicInfo").mockRejectedValue(new Error("DB error"));
      await controller.getTemplates(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateTemplate", () => {
    it("should update existing template", async () => {
      const mockUpdate = jest.fn();
      jest.spyOn(controller.templates, "getClinicInfo").mockResolvedValue({ language: "en" });
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockResolvedValue({ update: mockUpdate });
      req.params.type = "appointment_reminder";
      req.body = { text: "Updated text", html: "<p>Updated</p>" };
      await controller.updateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should create template when not existing", async () => {
      jest.spyOn(controller.templates, "getClinicInfo").mockResolvedValue({ language: "en" });
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockResolvedValue(null);
      jest.spyOn(require("../../../src/models").Settings, "create").mockResolvedValue({});
      req.params.type = "appointment_reminder";
      req.body = { text: "New text", html: "<p>New</p>" };
      await controller.updateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(require("../../../src/models").Settings.create).toHaveBeenCalled();
    });

    it("should default language to ar when not set", async () => {
      jest.spyOn(controller.templates, "getClinicInfo").mockResolvedValue({});
      jest.spyOn(require("../../../src/models").Settings, "findOne").mockResolvedValue(null);
      jest.spyOn(require("../../../src/models").Settings, "create").mockResolvedValue({});
      req.params.type = "appointment_reminder";
      req.body = { text: "New text", html: "<p>New</p>" };
      await controller.updateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.templates, "getClinicInfo").mockRejectedValue(new Error("DB error"));
      req.params.type = "appointment_reminder";
      await controller.updateTemplate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("resetTemplate", () => {
    it("should reset template to default", async () => {
      jest.spyOn(require("../../../src/models").Settings, "destroy").mockResolvedValue(1);
      req.params.type = "appointment_reminder";
      await controller.resetTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { type: "appointment_reminder" },
        })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(require("../../../src/models").Settings, "destroy").mockRejectedValue(new Error("DB error"));
      req.params.type = "appointment_reminder";
      await controller.resetTemplate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
