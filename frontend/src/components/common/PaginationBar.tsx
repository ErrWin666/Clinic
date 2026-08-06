import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { Pagination as PaginationType } from "@/types/api";

interface PaginationBarProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function PaginationBar({ pagination, onPageChange, isFetching }: PaginationBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {t("common.pagination.page", { current: pagination.currentPage, total: pagination.totalPages })}
        <span className="text-muted-foreground/70">
          {" · "}
          {t("common.pagination.total", { count: pagination.totalItems })}
        </span>
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
  );
}
