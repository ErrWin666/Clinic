import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { PatientNote, NoteAttachment } from "@/types/models";

export interface ListPatientNotesParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePatientNoteData {
  title?: string | null;
  content: string;
}

export interface UpdatePatientNoteData {
  title?: string | null;
  content?: string;
}

export const PatientNoteService = {
  async list(patientId: number, params?: ListPatientNotesParams): Promise<ApiResponse<PatientNote[]>> {
    const query: Record<string, unknown> = {};
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.pageSize) query.pageSize = params.pageSize;
    const { data } = await api.get<ApiResponse<PatientNote[]>>(
      `/patients/${patientId}/notes`,
      { params: query }
    );
    return data;
  },

  async getById(patientId: number, id: number): Promise<ApiResponse<PatientNote>> {
    const { data } = await api.get<ApiResponse<PatientNote>>(
      `/patients/${patientId}/notes/${id}`
    );
    return data;
  },

  async create(patientId: number, payload: CreatePatientNoteData): Promise<ApiResponse<PatientNote>> {
    const { data } = await api.post<ApiResponse<PatientNote>>(
      `/patients/${patientId}/notes`,
      payload
    );
    return data;
  },

  async update(patientId: number, id: number, payload: UpdatePatientNoteData): Promise<ApiResponse<PatientNote>> {
    const { data } = await api.put<ApiResponse<PatientNote>>(
      `/patients/${patientId}/notes/${id}`,
      payload
    );
    return data;
  },

  async delete(patientId: number, id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/patients/${patientId}/notes/${id}`
    );
    return data;
  },

  async uploadAttachments(patientId: number, noteId: number, files: File[]): Promise<ApiResponse<NoteAttachment[]>> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    const { data } = await api.post<ApiResponse<NoteAttachment[]>>(
      `/patients/${patientId}/notes/${noteId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  getAttachmentDownloadUrl(patientId: number, noteId: number, fileId: number): string {
    return `${getApiUrl()}/patients/${patientId}/notes/${noteId}/attachments/${fileId}`;
  },

  getAttachmentPreviewUrl(patientId: number, noteId: number, fileId: number): string {
    return `${getApiUrl()}/patients/${patientId}/notes/${noteId}/attachments/${fileId}/preview`;
  },

  async deleteAttachment(patientId: number, noteId: number, fileId: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/patients/${patientId}/notes/${noteId}/attachments/${fileId}`
    );
    return data;
  },
};
