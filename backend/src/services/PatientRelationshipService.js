const BaseService = require("./BaseService");
const PatientRelationshipRepository = require("../repositories/PatientRelationshipRepository");
const PatientRepository = require("../repositories/PatientRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Patient, Notification } = require("../models");
const { sequelize } = require("../database");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

const ADULT_AGE = 18;

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

class PatientRelationshipService extends BaseService {
  constructor() {
    super(new PatientRelationshipRepository());
    this.patientRepository = new PatientRepository();
  }

  async create(patientId, data) {
    return this.executeOperation(async () => {
      if (patientId === data.relatedPatientId) {
        throw new CustomError(MESSAGES.RELATIONSHIP.SELF_LINK, "SELF_RELATIONSHIP", 400);
      }

      const existing = await this.repository.findExistingBidirectional(patientId, data.relatedPatientId);
      if (existing) {
        throw new CustomError(MESSAGES.RELATIONSHIP.EXISTS, "RELATIONSHIP_EXISTS", 409);
      }

      const currentPatient = await this.patientRepository.findById(patientId);
      const relatedPatient = await this.patientRepository.findById(data.relatedPatientId);

      const currentAge = calculateAge(currentPatient.birthDate);
      const relatedAge = calculateAge(relatedPatient.birthDate);

      const currentIsChild = currentPatient.patientType === "child" || (currentAge !== null && currentAge < ADULT_AGE);
      const relatedIsChild = relatedPatient.patientType === "child" || (relatedAge !== null && relatedAge < ADULT_AGE);
      const currentIsAdult = currentPatient.patientType === "guardian" || (currentAge !== null && currentAge >= ADULT_AGE);
      const relatedIsAdult = relatedPatient.patientType === "guardian" || (relatedAge !== null && relatedAge >= ADULT_AGE);

      let guardianId, childId;

      if (currentIsChild && relatedIsChild) {
        throw new CustomError(MESSAGES.RELATIONSHIP.CHILD_TO_CHILD, "CHILD_TO_CHILD_RELATIONSHIP", 400);
      } else if (currentIsChild && relatedIsAdult) {
        guardianId = data.relatedPatientId;
        childId = patientId;
      } else if (currentIsAdult && relatedIsChild) {
        guardianId = patientId;
        childId = data.relatedPatientId;
      } else {
        guardianId = patientId;
        childId = data.relatedPatientId;
      }

      const guardianAge = calculateAge(guardianId === patientId ? currentPatient.birthDate : relatedPatient.birthDate);
      if (guardianAge !== null && guardianAge < ADULT_AGE) {
        throw new CustomError(MESSAGES.RELATIONSHIP.GUARDIAN_MINOR, "GUARDIAN_MINOR", 400);
      }

      const relationship = await this.repository.create({
        guardianId,
        childId,
        relationType: data.relationType,
      });

      const transaction = await sequelize.transaction();
      try {
        if (currentPatient.patientType !== "guardian" && guardianId === patientId) {
          await this.patientRepository.update(patientId, { patientType: "guardian" }, { transaction });
        }
        if (relatedPatient.patientType !== "guardian" && guardianId === data.relatedPatientId) {
          await this.patientRepository.update(data.relatedPatientId, { patientType: "guardian" }, { transaction });
        }
        if (currentPatient.patientType !== "child" && childId === patientId) {
          await this.patientRepository.update(patientId, { patientType: "child" }, { transaction });
        }
        if (relatedPatient.patientType !== "child" && childId === data.relatedPatientId) {
          await this.patientRepository.update(data.relatedPatientId, { patientType: "child" }, { transaction });
        }
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }

      return relationship;
    }, MESSAGES.RELATIONSHIP.CREATED, "RELATIONSHIP_CREATE_ERROR");
  }

  async getByPatientId(patientId) {
    return this.executeOperation(async () => {
      return this.repository.findByPatientId(patientId);
    }, MESSAGES.RELATIONSHIP.RETRIEVED, "RELATIONSHIP_LIST_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const relationship = await this.repository.findById(id);
      if (!relationship) {
        throw new CustomError(MESSAGES.RELATIONSHIP.NOT_FOUND, "RELATIONSHIP_NOT_FOUND", 404);
      }

      await this.repository.delete(id);

      const guardianHasMore = await this.repository.hasActiveRelationships(relationship.guardianId);
      if (!guardianHasMore) {
        const guardian = await this.patientRepository.findById(relationship.guardianId);
        if (guardian && guardian.patientType === "guardian") {
          await this.patientRepository.update(relationship.guardianId, { patientType: "regular" });
        }
      }

      const childHasMore = await this.repository.hasActiveRelationships(relationship.childId);
      if (!childHasMore) {
        const child = await this.patientRepository.findById(relationship.childId);
        if (child && child.patientType === "child") {
          await this.patientRepository.update(relationship.childId, { patientType: "regular" });
        }
      }

      return true;
    }, MESSAGES.RELATIONSHIP.DELETED, "RELATIONSHIP_DELETE_ERROR");
  }

  async checkAndTransitionAdults() {
    try {
      const adultBirthDate = new Date();
      adultBirthDate.setFullYear(adultBirthDate.getFullYear() - ADULT_AGE);
      const adultBirthDateStr = adultBirthDate.toISOString().split("T")[0];

      const patientsToTransition = await Patient.findAll({
        where: {
          patientType: "child",
          birthDate: { [Op.lte]: adultBirthDateStr },
        },
        attributes: ["id", "fullName", "displayId", "birthDate"],
      });

      let transitioned = 0;
      for (const patient of patientsToTransition) {
        await patient.update({ patientType: "regular" });

        const existingNotif = await Notification.findOne({
          where: {
            type: "age_transition",
            entityId: patient.id,
            entityType: "Patient",
          },
        });
        if (!existingNotif) {
          await Notification.create({
            type: "age_transition",
            title: "Patient Reached Adulthood",
            message: `Patient ${patient.fullName} (${patient.displayId}) has turned ${ADULT_AGE} and was transitioned from child to regular`,
            entityId: patient.id,
            entityType: "Patient",
          });
        }

        transitioned++;
      }

      if (transitioned > 0) {
        logger.info({ message: `Age transition: ${transitioned} patients transitioned from child to regular` });
      }
      return transitioned;
    } catch (error) {
      logger.error({ message: "Age transition check failed", error: error.message });
      return 0;
    }
  }
}

module.exports = PatientRelationshipService;
