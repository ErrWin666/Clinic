import { useState } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SupplierFormValues } from "@/components/suppliers/SupplierForm";
import type { Supplier } from "@/types/models";

export function useSuppliersPageLogic() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Supplier | null>(null);

  const {
    suppliers,
    pagination,
    isLoading,
    isError,
    refetch,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSuppliers({ search: debouncedSearch, page });

  const handleAdd = () => { setEditingSupplier(null); setFormOpen(true); };
  const handleEdit = (s: Supplier) => { setEditingSupplier(s); setFormOpen(true); };

  const handleSubmit = async (data: SupplierFormValues) => {
    if (editingSupplier) {
      await updateSupplier({ id: editingSupplier.id, data });
    } else {
      await createSupplier(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return {
    search,
    setSearch,
    page,
    setPage,
    formOpen,
    setFormOpen,
    editingSupplier,
    deleteTarget,
    setDeleteTarget,
    detailTarget,
    setDetailTarget,
    paymentTarget,
    setPaymentTarget,
    suppliers,
    pagination,
    isLoading,
    isError,
    refetch,
    isCreating,
    isUpdating,
    isDeleting,
    handleAdd,
    handleEdit,
    handleSubmit,
    handleDeleteConfirm,
  };
}
