import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ProductFormValues } from "@/components/inventory/ProductForm";
import type { Product, ProductVariant } from "@/types/models";

export function useProductsTabLogic() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const {
    products,
    pagination,
    isLoading,
    isError,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProducts({ search: debouncedSearch, category, page });

  const handleAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormSubmit = async (data: ProductFormValues) => {
    if (editingProduct) {
      await updateProduct({ id: editingProduct.id, data });
    } else {
      await createProduct(data);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddVariant = (product: Product) => {
    setVariantProduct(product);
    setEditingVariant(null);
    setVariantFormOpen(true);
  };

  const handleEditVariant = (product: Product, variant: ProductVariant) => {
    setVariantProduct(product);
    setEditingVariant(variant);
    setVariantFormOpen(true);
  };

  return {
    search,
    setSearch,
    category,
    setCategory,
    page,
    setPage,
    formOpen,
    setFormOpen,
    editingProduct,
    deleteTarget,
    setDeleteTarget,
    expandedRows,
    variantFormOpen,
    setVariantFormOpen,
    variantProduct,
    editingVariant,
    products,
    pagination,
    isLoading,
    isError,
    refetch,
    isCreating,
    isUpdating,
    isDeleting,
    handleAdd,
    handleEdit,
    handleDelete,
    handleDeleteConfirm,
    handleFormSubmit,
    toggleRow,
    handleAddVariant,
    handleEditVariant,
  };
}
