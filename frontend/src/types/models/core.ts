import type {
  UserRole,
  PatientType,
  Gender,
  RelationType,
  NotificationType,
} from "../enums";
import type { Appointment } from "./appointments";
import type { Invoice } from "./invoices";
import type { Examination } from "./examinations";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  profileImage?: string | null;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  displayId: string;
  fullName: string;
  age?: number;
  gender: Gender;
  birthDate: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  patientType: PatientType;
  profileImage?: string | null;
  notes?: string | null;
  telegramChatId?: string | null;
  whatsappOptIn?: boolean;
  preferredContactMethod?: "auto" | "whatsapp" | "telegram" | "sms_mobile" | "sms";
  createdAt: string;
  updatedAt: string;
}

export interface PatientDetail extends Patient {
  appointments?: Appointment[];
  eyeExaminations?: Examination[];
  invoices?: Invoice[];
}

export interface Relationship {
  id: number;
  guardianId: number;
  childId: number;
  guardian?: Pick<Patient, "id" | "displayId" | "fullName" | "birthDate" | "gender" | "profileImage" | "patientType">;
  child?: Pick<Patient, "id" | "displayId" | "fullName" | "birthDate" | "gender" | "profileImage" | "patientType">;
  relationType: RelationType;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityId?: number | null;
  entityType?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  unpaidInvoices: { count: number; totalAmount: number };
  monthlyRevenue: number;
  appointmentsChart: { month: string; count: number }[];
  revenueChart: { month: string; amount: number }[];
  recentAppointments?: Appointment[];
  recentExaminations?: Examination[];
  demographics?: {
    gender: { label: string; count: number }[];
    patientType: { label: string; count: number }[];
  };
  inventory?: {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
    expiredCount: number;
  };
}
