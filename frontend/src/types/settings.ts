import type {
  SettingsCategory,
  AuditAction,
  BackupType,
  BackupStatus,
} from "./enums";

export interface ClinicSettings {
  name?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  language?: string;
}

export interface SettingsGroup {
  clinic: ClinicSettings;
  ui: Record<string, unknown>;
  notification: Record<string, unknown>;
  backup: Record<string, unknown>;
}

export interface SettingsUpdateItem {
  key: string;
  value: string;
  category: SettingsCategory;
}

export interface AdminUpdateData {
  username?: string;
  currentPassword: string;
  newPassword?: string;
  isAdmin?: boolean;
}

export interface AdminUpdateResponse {
  id: number;
  username: string;
  role: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  action: AuditAction;
  entity: string;
  entityId: number | null;
  changes: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogListParams {
  page?: number;
  pageSize?: number;
  userId?: number;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
}

export interface BackupRecord {
  id: number;
  filename: string;
  fileSize: number;
  type: BackupType;
  status: BackupStatus;
  createdAt: string;
}

export interface DiskSpace {
  total: number;
  free: number;
  used: number;
  usedPercentage: number;
  dbSize: number;
  status: "ok" | "warning" | "critical";
}

export interface BackupSchedule {
  enabled: boolean;
  hour: number;
  minute: number;
}
