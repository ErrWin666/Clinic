import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePatientInvoices } from "@/hooks/usePatientInvoices";
import { useChangeInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { InvoiceService } from "@/services/InvoiceService";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, ReceiptIcon } from "lucide-react";
import type { Invoice } from "@/types/models";

interface InvoiceListProps {
  patientId: number;
}

export function InvoiceList({ patientId }: InvoiceListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const {
    invoices,
    pagination,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = usePatientInvoices({ patientId, page });

  const { changeStatus, isChangingStatus } = useChangeInvoiceStatus();
  const { deleteInvoice, isDeleting } = useDeleteInvoice();

  const handleAdd = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDetailInvoice(null);
    setFormOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
    setDetailInvoice(null);
    setDeleteTarget(invoice);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteInvoice(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleAdd}>
          <PlusIcon className="size-4" />
          {t("invoices.add")}
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon className="size-7" />}
              title="patientProfile.noInvoices"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("invoices.fields.invoiceDate")}</TableHead>
                  <TableHead>{t("invoices.fields.status")}</TableHead>
                  <TableHead>{t("invoices.fields.totalAmount")}</TableHead>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, index) => (
                  <TableRow
                    key={inv.id}
                    className={`cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-200 ${isFetching ? "opacity-60" : ""}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => setDetailInvoice(inv)}
                  >
                    <TableCell className="font-medium">
                      {dayjs(inv.invoiceDate).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`invoices.statuses.${inv.invoiceStatus}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(inv.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {inv.displayId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {t("common.pagination.page", { current: pagination.currentPage, total: pagination.totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1 || isFetching}
              onClick={() => setPage(pagination.currentPage - 1)}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || isFetching}
              onClick={() => setPage(pagination.currentPage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        patientId={patientId}
      />

      <InvoiceDetail
        open={!!detailInvoice}
        onOpenChange={(open) => { if (!open) setDetailInvoice(null); }}
        invoice={detailInvoice}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={(inv, status) => changeStatus({ id: inv.id, status })}
        onPDF={(inv) => InvoiceService.getPDF(inv.id)}
        isChangingStatus={isChangingStatus}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.displayId ?? ""}
        itemType="invoices.singular"
        isPending={isDeleting}
      />
    </div>
  );
}
