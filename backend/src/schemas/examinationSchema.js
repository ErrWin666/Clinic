const Joi = require("joi");
const ENUMS = require("../constants/enums");

const examFields = {
  examDate: Joi.date().iso(),
  examType: Joi.string().max(100).allow(null, ""),
  examStatus: Joi.string().valid(...ENUMS.EXAM_STATUS),
  rightEyeWithoutCorrection: Joi.string().max(500).allow(null, ""),
  rightEyeWithCorrection: Joi.string().max(500).allow(null, ""),
  rightEyePressure: Joi.string().max(100).allow(null, ""),
  leftEyeWithoutCorrection: Joi.string().max(500).allow(null, ""),
  leftEyeWithCorrection: Joi.string().max(500).allow(null, ""),
  leftEyePressure: Joi.string().max(100).allow(null, ""),
  cornealShapeRightEye: Joi.string().max(200).allow(null, ""),
  cornealSurfaceRightEye: Joi.string().max(200).allow(null, ""),
  rightEyeRetinaExamination: Joi.string().max(500).allow(null, ""),
  presenceOfCataractRightEye: Joi.string().max(200).allow(null, ""),
  lensClarityRightEye: Joi.string().max(200).allow(null, ""),
  rightEyeFundusExamination: Joi.string().max(500).allow(null, ""),
  cornealShapeLeftEye: Joi.string().max(200).allow(null, ""),
  cornealSurfaceLeftEye: Joi.string().max(200).allow(null, ""),
  leftEyeRetinaExamination: Joi.string().max(500).allow(null, ""),
  presenceOfCataractLeftEye: Joi.string().max(200).allow(null, ""),
  lensClarityLeftEye: Joi.string().max(200).allow(null, ""),
  leftEyeFundusExamination: Joi.string().max(500).allow(null, ""),
  rightEyeRefraction: Joi.string().max(200).allow(null, ""),
  rightEyeSphericalPower: Joi.string().max(100).allow(null, ""),
  rightEyeCylindricalPower: Joi.string().max(100).allow(null, ""),
  rightEyeAxis: Joi.string().max(100).allow(null, ""),
  rightEyeAdditionForReading: Joi.string().max(100).allow(null, ""),
  leftEyeRefraction: Joi.string().max(200).allow(null, ""),
  leftEyeSphericalPower: Joi.string().max(100).allow(null, ""),
  leftEyeCylindricalPower: Joi.string().max(100).allow(null, ""),
  leftEyeAxis: Joi.string().max(100).allow(null, ""),
  leftEyeAdditionForReading: Joi.string().max(100).allow(null, ""),
  rightEyeLensType: Joi.string().max(200).allow(null, ""),
  rightEyeLensDiameter: Joi.string().max(100).allow(null, ""),
  rightEyeBaseCurve: Joi.string().max(100).allow(null, ""),
  leftEyeLensType: Joi.string().max(200).allow(null, ""),
  leftEyeLensDiameter: Joi.string().max(100).allow(null, ""),
  leftEyeBaseCurve: Joi.string().max(100).allow(null, ""),
  frameType: Joi.string().max(200).allow(null, ""),
  frameManufacturer: Joi.string().max(200).allow(null, ""),
  frameModel: Joi.string().max(200).allow(null, ""),
  frameSize: Joi.string().max(100).allow(null, ""),
  frameLensWidth: Joi.string().max(100).allow(null, ""),
  frameBridgeWidth: Joi.string().max(100).allow(null, ""),
  frameTempleLength: Joi.string().max(100).allow(null, ""),
  frameMaterial: Joi.string().max(200).allow(null, ""),
  frameColor: Joi.string().max(200).allow(null, ""),
  frameShape: Joi.string().max(200).allow(null, ""),
  frameLensType: Joi.string().max(200).allow(null, ""),
  frameLensIndex: Joi.string().max(100).allow(null, ""),
  frameLensCoating: Joi.string().max(200).allow(null, ""),
  frameLensUVProtection: Joi.string().max(200).allow(null, ""),
  frameLensColor: Joi.string().max(200).allow(null, ""),
  eyeglassesPrescription: Joi.string().max(1000).allow(null, ""),
  contactLensesPrescription: Joi.string().max(1000).allow(null, ""),
  additionalTreatments: Joi.string().max(1000).allow(null, ""),
  followUpInstructions: Joi.string().max(1000).allow(null, ""),
  generalNotes: Joi.string().max(2000).allow(null, ""),
};

const createExaminationSchema = Joi.object({
  body: Joi.object({ examDate: Joi.date().iso().required(), ...examFields }),
  query: Joi.object({}),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

const updateExaminationSchema = Joi.object({
  body: Joi.object({ ...examFields }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listExaminationSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    examStatus: Joi.string().valid(...ENUMS.EXAM_STATUS),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

module.exports = { createExaminationSchema, updateExaminationSchema, listExaminationSchema };
