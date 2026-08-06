import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceDetail } from "@/hooks/useInvoices";
import { PaymentHistory } from "@/components/invoices/PaymentHistory";
import { config } from "@/lib/config";
import type { Invoice } from "@/types/models";
import {
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

interface InvoiceDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onStatusChange: (invoice: Invoice, status: string) => void;
  onPDF: (invoice: Invoice) => void;
  isChangingStatus?: boolean;
}

const STATUS_VARIANT: Record<string, string> = {
  unpaid: "bg-yellow-500/15 text-yellow-700 border-yellow-600/30 dark:text-yellow-400",
  "partially-paid": "bg-blue-500/15 text-blue-700 border-blue-600/30 dark:text-blue-400",
  paid: "bg-green-500/15 text-green-700 border-green-600/30 dark:text-green-400",
  overdue: "bg-red-500/15 text-red-700 border-red-600/30 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground border-border/40",
};

// Valid status transitions (overdue is derived, not manual)
const VALID_TRANSITIONS: Record<string, string[]> = {
  unpaid: ["partially-paid", "paid", "cancelled"],
  "partially-paid": ["paid", "unpaid", "cancelled"],
  paid: ["partially-paid", "cancelled"],
  overdue: ["partially-paid", "paid", "cancelled"],
  cancelled: [],
};

export function InvoiceDetail({
  open,
  onOpenChange,
  invoice,
  onEdit,
  onDelete,
  onStatusChange,
  onPDF,
  isChangingStatus,
}: InvoiceDetailProps) {
  const { t } = useTranslation();

  const { data: fullInvoice, isLoading } = useInvoiceDetail(invoice?.id, open && !!invoice);

  const current: Invoice | null = fullInvoice?.data ?? invoice;

  if (!current) return null;

  const isPaid = current.invoiceStatus === "paid";
  const billToName = current.patient?.fullName || current.customerName || "—";
  const billToPhone = current.patient?.phoneNumber
    ? current.patient.phoneNumber
    : current.customerPhone || "";
  const items = current.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl"
        data-slot="invoice-detail"
      >
        <DialogHeaderWithIcon
          icon={FileTextIcon}
          variant="primary"
          title={
            <span className="font-mono text-sm text-muted-foreground">
              {current.displayId}
            </span>
          }
          titleExtra={
            <Badge
              variant="outline"
              className={STATUS_VARIANT[current.invoiceStatus] ?? ""}
            >
              {t(`invoices.statuses.${current.invoiceStatus}`)}
            </Badge>
          }
          description={`${dayjs(current.invoiceDate).format("YYYY-MM-DD")}${current.dueDate ? ` · ${t("invoices.fields.dueDate")}: ${dayjs(current.dueDate).format("YYYY-MM-DD")}` : ""}`}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            <div className="flex flex-col gap-4">
              {/* Bill-to */}
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3.5 shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("invoices.fields.patient")}/{t("invoices.fields.customer")}
                </p>
                <p className="font-medium">{billToName}</p>
                {billToPhone && (
                  <p className="text-sm text-muted-foreground">{billToPhone}</p>
                )}
              </div>

              {/* Items table */}
              <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoices.fields.description")}</TableHead>
                      <TableHead className="w-[60px] text-center">
                        {t("invoices.fields.quantity")}
                      </TableHead>
                      <TableHead className="w-[100px] text-end">
                        {t("invoices.fields.unitPrice")}
                      </TableHead>
                      <TableHead className="w-[100px] text-end">
                        {t("invoices.fields.total")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="flex flex-col gap-2 p-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-8 w-full rounded-md" />
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          {t("invoices.noItems")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-end">
                            {Number(item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-end font-medium">
                            {Number(item.total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-2.5 ps-auto ms-auto w-full rounded-lg border border-border/40 bg-muted/30 p-4 shadow-sm sm:w-72">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("invoices.subtotalCalc")}
                  </span>
                  <span>{Number(subtotal).toFixed(2)} {config.defaultCurrency}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("invoices.fields.taxAmount")}
                  </span>
                  <span>{Number(current.taxAmount ?? 0).toFixed(2)} {config.defaultCurrency}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("invoices.fields.discountAmount")}
                  </span>
                  <span>-{Number(current.discountAmount ?? 0).toFixed(2)} {config.defaultCurrency}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>{t("invoices.totalCalc")}</span>
                  <span>{Number(current.totalAmount).toFixed(2)} {config.defaultCurrency}</span>
                </div>
                {Number(current.paidAmount ?? 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("invoices.paidAmount")}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {Number(current.paidAmount ?? 0).toFixed(2)} {config.defaultCurrency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{t("invoices.balanceDue")}</span>
                      <span className="text-orange-600 dark:text-orange-400">
                        {(Number(current.totalAmount) - Number(current.paidAmount ?? 0)).toFixed(2)} {config.defaultCurrency}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Notes */}
              {current.noteMessage && (
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3.5 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("invoices.fields.noteMessage")}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{current.noteMessage}</p>
                </div>
              )}

              {/* Payment History */}
              <PaymentHistory
                invoiceId={current.id}
                totalAmount={Number(current.totalAmount)}
                paidAmount={Number(current.paidAmount ?? 0)}
              />

              {/* Status change */}
              {(() => {
                const allowed = VALID_TRANSITIONS[current.invoiceStatus] ?? [];
                if (allowed.length === 0) return null;
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t("invoices.actions.changeStatus")}:
                    </span>
                    <Select
                      value={current.invoiceStatus}
                      onValueChange={(v) => { if (v) onStatusChange(current, v); }}
                      disabled={isChangingStatus}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowed.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`invoices.statuses.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer — fixed at bottom of the wrapper */}
          <div className="flex gap-3 border-t border-border/50 bg-muted/40 pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => onPDF(current)}
            >
              <FileTextIcon className="size-4" />
              {t("invoices.actions.pdf")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit(current)}
              disabled={isPaid}
            >
              <PencilIcon className="size-4" />
              {t("invoices.actions.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(current)}
              disabled={isPaid}
              className="ms-auto"
            >
              <Trash2Icon className="size-4" />
              {t("invoices.actions.delete")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
