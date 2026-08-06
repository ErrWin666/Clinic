import type { AppointmentStatus } from "../enums";
import type { Patient } from "./core";
import type { Examination } from "./examinations";
import type { Invoice } from "./invoices";

export interface Appointment {
  id: number;
  displayId: string;
  patientId: number | null;
  patient?: Pick<Patient, "id" | "fullName" | "displayId"> | null;
  quickName?: string | null;
  quickPhone?: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  duration?: number | null;
  confirmedAt?: string | null;
  examinationId?: number | null;
  invoiceId?: number | null;
  examination?: Pick<Examination, "id" | "displayId" | "examDate" | "examStatus"> | null;
  invoice?: Pick<Invoice, "id" | "displayId" | "invoiceDate" | "invoiceStatus" | "totalAmount"> | null;
  createdAt: string;
  updatedAt: string;
}
