import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface User {
  id: number;
  username: string;
  role: string;
  isAdmin: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateData {
  username: string;
  password: string;
  role: string;
}

export interface UserUpdateData {
  username?: string;
  role?: string;
  password?: string;
}

export const UserService = {
  async list(): Promise<ApiResponse<User[]>> {
    const { data } = await api.get<ApiResponse<User[]>>("/users");
    return data;
  },

  async getById(id: number): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data;
  },

  async create(payload: UserCreateData): Promise<ApiResponse<User>> {
    const { data } = await api.post<ApiResponse<User>>("/users", payload);
    return data;
  },

  async update(id: number, payload: UserUpdateData): Promise<ApiResponse<User>> {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(`/users/${id}`);
    return data;
  },
};
