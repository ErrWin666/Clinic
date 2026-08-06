import type { Examination } from "@/types/models";
import type { ExaminationFormValues } from "@/schemas/examinationSchema";

/**
 * Build default form values from an existing examination (for edit mode)
 * or fresh defaults (for create mode).
 */
export function buildExaminationDefaults(examination?: Examination | null): ExaminationFormValues {
  if (examination) {
    return {
      examDate: examination.examDate ? examination.examDate.split("T")[0] : "",
      examStatus: examination.examStatus,
      rightEyeWithoutCorrection: examination.rightEyeWithoutCorrection ?? "",
      rightEyeWithCorrection: examination.rightEyeWithCorrection ?? "",
      rightEyePressure: examination.rightEyePressure ?? "",
      leftEyeWithoutCorrection: examination.leftEyeWithoutCorrection ?? "",
      leftEyeWithCorrection: examination.leftEyeWithCorrection ?? "",
      leftEyePressure: examination.leftEyePressure ?? "",
      cornealShapeRightEye: examination.cornealShapeRightEye ?? "",
      cornealSurfaceRightEye: examination.cornealSurfaceRightEye ?? "",
      rightEyeRetinaExamination: examination.rightEyeRetinaExamination ?? "",
      presenceOfCataractRightEye: examination.presenceOfCataractRightEye ?? "",
      lensClarityRightEye: examination.lensClarityRightEye ?? "",
      rightEyeFundusExamination: examination.rightEyeFundusExamination ?? "",
      cornealShapeLeftEye: examination.cornealShapeLeftEye ?? "",
      cornealSurfaceLeftEye: examination.cornealSurfaceLeftEye ?? "",
      leftEyeRetinaExamination: examination.leftEyeRetinaExamination ?? "",
      presenceOfCataractLeftEye: examination.presenceOfCataractLeftEye ?? "",
      lensClarityLeftEye: examination.lensClarityLeftEye ?? "",
      leftEyeFundusExamination: examination.leftEyeFundusExamination ?? "",
      rightEyeRefraction: examination.rightEyeRefraction ?? "",
      rightEyeSphericalPower: examination.rightEyeSphericalPower ?? "",
      rightEyeCylindricalPower: examination.rightEyeCylindricalPower ?? "",
      rightEyeAxis: examination.rightEyeAxis ?? "",
      rightEyeAdditionForReading: examination.rightEyeAdditionForReading ?? "",
      leftEyeRefraction: examination.leftEyeRefraction ?? "",
      leftEyeSphericalPower: examination.leftEyeSphericalPower ?? "",
      leftEyeCylindricalPower: examination.leftEyeCylindricalPower ?? "",
      leftEyeAxis: examination.leftEyeAxis ?? "",
      leftEyeAdditionForReading: examination.leftEyeAdditionForReading ?? "",
      rightEyeLensType: examination.rightEyeLensType ?? "",
      rightEyeLensDiameter: examination.rightEyeLensDiameter ?? "",
      rightEyeBaseCurve: examination.rightEyeBaseCurve ?? "",
      leftEyeLensType: examination.leftEyeLensType ?? "",
      leftEyeLensDiameter: examination.leftEyeLensDiameter ?? "",
      leftEyeBaseCurve: examination.leftEyeBaseCurve ?? "",
      frameType: examination.frameType ?? "",
      frameManufacturer: examination.frameManufacturer ?? "",
      frameModel: examination.frameModel ?? "",
      frameSize: examination.frameSize ?? "",
      frameLensWidth: examination.frameLensWidth ?? "",
      frameBridgeWidth: examination.frameBridgeWidth ?? "",
      frameTempleLength: examination.frameTempleLength ?? "",
      frameMaterial: examination.frameMaterial ?? "",
      frameColor: examination.frameColor ?? "",
      frameShape: examination.frameShape ?? "",
      frameLensType: examination.frameLensType ?? "",
      frameLensIndex: examination.frameLensIndex ?? "",
      frameLensCoating: examination.frameLensCoating ?? "",
      frameLensUVProtection: examination.frameLensUVProtection ?? "",
      frameLensColor: examination.frameLensColor ?? "",
      eyeglassesPrescription: examination.eyeglassesPrescription ?? "",
      contactLensesPrescription: examination.contactLensesPrescription ?? "",
      additionalTreatments: examination.additionalTreatments ?? "",
      followUpInstructions: examination.followUpInstructions ?? "",
      generalNotes: examination.generalNotes ?? "",
    };
  }
  return {
    examDate: new Date().toISOString().split("T")[0],
    examStatus: "pending",
  } as ExaminationFormValues;
}
