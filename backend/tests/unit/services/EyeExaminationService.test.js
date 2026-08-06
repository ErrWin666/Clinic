const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const EyeExaminationService = require("../../../src/services/EyeExaminationService");
const PatientService = require("../../../src/services/PatientService");
const CustomError = require("../../../src/utils/CustomError");

describe("EyeExaminationService", () => {
  let examService;
  let patientService;
  let testPatient;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    examService = new EyeExaminationService();
    patientService = new PatientService();
    testPatient = await patientService.create({
      fullName: "Exam Patient",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "1112223333",
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create an examination with displayId", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-23",
        rightEyeWithoutCorrection: "20/20",
        leftEyeWithoutCorrection: "20/40",
      });
      expect(exam).toBeDefined();
      expect(exam.displayId).toBe("EX-0001");
      expect(exam.rightEyeWithoutCorrection).toBe("20/20");
    });

    it("should throw 404 for non-existent patient", async () => {
      await expect(
        examService.create(99999, { examDate: "2026-07-23" })
      ).rejects.toThrow(CustomError);
    });
  });

  describe("getById", () => {
    it("should return exam with patient", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-24",
        rightEyeWithCorrection: "20/15",
      });
      const found = await examService.getById(exam.id);
      expect(found).toBeDefined();
      expect(found.rightEyeWithCorrection).toBe("20/15");
    });

    it("should throw 404 for non-existent exam", async () => {
      await expect(examService.getById(99999)).rejects.toThrow(CustomError);
      try {
        await examService.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("createFollowUp", () => {
    it("should create follow-up copying data from original", async () => {
      const original = await examService.create(testPatient.id, {
        examDate: "2026-07-25",
        rightEyeWithoutCorrection: "20/30",
        leftEyeWithoutCorrection: "20/25",
        followUpInstructions: "Check again in 1 month",
      });
      const followUp = await examService.createFollowUp(original.id);
      expect(followUp).toBeDefined();
      expect(followUp.displayId).toBe("EX-0004");
      expect(followUp.rightEyeWithoutCorrection).toBe("20/30");
      expect(followUp.leftEyeWithoutCorrection).toBe("20/25");
    });

    it("should throw 404 for non-existent exam on createFollowUp", async () => {
      await expect(examService.createFollowUp(99999)).rejects.toThrow(CustomError);
    });
  });

  describe("getByPatientId", () => {
    it("should list exams for a patient", async () => {
      const { rows, pagination } = await examService.getByPatientId(testPatient.id, {
        page: 1,
        pageSize: 10,
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by examStatus", async () => {
      const { rows } = await examService.getByPatientId(testPatient.id, {
        page: 1,
        pageSize: 10,
        examStatus: "pending",
      });
      expect(rows).toBeDefined();
      expect(rows.every((r) => r.examStatus === "pending")).toBe(true);
    });

    it("should filter by date range", async () => {
      const { rows } = await examService.getByPatientId(testPatient.id, {
        page: 1,
        pageSize: 10,
        startDate: "2026-07-01",
        endDate: "2026-12-31",
      });
      expect(rows).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update exam fields", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-26",
      });
      const updated = await examService.update(exam.id, {
        rightEyePressure: "15mmHg",
      });
      expect(updated.rightEyePressure).toBe("15mmHg");
    });

    it("should throw 404 for non-existent exam on update", async () => {
      await expect(examService.update(99999, { rightEyePressure: "15" })).rejects.toThrow(CustomError);
    });

    it("should update examStatus to completed (stock integration)", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-30",
        examStatus: "pending",
      });
      const updated = await examService.update(exam.id, { examStatus: "completed" });
      expect(updated.examStatus).toBe("completed");
    });

    it("should update examStatus to cancelled from completed (stock reversal)", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-31",
        examStatus: "pending",
      });
      await examService.update(exam.id, { examStatus: "completed" });
      const updated = await examService.update(exam.id, { examStatus: "cancelled" });
      expect(updated.examStatus).toBe("cancelled");
    });
  });

  describe("delete", () => {
    it("should delete an exam", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-27",
      });
      const result = await examService.delete(exam.id);
      expect(result).toBe(true);
    });
  });

  describe("listSimpleByPatient", () => {
    it("should list simple exams for a patient", async () => {
      const result = await examService.listSimpleByPatient(testPatient.id);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("generateExamPDF", () => {
    it("should generate exam PDF", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-28",
        rightEyeWithoutCorrection: "20/20",
      });
      const pdf = await examService.generateExamPDF(exam.id, { name: "Test Clinic", lang: "en" });
      expect(pdf).toBeDefined();
    });
  });

  describe("generatePrescriptionPDFDoc", () => {
    it("should generate prescription PDF", async () => {
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-07-29",
        rightEyeWithoutCorrection: "20/20",
      });
      const pdf = await examService.generatePrescriptionPDFDoc(exam.id, { name: "Test Clinic", lang: "en" });
      expect(pdf).toBeDefined();
    });
  });
});
