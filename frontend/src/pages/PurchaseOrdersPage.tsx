import { useTranslation } from "react-i18next";
import { usePurchaseOrdersPageLogic } from "@/hooks/usePurchaseOrdersPageLogic";
import { usePurchaseOrder } from "@/hooks/usePurchaseOrders";
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm";
import { ReceiveDialog } from "@/components/purchase-orders/ReceiveDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/common/PaginationBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { PlusIcon, PencilIcon, ShoppingCartIcon, PackageCheckIcon, BanIcon, FileTextIcon } from "lucide-react";
import { ENUMS } from "@/types/enums";
import type { PurchaseOrder } from "@/types/models";

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const logic = usePurchaseOrdersPageLogic();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={ShoppingCartIcon}
        title={t("purchaseOrders.title")}
        actions={
          <Button size="sm" onClick={logic.handleAdd}>
            <PlusIcon className="size-4" />
            {t("purchaseOrders.actions.add")}
          </Button>
        }
      />

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
        <CardContent className="p-4">
          <Select value={logic.status || "all"} onValueChange={(v) => { logic.setStatus(v === "all" ? "" : v ?? ""); logic.setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("purchaseOrders.fields.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {ENUMS.PURCHASE_ORDER_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{t(`purchaseOrders.statuses.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover overflow-hidden">
        <CardContent className="p-0">
          {logic.isError ? (
            <ErrorState onRetry={() => logic.refetch()} />
          ) : logic.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : logic.purchaseOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCartIcon className="size-7" />}
              title="purchaseOrders.empty"
              description="purchaseOrders.emptyDescription"
              action={<Button onClick={logic.handleAdd}><PlusIcon className="size-4" />{t("purchaseOrders.actions.add")}</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("purchaseOrders.fields.supplier")}</TableHead>
                  <TableHead>{t("purchaseOrders.fields.status")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("purchaseOrders.fields.totalAmount")}</TableHead>
                  <TableHead>{t("purchaseOrders.fields.orderDate")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("purchaseOrders.fields.receivedDate")}</TableHead>
                  <TableHead className="w-32 text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.purchaseOrders.map((po) => (
                  <TableRow key={po.id} className="cursor-pointer hover:bg-muted/40" onClick={() => logic.setDetailTarget(po)}>
                    <TableCell className="font-medium">
                      <div>{po.supplier?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{po.displayId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={po.status === "received" ? "default" : po.status === "cancelled" ? "destructive" : "secondary"}>
                        {t(`purchaseOrders.statuses.${po.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">{Number(po.totalAmount).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{po.receivedDate ? new Date(po.receivedDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {po.status === "ordered" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("purchaseOrders.actions.receive")} onClick={() => logic.setReceiveTarget(po)} />}>
                                <PackageCheckIcon className="size-4" />
                              </TooltipTrigger>
                              <TooltipContent>{t("purchaseOrders.actions.receive")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {(po.status === "draft" || po.status === "ordered") && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => logic.handleEdit(po)} />}>
                                  <PencilIcon className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>{t("common.edit")}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("common.cancel")} onClick={() => logic.handleCancel(po)} />}>
                                  <BanIcon className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>{t("common.cancel")}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {logic.pagination && logic.pagination.totalPages > 1 && (
            <PaginationBar pagination={logic.pagination} onPageChange={logic.setPage} />
          )}
        </CardContent>
      </Card>

      <PurchaseOrderForm
        open={logic.formOpen}
        onOpenChange={logic.setFormOpen}
        purchaseOrder={logic.editingPO}
        onSubmit={logic.handleSubmit}
        isPending={logic.isCreating || logic.isUpdating}
      />

      <ReceiveDialog
        open={!!logic.receiveTarget}
        onOpenChange={(open) => { if (!open) logic.setReceiveTarget(null); }}
        purchaseOrder={logic.receiveTarget}
        onSubmit={logic.handleReceive}
        isPending={logic.isReceiving}
      />

      <PODetailDialog
        open={!!logic.detailTarget}
        onOpenChange={(open) => { if (!open) logic.setDetailTarget(null); }}
        purchaseOrder={logic.detailTarget}
      />
    </div>
  );
}

function PODetailDialog({ open, onOpenChange, purchaseOrder }: { open: boolean; onOpenChange: (o: boolean) => void; purchaseOrder: PurchaseOrder | null }) {
  const { t } = useTranslation();
  // Fetch the full PO (with items) when the dialog opens.
  // The list query only includes the supplier, not the items — so we need
  // to fetch by ID to get the complete data with items and their batch info.
  const { purchaseOrder: fullPO, isLoading } = usePurchaseOrder(purchaseOrder?.id ?? 0);
  const po = fullPO ?? purchaseOrder;

  if (!po) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="size-5" />
            {po.displayId}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{t("purchaseOrders.fields.supplier")}</div>
              <div className="font-medium">{po.supplier?.name || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("purchaseOrders.fields.status")}</div>
              <Badge variant={po.status === "received" ? "default" : "secondary"}>
                {t(`purchaseOrders.statuses.${po.status}`)}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("purchaseOrders.fields.orderDate")}</div>
              <div className="font-medium">{new Date(po.orderDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("purchaseOrders.fields.totalAmount")}</div>
              <div className="font-mono font-bold">{Number(po.totalAmount).toFixed(2)}</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">{t("purchaseOrders.fields.items")}</h4>
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.fields.name")}</TableHead>
                    <TableHead>{t("inventory.fields.quantity")}</TableHead>
                    <TableHead>{t("inventory.fields.unitCost")}</TableHead>
                    <TableHead>{t("inventory.fields.batchNumber")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : (po.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        —
                      </TableCell>
                    </TableRow>
                  ) : (
                    (po.items ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.variant?.name || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{item.quantity}</TableCell>
                        <TableCell className="font-mono text-sm">{Number(item.unitCost).toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">{item.batchNumber || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
