import { z } from "zod";

export const patientSchema = z.object({
  fullName: z.string().min(2).max(200),
  birthDate: z.string().min(1),
  gender: z.enum(["male", "female"]),
  phoneNumber: z.string().min(3).max(30),
  email: z.string().email().or(z.literal("")),
  address: z.string().max(500).or(z.literal("")),
  patientType: z.enum(["regular", "guardian", "child"]),
  notes: z.string().or(z.literal("")),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export const DEFAULT_PATIENT_VALUES: PatientFormValues = {
  fullName: "",
  birthDate: "",
  gender: "male",
  phoneNumber: "",
  email: "",
  address: "",
  patientType: "regular",
  notes: "",
};

import type { Patient } from "@/types/models";

export function buildPatientDefaults(patient?: Patient | null): PatientFormValues {
  if (patient) {
    return {
      fullName: patient.fullName,
      birthDate: patient.birthDate ? patient.birthDate.split("T")[0] : "",
      gender: patient.gender,
      phoneNumber: patient.phoneNumber,
      email: patient.email ?? "",
      address: patient.address ?? "",
      patientType: patient.patientType,
      notes: patient.notes ?? "",
    };
  }
  return { ...DEFAULT_PATIENT_VALUES };
}
