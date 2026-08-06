import { useState } from "react";
import { useStockMovements, useStockStats } from "@/hooks/useStock";

export function useStockMovementsTabLogic() {
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [openingOpen, setOpeningOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);

  const { stats } = useStockStats();
  const { movements, pagination, isLoading, isError, refetch } = useStockMovements({
    type: type || undefined,
    reason: reason || undefined,
    page,
  });

  return {
    type,
    setType,
    reason,
    setReason,
    page,
    setPage,
    openingOpen,
    setOpeningOpen,
    adjustOpen,
    setAdjustOpen,
    damageOpen,
    setDamageOpen,
    stats,
    movements,
    pagination,
    isLoading,
    isError,
    refetch,
  };
}
