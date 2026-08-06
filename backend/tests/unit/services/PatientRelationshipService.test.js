const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const PatientRelationshipService = require("../../../src/services/PatientRelationshipService");
const PatientService = require("../../../src/services/PatientService");
const CustomError = require("../../../src/utils/CustomError");
const { Patient, Notification } = require("../../../src/models");

describe("PatientRelationshipService", () => {
  let relService;
  let patientService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    relService = new PatientRelationshipService();
    patientService = new PatientService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create — valid relationships", () => {
    it("should create father relationship (adult → child)", async () => {
      const father = await createTestPatient({ fullName: "Father", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "Son", birthDate: "2010-01-01" });

      const rel = await relService.create(father.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      expect(rel).toBeDefined();
      expect(rel.guardianId).toBe(father.id);
      expect(rel.childId).toBe(child.id);
      expect(rel.relationType).toBe("father");
    });

    it("should create mother relationship (adult → child)", async () => {
      const mother = await createTestPatient({ fullName: "Mother", birthDate: "1985-01-01", gender: "female" });
      const child = await createTestPatient({ fullName: "Daughter", birthDate: "2012-01-01", gender: "female" });

      const rel = await relService.create(mother.id, {
        relatedPatientId: child.id,
        relationType: "mother",
      });

      expect(rel.relationType).toBe("mother");
      expect(rel.guardianId).toBe(mother.id);
    });

    it("should create guardian relationship", async () => {
      const guardian = await createTestPatient({ fullName: "Guardian", birthDate: "1975-01-01" });
      const child = await createTestPatient({ fullName: "Ward", birthDate: "2015-01-01" });

      const rel = await relService.create(guardian.id, {
        relatedPatientId: child.id,
        relationType: "guardian",
      });

      expect(rel.relationType).toBe("guardian");
    });

    it("should create single-father relationship", async () => {
      const father = await createTestPatient({ fullName: "Single Father", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "SF Child", birthDate: "2011-01-01" });

      const rel = await relService.create(father.id, {
        relatedPatientId: child.id,
        relationType: "single-father",
      });

      expect(rel.relationType).toBe("single-father");
    });

    it("should create single-mother relationship", async () => {
      const mother = await createTestPatient({ fullName: "Single Mother", birthDate: "1982-01-01", gender: "female" });
      const child = await createTestPatient({ fullName: "SM Child", birthDate: "2013-01-01" });

      const rel = await relService.create(mother.id, {
        relatedPatientId: child.id,
        relationType: "single-mother",
      });

      expect(rel.relationType).toBe("single-mother");
    });
  });

  describe("create — auto direction detection", () => {
    it("should auto-detect adult → child when called from child side", async () => {
      const adult = await createTestPatient({ fullName: "Adult Auto", birthDate: "1970-01-01" });
      const child = await createTestPatient({ fullName: "Child Auto", birthDate: "2014-01-01" });

      const rel = await relService.create(child.id, {
        relatedPatientId: adult.id,
        relationType: "father",
      });

      expect(rel.guardianId).toBe(adult.id);
      expect(rel.childId).toBe(child.id);
    });

    it("should auto-detect adult → child when called from adult side", async () => {
      const adult = await createTestPatient({ fullName: "Adult Auto2", birthDate: "1970-06-01" });
      const child = await createTestPatient({ fullName: "Child Auto2", birthDate: "2016-06-01" });

      const rel = await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "mother",
      });

      expect(rel.guardianId).toBe(adult.id);
      expect(rel.childId).toBe(child.id);
    });
  });

  describe("create — patientType auto-update", () => {
    it("should update guardian patientType from regular to guardian", async () => {
      const adult = await createTestPatient({ fullName: "Type Update Adult", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "Type Update Child", birthDate: "2010-01-01" });

      await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      const updated = await patientService.getById(adult.id);
      expect(updated.patientType).toBe("guardian");
    });

    it("should update child patientType from regular to child", async () => {
      const adult = await createTestPatient({ fullName: "Type Adult2", birthDate: "1980-03-01" });
      const child = await createTestPatient({ fullName: "Type Child2", birthDate: "2011-03-01" });

      await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "mother",
      });

      const updated = await patientService.getById(child.id);
      expect(updated.patientType).toBe("child");
    });
  });

  describe("create — rejections", () => {
    it("should reject self-link", async () => {
      const patient = await createTestPatient({ fullName: "Self Link", birthDate: "1990-01-01" });

      await expect(
        relService.create(patient.id, {
          relatedPatientId: patient.id,
          relationType: "father",
        })
      ).rejects.toThrow(CustomError);

      try {
        await relService.create(patient.id, {
          relatedPatientId: patient.id,
          relationType: "father",
        });
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    });

    it("should reject duplicate relationship", async () => {
      const adult = await createTestPatient({ fullName: "Dup Adult", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "Dup Child", birthDate: "2010-01-01" });

      await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      await expect(
        relService.create(adult.id, {
          relatedPatientId: child.id,
          relationType: "mother",
        })
      ).rejects.toThrow(CustomError);

      try {
        await relService.create(adult.id, {
          relatedPatientId: child.id,
          relationType: "guardian",
        });
      } catch (err) {
        expect(err.statusCode).toBe(409);
      }
    });

    it("should reject duplicate relationship (bidirectional)", async () => {
      const adult = await createTestPatient({ fullName: "BiDir Adult", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "BiDir Child", birthDate: "2010-01-01" });

      await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      await expect(
        relService.create(child.id, {
          relatedPatientId: adult.id,
          relationType: "guardian",
        })
      ).rejects.toThrow(CustomError);
    });

    it("should reject child-to-child relationship", async () => {
      const child1 = await createTestPatient({ fullName: "Child1", birthDate: "2012-01-01" });
      const child2 = await createTestPatient({ fullName: "Child2", birthDate: "2013-01-01" });

      await expect(
        relService.create(child1.id, {
          relatedPatientId: child2.id,
          relationType: "guardian",
        })
      ).rejects.toThrow(CustomError);

      try {
        await relService.create(child1.id, {
          relatedPatientId: child2.id,
          relationType: "guardian",
        });
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    });

    it("should reject guardian minor (under 18 as guardian type)", async () => {
      const teen = await createTestPatient({ fullName: "Teen Guardian", birthDate: "2010-01-01" });
      const child = await createTestPatient({ fullName: "Younger Child", birthDate: "2015-01-01" });

      await Patient.update({ patientType: "guardian" }, { where: { id: teen.id } });

      await expect(
        relService.create(teen.id, {
          relatedPatientId: child.id,
          relationType: "guardian",
        })
      ).rejects.toThrow(CustomError);

      try {
        await relService.create(teen.id, {
          relatedPatientId: child.id,
          relationType: "guardian",
        });
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe("delete — patientType auto-revert", () => {
    it("should revert guardian to regular after deleting last relationship", async () => {
      const adult = await createTestPatient({ fullName: "Revert Adult", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "Revert Child", birthDate: "2010-01-01" });

      const rel = await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      const adultBefore = await patientService.getById(adult.id);
      expect(adultBefore.patientType).toBe("guardian");

      await relService.delete(rel.id);

      const adultAfter = await patientService.getById(adult.id);
      expect(adultAfter.patientType).toBe("regular");
    });

    it("should revert child to regular after deleting last relationship (even if still minor)", async () => {
      const adult = await createTestPatient({ fullName: "Revert Adult2", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "Revert Child2", birthDate: "2015-01-01" });

      const rel = await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      const childBefore = await patientService.getById(child.id);
      expect(childBefore.patientType).toBe("child");

      await relService.delete(rel.id);

      const childAfter = await patientService.getById(child.id);
      expect(childAfter.patientType).toBe("regular");
    });

    it("should NOT revert if guardian has other active relationships", async () => {
      const adult = await createTestPatient({ fullName: "Multi Adult", birthDate: "1980-01-01" });
      const child1 = await createTestPatient({ fullName: "Multi Child1", birthDate: "2010-01-01" });
      const child2 = await createTestPatient({ fullName: "Multi Child2", birthDate: "2012-01-01" });

      const rel1 = await relService.create(adult.id, {
        relatedPatientId: child1.id,
        relationType: "father",
      });
      await relService.create(adult.id, {
        relatedPatientId: child2.id,
        relationType: "father",
      });

      await relService.delete(rel1.id);

      const adultAfter = await patientService.getById(adult.id);
      expect(adultAfter.patientType).toBe("guardian");
    });

    it("should throw 404 for non-existent relationship", async () => {
      await expect(relService.delete(99999)).rejects.toThrow(CustomError);
      try {
        await relService.delete(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("create — both adults", () => {
    it("should create relationship between two adults (else branch)", async () => {
      const adult1 = await createTestPatient({ fullName: "Adult1 Both", birthDate: "1980-01-01" });
      const adult2 = await createTestPatient({ fullName: "Adult2 Both", birthDate: "1985-01-01" });

      const rel = await relService.create(adult1.id, {
        relatedPatientId: adult2.id,
        relationType: "guardian",
      });

      expect(rel).toBeDefined();
      // When both are adults, guardianId = patientId (caller), childId = relatedPatientId
      expect(rel.guardianId).toBe(adult1.id);
      expect(rel.childId).toBe(adult2.id);
    });
  });

  describe("checkAndTransitionAdults - error handling", () => {
    it("should return 0 when an error occurs", async () => {
      const { Patient } = require("../../../src/models");
      const originalFindAll = Patient.findAll;
      Patient.findAll = jest.fn().mockRejectedValue(new Error("DB error"));
      try {
        const result = await relService.checkAndTransitionAdults();
        expect(result).toBe(0);
      } finally {
        Patient.findAll = originalFindAll;
      }
    });
  });

  describe("getByPatientId", () => {
    it("should return relationships for a patient", async () => {
      const adult = await createTestPatient({ fullName: "GetBy Adult", birthDate: "1980-01-01" });
      const child = await createTestPatient({ fullName: "GetBy Child", birthDate: "2010-01-01" });

      await relService.create(adult.id, {
        relatedPatientId: child.id,
        relationType: "father",
      });

      const rels = await relService.getByPatientId(adult.id);
      expect(rels).toBeDefined();
      expect(Array.isArray(rels)).toBe(true);
      expect(rels.length).toBeGreaterThan(0);
    });
  });

  describe("checkAndTransitionAdults", () => {
    it("should transition child patients who turned 18 to regular", async () => {
      const adultBorn18YearsAgo = await createTestPatient({
        fullName: "Now Adult",
        birthDate: new Date(new Date().getFullYear() - 18, 0, 1).toISOString().split("T")[0],
      });
      await Patient.update(
        { patientType: "child" },
        { where: { id: adultBorn18YearsAgo.id } }
      );

      const transitioned = await relService.checkAndTransitionAdults();
      expect(transitioned).toBeGreaterThan(0);

      const updated = await patientService.getById(adultBorn18YearsAgo.id);
      expect(updated.patientType).toBe("regular");
    });

    it("should create notification for transitioned patient", async () => {
      const patient = await createTestPatient({
        fullName: "Transition Notif",
        birthDate: new Date(new Date().getFullYear() - 19, 5, 15).toISOString().split("T")[0],
      });
      await Patient.update(
        { patientType: "child" },
        { where: { id: patient.id } }
      );

      await relService.checkAndTransitionAdults();

      const notif = await Notification.findOne({
        where: { type: "age_transition", entityId: patient.id, entityType: "Patient" },
      });
      expect(notif).toBeDefined();
      expect(notif).not.toBeNull();
    });

    it("should not create duplicate notification", async () => {
      const patient = await createTestPatient({
        fullName: "Dup Notif Patient",
        birthDate: new Date(new Date().getFullYear() - 20, 0, 1).toISOString().split("T")[0],
      });
      await Patient.update(
        { patientType: "child" },
        { where: { id: patient.id } }
      );

      await relService.checkAndTransitionAdults();
      await relService.checkAndTransitionAdults();

      const notifs = await Notification.findAll({
        where: { type: "age_transition", entityId: patient.id, entityType: "Patient" },
      });
      expect(notifs.length).toBe(1);
    });

    it("should not transition already-regular patients", async () => {
      const regular = await createTestPatient({
        fullName: "Already Regular",
        birthDate: "1990-01-01",
      });

      const transitioned = await relService.checkAndTransitionAdults();
      const patient = await patientService.getById(regular.id);
      expect(patient.patientType).toBe("regular");
    });
  });
});
