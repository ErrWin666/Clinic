import { authHandlers } from "./auth";
import { patientHandlers } from "./patients";
import { appointmentHandlers } from "./appointments";
import { invoiceHandlers } from "./invoices";
import { examinationHandlers } from "./examinations";
import { fileHandlers } from "./files";
import { settingsHandlers } from "./settings";
import { systemHandlers } from "./system";
import { stockHandlers } from "./stock";
import { clinicNoteHandlers } from "./clinicNotes";
import { patientNoteHandlers } from "./patientNotes";

export { mockUser } from "./auth";
export { mockPatient } from "./patients";
export { mockInvoice } from "./invoices";
export { mockAppointment } from "./appointments";
export { mockClinicNote } from "./clinicNotes";
export { mockPatientNote } from "./patientNotes";

export const handlers = [
  ...authHandlers,
  ...patientHandlers,
  ...appointmentHandlers,
  ...invoiceHandlers,
  ...examinationHandlers,
  ...fileHandlers,
  ...settingsHandlers,
  ...systemHandlers,
  ...stockHandlers,
  ...clinicNoteHandlers,
  ...patientNoteHandlers,
];
