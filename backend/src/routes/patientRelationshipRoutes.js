const express = require("express");
const router = express.Router({ mergeParams: true });
const PatientRelationshipController = require("../controllers/PatientRelationshipController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { createRelationshipSchema } = require("../schemas/relationshipSchema");
const { relationshipIdParamSchema } = require("../schemas/commonSchema");

const relationshipController = new PatientRelationshipController();

router.use(auth);

router.get("/", (req, res, next) => relationshipController.list(req, res, next));
router.post("/", validate(createRelationshipSchema), audit("CREATE"), (req, res, next) => relationshipController.create(req, res, next));
router.delete("/:relationshipId", validate(relationshipIdParamSchema), audit("DELETE"), (req, res, next) => relationshipController.delete(req, res, next));

module.exports = router;
