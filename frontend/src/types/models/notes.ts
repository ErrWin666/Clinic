import type { FileEntry } from "./files";

export interface ClinicNote {
  id: number;
  title: string | null;
  content: string;
  userId: number;
  attachments?: FileEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientNote {
  id: number;
  patientId: number;
  title: string | null;
  content: string;
  userId: number;
  attachments?: FileEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteAttachment extends FileEntry {
  clinicNoteId?: number | null;
  patientNoteId?: number | null;
}
