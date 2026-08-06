const TelegramController = require("../../../src/controllers/TelegramController");

jest.mock("../../../src/services/TelegramBotService");
jest.mock("../../../src/services/SmsService");
jest.mock("../../../src/models", () => ({
  Patient: { findByPk: jest.fn() },
  Settings: { findAll: jest.fn() },
}));

const { Patient } = require("../../../src/models");
const TelegramBotService = require("../../../src/services/TelegramBotService");
const SmsService = require("../../../src/services/SmsService");

describe("TelegramController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    TelegramBotService.mockImplementation(() => ({
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      handleUpdate: jest.fn(),
      generateInviteLink: jest.fn(),
      sendMessage: jest.fn(),
    }));
    SmsService.mockImplementation(() => ({
      sendMessage: jest.fn(),
    }));
    controller = new TelegramController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("getSettings", () => {
    it("should return Telegram settings", async () => {
      controller.telegramService.getSettings.mockResolvedValue({ enabled: true, botToken: "xxx" });
      await controller.getSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      controller.telegramService.getSettings.mockRejectedValue(new Error("DB error"));
      await controller.getSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateSettings", () => {
    it("should update Telegram settings", async () => {
      req.body = { enabled: true, botToken: "newtoken" };
      controller.telegramService.updateSettings.mockResolvedValue({ enabled: true });
      await controller.updateSettings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.body = { enabled: true };
      controller.telegramService.updateSettings.mockRejectedValue(new Error("DB error"));
      await controller.updateSettings(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("handleWebhook", () => {
    it("should respond with 200 and process update", async () => {
      req.body = { update_id: 12345, message: { text: "hello" } };
      controller.telegramService.handleUpdate.mockResolvedValue();
      await controller.handleWebhook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe("sendInviteLink", () => {
    it("should send invite link via SMS", async () => {
      req.params.patientId = "1";
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient", phoneNumber: "+1234567890" });
      controller.telegramService.generateInviteLink.mockResolvedValue({
        success: true,
        link: "https://t.me/+abc123",
      });
      controller.smsService.sendMessage.mockResolvedValue({ success: true, channel: "sms_mobile" });
      await controller.sendInviteLink(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent patient", async () => {
      req.params.patientId = "999";
      Patient.findByPk.mockResolvedValue(null);
      await controller.sendInviteLink(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next when patient has no phone number", async () => {
      req.params.patientId = "1";
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient", phoneNumber: null });
      await controller.sendInviteLink(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next when invite generation fails", async () => {
      req.params.patientId = "1";
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient", phoneNumber: "+1234567890" });
      controller.telegramService.generateInviteLink.mockResolvedValue({ success: false });
      await controller.sendInviteLink(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid patient id", async () => {
      req.params.patientId = "invalid";
      await controller.sendInviteLink(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("testConnection", () => {
    it("should send test message", async () => {
      req.body = { chatId: "123456" };
      controller.telegramService.sendMessage.mockResolvedValue({ success: true });
      await controller.testConnection(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next when chatId is missing", async () => {
      req.body = {};
      await controller.testConnection(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.body = { chatId: "123456" };
      controller.telegramService.sendMessage.mockRejectedValue(new Error("Send failed"));
      await controller.testConnection(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should return 200 even when test message fails", async () => {
      req.body = { chatId: "123456" };
      controller.telegramService.sendMessage.mockResolvedValue({ success: false });
      await controller.testConnection(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("handleWebhook error paths", () => {
    it("should call next on unexpected error", async () => {
      res.status = jest.fn(() => { throw new Error("Response error"); });
      req.body = { update_id: 12345 };
      await controller.handleWebhook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("sendInviteLink - SMS failure", () => {
    it("should return 200 with smsSent false when SMS fails", async () => {
      req.params.patientId = "1";
      Patient.findByPk.mockResolvedValue({ id: 1, fullName: "Test Patient", phoneNumber: "+1234567890" });
      controller.telegramService.generateInviteLink.mockResolvedValue({
        success: true,
        link: "https://t.me/+abc123",
      });
      controller.smsService.sendMessage.mockResolvedValue({ success: false });
      await controller.sendInviteLink(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
