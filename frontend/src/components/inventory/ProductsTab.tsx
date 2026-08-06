import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useProductsTabLogic } from "@/hooks/useProductsTabLogic";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductVariantForm } from "@/components/inventory/ProductVariantForm";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/common/PaginationBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { PlusIcon, SearchIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PackageIcon } from "lucide-react";
import { ENUMS } from "@/types/enums";

export function ProductsTab() {
  const { t } = useTranslation();
  const logic = useProductsTabLogic();

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={logic.search}
                onChange={(e) => { logic.setSearch(e.target.value); logic.setPage(1); }}
                className="ps-9"
              />
            </div>
            <Select value={logic.category || "all"} onValueChange={(v) => { logic.setCategory(v === "all" ? "" : v ?? ""); logic.setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("inventory.fields.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {ENUMS.PRODUCT_CATEGORY.map((cat) => (
                  <SelectItem key={cat} value={cat}>{t(`inventory.categories.${cat}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={logic.handleAdd} className="ml-auto">
              <PlusIcon className="size-4" />
              {t("inventory.actions.addProduct")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-0">
          {logic.isError ? (
            <ErrorState onRetry={() => logic.refetch()} />
          ) : logic.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : logic.products.length === 0 ? (
            <EmptyState
              icon={<PackageIcon className="size-7" />}
              title="inventory.empty"
              description="inventory.emptyDescription"
              action={<Button onClick={logic.handleAdd}><PlusIcon className="size-4" />{t("inventory.actions.addProduct")}</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t("inventory.fields.name")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("inventory.fields.category")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("inventory.fields.costingMethod")}</TableHead>
                  <TableHead>{t("inventory.fields.quantity")}</TableHead>
                  <TableHead className="w-24 text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.products.map((product) => {
                  const isExpanded = logic.expandedRows.has(product.id);
                  const totalQty = product.variants?.reduce((sum, v) => sum + v.quantity, 0) ?? 0;
                  return (
                    <Fragment key={product.id}>
                      <TableRow className="hover:bg-muted/40">
                        <TableCell className="w-10">
                          {product.variants && product.variants.length > 0 && (
                            <button onClick={() => logic.toggleRow(product.id)} className="text-muted-foreground hover:text-foreground">
                              {isExpanded ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4 rtl:rotate-180" />}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <PackageIcon className="size-4 text-muted-foreground" />
                            <div>
                              <div>{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.displayId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{t(`inventory.categories.${product.category}`)}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {t(`inventory.costingMethods.${product.costingMethod}`)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{totalQty}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => logic.handleEdit(product)} />}>
                                  <PencilIcon className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>{t("common.edit")}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("common.delete")} onClick={() => logic.handleDelete(product)} />}>
                                  <TrashIcon className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>{t("common.delete")}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && product.variants && (
                        <TableRow key={`${product.id}-variants`} className="bg-muted/20">
                          <TableCell colSpan={6} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">{t("inventory.fields.name")} — {product.variants.length} {t("inventory.products")}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger render={<Button size="sm" variant="outline" onClick={() => logic.handleAddVariant(product)} />}>
                                    <PlusIcon className="size-3.5" />
                                    {t("inventory.actions.addVariant")}
                                  </TooltipTrigger>
                                  <TooltipContent>{t("inventory.actions.addVariant")}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="rounded-md border border-border/60 overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t("inventory.fields.name")}</TableHead>
                                    <TableHead>{t("inventory.fields.sku")}</TableHead>
                                    <TableHead>{t("inventory.fields.sellPrice")}</TableHead>
                                    <TableHead>{t("inventory.fields.quantity")}</TableHead>
                                    <TableHead className="w-20 text-end">{t("common.actions")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.variants.map((variant) => (
                                    <TableRow key={variant.id}>
                                      <TableCell className="font-medium">{variant.name}</TableCell>
                                      <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                                      <TableCell className="font-mono text-sm">{Number(variant.sellPrice).toFixed(2)}</TableCell>
                                      <TableCell className="font-mono text-sm">
                                        <span className={variant.quantity <= variant.minQuantity ? "text-destructive font-bold" : ""}>
                                          {variant.quantity}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-end">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-7" aria-label={t("common.edit")} onClick={() => logic.handleEditVariant(product, variant)} />}>
                                              <PencilIcon className="size-3.5" />
                                            </TooltipTrigger>
                                            <TooltipContent>{t("common.edit")}</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {logic.pagination && logic.pagination.totalPages > 1 && (
            <PaginationBar pagination={logic.pagination} onPageChange={logic.setPage} />
          )}
        </CardContent>
      </Card>

      <ProductForm
        open={logic.formOpen}
        onOpenChange={logic.setFormOpen}
        product={logic.editingProduct}
        onSubmit={logic.handleFormSubmit}
        isPending={logic.isCreating || logic.isUpdating}
      />

      {logic.variantProduct && (
        <ProductVariantForm
          open={logic.variantFormOpen}
          onOpenChange={logic.setVariantFormOpen}
          product={logic.variantProduct}
          variant={logic.editingVariant}
          isPending={logic.isCreating || logic.isUpdating}
        />
      )}

      <DeleteConfirmDialog
        open={!!logic.deleteTarget}
        onCancel={() => logic.setDeleteTarget(null)}
        onConfirm={logic.handleDeleteConfirm}
        itemName={logic.deleteTarget?.name || ""}
        itemType="inventory.products"
        isPending={logic.isDeleting}
      />
    </div>
  );
}
