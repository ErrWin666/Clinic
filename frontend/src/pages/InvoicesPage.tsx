import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useInvoices, useInvoiceStats, useChangeInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { InvoiceService } from "@/services/InvoiceService";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { InvoiceSummary } from "@/components/invoices/InvoiceSummary";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, DownloadIcon, ReceiptIcon } from "lucide-react";
import type { Invoice } from "@/types/models";

type InvoiceTab = "all" | "patient" | "customer";

export function InvoicesPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<InvoiceTab>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const {
    invoices,
    pagination,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useInvoices({
    search,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page,
    invoiceType: activeTab === "all" ? undefined : activeTab,
  });

  const { changeStatus: changeInvoiceStatus, isChangingStatus } = useChangeInvoiceStatus();
  const { deleteInvoice, isDeleting } = useDeleteInvoice();

  const statsQuery = useInvoiceStats({
    search,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    invoiceType: activeTab === "all" ? undefined : activeTab,
  });

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  const handleAdd = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDetailInvoice(null);
    setFormOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    setDetailInvoice(invoice);
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

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    await changeInvoiceStatus({ id: invoice.id, status: newStatus });
    if (detailInvoice) {
      setDetailInvoice({
        ...detailInvoice,
        invoiceStatus: newStatus as Invoice["invoiceStatus"],
      });
    }
  };

  const handlePDF = (invoice: Invoice) => {
    InvoiceService.getPDF(invoice.id);
  };

  const handleExport = () => {
    InvoiceService.export({
      search: search || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      invoiceType: activeTab === "all" ? undefined : activeTab,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={ReceiptIcon}
        title={t("invoices.title")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadIcon className="size-4" />
              {t("invoices.export")}
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <PlusIcon className="size-4" />
              {t("invoices.add")}
            </Button>
          </>
        }
      />

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
        <CardContent className="flex flex-col gap-4 p-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab((v as InvoiceTab) ?? "all");
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">{t("invoices.tabs.all")}</TabsTrigger>
              <TabsTrigger value="patient">{t("invoices.tabs.patient")}</TabsTrigger>
              <TabsTrigger value="customer">{t("invoices.tabs.customer")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <InvoiceFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            startDate={startDate}
            onStartDateChange={(v) => {
              setStartDate(v);
              setPage(1);
            }}
            endDate={endDate}
            onEndDateChange={(v) => {
              setEndDate(v);
              setPage(1);
            }}
            minAmount={minAmount}
            onMinAmountChange={(v) => {
              setMinAmount(v);
              setPage(1);
            }}
            maxAmount={maxAmount}
            onMaxAmountChange={(v) => {
              setMaxAmount(v);
              setPage(1);
            }}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {!isError && statsQuery.data?.data && <InvoiceSummary stats={statsQuery.data.data} />}

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover overflow-hidden">
        <CardContent className="p-0">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <InvoiceTable
              data={invoices}
              pagination={pagination}
              onPageChange={setPage}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onPDF={handlePDF}
              isFetching={isFetching}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
      />

      <InvoiceDetail
        open={!!detailInvoice}
        onOpenChange={(open) => {
          if (!open) setDetailInvoice(null);
        }}
        invoice={detailInvoice}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onPDF={handlePDF}
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
