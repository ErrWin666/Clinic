import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
  productVariantId: z.number().optional(),
  unit: z.string(),
});

export const invoiceSchema = z
  .object({
    patientId: z.number().positive().optional(),
    customerName: z.string().max(200).optional(),
    customerPhone: z.string().max(30).optional(),
    invoiceDate: z.string().min(1),
    dueDate: z.string().optional(),
    taxAmount: z.number(),
    discountAmount: z.number(),
    logo: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1),
    noteMessage: z.string().optional(),
    noteContactLine: z.string().optional(),
    notePhone: z.string().optional(),
    noteEmail: z.string().email().optional(),
  })
  .refine((data) => !!data.patientId || !!data.customerName, {
    message: "errors.PATIENT_OR_CUSTOMER_REQUIRED",
    path: ["patientId"],
  });

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  productVariantId?: number;
  unit?: string;
}

export interface InvoiceCreateData {
  patientId?: number;
  customerName?: string;
  customerPhone?: string;
  invoiceDate: string;
  dueDate?: string;
  taxAmount?: number;
  discountAmount?: number;
  logo?: string;
  items: InvoiceItemData[];
  noteMessage?: string;
  noteContactLine?: string;
  notePhone?: string;
  noteEmail?: string;
}

export type InvoiceUpdateData = Partial<InvoiceCreateData>;
