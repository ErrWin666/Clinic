import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Relationship } from "@/types/models";
import type { RelationType } from "@/types/enums";

export interface CreateRelationshipData {
  relatedPatientId: number;
  relationType: RelationType;
}

export const RelationshipService = {
  async list(patientId: number): Promise<ApiResponse<Relationship[]>> {
    const { data } = await api.get<ApiResponse<Relationship[]>>(
      `/patients/${patientId}/relationships`
    );
    return data;
  },

  async create(
    patientId: number,
    payload: CreateRelationshipData
  ): Promise<ApiResponse<Relationship>> {
    const { data } = await api.post<ApiResponse<Relationship>>(
      `/patients/${patientId}/relationships`,
      payload
    );
    return data;
  },

  async delete(
    patientId: number,
    relationshipId: number
  ): Promise<ApiResponse<unknown>> {
    const { data } = await api.delete<ApiResponse<unknown>>(
      `/patients/${patientId}/relationships/${relationshipId}`
    );
    return data;
  },
};
