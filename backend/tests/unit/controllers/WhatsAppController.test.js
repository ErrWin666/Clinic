const WhatsAppController = require("../../../src/controllers/WhatsAppController");

jest.mock("../../../src/services/WhatsAppService");
jest.mock("../../../src/services/WhatsAppCloudService");
jest.mock("../../../src/services/SmsMobileApiService");
jest.mock("../../../src/models", () => ({
  Patient: { findByPk: jest.fn() },
  Appointment: { findByPk: jest.fn() },
  Invoice: { findByPk: jest.fn() },
  Settings: { findAll: jest.fn() },
}));

const { Patient, Appointment, Invoice, Settings } = require("../../../src/models");
const WhatsAppService = require("../../../src/services/WhatsAppService");
const WhatsAppCloudService = require("../../../src/services/WhatsAppCloudService");
const SmsMobileApiService = require("../../../src/services/SmsMobileApiService");

describe("WhatsAppController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    WhatsAppService.mockImplementation(() => ({
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      sendMessage: jest.fn(),
      sendAppointmentReminder: jest.fn(),
      sendInvoiceNotification: jest.fn(),
      sendFollowUpReminder: jest.fn(),
    }));
    WhatsAppCloudService.mockImplementation(() => ({
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      getMonthlyCount: jest.fn(),
    }));
    SmsMobileApiService.mockImplementation(() => ({
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      checkStatus: jest.fn(),
    }));
    controller = new WhatsAppController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("getSettings", () => {
    it("should return WhatsApp settings", async () => {
      controller.whatsappService.getSettings.mockResolvedValue({ enabled: true });
      await controller.getSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ enabled: true }) })
      );
    });

    it("should call next on error", async () => {
      controller.whatsappService.getSettings.mockRejectedValue(new Error("DB error"));
      await controller.getSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateSettings", () => {
    it("should update WhatsApp settings", async () => {
      req.body = { enabled: true, fromNumber: "1234567890" };
      controller.whatsappService.updateSettings.mockResolvedValue({ enabled: true });
      await controller.updateSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.body = { enabled: true };
      controller.whatsappService.updateSettings.mockRejectedValue(new Error("DB error"));
      await controller.updateSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("sendAppointmentReminder", () => {
    it("should send appointment reminder", async () => {
      req.params.id = "1";
      Appointment.findByPk.mockResolvedValue({ id: 1, patientId: 1 });
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient" });
      Settings.findAll.mockResolvedValue([{ value: '"Test Clinic"' }]);
      controller.whatsappService.sendAppointmentReminder.mockResolvedValue({ success: true });
      await controller.sendAppointmentReminder(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent appointment", async () => {
      req.params.id = "999";
      Appointment.findByPk.mockResolvedValue(null);
      await controller.sendAppointmentReminder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for non-existent patient", async () => {
      req.params.id = "1";
      Appointment.findByPk.mockResolvedValue({ id: 1, patientId: 999 });
      Patient.findByPk.mockResolvedValue(null);
      await controller.sendAppointmentReminder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.sendAppointmentReminder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("sendInvoiceNotification", () => {
    it("should send invoice notification", async () => {
      req.params.id = "1";
      Invoice.findByPk.mockResolvedValue({ id: 1, patientId: 1 });
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient" });
      Settings.findAll.mockResolvedValue([{ value: '"Test Clinic"' }]);
      controller.whatsappService.sendInvoiceNotification.mockResolvedValue({ success: true });
      await controller.sendInvoiceNotification(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent invoice", async () => {
      req.params.id = "999";
      Invoice.findByPk.mockResolvedValue(null);
      await controller.sendInvoiceNotification(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for non-existent patient on invoice", async () => {
      req.params.id = "1";
      Invoice.findByPk.mockResolvedValue({ id: 1, patientId: 999 });
      Patient.findByPk.mockResolvedValue(null);
      await controller.sendInvoiceNotification(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("sendFollowUpReminder", () => {
    it("should send follow-up reminder", async () => {
      req.params.patientId = "1";
      req.body = { lastVisitDate: "2026-01-01" };
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient" });
      Settings.findAll.mockResolvedValue([{ value: '"Test Clinic"' }]);
      controller.whatsappService.sendFollowUpReminder.mockResolvedValue({ success: true });
      await controller.sendFollowUpReminder(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent patient", async () => {
      req.params.patientId = "999";
      Patient.findByPk.mockResolvedValue(null);
      await controller.sendFollowUpReminder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("testMessage", () => {
    it("should send test message", async () => {
      req.body = { to: "+1234567890" };
      controller.whatsappService.sendMessage.mockResolvedValue({ success: true, sid: "TEST-001" });
      await controller.testMessage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next when phone number is missing", async () => {
      req.body = {};
      await controller.testMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle test message failure", async () => {
      req.body = { to: "+1234567890" };
      controller.whatsappService.sendMessage.mockResolvedValue({ success: false });
      await controller.testMessage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getCloudSettings", () => {
    it("should return WhatsApp Cloud settings", async () => {
      controller.whatsappCloudService.getSettings.mockResolvedValue({ enabled: true });
      controller.whatsappCloudService.getMonthlyCount.mockResolvedValue(5);
      await controller.getCloudSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      controller.whatsappCloudService.getSettings.mockRejectedValue(new Error("DB error"));
      await controller.getCloudSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateCloudSettings", () => {
    it("should update WhatsApp Cloud settings", async () => {
      req.body = { enabled: true };
      controller.whatsappCloudService.updateSettings.mockResolvedValue({ enabled: true });
      await controller.updateCloudSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on updateCloudSettings error", async () => {
      req.body = { enabled: true };
      controller.whatsappCloudService.updateSettings.mockRejectedValue(new Error("Update fail"));
      await controller.updateCloudSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getSmsMobileSettings", () => {
    it("should return SMSMobileAPI settings", async () => {
      controller.smsMobileApiService.getSettings.mockResolvedValue({ enabled: true });
      await controller.getSmsMobileSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on getSmsMobileSettings error", async () => {
      controller.smsMobileApiService.getSettings.mockRejectedValue(new Error("Get fail"));
      await controller.getSmsMobileSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateSmsMobileSettings", () => {
    it("should update SMSMobileAPI settings", async () => {
      req.body = { enabled: true, url: "http://localhost:3000", apiKey: "test" };
      controller.smsMobileApiService.updateSettings.mockResolvedValue({ enabled: true });
      await controller.updateSmsMobileSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on updateSmsMobileSettings error", async () => {
      req.body = { enabled: true };
      controller.smsMobileApiService.updateSettings.mockRejectedValue(new Error("Update fail"));
      await controller.updateSmsMobileSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("testSmsMobileConnection", () => {
    it("should test SMSMobileAPI connection", async () => {
      controller.smsMobileApiService.checkStatus.mockResolvedValue({ success: true });
      await controller.testSmsMobileConnection(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      controller.smsMobileApiService.checkStatus.mockRejectedValue(new Error("Connection failed"));
      await controller.testSmsMobileConnection(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
