import {
  EyeIcon,
  EyeOffIcon,
  GlassesIcon,
  CircleDotIcon,
  FrameIcon,
  SunIcon,
  ClipboardIcon,
} from "lucide-react";
import type { ExamStatus } from "@/types/enums";

export const VISION_FIELDS = [
  "rightEyeWithoutCorrection",
  "rightEyeWithCorrection",
  "rightEyePressure",
  "leftEyeWithoutCorrection",
  "leftEyeWithCorrection",
  "leftEyePressure",
] as const;

export const CORNEA_FIELDS = [
  "cornealShapeRightEye",
  "cornealSurfaceRightEye",
  "rightEyeRetinaExamination",
  "presenceOfCataractRightEye",
  "lensClarityRightEye",
  "rightEyeFundusExamination",
  "cornealShapeLeftEye",
  "cornealSurfaceLeftEye",
  "leftEyeRetinaExamination",
  "presenceOfCataractLeftEye",
  "lensClarityLeftEye",
  "leftEyeFundusExamination",
] as const;

export const PRESCRIPTION_FIELDS = [
  "rightEyeRefraction",
  "rightEyeSphericalPower",
  "rightEyeCylindricalPower",
  "rightEyeAxis",
  "rightEyeAdditionForReading",
  "leftEyeRefraction",
  "leftEyeSphericalPower",
  "leftEyeCylindricalPower",
  "leftEyeAxis",
  "leftEyeAdditionForReading",
] as const;

export const CONTACT_LENS_FIELDS = [
  "rightEyeLensType",
  "rightEyeLensDiameter",
  "rightEyeBaseCurve",
  "leftEyeLensType",
  "leftEyeLensDiameter",
  "leftEyeBaseCurve",
] as const;

export const FRAME_FIELDS = [
  "frameType",
  "frameManufacturer",
  "frameModel",
  "frameSize",
  "frameLensWidth",
  "frameBridgeWidth",
  "frameTempleLength",
  "frameMaterial",
  "frameColor",
  "frameShape",
] as const;

export const FRAME_LENS_FIELDS = [
  "frameLensType",
  "frameLensIndex",
  "frameLensCoating",
  "frameLensUVProtection",
  "frameLensColor",
] as const;

export const PRESCRIPTION_INSTRUCTION_FIELDS = [
  "eyeglassesPrescription",
  "contactLensesPrescription",
  "additionalTreatments",
  "followUpInstructions",
  "generalNotes",
] as const;

export const EXAM_STATUS_VARIANT: Record<ExamStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

export const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vision: EyeIcon,
  cornea: EyeOffIcon,
  prescription: GlassesIcon,
  contact: CircleDotIcon,
  frame: FrameIcon,
  frameLenses: SunIcon,
  instructions: ClipboardIcon,
};

export const SECTION_KEYS = [
  { key: "vision", labelKey: "visionPressure", fields: VISION_FIELDS, splitIndex: 3 },
  { key: "cornea", labelKey: "corneaLens", fields: CORNEA_FIELDS, splitIndex: 6 },
  { key: "prescription", labelKey: "prescription", fields: PRESCRIPTION_FIELDS, splitIndex: 5 },
  { key: "contact", labelKey: "contactLenses", fields: CONTACT_LENS_FIELDS, splitIndex: 3 },
  { key: "frame", labelKey: "frame", fields: FRAME_FIELDS, splitIndex: null },
  { key: "frameLenses", labelKey: "frameLenses", fields: FRAME_LENS_FIELDS, splitIndex: null },
  { key: "instructions", labelKey: "prescriptionsInstructions", fields: PRESCRIPTION_INSTRUCTION_FIELDS, splitIndex: null },
] as const;
