import { useTranslation } from "react-i18next";
import { useSupplierPayments } from "@/hooks/useSuppliers";
import { useSuppliersPageLogic } from "@/hooks/useSuppliersPageLogic";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { SupplierPaymentDialog } from "@/components/suppliers/SupplierPaymentDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/common/PaginationBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusIcon, SearchIcon, PencilIcon, TrashIcon, TruckIcon, DollarSign, FileTextIcon } from "lucide-react";
import type { Supplier } from "@/types/models";

export function SuppliersPage() {
  const { t } = useTranslation();
  const logic = useSuppliersPageLogic();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={TruckIcon}
        title={t("suppliers.title")}
        actions={
          <Button size="sm" onClick={logic.handleAdd}>
            <PlusIcon className="size-4" />
            {t("suppliers.actions.add")}
          </Button>
        }
      />

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={logic.search}
              onChange={(e) => { logic.setSearch(e.target.value); logic.setPage(1); }}
              className="ps-9"
            />
          </div>
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
          ) : logic.suppliers.length === 0 ? (
            <EmptyState
              icon={<TruckIcon className="size-7" />}
              title="suppliers.empty"
              description="suppliers.emptyDescription"
              action={<Button onClick={logic.handleAdd}><PlusIcon className="size-4" />{t("suppliers.actions.add")}</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("suppliers.fields.name")}</TableHead>
                  <TableHead>{t("suppliers.fields.phone")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("suppliers.fields.contactPerson")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("suppliers.fields.balance")}</TableHead>
                  <TableHead>{t("inventory.fields.isActive")}</TableHead>
                  <TableHead className="w-32 text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.suppliers.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/40" onClick={() => logic.setDetailTarget(s)}>
                    <TableCell className="font-medium">
                      <div>{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.displayId}</div>
                    </TableCell>
                    <TableCell className="text-sm">{s.phone || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{s.contactPerson || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      <span className={Number(s.balance ?? 0) > 0 ? "text-destructive font-bold" : ""}>
                        {Number(s.balance ?? 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.isActive ? "outline" : "secondary"}
                        className={s.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                      >
                        {s.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("suppliers.actions.addPayment")} onClick={() => logic.setPaymentTarget(s)} />}>
                              <DollarSign className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>{t("suppliers.actions.addPayment")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => logic.handleEdit(s)} />}>
                              <PencilIcon className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>{t("common.edit")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("common.delete")} onClick={() => logic.setDeleteTarget(s)} />}>
                              <TrashIcon className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>{t("common.delete")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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

      <SupplierForm
        open={logic.formOpen}
        onOpenChange={logic.setFormOpen}
        supplier={logic.editingSupplier}
        onSubmit={logic.handleSubmit}
        isPending={logic.isCreating || logic.isUpdating}
      />

      <SupplierPaymentDialog
        open={!!logic.paymentTarget}
        onOpenChange={(open) => { if (!open) logic.setPaymentTarget(null); }}
        supplier={logic.paymentTarget}
      />

      <SupplierDetailDialog
        open={!!logic.detailTarget}
        onOpenChange={(open) => { if (!open) logic.setDetailTarget(null); }}
        supplier={logic.detailTarget}
      />

      <DeleteConfirmDialog
        open={!!logic.deleteTarget}
        onCancel={() => logic.setDeleteTarget(null)}
        onConfirm={logic.handleDeleteConfirm}
        itemName={logic.deleteTarget?.name || ""}
        itemType="suppliers.title"
        isPending={logic.isDeleting}
      />
    </div>
  );
}

function SupplierDetailDialog({ open, onOpenChange, supplier }: { open: boolean; onOpenChange: (o: boolean) => void; supplier: Supplier | null }) {
  const { t } = useTranslation();
  const { payments, isLoading } = useSupplierPayments(supplier?.id ?? 0);

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="size-5" />
            {supplier.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailRow label={t("suppliers.fields.phone")} value={supplier.phone || "—"} />
            <DetailRow label={t("suppliers.fields.email")} value={supplier.email || "—"} />
            <DetailRow label={t("suppliers.fields.contactPerson")} value={supplier.contactPerson || "—"} />
            <DetailRow label={t("suppliers.fields.taxNumber")} value={supplier.taxNumber || "—"} />
            <DetailRow label={t("suppliers.fields.address")} value={supplier.address || "—"} />
            <DetailRow label={t("suppliers.fields.balance")} value={Number(supplier.balance ?? 0).toFixed(2)} />
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">{t("suppliers.actions.addPayment")}</h4>
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4">{t("common.loading")}</div>
            ) : payments.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">{t("common.noData")}</div>
            ) : (
              <div className="rounded-md border border-border/60 overflow-hidden max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("inventory.fields.receivedDate")}</TableHead>
                      <TableHead>{t("inventory.fields.unitCost")}</TableHead>
                      <TableHead>{t("inventory.fields.reason")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-sm">{Number(p.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{p.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
