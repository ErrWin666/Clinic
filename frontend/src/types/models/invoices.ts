import type { InvoiceStatus } from "../enums";
import type { Patient } from "./core";

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productVariantId?: number | null;
  batchId?: number | null;
  costAmount?: number | null;
  unit?: string | null;
  baseQuantity?: number | null;
}

export interface Invoice {
  id: number;
  displayId: string;
  patientId: number | null;
  patient?: Pick<Patient, "id" | "fullName" | "displayId" | "phoneNumber"> | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items?: InvoiceItem[];
  invoiceDate: string;
  dueDate?: string | null;
  invoiceStatus: InvoiceStatus;
  totalAmount: number;
  paidAmount?: number;
  taxAmount: number;
  discountAmount: number;
  logo?: string | null;
  noteMessage?: string | null;
  noteContactLine?: string | null;
  notePhone?: string | null;
  noteEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}
