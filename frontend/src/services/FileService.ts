import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { ApiResponse } from "@/types/api";
import type { Folder, FileEntry } from "@/types/models";

export interface CreateFolderData {
  name: string;
  parentFolderId?: number | null;
}

export interface ListFilesParams {
  folderId?: number | null;
  examinationId?: number | null;
  search?: string;
  page?: number;
  pageSize?: number;
  type?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ListFoldersParams {
  search?: string;
  page?: number;
  pageSize?: number;
  parentFolderId?: number | null;
  sortBy?: string;
  sortOrder?: string;
}

export const FileService = {
  async listFolders(patientId: number, params?: ListFoldersParams): Promise<ApiResponse<Folder[]>> {
    const query: Record<string, unknown> = {};
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.pageSize) query.pageSize = params.pageSize;
    if (params?.parentFolderId !== undefined && params?.parentFolderId !== null) {
      query.parentFolderId = params.parentFolderId;
    }
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.sortOrder) query.sortOrder = params.sortOrder;
    const { data } = await api.get<ApiResponse<Folder[]>>(
      `/patients/${patientId}/folders`,
      { params: query }
    );
    return data;
  },

  async createFolder(
    patientId: number,
    payload: CreateFolderData
  ): Promise<ApiResponse<Folder>> {
    const { data } = await api.post<ApiResponse<Folder>>(
      `/patients/${patientId}/folders`,
      payload
    );
    return data;
  },

  async renameFolder(
    patientId: number,
    folderId: number,
    name: string
  ): Promise<ApiResponse<Folder>> {
    const { data } = await api.put<ApiResponse<Folder>>(
      `/patients/${patientId}/folders/${folderId}`,
      { name }
    );
    return data;
  },

  async deleteFolder(
    patientId: number,
    folderId: number
  ): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/patients/${patientId}/folders/${folderId}`
    );
    return data;
  },

  async listFiles(
    patientId: number,
    params?: ListFilesParams
  ): Promise<ApiResponse<FileEntry[]>> {
    const query: Record<string, unknown> = {};
    if (params?.folderId !== undefined && params?.folderId !== null) {
      query.folderId = params.folderId;
    }
    if (params?.examinationId !== undefined && params?.examinationId !== null) {
      query.examinationId = params.examinationId;
    }
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.pageSize) query.pageSize = params.pageSize;
    if (params?.type) query.type = params.type;
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.sortOrder) query.sortOrder = params.sortOrder;
    const { data } = await api.get<ApiResponse<FileEntry[]>>(
      `/patients/${patientId}/files`,
      { params: query }
    );
    return data;
  },

  async uploadFile(
    patientId: number,
    file: File,
    folderId?: number | null,
    examinationId?: number | null
  ): Promise<ApiResponse<FileEntry>> {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folderId", String(folderId));
    }
    if (examinationId) {
      formData.append("examinationId", String(examinationId));
    }
    const { data } = await api.post<ApiResponse<FileEntry>>(
      `/patients/${patientId}/files`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  getFileDownloadUrl(patientId: number, fileId: number): string {
    return `${getApiUrl()}/patients/${patientId}/files/${fileId}`;
  },

  getFilePreviewUrl(patientId: number, fileId: number): string {
    return `${getApiUrl()}/patients/${patientId}/files/${fileId}/preview`;
  },

  async deleteFile(
    patientId: number,
    fileId: number
  ): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/patients/${patientId}/files/${fileId}`
    );
    return data;
  },
};
