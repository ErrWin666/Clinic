import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { ClinicNote, NoteAttachment } from "@/types/models";

export interface ListClinicNotesParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateClinicNoteData {
  title?: string | null;
  content: string;
}

export interface UpdateClinicNoteData {
  title?: string | null;
  content?: string;
}

export const ClinicNoteService = {
  async list(params?: ListClinicNotesParams): Promise<ApiResponse<ClinicNote[]>> {
    const query: Record<string, unknown> = {};
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.pageSize) query.pageSize = params.pageSize;
    const { data } = await api.get<ApiResponse<ClinicNote[]>>("/clinic-notes", {
      params: query,
    });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<ClinicNote>> {
    const { data } = await api.get<ApiResponse<ClinicNote>>(`/clinic-notes/${id}`);
    return data;
  },

  async create(payload: CreateClinicNoteData): Promise<ApiResponse<ClinicNote>> {
    const { data } = await api.post<ApiResponse<ClinicNote>>("/clinic-notes", payload);
    return data;
  },

  async update(id: number, payload: UpdateClinicNoteData): Promise<ApiResponse<ClinicNote>> {
    const { data } = await api.put<ApiResponse<ClinicNote>>(`/clinic-notes/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/clinic-notes/${id}`);
    return data;
  },

  async uploadAttachments(noteId: number, files: File[]): Promise<ApiResponse<NoteAttachment[]>> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    const { data } = await api.post<ApiResponse<NoteAttachment[]>>(
      `/clinic-notes/${noteId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  getAttachmentDownloadUrl(noteId: number, fileId: number): string {
    return `${getApiUrl()}/clinic-notes/${noteId}/attachments/${fileId}`;
  },

  getAttachmentPreviewUrl(noteId: number, fileId: number): string {
    return `${getApiUrl()}/clinic-notes/${noteId}/attachments/${fileId}/preview`;
  },

  async deleteAttachment(noteId: number, fileId: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/clinic-notes/${noteId}/attachments/${fileId}`
    );
    return data;
  },
};
