jest.mock("../../../src/services/WhatsAppService");
jest.mock("../../../src/services/SmsMobileApiService");

const SmsService = require("../../../src/services/SmsService");
const WhatsAppService = require("../../../src/services/WhatsAppService");
const SmsMobileApiService = require("../../../src/services/SmsMobileApiService");

describe("SmsService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    WhatsAppService.mockImplementation(() => ({
      sendMessage: jest.fn(),
    }));
    SmsMobileApiService.mockImplementation(() => ({
      isEnabled: jest.fn().mockReturnValue(false),
      sendMessage: jest.fn(),
    }));
    service = new SmsService();
  });

  describe("sendMessage", () => {
    it("should use SmsMobileApi when enabled and successful", async () => {
      service.smsMobileApiService.isEnabled.mockReturnValue(true);
      service.smsMobileApiService.sendMessage.mockResolvedValue({ success: true, sid: "MOBILE-001" });

      const result = await service.sendMessage("+1234567890", "Test message");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("sms_mobile");
      expect(service.smsMobileApiService.sendMessage).toHaveBeenCalledWith("+1234567890", "Test message");
    });

    it("should fall back to Twilio when SmsMobileApi fails", async () => {
      service.smsMobileApiService.isEnabled.mockReturnValue(true);
      service.smsMobileApiService.sendMessage.mockResolvedValue({ success: false, error: "Network error" });
      service.twilioService.sendMessage.mockResolvedValue({ success: true, sid: "TWILIO-001" });

      const result = await service.sendMessage("+1234567890", "Test message");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("sms");
      expect(service.twilioService.sendMessage).toHaveBeenCalled();
    });

    it("should use Twilio directly when SmsMobileApi is disabled", async () => {
      service.smsMobileApiService.isEnabled.mockReturnValue(false);
      service.twilioService.sendMessage.mockResolvedValue({ success: true, sid: "TWILIO-002" });

      const result = await service.sendMessage("+1234567890", "Test message");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("sms");
      expect(service.smsMobileApiService.sendMessage).not.toHaveBeenCalled();
    });

    it("should return failure when both services fail", async () => {
      service.smsMobileApiService.isEnabled.mockReturnValue(true);
      service.smsMobileApiService.sendMessage.mockResolvedValue({ success: false, error: "Mobile API down" });
      service.twilioService.sendMessage.mockResolvedValue({ success: false, error: "Twilio down" });

      const result = await service.sendMessage("+1234567890", "Test message");
      expect(result.success).toBe(false);
      expect(result.channel).toBe("sms");
    });
  });
});
