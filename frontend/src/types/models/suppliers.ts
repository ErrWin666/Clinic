import type {
  PurchaseOrderStatus,
  SupplierPaymentMethod,
} from "../enums";

export interface Supplier {
  id: number;
  displayId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  taxNumber?: string | null;
  openingBalance: number;
  balance?: number;
  notes?: string | null;
  isActive: boolean;
  purchaseOrders?: PurchaseOrder[];
  payments?: SupplierPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: number;
  displayId: string;
  supplierId: number;
  supplier?: Pick<Supplier, "id" | "name" | "displayId">;
  status: PurchaseOrderStatus;
  totalAmount: number;
  orderDate: string;
  receivedDate?: string | null;
  userId?: number | null;
  note?: string | null;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productVariantId: number;
  variant?: { id: number; name: string; sku: string };
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  receivedUnit?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
}

export interface SupplierPayment {
  id: number;
  displayId: string;
  supplierId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: SupplierPaymentMethod;
  reference?: string | null;
  purchaseOrderId?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierStatement {
  transactions: {
    date: string;
    type: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
    note: string;
  }[];
  currentBalance: number;
}
