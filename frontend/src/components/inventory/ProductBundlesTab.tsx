import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProductBundles, useCreateProductBundle, useUpdateProductBundle, useDeleteProductBundle } from "@/hooks/useProductBundles";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ProductBundleForm, type BundleFormValues } from "@/components/inventory/ProductBundleForm";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, BoxesIcon } from "lucide-react";
import type { ProductBundle } from "@/types/models";

export function ProductBundlesTab() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductBundle | null>(null);

  const { bundles, isLoading, isError, refetch } = useProductBundles({ search: debouncedSearch, page });
  const { createBundle, isCreating } = useCreateProductBundle();
  const { updateBundle, isUpdating } = useUpdateProductBundle();
  const { deleteBundle, isDeleting } = useDeleteProductBundle();

  const handleAdd = () => { setEditingBundle(null); setFormOpen(true); };
  const handleEdit = (bundle: ProductBundle) => { setEditingBundle(bundle); setFormOpen(true); };

  const handleSubmit = async (data: BundleFormValues) => {
    if (editingBundle) {
      await updateBundle({ id: editingBundle.id, data: { description: data.description, items: data.items } });
    } else {
      await createBundle(data);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="ps-9"
            />
          </div>
          <Button size="sm" onClick={handleAdd} className="ms-auto">
            <PlusIcon className="size-4" />
            {t("inventory.actions.addBundle")}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-0">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <EmptyState
              icon={<BoxesIcon className="size-7" />}
              title="inventory.empty"
              description="inventory.emptyDescription"
              action={<Button onClick={handleAdd}><PlusIcon className="size-4" />{t("inventory.actions.addBundle")}</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.fields.name")}</TableHead>
                  <TableHead>{t("inventory.fields.description")}</TableHead>
                  <TableHead>{t("inventory.fields.items")}</TableHead>
                  <TableHead className="w-24 text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell className="font-medium">{bundle.product?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{bundle.description || "—"}</TableCell>
                    <TableCell className="text-sm">{bundle.items?.length ?? 0}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => handleEdit(bundle)} />}>
                              <PencilIcon className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>{t("common.edit")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("common.delete")} onClick={() => setDeleteTarget(bundle)} />}>
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
        </CardContent>
      </Card>

      <ProductBundleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bundle={editingBundle}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await deleteBundle(deleteTarget.id); setDeleteTarget(null); } }}
        itemName={deleteTarget?.product?.name || ""}
        itemType="inventory.productBundles"
        isPending={isDeleting}
      />
    </div>
  );
}
