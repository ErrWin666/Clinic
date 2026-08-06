const BaseController = require("./BaseController");
const PatientRelationshipService = require("../services/PatientRelationshipService");
const MESSAGES = require("../constants/messages");

class PatientRelationshipController extends BaseController {
  constructor() {
    super();
    this.relationshipService = new PatientRelationshipService();
  }

  async list(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const relationships = await this.relationshipService.getByPatientId(patientId);
      return this.sendSuccess(res, relationships, MESSAGES.RELATIONSHIP.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const relationship = await this.relationshipService.create(patientId, req.body);
      return this.sendSuccess(res, relationship, MESSAGES.RELATIONSHIP.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.relationshipId);
      await this.relationshipService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.RELATIONSHIP.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientRelationshipController;
