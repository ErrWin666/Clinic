import { useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useExaminations } from "@/hooks/useExaminations";
import { ExaminationService, type ExaminationCreateData } from "@/services/ExaminationService";
import { ExaminationForm } from "@/components/examinations/ExaminationForm";
import { ExaminationDetail } from "@/components/examinations/ExaminationDetail";
import { ExaminationComparison } from "@/components/examinations/ExaminationComparison";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusIcon,
  MoreHorizontalIcon,
  EyeIcon,
  FileTextIcon,
  CopyIcon,
  Trash2Icon,
  GitCompareIcon,
} from "lucide-react";
import type { Examination } from "@/types/models";
import { EXAM_STATUS_VARIANT } from "@/components/examinations/examination-constants";

interface ExaminationListProps {
  patientId: number;
}

export function ExaminationList({ patientId }: ExaminationListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [detailExam, setDetailExam] = useState<Examination | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Examination | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const {
    examinations,
    pagination,
    isLoading,
    isFetching,
    isError,
    refetch,
    createExam,
    updateExam,
    followUp,
    deleteExam,
    isCreating,
    isUpdating,
    isFollowingUp,
    isDeleting,
  } = useExaminations({ patientId, page });

  const handleAdd = () => {
    setEditingExam(null);
    setFormOpen(true);
  };

  const handleEdit = (exam: Examination) => {
    setEditingExam(exam);
    setFormOpen(true);
  };

  const handleViewDetail = (exam: Examination) => {
    setDetailExam(exam);
  };

  const handlePDF = (exam: Examination) => {
    window.open(ExaminationService.getPDFUrl(exam.id), "_blank");
  };

  const handleFollowUp = async (exam: Examination) => {
    await followUp(exam.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteExam(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormSubmit = async (data: Record<string, unknown>, isEdit: boolean) => {
    const examData = data as ExaminationCreateData;
    if (isEdit && editingExam) {
      await updateExam({ id: editingExam.id, data: examData });
    } else {
      await createExam({ patientId, data: examData });
    }
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        {examinations.length >= 2 && (
          <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)}>
            <GitCompareIcon className="size-4" />
            {t("examinations.compare")}
          </Button>
        )}
        <Button size="sm" onClick={handleAdd}>
          <PlusIcon className="size-4" />
          {t("examinations.add")}
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
          ) : examinations.length === 0 ? (
            <EmptyState
              icon={<EyeIcon className="size-7" />}
              title="examinations.empty"
              description="examinations.emptyDescription"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("examinations.fields.examDate")}</TableHead>
                  <TableHead>{t("examinations.fields.examStatus")}</TableHead>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                  <TableHead className="w-[50px] text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examinations.map((exam, index) => (
                  <TableRow
                    key={exam.id}
                    className={`cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-200 ${isFetching ? "opacity-60" : ""}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handleViewDetail(exam)}
                  >
                    <TableCell className="font-medium">
                      {dayjs(exam.examDate).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={EXAM_STATUS_VARIANT[exam.examStatus] ?? "outline"}>
                        {t(`examinations.statuses.${exam.examStatus}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {exam.displayId}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("common.actions")}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleViewDetail(exam);
                            }}
                          >
                            <EyeIcon className="size-4" />
                            {t("examinations.viewDetail")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleEdit(exam);
                            }}
                          >
                            <FileTextIcon className="size-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handlePDF(exam);
                            }}
                          >
                            <FileTextIcon className="size-4" />
                            {t("examinations.downloadPDF")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isFollowingUp}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleFollowUp(exam);
                            }}
                          >
                            <CopyIcon className="size-4" />
                            {t("examinations.followUp")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setDeleteTarget(exam);
                            }}
                          >
                            <Trash2Icon className="size-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <ExaminationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        examination={editingExam}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
        patientId={patientId}
      />

      <ExaminationDetail
        exam={detailExam}
        open={!!detailExam}
        onOpenChange={(v) => !v && setDetailExam(null)}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.displayId ?? ""}
        itemType="examinations.title"
        isPending={isDeleting}
      />

      <ExaminationComparison
        examinations={examinations}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </div>
  );
}
