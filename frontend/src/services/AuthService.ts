import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/models";

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface SessionStatusResponse {
  user: User;
}

export interface RecoverData {
  username: string;
  recoveryCode: string;
  newPassword: string;
}

export interface RecoverViaFileData {
  username: string;
  newPassword: string;
}

export interface RecoverResponse {
  recoveryCode: string;
}

export const AuthService = {
  async login(payload: LoginData): Promise<ApiResponse<LoginResponse>> {
    const { data } = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      payload
    );
    return data;
  },

  async sessionStatus(): Promise<ApiResponse<SessionStatusResponse>> {
    const { data } = await api.get<ApiResponse<SessionStatusResponse>>(
      "/auth/session-status"
    );
    return data;
  },

  async logout(): Promise<ApiResponse<unknown>> {
    const { data } = await api.post<ApiResponse<unknown>>("/auth/logout");
    return data;
  },

  async recover(payload: RecoverData): Promise<ApiResponse<RecoverResponse>> {
    const { data } = await api.post<ApiResponse<RecoverResponse>>(
      "/auth/recover",
      payload
    );
    return data;
  },

  async recoverViaFile(payload: RecoverViaFileData): Promise<ApiResponse<RecoverResponse>> {
    const { data } = await api.post<ApiResponse<RecoverResponse>>(
      "/auth/recover-via-file",
      payload
    );
    return data;
  },

  async regenerateRecoveryCode(): Promise<ApiResponse<RecoverResponse>> {
    const { data } = await api.post<ApiResponse<RecoverResponse>>(
      "/auth/regenerate-recovery-code"
    );
    return data;
  },
};
