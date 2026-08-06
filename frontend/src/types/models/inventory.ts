import type {
  ProductCategory,
  CostingMethod,
  StockMovementType,
  StockMovementReason,
  StockReferenceType,
} from "../enums";
import type { Supplier } from "./suppliers";

export interface Product {
  id: number;
  displayId: string;
  name: string;
  category: ProductCategory;
  costingMethod: CostingMethod;
  description?: string | null;
  isActive: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  product?: Pick<Product, "id" | "name" | "displayId" | "category" | "costingMethod">;
  name: string;
  sku: string;
  barcode?: string | null;
  sellPrice: number;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  location?: string | null;
  serialNumber?: string | null;
  discountPercentage: number;
  discountValidUntil?: string | null;
  isActive: boolean;
  batches?: Batch[];
  packagingUnits?: PackagingUnit[];
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: number;
  productVariantId: number;
  variant?: Pick<ProductVariant, "id" | "name" | "sku">;
  batchNumber: string;
  quantity: number;
  initialQuantity: number;
  unitCost: number;
  expiryDate?: string | null;
  receivedDate: string;
  supplierId?: number | null;
  supplier?: Pick<Supplier, "id" | "name">;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  displayId: string;
  productVariantId: number;
  variant?: Pick<ProductVariant, "id" | "name" | "sku">;
  batchId: number;
  batch?: Pick<Batch, "id" | "batchNumber" | "expiryDate">;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  unitCost: number;
  totalCost: number;
  referenceType?: StockReferenceType | null;
  referenceId?: number | null;
  userId?: number | null;
  note?: string | null;
  movementDate: string;
  createdAt: string;
}

export interface PackagingUnit {
  id: number;
  productVariantId: number;
  name: string;
  shortName: string;
  factor: number;
  isBaseUnit: boolean;
  barcode?: string | null;
  sellPrice?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarcodeLookupResult {
  variant: ProductVariant;
  unit: PackagingUnit | null;
  factor: number;
}

export interface Stocktaking {
  id: number;
  displayId: string;
  status: "draft" | "in_progress" | "completed" | "cancelled";
  startedAt?: string | null;
  completedAt?: string | null;
  userId?: number | null;
  note?: string | null;
  items?: StocktakingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StocktakingItem {
  id: number;
  stocktakingId: number;
  productVariantId: number;
  variant?: Pick<ProductVariant, "id" | "name" | "sku">;
  batchId?: number | null;
  batch?: Pick<Batch, "id" | "batchNumber">;
  systemQuantity: number;
  countedQuantity?: number | null;
  difference?: number | null;
  note?: string | null;
}

export interface ExamConsumableRule {
  id: number;
  examType: string;
  productVariantId: number;
  variant?: Pick<ProductVariant, "id" | "name" | "sku" | "sellPrice">;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBundle {
  id: number;
  productId: number;
  product?: Pick<Product, "id" | "displayId" | "name" | "category">;
  description?: string | null;
  items?: ProductBundleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductBundleItem {
  id: number;
  bundleId: number;
  productVariantId: number;
  variant?: Pick<ProductVariant, "id" | "name" | "sku" | "sellPrice">;
  quantity: number;
}

export interface InventoryStats {
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
}

export interface InventoryValuationItem {
  displayId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  sellPrice: number;
  potentialProfit: number;
}

export interface InventoryValuationReport {
  items: InventoryValuationItem[];
  summary: {
    totalVariants: number;
    totalCostValue: number;
    totalSellValue: number;
    potentialProfit: number;
  };
}
