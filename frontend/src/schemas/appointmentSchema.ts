import { z } from "zod";

export const appointmentSchema = z
  .object({
    appointmentDate: z.string().min(1),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    appointmentType: z.string().min(2).max(50),
    reason: z.string().max(500).optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    patientId: z.number().positive().optional(),
    quickName: z.string().max(200).optional().or(z.literal("")),
    quickPhone: z.string().max(30).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const hasPatient = !!data.patientId;
      const hasQuick = !!data.quickName && !!data.quickPhone;
      return hasPatient !== hasQuick;
    },
    { message: "errors.PATIENT_OR_QUICK_REQUIRED", path: ["patientId"] }
  )
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      return eh * 60 + em > sh * 60 + sm;
    },
    { message: "errors.END_TIME_AFTER_START", path: ["endTime"] }
  );

export const APPOINTMENT_TYPES = [
  "consultation",
  "follow-up",
  "checkup",
  "surgery",
  "emergency",
  "vaccination",
  "lab-test",
  "imaging",
  "other",
] as const;

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
