const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const EyeExamination = sequelize.define(
  "EyeExamination",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "patients", key: "id" } },
    examDate: { type: DataTypes.DATEONLY, allowNull: false },
    examType: { type: DataTypes.STRING, allowNull: true, defaultValue: "general" },
    examStatus: {
      type: DataTypes.ENUM(...ENUMS.EXAM_STATUS),
      allowNull: false,
      defaultValue: "pending",
    },
    // Vision & Eye Pressure
    rightEyeWithoutCorrection: { type: DataTypes.STRING, allowNull: true },
    rightEyeWithCorrection: { type: DataTypes.STRING, allowNull: true },
    rightEyePressure: { type: DataTypes.STRING, allowNull: true },
    leftEyeWithoutCorrection: { type: DataTypes.STRING, allowNull: true },
    leftEyeWithCorrection: { type: DataTypes.STRING, allowNull: true },
    leftEyePressure: { type: DataTypes.STRING, allowNull: true },
    // Cornea & Lens
    cornealShapeRightEye: { type: DataTypes.STRING, allowNull: true },
    cornealSurfaceRightEye: { type: DataTypes.STRING, allowNull: true },
    rightEyeRetinaExamination: { type: DataTypes.STRING, allowNull: true },
    presenceOfCataractRightEye: { type: DataTypes.STRING, allowNull: true },
    lensClarityRightEye: { type: DataTypes.STRING, allowNull: true },
    rightEyeFundusExamination: { type: DataTypes.STRING, allowNull: true },
    cornealShapeLeftEye: { type: DataTypes.STRING, allowNull: true },
    cornealSurfaceLeftEye: { type: DataTypes.STRING, allowNull: true },
    leftEyeRetinaExamination: { type: DataTypes.STRING, allowNull: true },
    presenceOfCataractLeftEye: { type: DataTypes.STRING, allowNull: true },
    lensClarityLeftEye: { type: DataTypes.STRING, allowNull: true },
    leftEyeFundusExamination: { type: DataTypes.STRING, allowNull: true },
    // Prescription
    rightEyeRefraction: { type: DataTypes.STRING, allowNull: true },
    rightEyeSphericalPower: { type: DataTypes.STRING, allowNull: true },
    rightEyeCylindricalPower: { type: DataTypes.STRING, allowNull: true },
    rightEyeAxis: { type: DataTypes.STRING, allowNull: true },
    rightEyeAdditionForReading: { type: DataTypes.STRING, allowNull: true },
    leftEyeRefraction: { type: DataTypes.STRING, allowNull: true },
    leftEyeSphericalPower: { type: DataTypes.STRING, allowNull: true },
    leftEyeCylindricalPower: { type: DataTypes.STRING, allowNull: true },
    leftEyeAxis: { type: DataTypes.STRING, allowNull: true },
    leftEyeAdditionForReading: { type: DataTypes.STRING, allowNull: true },
    // Contact Lenses
    rightEyeLensType: { type: DataTypes.STRING, allowNull: true },
    rightEyeLensDiameter: { type: DataTypes.STRING, allowNull: true },
    rightEyeBaseCurve: { type: DataTypes.STRING, allowNull: true },
    leftEyeLensType: { type: DataTypes.STRING, allowNull: true },
    leftEyeLensDiameter: { type: DataTypes.STRING, allowNull: true },
    leftEyeBaseCurve: { type: DataTypes.STRING, allowNull: true },
    // Frame
    frameType: { type: DataTypes.STRING, allowNull: true },
    frameManufacturer: { type: DataTypes.STRING, allowNull: true },
    frameModel: { type: DataTypes.STRING, allowNull: true },
    frameSize: { type: DataTypes.STRING, allowNull: true },
    frameLensWidth: { type: DataTypes.STRING, allowNull: true },
    frameBridgeWidth: { type: DataTypes.STRING, allowNull: true },
    frameTempleLength: { type: DataTypes.STRING, allowNull: true },
    frameMaterial: { type: DataTypes.STRING, allowNull: true },
    frameColor: { type: DataTypes.STRING, allowNull: true },
    frameShape: { type: DataTypes.STRING, allowNull: true },
    // Frame Lenses
    frameLensType: { type: DataTypes.STRING, allowNull: true },
    frameLensIndex: { type: DataTypes.STRING, allowNull: true },
    frameLensCoating: { type: DataTypes.STRING, allowNull: true },
    frameLensUVProtection: { type: DataTypes.STRING, allowNull: true },
    frameLensColor: { type: DataTypes.STRING, allowNull: true },
    // Prescriptions & Instructions
    eyeglassesPrescription: { type: DataTypes.TEXT, allowNull: true },
    contactLensesPrescription: { type: DataTypes.TEXT, allowNull: true },
    additionalTreatments: { type: DataTypes.TEXT, allowNull: true },
    followUpInstructions: { type: DataTypes.TEXT, allowNull: true },
    // General
    generalNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "eye_examinations",
    paranoid: true,
    indexes: [
      { fields: ["patientId"] },
      { fields: ["examDate"] },
      { fields: ["examStatus"] },
      { fields: ["examType"] },
      { fields: ["createdAt"] },
    ],
    hooks: {},
  }
);

module.exports = EyeExamination;
