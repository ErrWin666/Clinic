const MessageDispatcherController = require("../../../src/controllers/MessageDispatcherController");

jest.mock("../../../src/models", () => ({
  Notification: { findByPk: jest.fn() },
  Patient: { findByPk: jest.fn() },
}));

const { Notification, Patient } = require("../../../src/models");

describe("MessageDispatcherController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MessageDispatcherController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("dispatchNotification", () => {
    it("should dispatch a notification successfully", async () => {
      req.params.notificationId = "1";
      Notification.findByPk.mockResolvedValue({
        id: 1,
        type: "appointment_reminder",
        entityType: "patient",
        entityId: 1,
      });
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient" });
      jest.spyOn(controller.dispatcher, "dispatch").mockResolvedValue({ success: true, channel: "sms" });
      await controller.dispatchNotification(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ success: true }) })
      );
    });

    it("should call next for non-existent notification", async () => {
      req.params.notificationId = "999";
      Notification.findByPk.mockResolvedValue(null);
      await controller.dispatchNotification(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.notificationId = "invalid";
      await controller.dispatchNotification(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on dispatch error", async () => {
      req.params.notificationId = "1";
      Notification.findByPk.mockResolvedValue({ id: 1, type: "appointment_reminder" });
      jest.spyOn(controller.dispatcher, "dispatch").mockRejectedValue(new Error("Dispatch failed"));
      await controller.dispatchNotification(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should work without patient when entityType is not patient", async () => {
      req.params.notificationId = "1";
      Notification.findByPk.mockResolvedValue({
        id: 1,
        type: "stock_alert",
        entityType: "product",
        entityId: 1,
      });
      jest.spyOn(controller.dispatcher, "dispatch").mockResolvedValue({ success: true });
      await controller.dispatchNotification(req, res, next);
      expect(Patient.findByPk).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getDispatchStatus", () => {
    it("should return dispatch status for a notification", async () => {
      req.params.notificationId = "1";
      Notification.findByPk.mockResolvedValue({
        id: 1,
        type: "appointment_reminder",
        dispatchChannel: "sms",
        dispatchedAt: "2026-01-01",
        dispatchError: null,
      });
      await controller.getDispatchStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent notification", async () => {
      req.params.notificationId = "999";
      Notification.findByPk.mockResolvedValue(null);
      await controller.getDispatchStatus(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.notificationId = "invalid";
      await controller.getDispatchStatus(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getDispatchStats", () => {
    it("should return dispatch stats", async () => {
      jest.spyOn(controller.dispatcher, "getStats").mockResolvedValue({
        today: { sms: 5, whatsapp: 3, telegram: 2 },
      });
      await controller.getDispatchStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.dispatcher, "getStats").mockRejectedValue(new Error("Stats error"));
      await controller.getDispatchStats(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
