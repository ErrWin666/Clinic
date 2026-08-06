import { useState } from "react";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
} from "@/hooks/usePurchaseOrders";
import type { POFormValues } from "@/components/purchase-orders/PurchaseOrderForm";
import type { ReceiveValues } from "@/components/purchase-orders/ReceiveDialog";
import type { PurchaseOrder } from "@/types/models";

export function usePurchaseOrdersPageLogic() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [detailTarget, setDetailTarget] = useState<PurchaseOrder | null>(null);

  const { purchaseOrders, pagination, isLoading, isError, refetch } = usePurchaseOrders({
    status: status || undefined,
    page,
  });
  const { createPurchaseOrder, isCreating } = useCreatePurchaseOrder();
  const { updatePurchaseOrder, isUpdating } = useUpdatePurchaseOrder();
  const { receivePurchaseOrder, isReceiving } = useReceivePurchaseOrder();
  const { cancelPurchaseOrder } = useCancelPurchaseOrder();

  const handleAdd = () => { setEditingPO(null); setFormOpen(true); };
  const handleEdit = (po: PurchaseOrder) => { setEditingPO(po); setFormOpen(true); };

  const handleSubmit = async (data: POFormValues) => {
    if (editingPO) {
      await updatePurchaseOrder({ id: editingPO.id, data: { orderDate: data.orderDate, note: data.note, items: data.items } });
    } else {
      await createPurchaseOrder(data);
    }
  };

  const handleReceive = async (data: ReceiveValues) => {
    if (!receiveTarget) return;
    await receivePurchaseOrder({ id: receiveTarget.id, data: { items: data.items } });
    setReceiveTarget(null);
  };

  const handleCancel = async (po: PurchaseOrder) => {
    await cancelPurchaseOrder(po.id);
  };

  return {
    status,
    setStatus,
    page,
    setPage,
    formOpen,
    setFormOpen,
    editingPO,
    receiveTarget,
    setReceiveTarget,
    detailTarget,
    setDetailTarget,
    purchaseOrders,
    pagination,
    isLoading,
    isError,
    refetch,
    isCreating,
    isUpdating,
    isReceiving,
    handleAdd,
    handleEdit,
    handleSubmit,
    handleReceive,
    handleCancel,
  };
}
