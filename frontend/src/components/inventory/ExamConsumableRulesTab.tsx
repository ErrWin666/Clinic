import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useExamConsumables, useCreateExamConsumable, useUpdateExamConsumable, useDeleteExamConsumable } from "@/hooks/useExamConsumables";
import { ExamConsumableRuleForm, type RuleFormValues } from "@/components/inventory/ExamConsumableRuleForm";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { PlusIcon, PencilIcon, TrashIcon, PackageCheckIcon } from "lucide-react";
import type { ExamConsumableRule } from "@/types/models";

export function ExamConsumableRulesTab() {
  const { t } = useTranslation();
  const [examType, setExamType] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ExamConsumableRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamConsumableRule | null>(null);

  const { rules, isLoading, isError, refetch } = useExamConsumables({
    examType: examType || undefined,
    page,
  });
  const { createRule, isCreating } = useCreateExamConsumable();
  const { updateRule, isUpdating } = useUpdateExamConsumable();
  const { deleteRule, isDeleting } = useDeleteExamConsumable();

  const handleAdd = () => { setEditingRule(null); setFormOpen(true); };
  const handleEdit = (rule: ExamConsumableRule) => { setEditingRule(rule); setFormOpen(true); };

  const handleSubmit = async (data: RuleFormValues) => {
    if (editingRule) {
      await updateRule({ id: editingRule.id, data: { quantity: data.quantity, isActive: true } });
    } else {
      await createRule(data);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            placeholder={t("inventory.fields.examType")}
            value={examType}
            onChange={(e) => { setExamType(e.target.value); setPage(1); }}
            className="w-[200px]"
          />
          <Button size="sm" onClick={handleAdd} className="ml-auto">
            <PlusIcon className="size-4" />
            {t("inventory.actions.addConsumableRule")}
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
          ) : rules.length === 0 ? (
            <EmptyState
              icon={<PackageCheckIcon className="size-7" />}
              title="inventory.empty"
              description="inventory.emptyDescription"
              action={<Button onClick={handleAdd}><PlusIcon className="size-4" />{t("inventory.actions.addConsumableRule")}</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.fields.examType")}</TableHead>
                  <TableHead>{t("inventory.fields.name")}</TableHead>
                  <TableHead>{t("inventory.fields.sku")}</TableHead>
                  <TableHead>{t("inventory.fields.quantity")}</TableHead>
                  <TableHead>{t("inventory.fields.isActive")}</TableHead>
                  <TableHead className="w-24 text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.examType}</TableCell>
                    <TableCell>{rule.variant?.name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{rule.variant?.sku || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{rule.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={t("common.edit")} onClick={() => handleEdit(rule)} />}>
                              <PencilIcon className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>{t("common.edit")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={t("common.delete")} onClick={() => setDeleteTarget(rule)} />}>
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

      <ExamConsumableRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editingRule}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await deleteRule(deleteTarget.id); setDeleteTarget(null); } }}
        itemName={deleteTarget?.examType || ""}
        itemType="inventory.examConsumables"
        isPending={isDeleting}
      />
    </div>
  );
}
