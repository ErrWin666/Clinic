export interface Folder {
  id: number;
  patientId: number;
  name: string;
  parentFolderId: number | null;
  path?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileEntry {
  id: number;
  patientId: number;
  folderId: number | null;
  examinationId: number | null;
  name: string;
  type: string;
  size: number;
  path?: string;
  createdAt: string;
  updatedAt: string;
}
