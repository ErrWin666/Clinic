import { memo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { config } from "@/lib/config";
import type { Invoice } from "@/types/models";
import type { Pagination } from "@/types/api";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  FileTextIcon,
  ReceiptIcon,
} from "lucide-react";

interface InvoiceTableProps {
  data: Invoice[];
  pagination?: Pagination;
  onPageChange: (page: number) => void;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onStatusChange: (invoice: Invoice, status: string) => void;
  onPDF: (invoice: Invoice) => void;
  isFetching: boolean;
  isLoading: boolean;
}

const STATUS_VARIANT: Record<string, string> = {
  unpaid: "bg-amber-500/12 text-amber-700 border-amber-600/25 dark:text-amber-400",
  "partially-paid": "bg-blue-500/12 text-blue-700 border-blue-600/25 dark:text-blue-400",
  paid: "bg-emerald-500/12 text-emerald-700 border-emerald-600/25 dark:text-emerald-400",
  overdue: "bg-red-500/12 text-red-700 border-red-600/25 dark:text-red-400",
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

export const InvoiceTable = memo(function InvoiceTable({
  data,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPDF,
  isFetching,
  isLoading,
}: InvoiceTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptIcon className="size-7" />}
        title="invoices.noInvoices"
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t("invoices.fields.displayId")}</TableHead>
            <TableHead>{t("invoices.fields.patient")}/{t("invoices.fields.customer")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("invoices.fields.invoiceDate")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("invoices.fields.dueDate")}</TableHead>
            <TableHead>{t("invoices.fields.totalAmount")}</TableHead>
            <TableHead>{t("invoices.fields.status")}</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((inv, index) => {
            const name = inv.patient?.fullName || inv.customerName || "—";
            const isPaid = inv.invoiceStatus === "paid";
            return (
              <TableRow
                key={inv.id}
                className={`cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-200 ${isFetching ? "opacity-60" : ""}`}
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => onView(inv)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {inv.displayId}
                </TableCell>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {dayjs(inv.invoiceDate).format("YYYY-MM-DD")}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {inv.dueDate ? dayjs(inv.dueDate).format("YYYY-MM-DD") : "—"}
                </TableCell>
                <TableCell className="font-semibold">
                  {Number(inv.totalAmount).toFixed(2)} {config.defaultCurrency}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={STATUS_VARIANT[inv.invoiceStatus] ?? ""}
                  >
                    {t(`invoices.statuses.${inv.invoiceStatus}`)}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label={t("common.actions")}>
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(inv)}>
                        <EyeIcon className="size-4" />
                        {t("invoices.actions.view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(inv)}
                        disabled={isPaid}
                      >
                        <PencilIcon className="size-4" />
                        {t("invoices.actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPDF(inv)}>
                        <FileTextIcon className="size-4" />
                        {t("invoices.actions.pdf")}
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          disabled={(VALID_TRANSITIONS[inv.invoiceStatus] ?? []).length === 0}
                        >
                          {t("invoices.actions.changeStatus")}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {(VALID_TRANSITIONS[inv.invoiceStatus] ?? []).map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => onStatusChange(inv, status)}
                            >
                              {t(`invoices.statuses.${status}`)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(inv)}
                        disabled={isPaid}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2Icon className="size-4" />
                        {t("invoices.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("common.pagination.page", {
              current: pagination.currentPage,
              total: pagination.totalPages,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1 || isFetching}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || isFetching}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
});
