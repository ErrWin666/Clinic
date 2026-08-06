const AppointmentController = require("../../../src/controllers/AppointmentController");
const CustomError = require("../../../src/utils/CustomError");

describe("AppointmentController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new AppointmentController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return paginated appointments", async () => {
      jest.spyOn(controller.appointmentService, "list").mockResolvedValue({
        rows: [{ id: 1 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.appointmentService, "list").mockRejectedValue(new Error("fail"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getCalendar", () => {
    it("should return calendar appointments", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-01-31" };
      jest.spyOn(controller.appointmentService, "getCalendar").mockResolvedValue([{ id: 1 }]);
      await controller.getCalendar(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-01-31" };
      jest.spyOn(controller.appointmentService, "getCalendar").mockRejectedValue(new Error("fail"));
      await controller.getCalendar(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return appointment by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.appointmentService, "getById").mockResolvedValue({ id: 1 });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create appointment and return 201", async () => {
      req.body = { appointmentDate: "2026-01-01", startTime: "10:00", endTime: "11:00", appointmentType: "checkup" };
      jest.spyOn(controller.appointmentService, "create").mockResolvedValue({ id: 1, displayId: "APT-0001" });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on conflict", async () => {
      req.body = { appointmentDate: "2026-01-01", startTime: "10:00", endTime: "11:00" };
      jest.spyOn(controller.appointmentService, "create").mockRejectedValue(
        new CustomError("Conflict", "APPOINTMENT_CONFLICT", 409)
      );
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("update", () => {
    it("should update appointment", async () => {
      req.params.id = "1";
      req.body = { appointmentType: "followup" };
      jest.spyOn(controller.appointmentService, "update").mockResolvedValue({ id: 1 });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      req.body = { appointmentType: "followup" };
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      req.body = { appointmentType: "followup" };
      jest.spyOn(controller.appointmentService, "update").mockRejectedValue(new Error("fail"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("changeStatus", () => {
    it("should change status", async () => {
      req.params.id = "1";
      req.body = { status: "confirmed" };
      jest.spyOn(controller.appointmentService, "changeStatus").mockResolvedValue({ id: 1, status: "confirmed" });
      await controller.changeStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("linkPatient", () => {
    it("should link patient to appointment", async () => {
      req.params.id = "1";
      req.body = { patientId: "2" };
      jest.spyOn(controller.appointmentService, "linkPatient").mockResolvedValue({ id: 1, patientId: 2 });
      await controller.linkPatient(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid patientId", async () => {
      req.params.id = "1";
      req.body = { patientId: "invalid" };
      await controller.linkPatient(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("delete", () => {
    it("should delete appointment (soft delete via service.delete)", async () => {
      req.params.id = "1";
      jest.spyOn(controller.appointmentService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(controller.appointmentService.delete).toHaveBeenCalledWith(1);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.appointmentService, "delete").mockRejectedValue(new Error("fail"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getWorkingHours", () => {
    it("should return working hours", async () => {
      jest.spyOn(controller.appointmentService, "getWorkingHours").mockResolvedValue({ start: "09:00", end: "17:00" });
      await controller.getWorkingHours(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.appointmentService, "getWorkingHours").mockRejectedValue(new Error("fail"));
      await controller.getWorkingHours(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("confirm", () => {
    it("should confirm appointment and return 200", async () => {
      req.params.id = "1";
      jest.spyOn(controller.appointmentService, "confirm").mockResolvedValue({ id: 1, status: "confirmed", confirmedAt: new Date() });
      await controller.confirm(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.confirm(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.appointmentService, "confirm").mockRejectedValue(new Error("fail"));
      await controller.confirm(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("linkExamination", () => {
    it("should link examination and return 200", async () => {
      req.params.id = "1";
      req.body = { entityId: "2" };
      jest.spyOn(controller.appointmentService, "linkExamination").mockResolvedValue({ id: 1, examinationId: 2 });
      await controller.linkExamination(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(controller.appointmentService.linkExamination).toHaveBeenCalledWith(1, 2);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      req.body = { entityId: "2" };
      await controller.linkExamination(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("linkInvoice", () => {
    it("should link invoice and return 200", async () => {
      req.params.id = "1";
      req.body = { entityId: "3" };
      jest.spyOn(controller.appointmentService, "linkInvoice").mockResolvedValue({ id: 1, invoiceId: 3 });
      await controller.linkInvoice(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(controller.appointmentService.linkInvoice).toHaveBeenCalledWith(1, 3);
    });

    it("should call next for invalid entityId", async () => {
      req.params.id = "1";
      req.body = { entityId: "invalid" };
      await controller.linkInvoice(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getAvailableSlots", () => {
    it("should return available slots", async () => {
      req.query = { date: "2026-12-01", appointmentType: "consultation" };
      jest.spyOn(controller.appointmentService, "getAvailableSlots").mockResolvedValue([
        { startTime: "09:00", endTime: "09:30", duration: 30 },
      ]);
      await controller.getAvailableSlots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.query = { date: "2026-12-01", appointmentType: "consultation" };
      jest.spyOn(controller.appointmentService, "getAvailableSlots").mockRejectedValue(new Error("fail"));
      await controller.getAvailableSlots(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
