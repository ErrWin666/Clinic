import type { Product, ProductVariant } from "@/types/models";

export interface ProductVariantOption {
  id: number;
  productId: number;
  productName: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellPrice: number;
}

/**
 * Flatten a list of products (with nested variants) into a flat list of
 * variant options suitable for comboboxes and pickers.
 */
export function flattenProductVariants(products: Product[]): ProductVariantOption[] {
  return products.flatMap((p) =>
    (p.variants ?? []).map((v: ProductVariant) => ({
      id: v.id,
      productId: p.id,
      productName: p.name,
      name: v.name,
      sku: v.sku,
      barcode: v.barcode ?? null,
      sellPrice: v.sellPrice,
    }))
  );
}
