const PatientReportController = require("../../../src/controllers/reports/PatientReportController");

describe("PatientReportController", () => {
  let controller, req, res, next;
  let mockReportService;

  beforeEach(() => {
    mockReportService = {
      exportPatients: jest.fn(),
      exportInvoices: jest.fn(),
      exportAppointments: jest.fn(),
    };
    controller = new PatientReportController(mockReportService);
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("exportPatients", () => {
    it("should export patients as CSV", async () => {
      req.query = { patientType: "adult" };
      mockReportService.exportPatients.mockResolvedValue({
        headers: ["ID", "Name", "Phone"],
        rows: [[1, "Test Patient", "555-1234"]],
      });
      await controller.exportPatients(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(res.send).toHaveBeenCalled();
      const sent = res.send.mock.calls[0][0];
      expect(sent).toContain("Test Patient");
    });

    it("should call next on error", async () => {
      mockReportService.exportPatients.mockRejectedValue(new Error("DB error"));
      await controller.exportPatients(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("exportInvoices", () => {
    it("should export invoices as CSV", async () => {
      req.query = { status: "paid" };
      mockReportService.exportInvoices.mockResolvedValue({
        headers: ["ID", "Total", "Status"],
        rows: [[1, "200", "paid"]],
      });
      await controller.exportInvoices(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=invoices-report.csv");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      mockReportService.exportInvoices.mockRejectedValue(new Error("DB error"));
      await controller.exportInvoices(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("exportAppointments", () => {
    it("should export appointments as CSV", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      mockReportService.exportAppointments.mockResolvedValue({
        headers: ["ID", "Date", "Status"],
        rows: [[1, "2026-06-01", "completed"]],
      });
      await controller.exportAppointments(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=appointments-report.csv");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      mockReportService.exportAppointments.mockRejectedValue(new Error("DB error"));
      await controller.exportAppointments(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
